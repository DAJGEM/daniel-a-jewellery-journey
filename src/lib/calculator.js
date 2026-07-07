// Metal weight estimator. Baseline volumes are typical mid-size pieces
// (size-7 comfort band, 45 cm chain, etc.); scale stretches size.

import { ALLOYS } from '../data/alloys.js';

export const FORM_VOLUMES_CM3 = {
  ring: 0.26,
  pendant: 0.35,
  bracelet: 1.1,
  chain: 0.9,
  earrings: 0.2,
};

export function estimateWeightGrams(form, alloyKey, scale = 1) {
  return FORM_VOLUMES_CM3[form] * ALLOYS[alloyKey].density * scale;
}
