import { describe, it, expect, vi } from 'vitest';
import { createState, DEFAULT_STATE } from '../src/core/state.js';

describe('state', () => {
  it('starts with defaults merged with initial', () => {
    const s = createState({ grams: 5 });
    expect(s.get().grams).toBe(5);
    expect(s.get().alloy).toBe(DEFAULT_STATE.alloy);
  });

  it('set merges and notifies with changed keys', () => {
    const s = createState();
    const fn = vi.fn();
    s.subscribe(fn);
    s.set({ form: 'ring', finish: 'satin' });
    expect(s.get().form).toBe('ring');
    expect(fn).toHaveBeenCalledWith(expect.objectContaining({ form: 'ring' }), ['form', 'finish']);
  });

  it('unsubscribe stops notifications', () => {
    const s = createState();
    const fn = vi.fn();
    s.subscribe(fn)();
    s.set({ grams: 1 });
    expect(fn).not.toHaveBeenCalled();
  });

  it('get returns a copy, not live reference', () => {
    const s = createState();
    s.get().grams = 99;
    expect(s.get().grams).toBe(0);
  });

  it('set with unchanged values does not notify', () => {
    const s = createState();
    const fn = vi.fn();
    s.subscribe(fn);
    s.set({ grams: 0 });
    expect(fn).not.toHaveBeenCalled();
  });
});
