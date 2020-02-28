import React, {createContext, useCallback, useMemo, useState} from 'react';
import { LazyProject, LazyTask, LazyTaskGroup, LGanttProps } from '../../types';
import { ThemeProvider } from 'styled-components';
import { LazyGanttMetaPanel } from './LazyGanttMetaPanel';
import { LazyGanttCalendar } from './LazyGanttCalendar';
import { GanttTheme, PropsWithConfig } from './types';
import { Map } from 'immutable';
import { AssignedFilter, DatesFilter, FilterHeader } from './FilterHeader';
import { Colors, Palette } from '../../colors';
import { Filters } from '../../types/filter';
import { CachedQueriesInstance } from '../../../firebase/cache';
import { FieldPath } from '../../../firebase/types';
import { useTypedSelector } from '../../../../redux/rootReducer';

export interface Meta {
  [key: string]: any;
}

interface SharedState {
  verticalDraggingSubjectUID?: string;
}

interface LazyGanttContextType {
  project: LazyProject;
  sharedState: SharedState;
  findNode: (id: string) => Promise<LazyTask | LazyTaskGroup | LazyProject | null>;
  tasks: LazyTask[];
  groups: LazyTaskGroup[];
  filters: Filters;
  atomsState: Map<string, Meta>;
  writeAtomsState: (id: string, meta: Meta) => void;
  writeSharedState: (data: Partial<SharedState>) => void;
}

export const LGanttContext = createContext<LazyGanttContextType | null>(null);
const findNode = async (group: LazyTaskGroup, id: string): Promise<LazyTask | LazyTaskGroup | null> => {
  if (group.uid == id) { return group; }
  const result = (await CachedQueriesInstance.getManyOnce<LazyTask>(group.tasks().where(FieldPath.documentId(), '==', id)));
  if (result && result.length > 0) {
    return result[0];
  } else {
    return (await CachedQueriesInstance.getManyOnce<LazyTaskGroup>(group.taskGroups()))
        .reduce<Promise<LazyTask | LazyTaskGroup | null> | null>(async (acc, group) => {
          if (acc) {
            return acc;
          } else {
            return findNode(group, id);
          }
        }, null);
  }
};

export const LazyGantt: React.FC<LGanttProps & PropsWithConfig> = ({
  config,
  project,
  ...props
}) => {
  const [sharedState, setSharedState] = useState({});
  const [sharedMeta, setSharedMeta] = useState(Map<string, Meta>());
  const tasksInStore = useTypedSelector(state => state.projectsState.tasks.filter(value => value && value.length > 0 && value[0].project().id == project.uid || true));
  const groups = useTypedSelector(state => state.projectsState.groups.filter(value => value && value.length > 0 && value[0].projectID == project.uid || true));
  const [filters, setFilters] = useState<Filters>({
    dateFilter: DatesFilter.All,
    usersFilter: { include: [] },
    colorsFilter: [],
    hideCompleted: false,
  });

  const hiddenCount = useMemo(() => {
    let hiddenCount = 0;
    for (let el of sharedMeta.values()) {
      if (el.hidden) {
        hiddenCount++;
      }
    }
    return hiddenCount;
  }, [sharedMeta]);
  
  return <LGanttContext.Provider value={{
    project: project,
    atomsState: sharedMeta,
    sharedState,
    filters,
    tasks: [...tasksInStore.values()].flat(1),
    groups: [...groups.values()].flat(1),
    writeSharedState: (data: Partial<SharedState>) => setSharedState(last => ({ ...last, ...data })),
    writeAtomsState: (id, meta) => setSharedMeta(last => last.update(id, last => ({ ...last, ...meta }))),
    findNode: async (id) => {
      if (project.uid == id) { return project; }
      for (let group of (await CachedQueriesInstance.getManyOnce<LazyTaskGroup>(project.taskGroups()))) {
        if (group.uid == id) { return group; }
        const result = await findNode(group, id);
        if (result) {
          return result;
        }
      }
      return null;
    },
  }}>
      <FilterHeader project={project} initial={filters} hiddenCount={hiddenCount}
                    onAssignedFilter={filter => setFilters(l => ({ ...l, usersFilter: filter }))}
                    onDateFilter={filter => setFilters(l => ({ ...l, dateFilter: filter }))}
                    onColorsFilter={filter => setFilters(l => ({ ...l, colorsFilter: filter }))}
                    onCompletedFilter={filter => setFilters(l => ({ ...l, hideCompleted: filter }))}/>
      <div className="gantt">
        <LazyGanttMetaPanel project={project}/>
        <LazyGanttCalendar project={project}/>
      </div>
  </LGanttContext.Provider>;
};
