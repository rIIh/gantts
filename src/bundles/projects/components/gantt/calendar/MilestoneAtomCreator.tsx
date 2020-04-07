import {Task } from '../../../types';
import React, { useContext, useEffect, useRef, useState } from 'react';
import stopEvent from '../../../../common/lib/stopEvent';
import { Atom, AtomWrapper, Milestone } from '../styled';
import { StyledProps, ThemedStyledProps, ThemeProps } from 'styled-components';
import { useTheme } from '../../../../styled-components/hooks/useTheme';
import { GanttTheme } from '../types';

interface AtomProps {
  task: Task;
  style?: React.CSSProperties;
  onDatesChanged: (task: Task, start: Date, end: Date) => void;
}

interface GhostState {
  start?: Date;
  offsetLeft?: number;
  width?: number;
}

const MilestoneAtomCreator: React.FC<AtomProps> = ({ task, style, onDatesChanged, ...extraProps }) => {
  const initializerRef = useRef<HTMLDivElement>(null);
  const theme = useTheme<GanttTheme>();
  
  let [ghost, setGhost] = useState<GhostState | null>(null);
  let [ghostVisible, showGhost] = useState<boolean>(false);
  const atom = useRef(null);
  
  const setDate = (date: Date) => {
    console.log(date);
    task.selfReference().update({ start: date, end: date });
  };
  
  const idToDate = (id: string): Date => {
    return new Date(id);
  };
  
  const mouseMoveHandler = (event: React.MouseEvent) => {
    if (ghostVisible && ghost) {
      setGhost({
        ...ghost,
        width: ghost.start ? event.pageX - initializerRef.current!.getBoundingClientRect().left - (ghost?.offsetLeft ?? 0) : 60,
        offsetLeft: ghost.start ? ghost.offsetLeft : event.pageX - initializerRef.current!.getBoundingClientRect().left - (theme.colWidth / 2),
      });
    }
  };
  
  const click = (event: React.MouseEvent) => {
    event.preventDefault();
    let dateCol = document.elementsFromPoint(event.clientX, event.clientY).find(elem => elem.className.includes('day-data'));
    if (dateCol) {
      setDate(idToDate(dateCol.id));
    }
    setGhost(null);
    showGhost(false);
  };
  
  return <AtomWrapper ref={initializerRef}
                      selected={false}
                      style={{ top: style?.top }}
                      onClick={(event) => {
                        event.preventDefault();
                        click(event);
                      }}
                      onMouseMove={mouseMoveHandler}
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
          <Milestone ref={atom} color="Basic Blue" isDragging={true} style={{ left: `${(ghost?.offsetLeft ?? 0)}px` }}/>
        </>
    ) }
  </AtomWrapper>;
};

export default MilestoneAtomCreator;
