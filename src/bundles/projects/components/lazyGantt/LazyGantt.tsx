import React, {createContext, useCallback, useMemo, useState} from 'react';
import { LazyProject, LazyTask, LazyTaskGroup, LGanttProps } from '../../types';
import { ThemeProvider } from 'styled-components';
import { LazyGanttMetaPanel } from './LazyGanttMetaPanel';
import { LazyGanttCalendar } from './LazyGanttCalendar';
import { GanttTheme, PropsWithConfig } from './types';
import { Map } from 'immutable';
import { AssignedFilter, DatesFilter, FilterHeader } from './FilterHeader';
import { Colors, Palette } from '../../colors';

export interface Meta {
  [key: string]: any;
}

interface LazyGanttContextType {
  project: LazyProject;
  findNode: (id: string) => Promise<LazyTask | null>;
  filters: { assignedFilter: AssignedFilter | null; dateFilter: DatesFilter;
  hideCompleted: boolean; colorsFilter: Colors<Palette>[]; };
  sharedState: Map<string, Meta>;
  writeSharedState: (id: string, meta: Meta) => void;
}

export const LGanttContext = createContext<LazyGanttContextType | null>(null);
const findNode = async (group: LazyTaskGroup, id: string): Promise<LazyTask | null> => {
  const result = (await group.tasks().get()).docs.map(doc => doc.data() as LazyTask).find(task => task.uid == id);
  console.log(group.tasks);
  if (result) {
    console.log('node found');
    return result;
  } else {
    console.log('searching in children', group.taskGroups);
    return (await group.taskGroups().get()).docs.map(doc => doc.data() as LazyTaskGroup)
        .reduce<Promise<LazyTask | null> | null>(async (acc, group) => {
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
  const [sharedMeta, setSharedMeta] = useState(Map<string, Meta>());
  const [assignedFilter, setAssignedFilter] = useState<AssignedFilter | null>(null);
  const [dateFilter, setDateFilter] = useState<DatesFilter>(DatesFilter.All);
  const [completedFilter, setCompletedFilter] = useState(false);
  const [colorsFilter, setColorsFilter] = useState<Colors<Palette>[]>([]);
  const onAssignedFilter = useCallback((filter: AssignedFilter) => {
    if (filter.include.length > 0) {
      setAssignedFilter(filter);
    } else {
      setAssignedFilter(null);
    }
  }, [setAssignedFilter]);

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
    sharedState: sharedMeta,
    filters: { assignedFilter, dateFilter, hideCompleted: completedFilter, colorsFilter },
    writeSharedState: (id, meta) => setSharedMeta(last => last.update(id, last => ({ ...last, ...meta }))),
    findNode: async (id) => {
      for (let group of (await project.taskGroups().get()).docs.map(doc => doc.data() as LazyTaskGroup)) {
        const result = await findNode(group, id);
        if (result) {
          return result;
        }
      }
      return null;
    },
  }}>
      <FilterHeader project={project} hiddenCount={hiddenCount} onAssignedFilter={onAssignedFilter} onColorsFilter={setColorsFilter} onCompletedFilter={setCompletedFilter} onDateFilter={setDateFilter}/>
      <div className="gantt">
        <LazyGanttMetaPanel project={project}/>
        <LazyGanttCalendar project={project}/>
      </div>
  </LGanttContext.Provider>;
};
