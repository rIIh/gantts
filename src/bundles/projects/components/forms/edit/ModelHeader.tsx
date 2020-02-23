import React from 'react';
import { FormGroup, FormInline, StyledHeader, TaskDetails, TaskName } from './StyledComponents';
import { prettyNum } from '../../utils';
import { Model } from './types';

export const Header: React.FC<{ value: Model; editable?: boolean }> = ({ value }) => {
  return <StyledHeader closeButton progress={value.progress}>
    <TaskDetails>
      <TaskName type="text" defaultValue="asd"/>
      <FormInline>
        <FormGroup>
          <label>Progress:</label><span className="value">{prettyNum(value.progress)}%</span></FormGroup>
        <FormGroup>
          <label>Start:</label><span className="value">{value.start?.toString('dd/MM/yy')}</span></FormGroup>
        <FormGroup>
          <label>End:</label><span className="value">{value.end?.toString('dd/MM/yy')}</span></FormGroup>
      </FormInline>
    </TaskDetails>
  </StyledHeader>;
};

