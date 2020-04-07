import React, { useEffect, useState } from 'react';
import 'datejs';
import { useRouteMatch } from 'react-router';
import {
  Project,
} from '../types';
import '../styles/blocks/project_manager.scss';
import '../styles/blocks/gantt.scss';
import { projectCollections, projectReferences } from '../firebase';
import { Gantt } from '../components/gantt/Gantt';
import { useDispatch } from 'react-redux';
import { attachToProject } from '../redux/thunks';
import { useSimpleReference } from '../../firebase/hooks/useSimpleReference';

interface ProjectComponentProps {
  project: Project;
}

const ProjectComponent: React.FC<ProjectComponentProps> = ({ project }) => {
  return <>
    <Gantt project={project}/>
  </>;
};

const ProjectPage: React.FC = () => {
  const { params: { id: projectID } } = useRouteMatch();
  const [project] = useSimpleReference<Project>(projectReferences.projects.doc(projectID));
  const dispatch = useDispatch();
  
  useEffect(() => { project && dispatch(attachToProject(project)); }, [project]);

  return <>
    { project && <ProjectComponent project={project}/> }
  </>;
};

export default ProjectPage;
