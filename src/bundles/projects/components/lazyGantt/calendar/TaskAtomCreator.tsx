import { LazyTask } from '../../../types';
import React, { useContext, useEffect, useRef, useState } from 'react';
import stopEvent from '../../../../common/lib/stopEvent';
import { Atom, AtomWrapper } from '../styled';
import { Palette } from '../../../colors';

interface AtomProps {
  task: LazyTask;
  style?: React.CSSProperties;
  onDatesChanged: (task: LazyTask, start: Date, end: Date) => void;
}

interface GhostState {
  start?: Date;
  offsetLeft?: number;
  width?: number;
}

const TaskAtomCreator: React.FC<AtomProps> = ({ task, style, onDatesChanged }) => {
  const initializerRef = useRef<HTMLDivElement>(null);
  
  let [ghost, setGhost] = useState<GhostState | null>(null);
  let [ghostVisible, showGhost] = useState<boolean>(false);
  const atom = useRef(null);
  
  const setDates = async (start: Date, end: Date) => {
    console.log(`${start.toDateString()} to ${end.toDateString()}`);
    if (start.compareTo(end) > 0) {
      await task.selfReference().update({ start, end: start });
    } else {
      await task.selfReference().update({ start, end });
    }
    onDatesChanged(task, start, end);
  };
  
  const idToDate = (id: string): Date => {
    return new Date(id);
  };
  
  const mouseMoveHandler = (event: MouseEvent) => {
    event.stopImmediatePropagation();
    event.preventDefault();
    if (ghostVisible && ghost) {
      setGhost({
        ...ghost,
        width: ghost.start ? event.pageX - initializerRef.current!.getBoundingClientRect().left - (ghost?.offsetLeft ?? 0) : 60,
        offsetLeft: ghost.start ? ghost.offsetLeft : event.pageX - initializerRef.current!.getBoundingClientRect().left - 30,
      });
    }
  };
  
  const mouseUpHandler = (event: MouseEvent) => {
    event.stopImmediatePropagation();
    event.preventDefault();
    let dateCol = document.elementsFromPoint(event.clientX, event.clientY).find(elem => elem.className.includes('day-data'));
    if (dateCol && ghost?.start) {
      setDates(ghost?.start!, idToDate(dateCol.id));
    }
    setGhost(null);
    showGhost(false);
  };
  
  useEffect(() => {
    const stopEvents: (keyof DocumentEventMap)[] = ['mousemove', 'mouseover', 'mouseleave', 'mouseenter', 'mouseout'];
    document.removeEventListener('mouseup', mouseUpHandler);
    document.removeEventListener('mousemove', mouseMoveHandler);
    stopEvents.forEach(event => document.removeEventListener(event, stopEvent));
    if (ghostVisible) {
      document.addEventListener('mouseup', mouseUpHandler);
      document.addEventListener('mousemove', mouseMoveHandler);
      stopEvents.forEach(event => document.addEventListener(event, stopEvent));
    }
    return () => {
      document.removeEventListener('mousemove', mouseMoveHandler);
      document.removeEventListener('mouseup', mouseUpHandler);
      stopEvents.forEach(event => document.removeEventListener(event, stopEvent));
    };
  });
  
  return <AtomWrapper ref={initializerRef}
                      selected={false}
                      style={{ top: style?.top }}
                      onMouseDown={(event) => {
                        event.preventDefault();
                        let dateCol = document.elementsFromPoint(event.clientX, event.clientY).find(elem => elem.className.includes('day-data'));
                        if (dateCol) {
                          setGhost({ ...ghost, start: idToDate(dateCol.id), offsetLeft: event.pageX - event.currentTarget.getBoundingClientRect().left });
                        }
                      }}
                      onMouseEnter={(event) => {
                        if (!ghost?.start) {
                          setGhost({ offsetLeft: event.pageX - event.currentTarget.getBoundingClientRect().left });
                          showGhost(true);
                        }
                      }}
                      onMouseLeave={() => {
                        if (!ghost?.start) {
                          console.log('leave');
                          showGhost(false);
                          setGhost(null);
                        }
                      }}>
    { ghostVisible && (
        <>
          <Atom ref={atom} className=""
                color="Basic Blue"
                isDragging={true}
                style={{ left: `${ghost?.offsetLeft}px`, width: `${ghost?.width}px` }}/>
        </>
    ) }
  </AtomWrapper>;
};

export default TaskAtomCreator;
