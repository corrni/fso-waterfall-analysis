import { DEFAULT_STATE, reducer, ReducerState } from './reducer.js';
import { Money, InvestorType } from './types.js';
import { pipe } from './utils.js';

export const simulateExitDistribution = (
  exitDistribution: Money,
  investors: InvestorType[],
): ReducerState => {
  // TODO: copy & sort investor list properly (sort on share-class priority)
  const sortedInvestors = [...investors].reverse();

  return pipe(
    setInitialState(exitDistribution, sortedInvestors),
    computePreferredShares(sortedInvestors),
    checkAndApplyCap(sortedInvestors),
    computeProRataSplit(sortedInvestors),
  )(DEFAULT_STATE);
};

function setInitialState(exitDistribution: Money, investors: InvestorType[]) {
  return (state: ReducerState) =>
    reducer(state, {
      type: 'SET_INITIAL_STATE',
      payload: { exitDistribution, investors },
    });
}

function computePreferredShares(investors: InvestorType[]) {
  return (state: ReducerState) =>
    investors.reduce(
      (previousState, currentInvestor) =>
        reducer(
          reducer(previousState, {
            type: 'CHECK_AND_CONVERT_TO_COMMON',
            payload: currentInvestor,
          }),
          { type: 'COMPUTE_PREFERRED_SHARE', payload: currentInvestor },
        ),
      state,
    );
}

function checkAndApplyCap(investors: InvestorType[]) {
  return (state: ReducerState) =>
    investors.reduce(
      (previousState, currentInvestor) =>
        reducer(previousState, {
          type: 'CHECK_AND_APPLY_CAP',
          payload: currentInvestor,
        }),
      state,
    );
}

function computeProRataSplit(investors: InvestorType[]) {
  return (state: ReducerState) =>
    investors.reduce(
      (previousState, currentInvestor) =>
        reducer(previousState, {
          type: 'COMPUTE_PRO_RATA_SPLIT',
          payload: currentInvestor,
        }),
      state,
    );
}
