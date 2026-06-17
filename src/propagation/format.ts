/**
 * Small, pure formatters for the propagation readouts — frequencies span kHz→GHz and wavelengths
 * span millimetres→kilometres, so a fixed unit would read absurdly at one end. These pick a sensible
 * unit and a couple of significant figures. UI-only, but pure and tested so the readouts stay honest.
 */

/** Round to a fixed number of significant figures (for compact, scale-free readouts). */
function sig(value: number, figures = 3): string {
  if (value === 0) return '0';
  const intDigits = Math.floor(Math.log10(Math.abs(value))) + 1;
  const decimals = Math.max(0, figures - intDigits);
  return value.toFixed(decimals);
}

/** Format a frequency in Hz as kHz / MHz / GHz. */
export function formatFrequency(frequencyHz: number): string {
  if (frequencyHz >= 1e9) return `${sig(frequencyHz / 1e9)} GHz`;
  if (frequencyHz >= 1e6) return `${sig(frequencyHz / 1e6)} MHz`;
  if (frequencyHz >= 1e3) return `${sig(frequencyHz / 1e3)} kHz`;
  return `${sig(frequencyHz)} Hz`;
}

/** Format a wavelength in metres as mm / cm / m / km. */
export function formatWavelength(wavelengthMeters: number): string {
  if (wavelengthMeters >= 1000) return `${sig(wavelengthMeters / 1000)} km`;
  if (wavelengthMeters >= 1) return `${sig(wavelengthMeters)} m`;
  if (wavelengthMeters >= 0.01) return `${sig(wavelengthMeters * 100)} cm`;
  return `${sig(wavelengthMeters * 1000)} mm`;
}

/** Format a distance in km with a sensible precision for the horizon/reach readouts. */
export function formatDistanceKm(distanceKm: number): string {
  if (distanceKm >= 1000) return `${sig(distanceKm / 1000)} ×10³ km`;
  if (distanceKm >= 100) return `${distanceKm.toFixed(0)} km`;
  return `${distanceKm.toFixed(1)} km`;
}
