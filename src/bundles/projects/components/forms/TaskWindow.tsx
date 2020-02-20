import React from 'react';
import { LazyTask } from '../../types';

interface Props {
  task: LazyTask;
}

export const TaskWindow: React.FC<Props> = ({ task }) => {
  return (
      <div>{ task.title }</div>
  );
};
