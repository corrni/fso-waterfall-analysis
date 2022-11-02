export enum ShareClass {
  Common = 'common',
  PreferredA = 'seriesA',
  PreferredB = 'seriesB',
  PreferredC = 'seriesC',
}

export interface InvestorType {
  title: string;
  shareClass: ShareClass;
  numShares: number;
  purchasePrice: Money;
  liquidationPreference: number | null;
  isParticipatingPreference: boolean;
  cap?: number | false;
}

// TODO: use Money object
export type Money = number;
