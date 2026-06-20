/**
 * Barrel for the RF-propagation helpers (brief §8, §10).
 *
 * This is the one track whose math lives *outside* the from-scratch `dsp/` signal-processing core:
 * propagation is physics — how energy crosses a medium before it becomes samples — so its band
 * lookup, radio-horizon calculator, and skywave/ray-path geometry live here, behind their own
 * boundary. Everything is textbook-level and illustrative.
 */

export { SPEED_OF_LIGHT_M_S, EARTH_RADIUS_KM } from './constants';
export { wavelengthM, frequencyHzForWavelength } from './wavelength';
export { type Band, type PropagationMode, BANDS, bandFor, modeLabel } from './bands';
export { horizonKm, radioHorizonKm, HORIZON_COEFF_KM_PER_SQRT_M } from './horizon';
export {
  VIRTUAL_HEIGHT_KM,
  CRITICAL_FREQ_DAY_MHZ,
  CRITICAL_FREQ_NIGHT_MHZ,
  incidenceAngleDeg,
  mufMHz,
  reflectsSkywave,
  SKYWAVE_BEARING_BIAS_DEG,
  skywaveApparentBearingRad,
  reflectionMidpoint,
} from './skywave';
export {
  type IonoLayer,
  type IonogramPoint,
  type IonogramOptions,
  LAYER_PEAK_HEIGHT_KM,
  LAYER_SEMI_THICKNESS_KM,
  virtualHeightKmFromDelay,
  echoDelaySecondsForHeight,
  reflectsVertical,
  virtualHeightKm,
  ionogramTrace,
} from './ionosonde';
export { formatFrequency, formatWavelength, formatDistanceKm } from './format';
