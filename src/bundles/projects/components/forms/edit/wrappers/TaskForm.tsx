import React from 'react';
import { Project, Task } from '../../../../types';
import { BodyModel, FormBody } from '../FormBody';
import _ from 'lodash';
import { useSimpleReference } from '../../../../../firebase/hooks/useSimpleReference';
import { Spinner } from 'react-bootstrap';
import { ProjectConverter, TaskConverter } from '../../../../firebase/project_converter';
import { TaskHeader } from './headers/TaskHeader';
import { TaskSidebar } from './sidebars/TaskSidebar';
import { useDebounce } from '../../../../../common/hooks/lodashHooks';
import { withoutUndefined } from '../../../../../common/lib/withoutUndefined';

export const TaskForm: React.FC<{ task: Task }> = ({ task }) => {
  const [value] = useSimpleReference<Task>(task.selfReference());
  const update = useDebounce((newVal: Partial<Task>) => task.selfReference().update(withoutUndefined(newVal)), 1000, [task]);
  if (!value) { return <Spinner animation="border" />; }
  const { comments, note, documents, history, start, end, type, color } = value;
  return <>
    <TaskHeader task={value}/>
    <FormBody model={{ comments, note, documents, history, selfReference: task.selfReference }}
              storagePath={`projects/${value.uid}/documents/${task.uid}/`}
              onModelChanged={model => value.selfReference().withConverter(TaskConverter).update(_.omitBy(model, _.isFunction))} sidebar={() => (
        <TaskSidebar model={{ start, end, color, type }} onChange={update}/>
    )}/>
  </>;
};
