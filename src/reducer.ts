import { Money, InvestorType, ShareClass } from './types.js';
import { getRoundedFractional, shouldConvertToCommon } from './utils.js';

interface ShareDistribution {
  convertedToCommon: boolean;
  exitAmount: Money;
  isCapped: boolean;
}

export interface ReducerState {
  distribution: {
    [shareClass: string]: ShareDistribution;
  };
  exitRemainder: Money;
  totalSharesRemainder: number;
}

type ReducerActions = 'SET_INITIAL_STATE' | 'COMPUTE_PREFERRED_SHARE' | 'CHECK_AND_APPLY_CAP' | 'COMPUTE_PRO_RATA_SPLIT' |  'CHECK_AND_CONVERT_TO_COMMON';
type NonInitialReducerActions = Exclude<ReducerActions, 'SET_INITIAL_STATE'>;
type Payload<T extends NonInitialReducerActions> = T extends T ? { type: T, payload: InvestorType}: never;
export type ReducerAction =
  | SetInitialState
  | Payload<NonInitialReducerActions>

// HELPERS
export const getPreviousShareDistribution = (
  state: ReducerState,
  investor: InvestorType,
): ShareDistribution =>
  state.distribution[investor.shareClass] || {
    isCapped: false,
    convertedToCommon: false,
    exitAmount: 0,
  };

// REDUCER ACTION HANDLERS

interface SetInitialState {
  type: 'SET_INITIAL_STATE';
  payload: {
    exitDistribution: Money;
    investors: InvestorType[];
  };
}
const setInitialState = (
  state: ReducerState,
  { investors, exitDistribution: exitRemainder }: SetInitialState['payload'],
) =>
  investors.reduce(
    (previousState, currentInvestor) => ({
      ...previousState,
      totalSharesRemainder:
        previousState.totalSharesRemainder + currentInvestor.numShares,
    }),
    {
      ...state,
      exitRemainder,
    },
  );

const convertToCommonStock = (
  state: ReducerState,
  investor: Payload<'CHECK_AND_CONVERT_TO_COMMON'>['payload'],
): ReducerState => {
  const shouldConvert =
    investor.shareClass !== ShareClass.Common &&
    shouldConvertToCommon(state, investor);

  if (!shouldConvert) {
    return {
      ...state,
      distribution: {
        ...state.distribution,
        [investor.shareClass]: getPreviousShareDistribution(state, investor),
      },
    };
  }

  return {
    ...state,
    distribution: {
      ...state.distribution,
      [investor.shareClass]: {
        ...getPreviousShareDistribution(state, investor),
        convertedToCommon: true,
      },
    },
  };
};

const computePreferredShare = (
  state: ReducerState,
  investor: Payload<'COMPUTE_PREFERRED_SHARE'>['payload'],
): ReducerState => {
  const previousDistribution = getPreviousShareDistribution(state, investor);

  const isCommonStock =
    investor.shareClass === ShareClass.Common ||
    previousDistribution.convertedToCommon;

  if (isCommonStock) {
    return {
      ...state,
      distribution: {
        ...state.distribution,
        [investor.shareClass]: getPreviousShareDistribution(state, investor),
      },
    };
  }

  const exitAmount = investor.purchasePrice * investor.liquidationPreference;

  return {
    ...state,
    exitRemainder: state.exitRemainder - exitAmount,
    distribution: {
      ...state.distribution,
      [investor.shareClass]: {
        ...previousDistribution,
        exitAmount,
      },
    },
  };
};

// TODO: refactor
const shouldBeCapped = (state: ReducerState, investor: InvestorType) => {
  const previousDistribution = getPreviousShareDistribution(state, investor);

  const isCommonStock =
    investor.shareClass === ShareClass.Common ||
    previousDistribution.convertedToCommon;

  if (!investor.cap || isCommonStock) {
    return false;
  }

  const shareOwnership = getRoundedFractional(
    investor.numShares / state.totalSharesRemainder,
  );

  const cappedExitAmount = investor.purchasePrice * investor.cap;
  const unCappedExitAmount =
    previousDistribution.exitAmount + state.exitRemainder * shareOwnership;

  return unCappedExitAmount >= cappedExitAmount;
};

const checkAndApplyCap = (
  state: ReducerState,
  investor: Payload<'CHECK_AND_APPLY_CAP'>['payload'],
): ReducerState => {
  const previousDistribution = getPreviousShareDistribution(state, investor);

  if (!shouldBeCapped(state, investor)) {
    return {
      ...state,
      distribution: {
        ...state.distribution,
        [investor.shareClass]: previousDistribution,
      },
    };
  }

  const shareOwnership = getRoundedFractional(
    investor.numShares / state.totalSharesRemainder,
  );

  const cappedExitAmount = investor.purchasePrice * (investor.cap as number);
  const unCappedExitAmount =
    previousDistribution.exitAmount + state.exitRemainder * shareOwnership;
  const isCapped = unCappedExitAmount >= cappedExitAmount;

  const exitAmount = cappedExitAmount;

  return {
    ...state,
    exitRemainder:
      state.exitRemainder - (exitAmount - previousDistribution.exitAmount),
    totalSharesRemainder: state.totalSharesRemainder - investor.numShares,
    distribution: {
      ...state.distribution,
      [investor.shareClass]: {
        ...previousDistribution,
        exitAmount,
        isCapped,
      },
    },
  };
};

const computeProRataSplit = (
  state: ReducerState,
  investor: Payload<'COMPUTE_PRO_RATA_SPLIT'>['payload'],
): ReducerState => {
  const previousDistribution = getPreviousShareDistribution(state, investor);

  if (previousDistribution.isCapped) {
    return state;
  }

  const shareOwnership = getRoundedFractional(
    investor.numShares / state.totalSharesRemainder,
  );

  const exitAmount =
    previousDistribution.exitAmount + state.exitRemainder * shareOwnership;

  return {
    ...state,
    distribution: {
      ...state.distribution,
      [investor.shareClass]: {
        ...previousDistribution,
        exitAmount,
      },
    },
  };
};

// REDUCER

export const DEFAULT_STATE: ReducerState = {
  totalSharesRemainder: 0,
  exitRemainder: 0,
  distribution: {},
};

export function reducer(
  state: ReducerState = DEFAULT_STATE,
  action: ReducerAction,
) {
  switch (action.type) {
    case 'SET_INITIAL_STATE':
      return setInitialState(state, action.payload);

    case 'CHECK_AND_CONVERT_TO_COMMON':
      return convertToCommonStock(state, action.payload);

    case 'COMPUTE_PREFERRED_SHARE':
      return computePreferredShare(state, action.payload);

    case 'CHECK_AND_APPLY_CAP':
      return checkAndApplyCap(state, action.payload);

    case 'COMPUTE_PRO_RATA_SPLIT':
      return computeProRataSplit(state, action.payload);

    default:
      // @ts-expect-error Extra safety measure for JS consumers
      // (TS should catch unknown actions)
      throw new Error(`Unknown reducer action "${action.type}"`);
  }
}
