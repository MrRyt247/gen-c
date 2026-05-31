/**
 * Uses the Anthropic Messages API via raw fetch so it runs in any environment
 * (Cloudflare Workers, Node.js, etc.) without Node.js-specific builtins.
 */
import { env } from '$env/dynamic/private';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { MarkerResult, Status } from '$lib/types';
import { MARKER_META } from '$lib/data/markers';

export interface Recommendation {
	verdict: 'seek_care' | 'monitor' | 'normal';
	urgency: 'urgent' | 'soon' | 'routine' | 'none';
	headline: string;
	reasoning: string;
	nextSteps: string[];
}

const SYSTEM =
	`You are a urinalysis assistant that helps interpret dipstick urine test results. ` +
	`Your role is to recommend whether the user should seek medical care, monitor at home, or if results look normal. ` +
	`You do NOT diagnose conditions. Speak plainly and calmly — like a knowledgeable friend, not a clinician.`;

const RECOMMENDATION_TOOL = {
	name: 'give_recommendation',
	description: 'Return a structured recommendation based on the urinalysis results provided.',
	input_schema: {
		type: 'object',
		properties: {
			verdict: {
				type: 'string',
				enum: ['seek_care', 'monitor', 'normal'],
				description:
					'"seek_care" = medical evaluation recommended; "monitor" = watch and re-test; "normal" = within expected ranges'
			},
			urgency: {
				type: 'string',
				enum: ['urgent', 'soon', 'routine', 'none'],
				description:
					'Only applies when verdict is seek_care. "urgent" = today/urgent care; "soon" = within 1-3 days; "routine" = schedule an appointment; "none" = not applicable'
			},
			headline: {
				type: 'string',
				description: 'One clear sentence summarising the recommendation (under 15 words).'
			},
			reasoning: {
				type: 'string',
				description:
					'2-3 plain-language sentences about the key findings. No clinical jargon.'
			},
			nextSteps: {
				type: 'array',
				items: { type: 'string' },
				description: '2-4 specific, actionable steps the user should take.'
			}
		},
		required: ['verdict', 'urgency', 'headline', 'reasoning', 'nextSteps']
	}
};

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) error(401, 'Sign in to get a recommendation.');

	const apiKey = env.ANTHROPIC_API_KEY;
	if (!apiKey) error(503, 'AI recommendation service is not configured.');

	let body: { results: MarkerResult[]; status: Status };
	try {
		body = await request.json();
	} catch {
		error(400, 'Invalid JSON body.');
	}

	const { results, status } = body;
	if (!Array.isArray(results) || !results.length) error(400, 'results array is required.');

	const markerLines = results
		.map((r) => {
			const meta = MARKER_META[r.marker];
			const value = r.unit ? `${r.value} ${r.unit}` : r.value;
			const ref = meta?.referenceLabel ? ` (normal: ${meta.referenceLabel})` : '';
			return `• ${meta?.label ?? r.marker}: ${value} — ${r.status}${ref}`;
		})
		.join('\n');

	const flagged = results.filter((r) => r.status !== 'normal');
	const flagSummary = flagged.length
		? `${flagged.length} marker(s) outside normal range: ${flagged.map((r) => MARKER_META[r.marker]?.label ?? r.marker).join(', ')}.`
		: 'All markers within normal range.';

	const userMessage =
		`Urine dipstick results:\nOverall status: ${status}\n${flagSummary}\n\nMarker readings:\n${markerLines}\n\n` +
		`Please analyse these results and use the give_recommendation tool to provide a clear, compassionate recommendation.`;

	// ── Call the Anthropic Messages API via fetch (no Node.js builtins needed) ──
	let anthropicRes: Response;
	try {
		anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
			method: 'POST',
			headers: {
				'x-api-key': apiKey,
				'anthropic-version': '2023-06-01',
				'content-type': 'application/json'
			},
			body: JSON.stringify({
				model: 'claude-haiku-4-5-20251001',
				max_tokens: 600,
				system: SYSTEM,
				tools: [RECOMMENDATION_TOOL],
				tool_choice: { type: 'tool', name: 'give_recommendation' },
				messages: [{ role: 'user', content: userMessage }]
			})
		});
	} catch (e) {
		console.error('[uroscan] anthropic fetch error:', e);
		error(502, 'Could not reach the AI service. Please try again.');
	}

	if (!anthropicRes.ok) {
		const detail = await anthropicRes.text().catch(() => '');
		console.error('[uroscan] anthropic error response:', anthropicRes.status, detail.slice(0, 200));
		error(502, `AI service returned ${anthropicRes.status}. Please try again.`);
	}

	const payload = await anthropicRes.json() as {
		content: Array<{ type: string; name?: string; input?: unknown }>;
	};

	const toolBlock = payload.content?.find((b) => b.type === 'tool_use' && b.name === 'give_recommendation');
	if (!toolBlock?.input) {
		console.error('[uroscan] unexpected anthropic payload:', JSON.stringify(payload).slice(0, 300));
		error(502, 'AI returned an unexpected response. Please try again.');
	}

	return json(toolBlock.input as Recommendation);
};
