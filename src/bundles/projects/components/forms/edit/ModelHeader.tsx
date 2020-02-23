import React, { useEffect, useState } from 'react';
import _ from 'lodash';
import { prettyNum } from '../../utils';
import { Model } from './types';
import { FormInline, StyledHeader, Details, Title, FormGroup } from './styled/Header';
import styled from 'styled-components';
import { DatePicker } from '../../../../datepicker';
import { FormControl, FormControlProps } from 'react-bootstrap';
import { useProgressUpdate } from '../../tasks/TaskItem';
import { Colors, Palette } from '../../../colors';
import { clamp } from '../../../../common/lib/clamp';

const Span = styled.span``;
const Input = styled.input``;
const InlineLabel = styled.label`
  display: inline-block;
`;

export const ModelHeader: React.FC<{ value: Model; color?: Colors<Palette>; editable?: boolean; onChange?: (newValue: Model) => void }> = ({ value, editable, color, onChange }) => {
  const [state, setState] = useState<Model>(_.clone(value));
  useEffect(() => setState(_.clone(value)), [value]);
  useEffect(() => { if (!_.isEqual(state, value)) { onChange?.(state); } }, [state]);
  const [editingProgress, setEditing] = useState(false);

  return <StyledHeader color={color} closeButton progress={value.progress}>
    <Details>
      <Title type="text" defaultValue={value.title} onChange={e => {
        const value = e.currentTarget.value;
        setState(l => ({ ...l, title: value }));
      }}/>
      <FormInline>
        <FormGroup>
          <InlineLabel>Progress:</InlineLabel>
          { !editable ? (
              <span className="value">{prettyNum(value.progress)}%</span>
          ) : (
              <FormControl style={{ width: '58px' }} type="text"
                           value={`${prettyNum(state.progress)}${editingProgress ? '' : '%'}`}
                           onFocus={(e: React.FocusEvent<HTMLInputElement>) => {
                             setEditing(true);
                             e.target.select();
                           }}
                           onBlur={() => setEditing(false)}
                           onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              {
                const value = e.target.value;
                setState(l => ({ ...l, progress: clamp(parseFloat(value) ?? 0, 0, 100) }));
              }} />
          )}
        </FormGroup>
        <FormGroup>
          {/*<Field label="Progress:" value={`${prettyNum(value.progress)}%`} onChange={newValue => setState(l => ({ ...l, progress: parseFloat(newValue) ?? 0 }))}/>*/}
          <InlineLabel>Start:</InlineLabel>
          { !editable ? (
              <span className="value">{state.start?.toString('dd/MM/yy')}</span>
          ) : (
              <DatePicker selected={state.start} onChange={date => setState(l => ({ ...l, start: date ?? undefined }))}/>
          )}
        </FormGroup>
        <FormGroup>
          <InlineLabel>End:</InlineLabel>
          { !editable ? (
              <span className="value">{state.end?.toString('dd/MM/yy')}</span>
          ) : (
              <DatePicker selected={state.end} onChange={date => setState(l => ({ ...l, end: date ?? undefined }))}/>
          )}
        </FormGroup>
      </FormInline>
    </Details>
  </StyledHeader>;
};

