import React from 'react';
import { Project, Task, TaskGroup } from '../../../../types';
import { BodyModel, FormBody } from '../FormBody';
import _ from 'lodash';
import { useSimpleReference } from '../../../../../firebase/hooks/useSimpleReference';
import { Spinner } from 'react-bootstrap';
import { TaskConverter, TaskGroupConverter } from '../../../../firebase/project_converter';
import { GroupHeader } from './headers/GroupHeader';

export const GroupForm: React.FC<{ group: TaskGroup }> = ({ group }) => {
  const [value] = useSimpleReference<TaskGroup>(group.selfReference());
  if (!value) { return <Spinner animation="border" />; }
  const { comments, note, documents, history } = value;
  console.log(group.selfReference());
  return <>
    <GroupHeader group={value}/>
    <FormBody model={{ comments, note, documents, history, selfReference: value.selfReference }}
              storagePath={`projects/${value.uid}/documents/${group.uid}/`}
              onModelChanged={model => value.selfReference().withConverter(TaskGroupConverter).update(_.omitBy(model, _.isFunction))} sidebar={() => (
        <div/>
    )}/>
  </>;
};
