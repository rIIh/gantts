import React, { CSSProperties, useContext } from 'react';
import styled from 'styled-components';
import _ from 'lodash';
import I from 'immutable';
import { WeekBitMask } from '../../types';
import { LGanttContext } from './LazyGantt';
import { useSimpleCollection } from '../../../firebase/hooks/useSimpleReference';
import { LazyUserInfo } from '../../../user/types';
import { scrollbarWidth } from '../../../common/lib/scrollbarWidth';

const BottomBar = styled.div`
  position: absolute;
  width: 100%;
  bottom: 0;
`;

const Row = styled.div`
  height: ${props => props.theme.atomHeight}px;
  border-bottom: 1px solid ${props => props.theme.colors.lightgrey};
  width: 100%;
  font-size: 0.9em;
`;

const FlexRow = styled(Row)`
  display: flex;
  align-items: center;
  flex-flow: row nowrap;
`;

const Title = styled.div`
  width: ${props => Object.values(props.theme.meta_columns).reduce(_.add)}px;
  color: #767676;
  text-align: end;
`;

export const LazyGanttBottomBar: React.FC = () => {
  return <BottomBar>
    <Row>
      <Title>Hello</Title>
    </Row>
  </BottomBar>;
};

const StyledBottomBarMeta = styled.div`
  position: absolute;
  width: 100%;
  bottom: 0;
  background-color: white;
  border-top: 1px solid ${props => props.theme.colors.lightgrey};
  text-align: end;
  padding-bottom: ${props => props.theme.atomHeight}px;
`;

const StyledBottomBarCalendar = styled.div`
  position: absolute;
  width: 100%;
  bottom: 0;
  z-index: 200;
  background-color: white;
  border-top: 1px solid ${props => props.theme.colors.lightgrey};
  padding-bottom: ${props => props.theme.atomHeight - scrollbarWidth}px;
`;

const MetaRow = styled(Row)`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 1rem;
`;

export const BottomBarMeta: React.FC = () => {
  const { project } = useContext(LGanttContext)!;
  const [enrolledUsers] = useSimpleCollection<LazyUserInfo>(project.enrolled());
  
  return <StyledBottomBarMeta>
    { enrolledUsers.map(u => <MetaRow key={u.uid}>{ u.displayName }</MetaRow>)}
    <MetaRow>Unassigned</MetaRow>
  </StyledBottomBarMeta>;
};

const Mark = styled.div.attrs<{ value?: number }>(({ value = 0 }) => {
  let background: string = 'transparent';
  switch (value) {
    case 1: background = '#f3f3d4'; break;
    case 2: background = '#f9f960'; break;
    case 3: background = '#f7e941'; break;
    case 4: background = '#f6d041'; break;
  }
  if (value >= 5) { background = '#f5b840'; }
  return ({
    children: value,
    style: {
      color: value != 0 ? '#767676' : 'lightgrey',
      backgroundColor: background,
    } as CSSProperties,
  });
})<{ value?: number }>`
  width: ${props => props.theme.colWidth}px;
  height: ${props => props.theme.atomHeight}px;
  flex: 0 1 ${props => props.theme.colWidth}px;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  -webkit-user-select: none;
`;

export const BottomBarCalendar: React.FC<{dates: Map<Date, HTMLDivElement>; mask: WeekBitMask}> = ({ dates, mask }) => {
  const { project, tasks } = useContext(LGanttContext)!;
  const [enrolledUsers] = useSimpleCollection<LazyUserInfo>(project.enrolled());
  return <StyledBottomBarCalendar>
    { enrolledUsers.map(user => (
        <FlexRow key={user.uid}>{ [...dates.keys()].map(date => {
          return <Mark value={tasks.filter(task => task.assignedUsers.some(id => user.uid == id) && task.start && task.end && (date.between(task.start, task.end) || date.isToday(task.end))).length} key={date.getTime()}/>;
        })}</FlexRow>
    )) }
    <FlexRow id="unassigned-bottom-row">{ [...dates.keys()].map(date => {
      return <Mark key={date.getTime()} value={tasks.filter(task => task.assignedUsers.length == 0 && task.start && task.end && (date.between(task.start, task.end) || date.isToday(task.end))).length}/>;
    })}</FlexRow>
  </StyledBottomBarCalendar>;
};
