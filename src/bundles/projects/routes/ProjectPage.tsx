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
import { useDocumentData } from 'react-firebase-hooks/firestore';

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
  const [project] = useDocumentData<LazyProject>(projectReferences.projects.doc(projectID));

  return <>
    { project && <ProjectComponent project={project}/> }
  </>;
};

export default ProjectPage;
