import React, { useEffect, useRef, useState } from 'react';
import { CalendarScale, GanttProps, TaskCreator } from '../types/gantt';
import useComponentSize from '@rehooks/component-size';
import { WeekBitMask } from '../types';
import { DateStep, IterableDate } from '../../date/iterableDate';
import { dateDay, dayToWeekBit, weekBitToDay } from '../utils';

interface GanttCalendarProps {
  start: Date;
  lengthInWeeks: number;
  scale: CalendarScale;
  zoom: number;
}

export const GanttCalendar: React.FC<GanttProps & GanttCalendarProps> = ({ tree, weekMask, start, scale, zoom }) => {
  const ref = useRef(null);
  const size = useComponentSize(ref);
  const [endMonth, setEndMonth] = useState(start.clone().addMonths(2));
  const [lastDayInWeek, setLastDayInWeek] = useState(0);
  const taskGhost = useRef<HTMLDivElement>(null);
  const [iterableDate, setIterableDate] = useState<IterableDate>();

  const [taskConstructor, setTaskConstructor] = useState<TaskCreator>();

  useEffect(() => {
    setIterableDate(new IterableDate(start.addMonths(-2), endMonth));
  }, [endMonth]);

  useEffect(() => {
    let _lastDayInWeek = WeekBitMask.Sunday;
    if (!(weekMask & WeekBitMask.Sunday)) {
      for (let entry of Object.entries(WeekBitMask).reverse().filter((e) => typeof e[1] === 'number' && e[1] !== 0)) {
        if (weekMask & entry[1] as number) {
          _lastDayInWeek = entry[1] as number;
          break;
        }
      }
    }
    if (_lastDayInWeek !== lastDayInWeek) {
      setLastDayInWeek(weekBitToDay[_lastDayInWeek]);
    }
  }, [weekMask]);

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    if (event.currentTarget.scrollLeft + size.width + 200 > event.currentTarget.scrollWidth) {
      setEndMonth(endMonth.clone().next().month());
    }
  };

  const [atoms, updateAtoms] = useState<JSX.Element[]>([]);
  useEffect(() => {
    const groups: JSX.Element[] = [];
    for (let group of tree.subTrees ?? []) {
      let tasks = group.subTrees;
      if (!tasks) {
        continue;
      }
      let start = tasks.reduce<Date | null>((acc, task) => {
        if (!task.start) {
          return acc;
        }
        if (acc && task.start < acc) {
          return task.start;
        } else {
          return acc;
        }
      }, null);
      let end = tasks.reduce<Date | null>((acc, task) => {
        if (!task.end) {
          return acc;
        }
        if (acc && task.end > acc) {
          return task.end;
        } else {
          return acc;
        }
      }, null);

      let startTarget = start ? document.getElementById(start.toDateString()) : null;
      let endTarget = end ? document.getElementById(end.toDateString()) : null;
      let metaTarget = document.getElementById(group.id!);

      if (!metaTarget) {
        continue;
      }
      let noInitializedTasks = !start || !end;

      let groupAtom = (
          <div key={group.id} className="gantt__calendar_atom_group" style={{
            left: `${startTarget?.offsetLeft ?? 0}px`,
            right: `${((endTarget?.offsetWidth ?? 0) + (endTarget?.offsetLeft ?? 0))}px`,
            top: `${metaTarget.offsetTop}px`,
          }}>
            <div className={'gantt__calendar_atom_group_header' + (noInitializedTasks ? ' gantt__calendar_atom_group_header--hidden' : '')}>

            </div>
            {tasks?.map((task, index) => {
              let startTarget = task.start ? document.getElementById(task.start.toDateString()) : null;
              let endTarget = task.end ? document.getElementById(task.end.toDateString()) : null;

              return <div key={task.id} className="gantt__calendar_atom_group_task"
                          onMouseMove={event => {
                            if (task.start && task.end) {
                              return;
                            }
                            const mouseX = event.pageX - event.currentTarget.getBoundingClientRect().left;
                            console.log();
                            taskGhost.current?.style.setProperty('left', `${mouseX}px`);
                            taskGhost.current?.style.setProperty('width', '100px');
                            taskGhost.current?.style.setProperty('top', `${(metaTarget?.offsetTop ?? 0) + (index + 1) * 32}px`);
                          }}
                          style={{
                            left: `${startTarget?.offsetLeft ?? 0}px`,
                            right: `${((endTarget?.offsetWidth ?? 0) + (endTarget?.offsetLeft ?? 0))}px`,
                            top: `${(index + 1) * 32}px`,
                          }}/>;
            })}
          </div>
      );
      groups.push(groupAtom);
    }
    updateAtoms(groups);
  }, [tree]);

  return <div className="gantt__calendar_wrapper" ref={ref} onScroll={handleScroll}>
    <div
        className="gantt__calendar">
      <div className="gantt__calendar_atom gantt__calendar_atom--ghost" ref={taskGhost}>
      </div>
      {iterableDate?.iterateByMonths(DateStep.Month).map(date => {
        return (
            <div key={date.toString()} className="gantt__calendar_month">
              <p className="gantt__calendar_header">{date.toString('MMMM yyyy')}</p>
              <div className="gantt__calendar_content">
                {
                  new IterableDate(date.clone().moveToFirstDayOfMonth(), date.clone().moveToLastDayOfMonth()).map(dayDate => {
                    const day = dayDate.getDay();
                    if (!(weekMask & dayToWeekBit[day])) {
                      return null;
                    }
                    return (
                        <div key={dayDate.toString()}
                             id={dayDate.toDateString()}
                             className={'day-data gantt__calendar_column' + (day === lastDayInWeek ? ' gantt__calendar_column--last_in_week' : '')}
                             onMouseDown={(event) => {
                               // start task creation;
                               if (!taskConstructor) {
                                 return;
                               }
                               event.stopPropagation();
                               event.preventDefault();
                               setTaskConstructor({ start: dayDate });
                             }}>
                          {dayDate.toLocaleString(undefined, dateDay)}
                        </div>
                    );
                  })}
              </div>
            </div>
        );
      })}
      {atoms}
    </div>
  </div>;
};
