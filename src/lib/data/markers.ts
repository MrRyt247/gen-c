import type { MarkerKey, MarkerMeta } from '$lib/types';

/** Static reference metadata for each dipstick marker, in physical strip order. */
export const MARKER_META: Record<MarkerKey, MarkerMeta> = {
	pH: {
		key: 'pH',
		label: 'pH',
		unit: '',
		referenceLabel: '4.5 – 8.0',
		category: 'Acidity',
		about: 'Acidity of your urine. Diet, hydration and some infections can shift it.'
	},
	specific_gravity: {
		key: 'specific_gravity',
		label: 'Specific gravity',
		unit: '',
		referenceLabel: '1.005 – 1.030',
		category: 'Hydration',
		about: 'How concentrated your urine is — a proxy for hydration and kidney function.'
	},
	protein: {
		key: 'protein',
		label: 'Protein',
		unit: 'mg/dL',
		referenceLabel: 'Negative – Trace',
		category: 'Kidney',
		about: 'Protein in urine can be benign, but persistent levels may point to kidney stress.'
	},
	glucose: {
		key: 'glucose',
		label: 'Glucose',
		unit: 'mg/dL',
		referenceLabel: 'Negative',
		category: 'Sugar',
		about: 'Sugar in urine. Elevated readings are associated with high blood sugar.'
	},
	ketones: {
		key: 'ketones',
		label: 'Ketones',
		unit: 'mg/dL',
		referenceLabel: 'Negative',
		category: 'Metabolism',
		about: 'Produced when the body burns fat for fuel — seen in fasting, low-carb diets or diabetes.'
	},
	bilirubin: {
		key: 'bilirubin',
		label: 'Bilirubin',
		unit: '',
		referenceLabel: 'Negative',
		category: 'Liver',
		about: 'A breakdown product of red blood cells. Its presence can relate to liver function.'
	},
	urobilinogen: {
		key: 'urobilinogen',
		label: 'Urobilinogen',
		unit: 'mg/dL',
		referenceLabel: '0.1 – 1.0',
		category: 'Liver',
		about: 'Formed from bilirubin in the gut. Both high and absent levels can be meaningful.'
	},
	blood: {
		key: 'blood',
		label: 'Blood',
		unit: '',
		referenceLabel: 'Negative',
		category: 'Kidney',
		about: 'Hidden blood in urine. Causes range from harmless to needing follow-up.'
	},
	leukocytes: {
		key: 'leukocytes',
		label: 'Leukocytes',
		unit: '',
		referenceLabel: 'Negative',
		category: 'Infection',
		about: 'White blood cells — often a sign of a urinary tract infection.'
	},
	nitrites: {
		key: 'nitrites',
		label: 'Nitrites',
		unit: '',
		referenceLabel: 'Negative',
		category: 'Infection',
		about: 'Produced by certain bacteria, so a positive result suggests infection.'
	}
};

/** Markers in strip order, for iterating the visual + results table. */
export const MARKER_ORDER: MarkerKey[] = [
	'pH',
	'specific_gravity',
	'protein',
	'glucose',
	'ketones',
	'bilirubin',
	'urobilinogen',
	'blood',
	'leukocytes',
	'nitrites'
];

/** Markers surfaced on the dashboard mini trend chart. */
export const TREND_MARKERS: MarkerKey[] = ['pH', 'glucose', 'protein', 'leukocytes'];
