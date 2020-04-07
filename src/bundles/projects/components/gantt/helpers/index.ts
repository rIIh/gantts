import { Orderable } from '../../../types';

export const getDateColumnFromPoint = ({ x, y }: { x: number; y: number }) => document.elementsFromPoint(x, y).find(elem => elem.className.includes('day-data'));
export const linkedSorter = <T extends Orderable>(by: (el: T) => any) => (left: T, right: T) => {
  return right.next == null ? -1 : (right.next == by(left) ? 1 : -1);
};

export const sortOrderable = <T extends Orderable>(orderable: T[], by: (el: T) => any): T[] => {
  const result: T[] = [];
  const tail = orderable.find(e => e.next == undefined);
  if (!tail) { return orderable; }
  result.push(tail);
  let i = 1;
  while (i < orderable.length) {
    const nextToTail = orderable.find(e => e.next == by(result[result.length - 1]));
    if (nextToTail) {
      result.push(nextToTail);
    }
    i++;
  }
  if (result.length != orderable.length) { return orderable; }
  return result.reverse();
};
