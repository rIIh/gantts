import { WeekBitMask } from '../types';
import { GanttTree } from '../types/gantt';

export const timeUnits = {
  hour: 1,
  day: 24,
  week: 24 * 7,
  month: 24 * 31,
};
export const times = (count: number, builder: (index: number) => JSX.Element | null): JSX.Element[] => {
  let elements = [];
  for (let i = 0; i < count; i++) {
    const element = builder(i);
    if (element) {
      elements.push(element);
    }
  }
  return elements;
};
export const dateDay = { day: 'numeric' };
export const dateMonth = { month: 'long' };
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
export const inline = (tree: GanttTree): GanttTree[] => {
  const subtreesInlined = [];
  for (let subtree of tree.subTrees ?? []) {
    subtreesInlined.push(...inline(subtree));
  }
  return [tree, ...subtreesInlined];
};
