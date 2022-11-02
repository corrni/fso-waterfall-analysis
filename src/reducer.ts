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

export type ReducerAction =
  | SetInitialState
  | CheckAndApplyCapAction
  | ComputePreferredShareAction
  | ComputeProRataSplitAction
  | CheckAndConvertToCommonAction;

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

interface CheckAndConvertToCommonAction {
  type: 'CHECK_AND_CONVERT_TO_COMMON';
  payload: InvestorType;
}
const convertToCommonStock = (
  state: ReducerState,
  investor: CheckAndConvertToCommonAction['payload'],
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

interface ComputePreferredShareAction {
  type: 'COMPUTE_PREFERRED_SHARE';
  payload: InvestorType;
}
const computePreferredShare = (
  state: ReducerState,
  investor: ComputePreferredShareAction['payload'],
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

interface CheckAndApplyCapAction {
  type: 'CHECK_AND_APPLY_CAP';
  payload: InvestorType;
}
const checkAndApplyCap = (
  state: ReducerState,
  investor: CheckAndApplyCapAction['payload'],
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

interface ComputeProRataSplitAction {
  type: 'COMPUTE_PRO_RATA_SPLIT';
  payload: InvestorType;
}
const computeProRataSplit = (
  state: ReducerState,
  investor: ComputeProRataSplitAction['payload'],
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
