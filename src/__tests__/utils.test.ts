import {
  buildInitialState,
  founders,
  seriesB as defaultInvestor,
} from '../fixtures.js';
import { ReducerState } from '../reducer.js';
import { ShareClass } from '../types.js';
import { getShareClassPriority, shouldConvertToCommon } from '../utils.js';

const initialState = buildInitialState({ exitDistribution: 60_000_000 });

describe('shouldConvertToCommonStock', () => {
  it('never converts to common stock if uncapped', () => {
    const uncappedInvestor = {
      ...defaultInvestor,
      cap: false,
    } as const;

    const result = shouldConvertToCommon(initialState, uncappedInvestor);

    expect(result).toBe(false);
  });

  it('converts if common stock would yield a higher return', () => {
    const result = shouldConvertToCommon(initialState, defaultInvestor);
    expect(result).toBe(true);
  });

  it('does not convert if already common stock', () => {
    const result = shouldConvertToCommon(initialState, founders);
    expect(result).toBe(false);
  });

  it('does not convert if common stock would yield a lower return', () => {
    const state: ReducerState = {
      ...initialState,
      exitRemainder: 17_000_000,
    };

    const result = shouldConvertToCommon(state, defaultInvestor);

    expect(result).toBe(false);
  });
});

// may be overkill... ¯\_(ツ)_/¯
test('getShareClassPriority', () => {
  (
    [
      [ShareClass.Common, 0],
      [ShareClass.PreferredA, 1],
      [ShareClass.PreferredB, 2],
      [ShareClass.PreferredC, 3],
    ] as const
  ).forEach(([shareClass, priority]) => {
    expect(getShareClassPriority(shareClass)).toBe(priority);
  });
});
