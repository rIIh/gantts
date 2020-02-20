import React, { createContext, useCallback, useState } from 'react';
import { LazyProject, LazyTask, LazyTaskGroup, LGanttProps } from '../../types';
import { ThemeProvider } from 'styled-components';
import { LazyGanttMetaPanel } from './LazyGanttMetaPanel';
import { LazyGanttCalendar } from './LazyGanttCalendar';
import { GanttTheme, PropsWithConfig } from './types';
import { Map } from 'immutable';
import { AssignedFilter, DatesFilter, LazyGanttHeader } from './LazyGanttHeader';

export interface Meta {
  [key: string]: any;
}

interface LazyGanttContextType {
  project: LazyProject;
  findNode: (id: string) => Promise<LazyTask | null>;
  filters: { assignedFilter: AssignedFilter | null; dateFilter: DatesFilter };
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
  const onAssignedFilter = useCallback((filter: AssignedFilter) => {
    if (filter.include.length > 0) {
      setAssignedFilter(filter);
    } else {
      setAssignedFilter(null);
    }
  }, [setAssignedFilter]);
  
  return <LGanttContext.Provider value={{
    project: project,
    sharedState: sharedMeta,
    filters: { assignedFilter, dateFilter },
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
    <ThemeProvider theme={config ?? new GanttTheme()}>
      
      <LazyGanttHeader onAssignedFilter={onAssignedFilter} onDateFilter={setDateFilter}/>
      <div className="gantt">
        <LazyGanttMetaPanel project={project}/>
        <LazyGanttCalendar project={project}/>
      </div>
    </ThemeProvider>
  </LGanttContext.Provider>;
};
