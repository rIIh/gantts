import { DateRange, LazyTask, LazyTaskGroup, TaskType } from '../../../types';
import React, { forwardRef, memo, PropsWithRef, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AtomWrapper, GroupHeader } from '../styled';
import { useCollectionReference } from '../../../../firebase/hooks/useReference';
import { useDrag, useHover } from 'react-use-gesture';
import TaskAtom from './TaskAtom';
import TaskAtomCreator from './TaskAtomCreator';
import MilestoneAtomCreator from './MilestoneAtomCreator';
import { LGanttContext } from '../LazyGantt';
import { CalendarContext } from '../LazyGanttCalendar';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import { useTraceUpdate } from '../../../../common/hooks/useTraceUpdate';
import _ from 'lodash';
import { useSimpleCollection } from '../../../../firebase/hooks/useSimpleReference';
import { getDateColumnFromPoint } from '../helpers';
import { FirestoreApp } from '../../../../common/services/firebase';

interface Props {
  group: LazyTaskGroup;
  getDateColumn: (date: Date) => HTMLElement;
  groupDatesChanged: (group: LazyTaskGroup, start: Date, end: Date) => void;
}

enum DragType {
  Horizontal, None,
}

const GroupAtom = memo(forwardRef<HTMLDivElement, Props>(
    (
        { group, getDateColumn, groupDatesChanged, ...events }, ref
    ) => {
      const { uid } = group;
      const [tasks] = useSimpleCollection<LazyTask>(group.tasks());
      const [selected, setSelected] = useState(false);
      const [dataRange, setDates] = useState<DateRange | null>(null);
      const initialized = dataRange != null;
      const { atomElements, setAtomRef } = useContext(CalendarContext);
  
      const { project, sharedState, writeSharedState } = useContext(LGanttContext)!;
      const shared = sharedState.get(group.uid) as { collapsed?: boolean };
      
      let groupStartCol = dataRange?.start ? getDateColumn(dataRange.start) : null;
      let groupEndCol = dataRange?.end ? getDateColumn(dataRange.end) : null;
      let metaTarget = document.getElementById(uid!);
      const [offset, setOffset] = useState(metaTarget?.offsetTop);
      
      const groupRef = useRef<HTMLDivElement>(null);
      
      const [dragState, setDragState] = useState(DragType.None);
      const [dragValue, setDragValue] = useState(0);
      
      useTraceUpdate({group, getDateColumn, groupDatesChanged, events, ref});
      
      useEffect(() => {
        let metaTarget = document.getElementById(uid!);
        setOffset(metaTarget?.offsetTop);
      }, [atomElements]);
  
      const bind = useHover(({ hovering }) => setSelected(hovering));
      let batching: Promise<void[]> | null = null;
      const drag = useDrag(({ down, first, last, event, cancel, movement: [mx]  }) => {
        if (batching) { cancel?.(); }
        event?.stopPropagation();
        if (first) {
          event?.preventDefault();
          setDragState(DragType.Horizontal);
          writeSharedState(group.uid, { dragging: true });
        }
        if (down) {
          console.log('down', mx);
          setDragValue(mx);
        }
        if (last) {
          console.log('last');
          if (groupRef.current) {
            const rect = groupRef.current.getBoundingClientRect();
            const dateColumn = getDateColumnFromPoint({ x: rect.left, y: rect.top });
            if (dateColumn) {
              const newStart = new Date(dateColumn.id);
              const currentStart = sharedState.get(group.uid)!.start as Date;
              const negative = currentStart.compareTo(newStart) > 0;
              const diffTime = Math.abs(negative ? -newStart.getTime() + sharedState.get(group.uid)!.start.getTime() : newStart.getTime() - sharedState.get(group.uid)!.start.getTime());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              console.log(negative ? -diffDays : diffDays);
              if (Math.abs(diffDays) > 0) {
                const batch: Promise<void>[] = [];
                for (let task of tasks) {
                  if (task.start) {
                    batch.push(task.selfReference().update({
                      start: task.start?.clone().addDays(negative ? -diffDays : diffDays),
                      end: task.end?.clone().addDays(negative ? -diffDays : diffDays),
                    }));
                  }
                }
                batching = Promise.all(batch);
                batching.then(() => {
                  batching = null;
                  setDragState(DragType.None);
                  setDragValue(0);
                  writeSharedState(group.uid, { dragging: false });
                });
              }
            }
          }
          if (!batching) {
            setDragState(DragType.None);
            setDragValue(0);
            writeSharedState(group.uid, { dragging: false });
          }
        }
      });
 
      useEffect(() => {
        if (dragState != DragType.None) { return; }
  
        const minimum = tasks?.map(_task => _task.start).reduce((a, date) => {
          if (a && date && a.compareTo(date) < 0 || !date) {
            return a;
          } else {
            return date;
          }
        }, undefined);
        const maximum = tasks?.map(_task => _task.end).reduce((a, date) => {
          if (a && date && a.compareTo(date) > 0 || !date) {
            return a;
          } else {
            return date;
          }
        }, undefined);
        if (minimum && maximum) {
          setDates({
            start: minimum,
            end: maximum,
          });
          writeSharedState(group.uid, { start: minimum, end: maximum });
        }
        console.log(minimum, maximum);
      }, [tasks, dragState]);
      
      
      return <>
        <AtomWrapper selected={selected}
                     {...bind()}
                     style={{
                       top: `${offset ?? 0}px`,
                     }}>
          <GroupHeader hidden={!initialized}
                       ref={groupRef}
                       id={`group_${group.uid}_calendar`}
                       filled={sharedState.get(group.uid)?.progress}
                       dragging={dragState != DragType.None}
                       {...drag()}
                       style={{
            left: `${(groupStartCol?.offsetLeft ?? 0)}px`,
            marginLeft: `${(dragState == DragType.Horizontal ? dragValue : 0)}px`,
            width: initialized ? `${(groupEndCol?.offsetLeft ?? 0) - (groupStartCol?.offsetLeft ?? 0) + 29}px` : '100%',
          }}/>
        </AtomWrapper>
        { (!shared || !shared.collapsed) && <>
          { tasks?.filter(task => !sharedState?.get(task.uid)?.hidden).map(
              (task, index) => {
                const Atom = task.type == TaskType.Task ? (
                    task.start && task.end ? TaskAtom : TaskAtomCreator
                ) : (
                    task.start ? TaskAtom : MilestoneAtomCreator
                );
                return <Atom key={task.uid!} task={task}
                             ref={ref => {
                               ref && setAtomRef(task.uid, ref);
                             }
                             }
                             getDateColumn={getDateColumn} onDatesChanged={console.log}
                             style={{
                               top: `${(metaTarget?.offsetTop ?? 0) + (index + 1) * 24}px`,
                             }} {...events}/>;
              }
          )}
        </>}
      </>;
    }), ({ group: left }, { group: right }) => {
  return _.isEqual(left.uid, right.uid);
});

export default GroupAtom;
