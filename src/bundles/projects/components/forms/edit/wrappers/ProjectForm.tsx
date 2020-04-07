import React, { useCallback } from 'react';
import { Project } from '../../../../types';
import { ProjectHeader } from './headers/ProjectHeader';
import { BodyModel, FormBody } from '../FormBody';
import { ProjectSidebar } from './sidebars/ProjectSidebar';
import _ from 'lodash';
import { useSimpleReference } from '../../../../../firebase/hooks/useSimpleReference';
import { Spinner } from 'react-bootstrap';
import { ProjectConverter } from '../../../../firebase/project_converter';

export const ProjectForm: React.FC<{ project: Project }> = ({ project }) => {
  console.log('ProjectForm: ', project);
  const [value] = useSimpleReference<Project>(project.selfReference());
  const updateProject = useCallback(_.debounce((data: Partial<Project>) => project.selfReference().update(data), 600),[project]);
  
  if (!value) { return <Spinner animation="border" />; }
  const { comments, note, documents, history, state, startDate, daysInWeekBitMask } = value;
  
  return <>
    <ProjectHeader project={value}/>
    <FormBody model={{ comments, note, documents, history, selfReference: project.selfReference }}
              storagePath={`projects/${value.uid}/documents/root/`}
              onModelChanged={model => value.selfReference().withConverter(ProjectConverter).update(_.omitBy(model, _.isFunction))} sidebar={() => (
        <ProjectSidebar model={{ state, startDate, daysInWeekBitMask }} onChange={updateProject}/>
    )}/>
  </>;
};
