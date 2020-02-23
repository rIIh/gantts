import React, { useContext, useMemo } from 'react';
import { LazyProject, LazyTask, LazyTaskGroup } from '../../../../../types';
import { useTypedSelector } from '../../../../../../../redux/rootReducer';
import { ModelHeader } from '../../ModelHeader';
import { useDebounce } from '../../../../../../common/hooks/lodashHooks';
import { ProjectConverter } from '../../../../../firebase/project_converter';

export const GroupHeader: React.FC<{ group: LazyTaskGroup }> = ({ group }) => {
  const groupState = useTypedSelector(state => state.projectsState.calculatedProperties.get(group.uid));
  const update = useDebounce(({ title }: Partial<LazyTaskGroup>) => title && title?.length > 0 && group.selfReference().update({ title }), 1000);
  return group && <ModelHeader onChange={update} value={{ ...group, start: groupState?.start, end: groupState?.end, progress: groupState?.progress ?? 0 }}/>;
};
