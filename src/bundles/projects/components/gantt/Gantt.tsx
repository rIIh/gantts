import React, {createContext, useCallback, useMemo, useState} from 'react';
import { Project, Task, TaskGroup, GanttProps } from '../../types';
import { ThemeProvider } from 'styled-components';
import { GanttSidePanel } from './GanttSidePanel';
import { GanttCalendar } from './GanttCalendar';
import { GanttTheme, PropsWithConfig } from './types';
import { Map } from 'immutable';
import { AssignedFilter, DatesFilter, ProjectHeader } from './ProjectHeader';
import { Colors, Palette } from '../../colors';
import { Filters } from '../../types/filter';
import { CachedQueriesInstance } from '../../../firebase/cache';
import { FieldPath } from '../../../firebase/types';
import { useTypedSelector } from '../../../../redux/rootReducer';
import { GanttBottomBar } from './GanttBottomBar';
import { Blocker } from '../../../common/components/Blocker';

export interface Meta {
  [key: string]: any;
}

interface SharedState {
  verticalDraggingSubjectUID?: string;
}

interface GanttContextType {
  project: Project;
  sharedState: SharedState;
  findNode: (id: string) => Promise<Task | TaskGroup | Project | null>;
  tasks: Task[];
  groups: TaskGroup[];
  filters: Filters;
  atomsState: Map<string, Meta>;
  writeAtomsState: (id: string, meta: Meta) => void;
  writeSharedState: (data: Partial<SharedState>) => void;
}

export const GanttContext = createContext<GanttContextType | null>(null);
const findNode = async (group: TaskGroup, id: string): Promise<Task | TaskGroup | null> => {
  if (group.uid == id) { return group; }
  const result = (await CachedQueriesInstance.getManyOnce<Task>(group.tasks().where(FieldPath.documentId(), '==', id)));
  if (result && result.length > 0) {
    return result[0];
  } else {
    return (await CachedQueriesInstance.getManyOnce<TaskGroup>(group.taskGroups()))
        .reduce<Promise<Task | TaskGroup | null> | null>(async (acc, group) => {
          if (acc) {
            return acc;
          } else {
            return findNode(group, id);
          }
        }, null);
  }
};

export const Gantt: React.FC<GanttProps & PropsWithConfig> = ({
  config,
  project,
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
  
  return <GanttContext.Provider value={{
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
      for (let group of (await CachedQueriesInstance.getManyOnce<TaskGroup>(project.taskGroups()))) {
        if (group.uid == id) { return group; }
        const result = await findNode(group, id);
        if (result) {
          return result;
        }
      }
      return null;
    },
  }}>
        <ProjectHeader project={project} initial={filters} hiddenCount={hiddenCount}
                       onAssignedFilter={filter => setFilters(l => ({ ...l, usersFilter: filter }))}
                       onDateFilter={filter => setFilters(l => ({ ...l, dateFilter: filter }))}
                       onColorsFilter={filter => setFilters(l => ({ ...l, colorsFilter: filter }))}
                       onCompletedFilter={filter => setFilters(l => ({ ...l, hideCompleted: filter }))}/>
        <div className="gantt">
          <GanttSidePanel project={project}/>
          <GanttCalendar project={project}/>
        </div>
  </GanttContext.Provider>;
};
