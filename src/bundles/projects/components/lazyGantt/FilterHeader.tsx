import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { Set } from 'immutable';
import { Dropdown, FormControl, InputGroup, Form } from 'react-bootstrap';
import { LGanttContext } from './LazyGantt';
import { LazyUserInfo } from '../../../user/types';
import _ from 'lodash';
import { useSimpleCollection } from '../../../firebase/hooks/useSimpleReference';
import { Colors, Palette } from '../../colors';
import { ColorPill } from './styled';
import {LazyProject} from '../../types';
import { Filters } from '../../types/filter';

const Header = styled.div`
  width: 100%;
  height: 56px;
  border-bottom: 1px solid ${props => props.theme.colors.lightgrey};
  display: flex;
  justify-content: center;
  align-items: center;
  
  > :not(:last-child) {
    margin-right: 3rem;
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
  project: LazyProject;
  hiddenCount: number;
  initial: Filters;
  onAssignedFilter?: (newFilter: AssignedFilter) => void;
  onDateFilter?: (newFilter: DatesFilter) => void;
  onColorsFilter?: (colors: Colors<Palette>[]) => void;
  onCompletedFilter?: (hide: boolean) => void;
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

const Checkbox = styled(Form.Check)`
  color: ${props => props.theme.colors.dark};
  border: none;
  background: none;
`;

export const CheckField: React.FC<{ checked?: boolean; onChecked?: (checked: boolean) => void }> =
    ({ checked, onChecked, children }) => {
  const [state, setState] = useState(checked ?? false);
  useEffect(_.after(1, () => { if (checked != state) { onChecked?.(state); }}), [state]);
  useEffect(() => setState(checked ?? false), [checked]);
  
  return <InputGroup className="mb-3">
    <Checkbox checked={state} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setState(e.target.checked)} aria-label="Checkbox for following text input" />
    { children }
    </InputGroup>;
};

export const FilterHeader: React.FC<Props> = ({ project, initial, hiddenCount, onAssignedFilter, onCompletedFilter, onColorsFilter, onDateFilter }) => {
  const [enrolled] = useSimpleCollection<LazyUserInfo>(project.enrolled());
  const [checkedUsers, setCheckedUsers] = useState(Set<string>(initial.usersFilter.include));
  useEffect(() => onAssignedFilter?.({ include: checkedUsers.toArray() }), [checkedUsers]);
  
  const [dateFilter, setDateFilter] = useState<DatesFilter>(initial.dateFilter);
  useEffect(() => onDateFilter?.(dateFilter), [dateFilter]);
  useEffect(() => { dateFilter != initial.dateFilter && setDateFilter(initial.dateFilter); }, [initial.dateFilter]);

  const [completedFilter, setCompletedFilter] = useState(initial.hideCompleted);
  useEffect(() => onCompletedFilter?.(completedFilter), [completedFilter]);
  useEffect(() => { completedFilter != initial.hideCompleted && setCompletedFilter(initial.hideCompleted); }, [initial.hideCompleted]);

  const [colorsFilter, setColorsFilter] = useState<Set<Colors<Palette>>>(Set(initial.colorsFilter));
  useEffect(() => onColorsFilter?.(colorsFilter.toArray()), [colorsFilter]);

  const colorFilterName = useCallback(() => {
    if (colorsFilter.size == 0) {
      return 'All colors';
    } else if (colorsFilter.size == 1) {
      return colorsFilter.first();
    } else {
      return `${colorsFilter.size} Colors`;
    }
  }, [colorsFilter]);


  return <Header>
    { hiddenCount > 0 && <p>{`${hiddenCount} Tasks hidden.`} <LinkWithoutHover href="" onClick={(e) => {
      e.preventDefault();
      setCheckedUsers(last => last.clear());
      setDateFilter(DatesFilter.All);
      setColorsFilter(Set());
      setCompletedFilter(false);
    }
    }>(x) Clear</LinkWithoutHover></p>}
    { onAssignedFilter && (
        <Dropdown>
          <Dropdown.Toggle as={DropdownLink} id="hello world">Assignees</Dropdown.Toggle>
          <Dropdown.Menu className="p-3" style={{ width: 'max-content' }}>
            { enrolled && enrolled?.map(user => (
                <Dropdown.Item as={CheckField}
                               checked={checkedUsers.some(checked => checked == user.uid)}
                               onChecked={(checked: boolean) => checked ? setCheckedUsers(checkedUsers.add(user.uid)) : setCheckedUsers(checkedUsers.delete(user.uid))}
                               key={user.uid}>
                  {user.displayName ?? 'Anonymous'}
                </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        </Dropdown>
    )}
    { onDateFilter && (
        <Dropdown>
          <Dropdown.Toggle as={DropdownLink} id="hello world">{ dateFilter }</Dropdown.Toggle>
          <Dropdown.Menu className="p-3" style={{ width: 'max-content' }}>
            { Object.entries(DatesFilter).map(([key, name]) => (
                <Dropdown.Item key={key} onClick={() => setDateFilter(name)}>{name}</Dropdown.Item>
            ))}
          </Dropdown.Menu>
        </Dropdown>
    )}
    { onColorsFilter && (
        <Dropdown>
          <Dropdown.Toggle as={DropdownLink} id="colors_filter">{ colorFilterName() }</Dropdown.Toggle>
          <Dropdown.Menu className="p-3" style={{ width: 'max-content' }}>
            { Object.keys(Palette).map(key => (
                <Dropdown.Item key={key} as={CheckField}
                               checked={colorsFilter.includes(key as Colors<Palette>)}
                               onChecked={(checked: boolean) => checked ?
                                   setColorsFilter(c => c.add(key as Colors<Palette>)) :
                                   setColorsFilter(c => c.remove(key as Colors<Palette>))}>
                  <div style={{ height: 'inherit', display: 'flex', alignItems: 'center' }}>
                    <ColorPill style={{ width: '12px', height: '12px', borderRadius: '2px', marginRight: '4px' }} color={key as Colors<Palette>}/>
                  </div>
                  { key }
                </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        </Dropdown>
    )}
    { onColorsFilter && (
        <Form.Group className="my-0">
          <Checkbox type="checkbox" label="Hide completed"
                    checked={completedFilter}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCompletedFilter(e.target.checked)}/>
        </Form.Group>
    )}
  </Header>;
};
