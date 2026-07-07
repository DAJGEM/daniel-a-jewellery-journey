// Physically-grounded glow colour for heated metal.
// Colour from the Tanner–Helland black-body approximation (clamped to the
// incandescent range); intensity ramps from first visible glow (~480 °C)
// to full brightness at gold's melting point (1,064 °C = 1,337 K).

const MELT_K = 1337;
const RAMP_START_K = 750;
const FIRST_GLOW_C = 480;

export function glow(celsius) {
  const kelvin = celsius + 273.15;

  if (celsius < FIRST_GLOW_C) {
    return { r: 0, g: 0, b: 0, intensity: 0 };
  }

  const intensity = Math.min(1, Math.max(0, (kelvin - RAMP_START_K) / (MELT_K - RAMP_START_K)));

  // Tanner–Helland, valid domain starts near 1000 K; clamp below.
  const t = Math.max(kelvin, 1000) / 100;
  const r = 255;
  const g = Math.round(Math.min(255, Math.max(0, 99.4708025861 * Math.log(t) - 161.1195681661)));
  const b = kelvin < 1900 ? 0 : Math.round(Math.min(255, Math.max(0, 138.5177312231 * Math.log(t - 10) - 305.0447927307)));

  return { r, g, b, intensity };
}
