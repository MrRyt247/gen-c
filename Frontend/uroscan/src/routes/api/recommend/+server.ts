import Anthropic from '@anthropic-ai/sdk';
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

const SYSTEM = `You are a urinalysis assistant that helps interpret dipstick urine test results. \
Your role is to recommend whether the user should seek medical care, monitor at home, or if results look normal. \
You do NOT diagnose conditions. You speak plainly and calmly, like a knowledgeable friend — not a clinician.`;

/** Force-structured response via tool use so we always get clean JSON. */
const RECOMMENDATION_TOOL: Anthropic.Tool = {
	name: 'give_recommendation',
	description:
		'Return a structured recommendation based on the urinalysis results provided by the user.',
	input_schema: {
		type: 'object' as const,
		properties: {
			verdict: {
				type: 'string',
				enum: ['seek_care', 'monitor', 'normal'],
				description:
					'"seek_care" = medical evaluation recommended; "monitor" = watch symptoms and re-test in a few days; "normal" = results within expected ranges'
			},
			urgency: {
				type: 'string',
				enum: ['urgent', 'soon', 'routine', 'none'],
				description:
					'Only meaningful when verdict is seek_care. "urgent" = today / urgent care; "soon" = within 1-3 days; "routine" = schedule an appointment; "none" = not applicable'
			},
			headline: {
				type: 'string',
				description: 'A single, clear sentence summarising the recommendation (under 15 words).'
			},
			reasoning: {
				type: 'string',
				description:
					'2-3 plain-language sentences explaining the key findings that led to this recommendation. Do not use clinical jargon.'
			},
			nextSteps: {
				type: 'array',
				items: { type: 'string' },
				description:
					'2-4 specific, actionable steps the user should take. Keep each step concise (one sentence).'
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

	const userMessage = `Here are the urine dipstick test results for a patient:

Overall panel status: ${status}
${flagSummary}

Full marker readings:
${markerLines}

Please analyse these results and use the give_recommendation tool to provide a clear, compassionate recommendation.`;

	try {
		const client = new Anthropic({ apiKey });

		const response = await client.messages.create({
			model: 'claude-haiku-4-5-20251001',
			max_tokens: 600,
			system: SYSTEM,
			tools: [RECOMMENDATION_TOOL],
			tool_choice: { type: 'tool', name: 'give_recommendation' },
			messages: [{ role: 'user', content: userMessage }]
		});

		const toolBlock = response.content.find((b) => b.type === 'tool_use');
		if (!toolBlock || toolBlock.type !== 'tool_use') {
			error(502, 'AI returned an unexpected response. Please try again.');
		}

		return json(toolBlock.input as Recommendation);
	} catch (e) {
		if (e && typeof e === 'object' && 'status' in e) throw e; // re-throw SvelteKit errors
		console.error('[uroscan] claude recommendation error:', e);
		error(502, e instanceof Error ? e.message : 'AI recommendation unavailable.');
	}
};
