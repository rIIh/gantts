export enum DateStep {
  Day = 1, Week = 7, Month, Year,
}

export class IterableDate implements Iterable<Date> {
  private readonly start: Date;
  private readonly end: Date;
  private step: DateStep = DateStep.Day;
  private current: Date;

  constructor(start: Date, end: Date) {
    this.start = start.clone().moveToFirstDayOfMonth();
    this.end = end.clone().moveToLastDayOfMonth();
    this.current = start.clone();
  }

  iterateByMonths(step: DateStep): IterableDate {
    let copy = new IterableDate(this.start, this.end);
    copy.step = step;
    return copy;
  }

  map<T>(builder: (date: Date) => T): T[] {
    let result: T[] = [];
    for (let date of this) {
      result.push(builder(date));
    }
    return result;
  }

  done: boolean = false;

  [Symbol.iterator](): Iterator<Date> {
    return {
      next: (): IteratorYieldResult<Date> | IteratorReturnResult<any> => {
        if (this.done) {
          this.done = false;
          return { done: true, value: null };
        }
        let result = this.current.clone();
        let next = this.current.clone();
        switch (this.step) {
          case DateStep.Day: {
            next.next().day();
            break;
          }
          case DateStep.Week: {
            next.next().week();
            break;
          }
          case DateStep.Month: {
            next.next().month();
            break;
          }
          case DateStep.Year: {
            next.next().year();
            break;
          }
        }
        if (next > this.end) {
          this.current = this.start.clone();
          this.done = true;
        } else {
          this.current = next.clone();
        }
        return {
          value: result,
          done: false,
        };
      },
    };
  };
}
