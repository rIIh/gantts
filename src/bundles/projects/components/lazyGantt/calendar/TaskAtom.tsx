import { DateRange, LazyTask, TaskType } from '../../../types';
import React, { forwardRef, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { Atom, AtomDot, AtomHandle, AtomLabel, AtomWrapper, Milestone } from '../styled';
import { useDrag, useGesture, useHover } from 'react-use-gesture';
import { Overlay, Tooltip } from 'react-bootstrap';
import Link, { LinkState } from './Link';
import { useTheme } from '../../../../styled-components/hooks/useTheme';
import { LGanttContext } from '../LazyGantt';
import { LazyReference } from '../../../../firebase/types';
import _ from 'lodash';
import { useForwardedRef } from '../../../../common/hooks/useForwardedRef';
import { FullGestureState } from 'react-use-gesture/dist/types';
import { CalendarContext } from '../LazyGanttCalendar';
import { GanttTheme } from '../types';
import { getDateColumnFromPoint } from '../helpers';
import { LazyUserInfo } from '../../../../user/types';
import { useSimpleCollection } from '../../../../firebase/hooks/useSimpleReference';
import { WTooltip } from '../../../../bootstrap/WTooltip';
import { diffDays } from '../../../../date/date';

interface AtomProps {
  task: LazyTask;
  getDateColumn: (date: Date) => HTMLElement;
  style?: React.CSSProperties;
}

const DraggableAtom = styled(Atom)`
  cursor: move;
`;

interface DragState {
  dragXOffset?: number;
  dragYOffset?: number;
}

interface HandleState {
  left?: number;
  right?: number;
}

const Content = styled.div`
  position: absolute;
  left: 8px;
  right: 5px;
  font-size: 11px;
  opacity: 0.69;
  display: flex;
  align-items: center;
  height: 100%;
  z-index: 100;
`;

const TaskAtom = forwardRef<HTMLDivElement, AtomProps>(({ task, style, getDateColumn }, ref) => {
  const atomStart = task.start ? getDateColumn(task.start) : null;
  const atomEnd = task.end ? getDateColumn(task.end) : null;
  const [mouseOver, setMouseOver] = useState(false);
  const [dragState, setDrag] = useState<DragState | null>(null);
  const [handleState, setHandle] = useState<HandleState | null>(null);
  const [assigned] = useSimpleCollection<LazyUserInfo>(task.assigned());
  const [dates, setDates] = useState<DateRange | null>(null);
  const atom = useForwardedRef(ref);
  const [selected, setSelected] = useState(false);
  const theme = useTheme<GanttTheme>();
  const { findNode, filters, sharedState } = useContext(LGanttContext)!;
  const { setAtomRef } = useContext(CalendarContext);
  const [waitingForRelink, setRelink] = useState(false);
  
  useEffect(() => () => setAtomRef(task.uid, null), []);
  
  useEffect(() => {
    if (dragState || handleState) {
      let atomRect = atom.current?.getBoundingClientRect();
      if (atomRect) {
        let startPoint = atomRect.x + 13;
        let endPoint = atomRect.x + atomRect.width - 29 + 13;
        let startCol = getDateColumnFromPoint({ x: startPoint, y: atomRect.y });
        let endCol = getDateColumnFromPoint({ x: endPoint, y: atomRect.y });
        if (startCol && endCol) {
          let start = new Date(startCol.id);
          let end = new Date(endCol.id);
          setDates({ start, end });
        }
      }
    } else {
      if (dates && (!task.start?.equals(dates.start) || !task.end?.equals(dates.end))) {
        task.selfReference().update(dates).catch(console.warn);
      }
      setDates(null);
    }
  }, [dragState, handleState]);
  
  useEffect(_.after(0, () => {
    (async () => {
      if (task.end) {
        const taskEnd = task.end;
        const promises = task.dependentOn?.().map(ref => ref.get());
        for (let doc of promises ?? []) {
          const dependency = (await doc).data() as LazyTask;
          if ((dependency.start?.compareTo(taskEnd) ?? 0) <= 0 && dependency.start) {
            const days = diffDays(dependency.start, taskEnd.clone());
            if (days >= 0) {
              dependency.selfReference().update({ start: dependency.start.clone().addDays(days + 1), end: dependency.end!.clone().addDays(days + 1) });
            }
          }
        }
      }
    })();
  }), [task]);
  
  const handleHandler = (side: 'left' | 'right', down: boolean, x: number) => {
    if (down) {
      setHandle({ [side]: x });
    } else {
      if (handleState !== null) {
        setHandle(null);
      }
    }
  };
  
  const leftHandle = useDrag(({ down, movement: [x, y], event, last, cancel }) => {
    if (dragState) {
      cancel?.();
    }
    if (!last) {
      event?.preventDefault();
    }
    event?.stopPropagation();
    handleHandler('left', down, x);
  });
  
  const rightHandle = useDrag(({ down, movement: [x, y], event, last, cancel }) => {
    if (dragState) {
      cancel?.();
    }
    if (!last) {
      event?.preventDefault();
    }
    event?.stopPropagation();
    handleHandler('right', down, x);
  });
  
  const atomGesture = useGesture({
    onMouseEnter: event => setMouseOver(true),
    onMouseLeave: event => setMouseOver(false),
    onMouseDown: (event) => event.preventDefault(),
    onDrag: ({ down, movement: [mx, my], cancel }) => {
      if (handleState) {
        cancel?.();
      }
      if (down) {
        setDrag({ dragXOffset: mx });
      } else {
        if (dragState !== null) {
          console.log('hello there');
          setDrag(null);
        }
      }
    },
  });
  const bind = useHover(({ hovering }) => setSelected(hovering));
  
  const [linkState, setLinkState] = useState<LinkState | null>(null);
  
  const wrapper = useRef<HTMLDivElement>(null);
  
  const prepareGesture = (props: FullGestureState<'drag'>): boolean => {
    const { event, first, last, cancel } = props;
    event?.stopPropagation();
    if (first) {
      event?.preventDefault();
    }
    if (!atom.current) {
      cancel?.();
      return false;
    }
    return true;
  };
  
  const handleLinking = (props: FullGestureState<'drag'>, type: 'left' | 'right') => {
    const { down, xy: [x, y], first, last } = props;
    const isLeft = type == 'left';
    const staticProp: keyof LinkState = isLeft ? 'to' : 'from';
    const movingProp: keyof LinkState = isLeft ? 'from' : 'to';
    
    const testAtomBelow = document.elementsFromPoint(x, y).find(node => node.matches('.calendar_task_atom')) as HTMLElement;
    let targetID = testAtomBelow?.getAttribute('data-atom_uid');
    if (testAtomBelow && targetID != task.uid) {
      setLinkState({
        from: [0, 0], to: [0, 0],
        [movingProp]: [testAtomBelow.offsetLeft + (isLeft ? testAtomBelow.getBoundingClientRect().width : 0), testAtomBelow.parentElement!.offsetTop + theme.atomHeight / 2 - theme.barVMargin / 2],
        [staticProp]: [atom.current!.offsetLeft + (isLeft ? 0 : atom.current!.getBoundingClientRect().width), atom.current!.parentElement!.offsetTop + theme.atomHeight / 2 - theme.barVMargin / 2],
      });
      if (last && targetID ) {
        console.log(testAtomBelow, targetID);
        findNode(targetID).then((target => {
          let targetRef = target?.selfReference;
          let taskRef = task.selfReference;
          
          if (taskRef && targetRef && !_.isEqual(taskRef, targetRef)) {
            const isLeft = type == 'left';
            const taskProp: keyof LazyTask = isLeft ? 'dependsOn' : 'dependentOn';
            const targetProp: keyof LazyTask = isLeft ? 'dependentOn' : 'dependsOn';
            if (target?.[taskProp]?.().some(dep => dep.id == task.uid)) {
              alert('Circle reference not allowed');
            }
            else if (!task[taskProp]?.().find(t => t!.id == target?.uid) && !target?.[targetProp]?.().find(t => t!.id == task?.uid)) {
              const taskPromise = taskRef().update(
                  { [taskProp]: [...task?.[taskProp]?.().map(ref => ({ uid: ref.id, path: ref.path })) ?? [], new LazyReference(targetRef().path).toJson()] });
              const targetPromise = targetRef().update(
                  { [targetProp]: [...target?.[targetProp]?.().map(ref => ({ uid: ref.id, path: ref.path })) ?? [], new LazyReference(taskRef().path).toJson()] });
            }
          }
        })).catch(console.warn);
      }
    } else {
      let container = wrapper.current!.parentElement!.parentElement!;
      let rect = container.getBoundingClientRect();
      setLinkState({
        from: [0, 0], to: [0, 0],
        [movingProp]: [x + container.scrollLeft - rect.left, y - rect.top],
        [staticProp]: [atom.current!.offsetLeft + (isLeft ? 0 : atom.current!.getBoundingClientRect().width), atom.current!.parentElement!.offsetTop + theme.atomHeight / 2 - theme.barVMargin / 2],
      });
    }
  };
  
  const endLink = useDrag((props) => {
    if (!prepareGesture(props)) {
      return;
    }
    handleLinking(props, 'right');
    if (props.last) {
      setLinkState(null);
    }
  });
  
  const startLink = useDrag((props) => {
    if (!prepareGesture(props)) {
      return;
    }
    handleLinking(props, 'left');
    if (props.last) {
      setLinkState(null);
    }
  });
  
  const offset = atomStart ? (atomStart?.offsetLeft) : 0;
  const editOffset = offset + (dragState?.dragXOffset ?? 0) + (handleState?.left ?? 0);
  const width = atomEnd ? (atomEnd?.offsetLeft - offset + 29 + (handleState?.right ?? 0) - (handleState?.left ?? 0)) : 0;
  
  const AtomElement = task.type == TaskType.Task ? DraggableAtom : Milestone;
  const linkTheme = { hOffset: 10, vOffset: theme.atomHeight / 2 - 1, weight: 2 };
  
  const offsetResolver = useCallback((el): [number, number] => [el.offsetLeft, el.offsetTop + el.parentElement!.offsetTop], []);
  
  const groupParentElement = useMemo(() => document.querySelector(`#group_${task.parentGroup().id}_calendar`) as HTMLElement, [sharedState, task]);
  
  return <>
    {linkState && wrapper.current && <Link state={linkState} theme={linkTheme} offsetResolver={offsetResolver}/>}
    <AtomWrapper selected={selected}
                 ref={wrapper}
                 {...bind()}
                 style={{ position: 'absolute', left: 0, width: '100%', top: style?.top }}>
      {atom.current && <Overlay target={atom.current} show={mouseOver && !dragState} placement={'bottom'}>
        <WTooltip width={300} id={'tooltip-bottom'}>{task.start?.toDateString()} to {task.end?.toDateString()}</WTooltip>
      </Overlay>}
      <AtomElement
          ref={atom}
          color={task.color}
          filled={task.progress ?? sharedState.get(task.uid)?.progress ?? 0}
          data-atom_uid={task.uid}
          className="calendar_task_atom on_calendar"
          isDragging={dragState != null || handleState != null || groupParentElement.style.marginLeft != '0px'}
          style={{
            left: `${editOffset}px`,
            width: `${width}px`,
            marginLeft: `${parseInt(groupParentElement.style.marginLeft)}px`,
          }}
          {...atomGesture()}
      >
        { task.type == TaskType.Task && <Content>{task.title}</Content>}
        {
          mouseOver && !dragState && <>
            {task.type == TaskType.Task && (
                <>
                  <AtomHandle placement="left" {...leftHandle()} />
                  <AtomHandle placement="right" {...rightHandle()} />
                </>
            )}
            <AtomLabel placement="left" {...startLink()}>
              <AtomDot/>
            </AtomLabel>
            <AtomLabel placement="right" {...endLink()}>
              <AtomDot/>
            </AtomLabel>
          </>
        }
        { dragState && <>
          <AtomLabel placement="left">
            {dates?.start?.toDateString()}
          </AtomLabel>
          {task.type == TaskType.Task && (
              <AtomLabel placement="right">
                {dates?.end?.toDateString()}
              </AtomLabel>
          )}
        </>
        }
      </AtomElement>
    </AtomWrapper>
  </>;
});

export default TaskAtom;
