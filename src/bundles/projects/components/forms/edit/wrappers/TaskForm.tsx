import React from 'react';
import { LazyProject, LazyTask } from '../../../../types';
import { BodyModel, ModelBody } from '../ModelBody';
import _ from 'lodash';
import { useSimpleReference } from '../../../../../firebase/hooks/useSimpleReference';
import { Spinner } from 'react-bootstrap';
import { ProjectConverter, TaskConverter } from '../../../../firebase/project_converter';
import { TaskHeader } from './headers/TaskHeader';

export const TaskForm: React.FC<{ task: LazyTask }> = ({ task }) => {
  const [value] = useSimpleReference<LazyTask>(task.selfReference());
  if (!value) { return <Spinner animation="border" />; }
  const { comments, note, documents, history } = value;
  return <>
    <TaskHeader task={value}/>
    <ModelBody model={{ comments, note, documents, history, selfReference: task.selfReference }}
               storagePath={`projects/${value.uid}/documents/${task.uid}/`}
               onModelChanged={model => value.selfReference().withConverter(TaskConverter).update(_.omitBy(model, _.isFunction))} sidebar={() => (
        <div/>
    )}/>
  </>;
};
