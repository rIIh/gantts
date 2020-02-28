import React from 'react';
import { LazyProject, LazyTask } from '../../../../types';
import { BodyModel, ModelBody } from '../ModelBody';
import _ from 'lodash';
import { useSimpleReference } from '../../../../../firebase/hooks/useSimpleReference';
import { Spinner } from 'react-bootstrap';
import { ProjectConverter, TaskConverter } from '../../../../firebase/project_converter';
import { TaskHeader } from './headers/TaskHeader';
import { TaskSidebar } from './sidebars/TaskSidebar';
import { useDebounce } from '../../../../../common/hooks/lodashHooks';
import { withoutUndefined } from '../../../../../common/lib/withoutUndefined';

export const TaskForm: React.FC<{ task: LazyTask }> = ({ task }) => {
  const [value] = useSimpleReference<LazyTask>(task.selfReference());
  const update = useDebounce((newVal: Partial<LazyTask>) => task.selfReference().update(withoutUndefined(newVal)), 1000, [task]);
  if (!value) { return <Spinner animation="border" />; }
  const { comments, note, documents, history } = value;
  return <>
    <TaskHeader task={value}/>
    <ModelBody model={{ comments, note, documents, history, selfReference: task.selfReference }}
               storagePath={`projects/${value.uid}/documents/${task.uid}/`}
               onModelChanged={model => value.selfReference().withConverter(TaskConverter).update(_.omitBy(model, _.isFunction))} sidebar={() => (
        <TaskSidebar model={{ start: value.start, end: value.end, dependsOn: value.dependsOn, dependentOn: value.dependentOn }} onChange={update}/>
    )}/>
  </>;
};
