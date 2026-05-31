/** Shared domain types for Uroscan. */

export type Status = 'normal' | 'borderline' | 'abnormal';

/** The ten dipstick markers Uroscan reads, in strip order. */
export type MarkerKey =
	| 'pH'
	| 'specific_gravity'
	| 'protein'
	| 'glucose'
	| 'ketones'
	| 'bilirubin'
	| 'urobilinogen'
	| 'blood'
	| 'leukocytes'
	| 'nitrites';

export interface MarkerResult {
	id: string;
	test_id: string;
	marker: MarkerKey;
	/** Display value, e.g. "6.0", "Negative", "Trace". */
	value: string;
	unit: string | null;
	status: Status;
	reference_min: number | null;
	reference_max: number | null;
	/** Hex swatch the AI detected for the pad. */
	color_detected: string | null;
	confidence: number | null;
}

export interface Test {
	id: string;
	user_id: string;
	created_at: string;
	status: Status;
	result_summary: string | null;
	ai_insights: string | null;
	thumbnail_url: string | null;
	image_url: string | null;
	raw_analysis: Record<string, unknown> | null;
	/** Joined rows (present on detail / history queries). */
	results?: MarkerResult[];
}

export interface Profile {
	id: string;
	full_name: string | null;
	avatar_url: string | null;
	age_range: string | null;
	sex: string | null;
	conditions: string[] | null;
	medications: string | null;
	notification_prefs: NotificationPrefs;
	settings: AppSettings;
	created_at: string;
}

export interface NotificationPrefs {
	weekly_summary?: boolean;
	abnormal_alerts?: boolean;
	test_reminders?: boolean;
}

export interface AppSettings {
	dark_mode?: boolean;
	units?: 'metric' | 'imperial';
	language?: string;
}

export interface SessionUser {
	id: string;
	email: string;
	name: string;
}

/** Static reference metadata for rendering a marker even before results exist. */
export interface MarkerMeta {
	key: MarkerKey;
	label: string;
	unit: string;
	referenceLabel: string;
	/** One-word body-system the marker speaks to, e.g. "Hydration", "Infection". */
	category: string;
	about: string;
}
