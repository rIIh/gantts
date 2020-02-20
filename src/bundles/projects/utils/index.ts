import { WeekBitMask } from '../types';

export const dayToWeekBit: { [key: number]: WeekBitMask } = {
  0: WeekBitMask.Sunday,
  1: WeekBitMask.Monday,
  2: WeekBitMask.Tuesday,
  3: WeekBitMask.Wednesday,
  4: WeekBitMask.Thursday,
  5: WeekBitMask.Friday,
  6: WeekBitMask.Saturday,
};

export const weekBitToDay: { [key: number]: number } = {
  [WeekBitMask.Sunday]: 0,
  [WeekBitMask.Monday]: 1,
  [WeekBitMask.Tuesday]: 2,
  [WeekBitMask.Wednesday]: 3,
  [WeekBitMask.Thursday]: 4,
  [WeekBitMask.Friday]: 5,
  [WeekBitMask.Saturday]: 6,
};

