import type { MarkerKey, Status } from '$lib/types';

/**
 * Standard 10-parameter urinalysis reference chart.
 *
 * ⚠️ CALIBRATION NEEDED. These RGB swatches approximate a generic dipstick
 * colour chart (URS-10 / Multistix family) under neutral lighting. Real
 * accuracy depends on the strip brand and white-balance, and should be
 * calibrated against the actual reference card the user lays the strip on.
 * Swap the values here without touching the matching logic in analyze.ts.
 *
 * Each level lists the pad colour (rgb), the value shown to the user, and the
 * clinical status that colour maps to.
 */

export interface ColorRef {
	rgb: [number, number, number];
	value: string;
	status: Status;
}

/** Numeric reference window per marker, for drawing the marker-row pin. */
export const REFERENCE_RANGE: Partial<Record<MarkerKey, [number, number]>> = {
	pH: [4.5, 8.0],
	specific_gravity: [1.005, 1.03],
	urobilinogen: [0.1, 1.0]
};

/** Roboflow class label → our marker key. ('strip' / 'background' are ignored.) */
export const CLASS_TO_MARKER: Record<string, MarkerKey> = {
	pH: 'pH',
	SpGravity: 'specific_gravity',
	Protein: 'protein',
	Glucose: 'glucose',
	Ketone: 'ketones',
	Bilirubin: 'bilirubin',
	Urobilinogen: 'urobilinogen',
	Blood: 'blood',
	Leukocytes: 'leukocytes',
	Nitrite: 'nitrites'
};

export const CHART: Record<MarkerKey, ColorRef[]> = {
	// Blue → green → brown as glucose rises.
	glucose: [
		{ rgb: [120, 190, 180], value: 'Negative', status: 'normal' },
		{ rgb: [150, 190, 140], value: '100 mg/dL', status: 'borderline' },
		{ rgb: [170, 180, 90], value: '250 mg/dL', status: 'abnormal' },
		{ rgb: [150, 120, 60], value: '500 mg/dL', status: 'abnormal' },
		{ rgb: [120, 80, 40], value: '≥1000 mg/dL', status: 'abnormal' }
	],
	// Pale cream → tan/pink.
	bilirubin: [
		{ rgb: [245, 225, 150], value: 'Negative', status: 'normal' },
		{ rgb: [230, 190, 140], value: 'Small', status: 'borderline' },
		{ rgb: [215, 160, 140], value: 'Moderate', status: 'abnormal' },
		{ rgb: [200, 130, 140], value: 'Large', status: 'abnormal' }
	],
	// Beige → pink → maroon.
	ketones: [
		{ rgb: [240, 200, 170], value: 'Negative', status: 'normal' },
		{ rgb: [230, 170, 160], value: 'Trace', status: 'borderline' },
		{ rgb: [215, 130, 140], value: 'Small', status: 'abnormal' },
		{ rgb: [180, 80, 110], value: 'Moderate', status: 'abnormal' },
		{ rgb: [130, 40, 80], value: 'Large', status: 'abnormal' }
	],
	// Deep blue-green (dilute) → yellow-green (concentrated).
	specific_gravity: [
		{ rgb: [60, 110, 110], value: '1.000', status: 'borderline' },
		{ rgb: [90, 140, 105], value: '1.005', status: 'normal' },
		{ rgb: [120, 160, 100], value: '1.010', status: 'normal' },
		{ rgb: [160, 175, 90], value: '1.015', status: 'normal' },
		{ rgb: [185, 185, 85], value: '1.020', status: 'normal' },
		{ rgb: [205, 195, 85], value: '1.025', status: 'normal' },
		{ rgb: [215, 200, 95], value: '1.030', status: 'borderline' }
	],
	// Orange → green where blood is present.
	blood: [
		{ rgb: [240, 170, 80], value: 'Negative', status: 'normal' },
		{ rgb: [190, 180, 90], value: 'Trace', status: 'borderline' },
		{ rgb: [120, 170, 110], value: 'Moderate', status: 'abnormal' },
		{ rgb: [70, 140, 90], value: 'Large', status: 'abnormal' }
	],
	// Orange → yellow → green → blue across the pH scale.
	pH: [
		{ rgb: [235, 140, 60], value: '5.0', status: 'normal' },
		{ rgb: [235, 180, 70], value: '6.0', status: 'normal' },
		{ rgb: [220, 200, 80], value: '6.5', status: 'normal' },
		{ rgb: [170, 190, 90], value: '7.0', status: 'normal' },
		{ rgb: [120, 180, 120], value: '7.5', status: 'normal' },
		{ rgb: [80, 160, 150], value: '8.0', status: 'normal' },
		{ rgb: [60, 130, 170], value: '8.5', status: 'borderline' }
	],
	// Yellow → green as protein rises.
	protein: [
		{ rgb: [225, 210, 90], value: 'Negative', status: 'normal' },
		{ rgb: [190, 200, 100], value: 'Trace', status: 'borderline' },
		{ rgb: [150, 190, 110], value: '30 mg/dL', status: 'abnormal' },
		{ rgb: [110, 170, 110], value: '100 mg/dL', status: 'abnormal' },
		{ rgb: [70, 150, 110], value: '≥300 mg/dL', status: 'abnormal' }
	],
	// Pale → deeper pink-orange.
	urobilinogen: [
		{ rgb: [245, 210, 180], value: '0.2 mg/dL', status: 'normal' },
		{ rgb: [240, 180, 160], value: '1.0 mg/dL', status: 'normal' },
		{ rgb: [235, 150, 150], value: '2.0 mg/dL', status: 'borderline' },
		{ rgb: [225, 120, 140], value: '4.0 mg/dL', status: 'abnormal' },
		{ rgb: [210, 90, 130], value: '≥8.0 mg/dL', status: 'abnormal' }
	],
	// Cream → pink when nitrite is present.
	nitrites: [
		{ rgb: [245, 240, 225], value: 'Negative', status: 'normal' },
		{ rgb: [235, 190, 200], value: 'Positive', status: 'abnormal' },
		{ rgb: [215, 130, 160], value: 'Positive', status: 'abnormal' }
	],
	// Beige → purple as leukocytes rise.
	leukocytes: [
		{ rgb: [235, 225, 190], value: 'Negative', status: 'normal' },
		{ rgb: [220, 200, 195], value: 'Trace', status: 'borderline' },
		{ rgb: [200, 170, 190], value: 'Small', status: 'abnormal' },
		{ rgb: [170, 130, 175], value: 'Moderate', status: 'abnormal' },
		{ rgb: [140, 90, 160], value: 'Large', status: 'abnormal' }
	]
};
