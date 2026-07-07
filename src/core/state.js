// Visitor state: every choice made during the journey, carried act to act.

export const DEFAULT_STATE = {
  grams: 0,
  alloy: 'gold-18k-yellow',
  form: null,
  finish: 'mirror',
  engraving: '',
  stone: null,
  stoneCarat: 1.0,
  firstName: '',
  purified: false,
};

export function createState(initial = {}) {
  let state = { ...DEFAULT_STATE, ...initial };
  const subscribers = new Set();

  return {
    get() {
      return { ...state };
    },
    set(patch) {
      const changedKeys = Object.keys(patch).filter((k) => state[k] !== patch[k]);
      if (changedKeys.length === 0) return;
      state = { ...state, ...patch };
      const snapshot = { ...state };
      subscribers.forEach((fn) => fn(snapshot, changedKeys));
    },
    subscribe(fn) {
      subscribers.add(fn);
      return () => subscribers.delete(fn);
    },
  };
}
