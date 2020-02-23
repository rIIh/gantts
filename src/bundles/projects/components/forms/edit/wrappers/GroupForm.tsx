import React from 'react';
import { LazyProject, LazyTask, LazyTaskGroup } from '../../../../types';
import { BodyModel, ModelBody } from '../ModelBody';
import _ from 'lodash';
import { useSimpleReference } from '../../../../../firebase/hooks/useSimpleReference';
import { Spinner } from 'react-bootstrap';
import { TaskConverter, TaskGroupConverter } from '../../../../firebase/project_converter';
import { GroupHeader } from './headers/GroupHeader';

export const GroupForm: React.FC<{ group: LazyTaskGroup }> = ({ group }) => {
  const [value] = useSimpleReference<LazyTaskGroup>(group.selfReference());
  if (!value) { return <Spinner animation="border" />; }
  const { comments, note, documents, history } = value;
  console.log(group.selfReference());
  return <>
    <GroupHeader group={value}/>
    <ModelBody model={{ comments, note, documents, history, selfReference: value.selfReference }}
               storagePath={`projects/${value.uid}/documents/${group.uid}/`}
               onModelChanged={model => value.selfReference().withConverter(TaskGroupConverter).update(_.omitBy(model, _.isFunction))} sidebar={() => (
        <div/>
    )}/>
  </>;
};
