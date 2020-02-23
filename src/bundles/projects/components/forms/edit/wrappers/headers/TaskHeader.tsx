import React from 'react';
import { LazyTask } from '../../../../types';
import { Header } from '../Header';

export const TaskHeader: React.FC<{ task: LazyTask}> = ({ task }) => {
  return <Header value={{ ...task, progress: task.progress ?? 0 }}/>;
};
