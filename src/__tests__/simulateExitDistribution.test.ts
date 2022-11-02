import { investors } from '../fixtures.js';
import { ReducerState } from '../reducer.js';
import { simulateExitDistribution } from '../simulateExitDistribution.js';
import { ShareClass } from '../types.js';

const getRounded = (state: ReducerState, shareClass: ShareClass) =>
  Math.round(state.distribution[shareClass].exitAmount);

test('Stage 1: compute exit distribution at €60m', () => {
  const exitDistribution = 60_000_000;
  const expectedCommon = 19_980_000;
  const expectedSeriesA = 4_020_000;
  const expectedSeriesB = 6_000_000;
  const expectedSeriesC = 30_000_000;

  const result = simulateExitDistribution(exitDistribution, investors);

  expect(getRounded(result, ShareClass.Common)).toEqual(expectedCommon);
  expect(getRounded(result, ShareClass.PreferredA)).toEqual(expectedSeriesA);
  expect(getRounded(result, ShareClass.PreferredB)).toEqual(expectedSeriesB);
  expect(getRounded(result, ShareClass.PreferredC)).toEqual(expectedSeriesC);
});

test('Stage 2: compute exit distribution at €25m', () => {
  const exitDistribution = 25_000_000;
  const expectedCommon = 2_331_000;
  const expectedSeriesA = 1_369_000;
  const expectedSeriesB = 2_800_000;
  const expectedSeriesC = 18_500_000;

  const result = simulateExitDistribution(exitDistribution, investors);

  expect(getRounded(result, ShareClass.Common)).toEqual(expectedCommon);
  expect(getRounded(result, ShareClass.PreferredA)).toEqual(expectedSeriesA);
  expect(getRounded(result, ShareClass.PreferredB)).toEqual(expectedSeriesB);
  expect(getRounded(result, ShareClass.PreferredC)).toEqual(expectedSeriesC);
});

test('Stage 3: compute exit distribution at €35m', () => {
  const exitDistribution = 35_000_000;
  const expectedCommon = 5_747_700;
  const expectedSeriesA = 1_800_000;
  const expectedSeriesB = 3_822_700;
  const expectedSeriesC = 23_629_600;

  const result = simulateExitDistribution(exitDistribution, investors);

  expect(getRounded(result, ShareClass.Common)).toEqual(expectedCommon);
  expect(getRounded(result, ShareClass.PreferredA)).toEqual(expectedSeriesA);
  expect(getRounded(result, ShareClass.PreferredB)).toEqual(expectedSeriesB);
  expect(getRounded(result, ShareClass.PreferredC)).toEqual(expectedSeriesC);
});

test('Stage 4: compute exit distribution at €45m', () => {
  const exitDistribution = 45_000_000;
  const expectedCommon = 9_546_000;
  const expectedSeriesA = 1_909_200;
  const expectedSeriesB = 4_200_000;
  const expectedSeriesC = 29_344_800;

  const result = simulateExitDistribution(exitDistribution, investors);

  expect(getRounded(result, ShareClass.Common)).toEqual(expectedCommon);
  expect(getRounded(result, ShareClass.PreferredA)).toEqual(expectedSeriesA);
  expect(getRounded(result, ShareClass.PreferredB)).toEqual(expectedSeriesB);
  expect(getRounded(result, ShareClass.PreferredC)).toEqual(expectedSeriesC);
});

test.todo('Stage 5: compute exit distribution at €40m');
test.todo('Stage 5: compute exit distribution at €50m');
test.todo('Stage 5: compute exit distribution at €70m');

test.todo('Stage 6: compute exit distribution at €39m');
test.todo('Stage 6: compute exit distribution at €44m');
test.todo('Stage 6: compute exit distribution at €47m');
