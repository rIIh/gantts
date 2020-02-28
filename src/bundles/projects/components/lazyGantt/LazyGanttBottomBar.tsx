import React, { useContext } from 'react';
import styled from 'styled-components';
import _ from 'lodash';
import I from 'immutable';
import { WeekBitMask } from '../../types';
import { LGanttContext } from './LazyGantt';
import { useSimpleCollection } from '../../../firebase/hooks/useSimpleReference';
import { LazyUserInfo } from '../../../user/types';

const BottomBar = styled.div`
  position: absolute;
  width: 100%;
  bottom: 0;
  background-color: rebeccapurple;
`;

const Row = styled.div`
  height: ${props => props.theme.atomHeight}px;
  width: 100%;
`;

const FlexRow = styled(Row)`
  display: flex;
  flex-flow: row nowrap;
`;

const Title = styled.div`
  width: ${props => Object.values(props.theme.meta_columns).reduce(_.add)}px;
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
  background-color: lightgreen;
  text-align: end;
  padding-bottom: ${props => props.theme.atomHeight}px;
`;
const StyledBottomBarCalendar = styled.div`
  position: absolute;
  width: 100%;
  bottom: 0;
  background-color: lightgreen;
`;

export const BottomBarMeta: React.FC = () => {
  const { project } = useContext(LGanttContext)!;
  const [enrolledUsers] = useSimpleCollection<LazyUserInfo>(project.enrolled());
  
  return <StyledBottomBarMeta>
    { enrolledUsers.map(u => <Row key={u.uid}>{ u.displayName }</Row>)}
    <Row>Unassigned</Row>
  </StyledBottomBarMeta>;
};

const Mark = styled.div`
  width: ${props => props.theme.colWidth}px;
  height: ${props => props.theme.atomHeight}px;
  border: 1px solid grey;
  flex: 0 1 ${props => props.theme.colWidth}px;
  font-size: 0.5em;
`;

export const BottomBarCalendar: React.FC<{dates: Map<Date, HTMLDivElement>; mask: WeekBitMask}> = ({ dates, mask }) => {
  return <StyledBottomBarCalendar>
    <FlexRow>{ [...dates.keys()].map(date => {
      return <Mark key={date.getTime()}>{date.toString('dd.MM.yy')}</Mark>;
    })}</FlexRow>
  </StyledBottomBarCalendar>;
};
