import React, { useEffect, useState } from 'react';
import 'datejs';
import { useRouteMatch } from 'react-router';
import {
  LazyProject,
} from '../types';
import '../styles/blocks/project_manager.scss';
import '../styles/blocks/gantt.scss';
import { projectCollections, projectReferences } from '../firebase';
import { LazyGantt } from '../components/lazyGantt/LazyGantt';
import { useDispatch } from 'react-redux';
import { attachToProject } from '../redux/thunks';
import { useSimpleReference } from '../../firebase/hooks/useSimpleReference';

interface ProjectComponentProps {
  project: LazyProject;
}

const ProjectComponent: React.FC<ProjectComponentProps> = ({ project }) => {
  return <>
    <LazyGantt project={project}/>
  </>;
};

const ProjectPage: React.FC = () => {
  const { params: { id: projectID } } = useRouteMatch();
  const [project] = useSimpleReference<LazyProject>(projectReferences.projects.doc(projectID));
  const dispatch = useDispatch();
  
  useEffect(() => { project && dispatch(attachToProject(project)); }, [project]);

  return <>
    { project && <ProjectComponent project={project}/> }
  </>;
};

export default ProjectPage;
