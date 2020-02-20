import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { Set } from 'immutable';
import { Dropdown, FormControl, InputGroup } from 'react-bootstrap';
import { LGanttContext } from './LazyGantt';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import { LazyUserInfo } from '../../../user/types';
import _ from 'lodash';
import { useSimpleCollection } from '../../../firebase/hooks/useSimpleReference';

const Header = styled.div`
  width: 100%;
  height: 56px;
  border-bottom: 1px solid ${props => props.theme.colors.lightgrey};
  display: flex;
  justify-content: center;
  align-items: center;
  
  > :not(:last-child) {
    margin-right: 1rem;
  }
`;

export interface AssignedFilter {
  include: string[];
}

export enum DatesFilter {
  All                       = 'All Dates',
  DueToday                  = 'Due today',
  Overdue                   = 'Over due',
  InProgress                = 'In progress',
  DueWithinOneWeek          = 'Due within 1 week',
  DueWithinTwoWeek          = 'Due within 2 week',
  DueWithinFourWeek         = 'Due within 4 week',
  StartingWithinOneWeek     = 'Starting within 1 week',
  StartingWithinTwoWeek     = 'Starting within 2 week',
  StartingWithinFourWeek    = 'Starting within 4 week',
  // RemainingToday            = 'Remaining today',
  OnlyMilestones            = 'Only milestones',
  NotScheduled              = 'Not scheduled',
  Completed                 = 'Completed',
}

interface Props {
  onAssignedFilter: (newFilter: AssignedFilter) => void;
  onDateFilter: (newFilter: DatesFilter) => void;
}

const LinkWithoutHover = styled.a`
  color: #868686;
  &:hover {
    text-decoration: none;
    color: #868686;
  }
`;

export const DropdownLink = React.forwardRef<HTMLAnchorElement, { onClick?: (e: any) => void }>(({ children, onClick }, ref) => (
    <LinkWithoutHover
        href=""
        ref={ref}
        onClick={e => {
          e.preventDefault();
          onClick?.(e);
        }}
    >
      {children}
      <span className="fas fa-chevron-down" style={{ marginLeft: '4px', fontSize: '0.7em' }}/>
    </LinkWithoutHover>
));

export const CheckField: React.FC<{ label: string; checked?: boolean; onChecked?: (checked: boolean) => void }> = ({ label, checked, onChecked }) => {
  const [state, setState] = useState(checked ?? false);
  useEffect(_.after(1, () => onChecked?.(state)), [state]);
  
  return <InputGroup className="mb-3">
      <InputGroup.Prepend>
        <InputGroup.Checkbox checked={state} onChange={(e) => setState(e.currentTarget.checked)} aria-label="Checkbox for following text input" />
      </InputGroup.Prepend>
      <FormControl readOnly value={label} aria-label="Text input with checkbox" />
    </InputGroup>;
};

export const LazyGanttHeader: React.FC<Props> = ({ onAssignedFilter, onDateFilter }) => {
  const { project } = useContext(LGanttContext)!;
  const [enrolled] = useSimpleCollection<LazyUserInfo>(project.enrolled());
  const { sharedState } = useContext(LGanttContext)!;
  const [checkedUsers, setCheckedUsers] = useState(Set<string>());
  useEffect(() => onAssignedFilter({ include: checkedUsers.toArray() }), [checkedUsers]);
  
  const [dateFilter, setDateFilter] = useState<DatesFilter>(DatesFilter.All);
  useEffect(() => onDateFilter(dateFilter), [dateFilter]);
  
  const hiddenElements = useMemo(() => {
    let hiddenCount = 0;
    for (let el of sharedState.values()) {
      if (el.hidden) {
        hiddenCount++;
      }
    }
    return hiddenCount;
  }, [sharedState]);
  
  return <Header>
    { hiddenElements > 0 && <p>{`${hiddenElements} Tasks hidden.`} <LinkWithoutHover href="" onClick={(e) => {
      e.preventDefault();
      setCheckedUsers(last => last.clear());
      setDateFilter(DatesFilter.All);
    }
    }>(x) Clear</LinkWithoutHover></p>}
    <Dropdown>
      <Dropdown.Toggle as={DropdownLink} id="hello world">Assignees</Dropdown.Toggle>
      <Dropdown.Menu className="p-3" style={{ width: 'max-content' }}>
        { enrolled && enrolled?.map(user => (
            <Dropdown.Item as={CheckField} onChecked={(checked: boolean) => checked ? setCheckedUsers(checkedUsers.add(user.uid)) : setCheckedUsers(checkedUsers.delete(user.uid))}
                           key={user.uid} label={user.displayName ?? 'Anonymous'}/>
        ))}
      </Dropdown.Menu>
    </Dropdown>
    <Dropdown>
      <Dropdown.Toggle as={DropdownLink} id="hello world">{ dateFilter }</Dropdown.Toggle>
      <Dropdown.Menu className="p-3" style={{ width: 'max-content' }}>
        { Object.entries(DatesFilter).map(([key, name]) => (
            <Dropdown.Item key={key} onClick={() => setDateFilter(name)}>{name}</Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  </Header>;
};
