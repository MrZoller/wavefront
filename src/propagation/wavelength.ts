import { SPEED_OF_LIGHT_M_S } from './constants';

/**
 * Wavelength ↔ frequency for a wave travelling at the speed of light.
 *
 * The whole "why do the bands behave differently" story starts here: a radio wave's wavelength is
 * just the speed of light divided by its frequency, so low frequencies are physically *long* (an LF
 * wave is hundreds of metres) and high frequencies are *short* (a UHF wave is centimetres). That one
 * fact drives antenna sizes and which propagation mode dominates.
 */

/**
 * Wavelength in metres for a frequency in hertz: `λ = c / f`.
 *
 * @param frequencyHz frequency in Hz (must be > 0)
 * @returns wavelength in metres
 */
export function wavelengthM(frequencyHz: number): number {
  if (frequencyHz <= 0) throw new Error('wavelengthM: frequency must be positive');
  return SPEED_OF_LIGHT_M_S / frequencyHz;
}

/**
 * The inverse: frequency in hertz for a wavelength in metres, `f = c / λ`.
 *
 * @param wavelengthMeters wavelength in metres (must be > 0)
 * @returns frequency in Hz
 */
export function frequencyHzForWavelength(wavelengthMeters: number): number {
  if (wavelengthMeters <= 0)
    throw new Error('frequencyHzForWavelength: wavelength must be positive');
  return SPEED_OF_LIGHT_M_S / wavelengthMeters;
}
