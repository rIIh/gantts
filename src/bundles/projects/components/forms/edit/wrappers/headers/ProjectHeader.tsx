import React, { useContext, useEffect, useMemo, useState } from 'react';
import { LazyProject, LazyTaskGroup } from '../../../../types';
import { Header } from '../Header';
import { useTypedSelector } from '../../../../../../redux/rootReducer';
import { Body } from '../Body';

export const ProjectHeader: React.FC<{ project: LazyProject }> = ({ project }) => {
  const projectState = useTypedSelector(state => state.projectsState.calculatedProperties.get(project.uid));
  return <>
    <Header value={{ ...project, start: projectState?.start, end: projectState?.end, progress: projectState?.progress ?? 0 }}/>
    <Body/>
  </>;
};
