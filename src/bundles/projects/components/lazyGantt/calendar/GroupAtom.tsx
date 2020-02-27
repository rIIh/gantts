import { DateRange, LazyTask, LazyTaskGroup, TaskType } from '../../../types';
import React, { forwardRef, memo, PropsWithRef, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
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
import { useTypedSelector } from '../../../../../redux/rootReducer';
import { diffDays } from '../../../../date/date';
import { useSpring, animated } from 'react-spring';
import { IterableDate } from '../../../../date/iterableDate';

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
      const { atomElements, setAtomRef } = useContext(CalendarContext);
      const [hasAnchor, setAnchor] = useState(false);
      const { sharedState } = useContext(LGanttContext)!;
      const groupState = useTypedSelector(state => state.projectsState.calculatedProperties.get(group.uid));
      const shared = sharedState.get(group.uid) as { collapsed?: boolean };
      const initialized = groupState != null && groupState.start;
      
      let metaTarget = document.getElementById(uid!);
      const [offset, setOffset] = useState(metaTarget?.offsetTop);
      
      const groupRef = useRef<HTMLDivElement>(null);
      
      const groupStartCol = useMemo(() => { return groupState?.start ? getDateColumn(groupState.start) : null; }, [groupState]);
      const groupEndCol = useMemo(() => { return groupState?.end ? getDateColumn(groupState.end) : null; }, [groupState]);
      
      useEffect(() => {
        set({
          marginLeft: 0,
        });
      }, [groupStartCol]);
      
      useEffect(() => {
        let metaTarget = document.getElementById(uid!);
        if (metaTarget) {
          setAnchor(true);
        } else { setAnchor(false); }
        setOffset(metaTarget?.offsetTop);
      }, [atomElements, sharedState]);
      
      const [spring, set] = useSpring(() => ({
        left: groupStartCol?.offsetLeft ?? 0,
        marginLeft: 0,
        config: {
          mass: 1,
          tension: 350,
          friction: 25,
        },
      }));
      
      useLayoutEffect(() => { set({ left: groupStartCol?.offsetLeft ?? 0 }); }, [groupStartCol]);
      const [dragV, setDrag] = useState(0);
      
      const bind = useHover(({ hovering }) => setSelected(hovering));
      let batching: Promise<void[]> | null = null;
      const drag = useDrag(({ down, first, last, event, cancel, movement: [mx] }) => {
        if (batching) {
          cancel?.();
        }
        event?.stopPropagation();
        if (first) {
          event?.preventDefault();
        }
        if (down && !last) {
          set({
            marginLeft: mx,
          });
          setDrag(mx);
        }
        if (last) {
          if (groupRef.current) {
            const rect = groupRef.current.getBoundingClientRect();
            const dateColumn = getDateColumnFromPoint({ x: rect.left, y: rect.top });
            const currentStart = groupState?.start;
            if (dateColumn && currentStart) {
              const newStart = new Date(dateColumn.id);
              const diff = diffDays(currentStart, newStart);
              if (Math.abs(diff) > 0) {
                const batch: Promise<void>[] = [];
                for (let task of tasks) {
                  if (task.start) {
                    batch.push(task.selfReference().update({
                      start: task.start?.clone().addDays(diff),
                      end: task.end?.clone().addDays(diff),
                    }));
                  }
                }
                batching = Promise.all(batch);
                batching.then(() => {
                  batching = null;
                });
              }
            }
          }
          setDrag(0);
          if (!batching) {
            set({
              marginLeft: 0,
            });
          }
        }
      });
      
      if (!hasAnchor) {
        console.log('Meta not found');
        return null;
      }
      
      return <>
        <AtomWrapper selected={selected}
                     {...bind()}
                     style={{
                       top: `${offset ?? 0}px`,
                     }}>
          <animated.div/>
          <GroupHeader hidden={!initialized}
                       ref={groupRef}
                       id={`group_${group.uid}_calendar`}
                       filled={groupState?.progress}
                       {...drag()}
                       style={{
                         width: initialized ? `${(groupEndCol?.offsetLeft ?? 0) - (groupStartCol?.offsetLeft ?? 0) + 29}px` : '0',
                         ...spring,
                       }}/>
        </AtomWrapper>
        {(!shared || !shared.collapsed) && <>
          {tasks?.filter(task => !sharedState?.get(task.uid)?.hidden).map(
              (task, index) => {
                const Atom = task.type == TaskType.Task ? (
                    task.start && task.end ? TaskAtom : TaskAtomCreator
                ) : (
                    task.start ? TaskAtom : MilestoneAtomCreator
                );
                return <Atom key={task.uid!} task={task}
                             ref={ref => {
                               ref && setAtomRef(task.uid, ref);
                             }}
                             parentOffset={dragV}
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
