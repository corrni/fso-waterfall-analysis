import { Money, InvestorType, ShareClass } from './types.js';
import { DEFAULT_CAP, DEFAULT_LIQUIDATION_PREFERENCE } from './constants.js';
import { reducer, DEFAULT_STATE } from './reducer.js';

export const founders: InvestorType = {
  shareClass: ShareClass.Common,
  title: 'Founders',
  purchasePrice: 0,
  numShares: 1_000_000,
  liquidationPreference: null,
  isParticipatingPreference: false,
};

export const seriesA: InvestorType = {
  shareClass: ShareClass.PreferredA,
  title: 'Preferred A Investors',
  purchasePrice: 900_000,
  numShares: 200_000,
  liquidationPreference: DEFAULT_LIQUIDATION_PREFERENCE,
  isParticipatingPreference: true,
  cap: DEFAULT_CAP,
};

export const seriesB: InvestorType = {
  shareClass: ShareClass.PreferredB,
  title: 'Preferred B Investors',
  purchasePrice: 2_100_000,
  numShares: 300_000,
  liquidationPreference: DEFAULT_LIQUIDATION_PREFERENCE,
  isParticipatingPreference: true,
  cap: DEFAULT_CAP,
};

export const seriesC: InvestorType = {
  shareClass: ShareClass.PreferredC,
  title: 'Preferred C Investors',
  purchasePrice: 15_000_000,
  numShares: 1_500_000,
  liquidationPreference: DEFAULT_LIQUIDATION_PREFERENCE,
  isParticipatingPreference: true,
  cap: DEFAULT_CAP,
};

export const investors = [founders, seriesA, seriesB, seriesC];

export const buildInitialState = ({
  exitDistribution = 0,
  investorList = investors,
}: {
  exitDistribution?: Money;
  investorList?: InvestorType[];
} = {}) =>
  reducer(DEFAULT_STATE, {
    type: 'SET_INITIAL_STATE',
    payload: {
      exitDistribution,
      investors: investorList,
    },
  });
