import { InvestorType, ShareClass } from './types.js';
import { DEFAULT_CAP } from './constants.js';
import { ReducerState } from './reducer.js';

export const shouldConvertToCommon = (
  state: ReducerState,
  {
    cap = DEFAULT_CAP,
    liquidationPreference,
    numShares,
    purchasePrice,
    shareClass,
  }: InvestorType,
) => {
  if (shareClass === ShareClass.Common || !cap) return false;

  const shareOwnership = getRoundedFractional(
    numShares / state.totalSharesRemainder,
  );

  /*
    TODO: May not be a complete solution, check if investors with preferred
    stock are allowed to convert after all other *participating* players have
    received their `purchasePrice * liquidationPreference`.
  */
  const returnWithCap = Math.min(
    purchasePrice * cap,
    purchasePrice * liquidationPreference +
      state.exitRemainder * shareOwnership,
  );

  const returnWithCommonStock = state.exitRemainder * shareOwnership;

  return returnWithCap <= returnWithCommonStock;
};

export const getShareClassPriority = (shareClass: ShareClass) =>
  ({
    [ShareClass.Common]: 0 as const,
    [ShareClass.PreferredA]: 1 as const,
    [ShareClass.PreferredB]: 2 as const,
    [ShareClass.PreferredC]: 3 as const,
  }[shareClass]);

export const getRoundedFractional = (num: number) =>
  Math.round(num * 1000) / 1000;

// TODO: Add types
export const pipe =
  (...fns) =>
  (x) =>
    fns.reduce((res, fn) => fn(res), x);
