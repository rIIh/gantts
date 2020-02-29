import React, { useContext, useEffect, useMemo, useState } from 'react';
import { LazyProject, LazyTaskGroup } from '../../../../../types';
import { useTypedSelector } from '../../../../../../../redux/rootReducer';
import { FormBody } from '../../FormBody';
import { ModelHeader } from '../../ModelHeader';
import { useSimpleReference } from '../../../../../../firebase/hooks/useSimpleReference';
import { useDebounce } from '../../../../../../common/hooks/lodashHooks';
import { ProjectConverter } from '../../../../../firebase/project_converter';

export const ProjectHeader: React.FC<{ project: LazyProject }> = ({ project }) => {
  const projectState = useTypedSelector(state => state.projectsState.calculatedProperties.get(project.uid));
  const update = useDebounce(({ title }: Partial<LazyProject>) => title && title.length > 0 && project.selfReference().withConverter(ProjectConverter).update({ title }), 1000);
  return project && <ModelHeader onChange={update} value={{ title: project.title, start: projectState?.start, end: projectState?.end, progress: projectState?.progress ?? 0 }}/>;
};
