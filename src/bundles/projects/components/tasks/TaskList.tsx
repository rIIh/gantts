import React, { PropsWithChildren } from 'react';
import { Task } from '../../types';
import styled from 'styled-components';

interface Props {
  tasks: Task[];
}

export const TaskList = styled.div`
  display: flex;
  flex-flow: column nowrap;
  align-items: stretch;
  
  > :not(:last-child) {
    margin-bottom: 20px;
  }
`;
