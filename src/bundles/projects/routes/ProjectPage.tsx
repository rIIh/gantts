import React, { ClassAttributes, Fragment, useEffect, useRef, useState } from 'react';
import 'datejs';
import '../../date/extension';
import _ from 'lodash';
import { useRouteMatch } from 'react-router';
import { Project, ProjectID, Task, TaskConstructor, TaskGroup, TaskGroupConstructor, TaskGroupID, TaskType, WeekBitMask } from '../types/index';
import { useDispatch } from 'react-redux';
import { createTask, createTaskGroup, fetchTasksFor } from '../redux/thunks';
import '../styles/blocks/project_manager.scss';
import '../styles/blocks/gantt.scss';
import useComponentSize from '@rehooks/component-size';
import { useTypedSelector } from '../../../redux/rootReducer';
import cuid from 'cuid';

interface GanttRowProps {
  title: string;
  id: string;
  level: number;
  isHovered: boolean;
  onChange?: () => void;
  onDestroy?: () => void;
  onDots?: () => void;
  isForm: boolean;
}

const keys: GanttRowProps = { title: '', level: 0, isHovered: false, onChange: undefined, onDestroy: undefined, onDots: undefined, isForm: false, id: '' };
const GanttAtomMeta: React.FC<GanttRowProps & React.HTMLAttributes<HTMLDivElement>> = (props) => {
  const { id, title, level, isHovered, onChange, onDestroy, onDots, isForm } = props;
  const divProps = _.omit(props, Object.keys(keys));
  return <div
      id={id}
      className={'gantt__atom_meta' + (isHovered ? ' gantt__atom_meta--active' : '') + (level === GanttTreeLevel.Group ? ' gantt__atom_meta--group' : '')}
      style={{ paddingLeft: `calc(${level}rem + 12px)` }}
      {...divProps}
  >
    {isForm ? <input type="text"/> : title}
    <span className="gantt__atom_meta_toolbar" style={{ display: isHovered ? undefined : 'none' }}>
      <span className="badge toolbar__button link" onClick={onChange}>
        <span className="fas fa-pen"/>
      </span>
      <span className="badge toolbar__button link" onClick={onDestroy}>
        <span className="fas fa-times"/>
      </span>
      <span className="badge toolbar__button link" onClick={onDots}>
        <span className="fas fa-ellipsis-v"/>
      </span>
    </span>
  </div>;
};

enum GanttTreeLevel {
  Project, Group, Atom,
}

interface GanttTreeConstructor {
  level: GanttTreeLevel;
  type?: TaskType;
  parentID?: string;
  title: string;
  start?: Date;
  end?: Date;
}

interface GanttTree extends GanttTreeConstructor {
  id?: string;
  subTrees?: GanttTree[];
  dependsOn?: Task;
  dependentOn?: Task;
}

enum ChangeType {
  AtomCreated, AtomRemoved, AtomUpdated,
  GroupCreated, GroupRemoved, GroupUpdated,
  ProjectUpdated,
}

interface Change {
  type: ChangeType;
  payload: GanttTree;
}

interface GanttProps {
  tree: GanttTree;
  weekMask: WeekBitMask;
  start: Date;
  onTreeChanged: (changes: Change, newTree: GanttTree) => void;
}

enum CalendarScale {
  Days,
  Weeks,
  Months,
}

interface GanttCalendarProps {
  start: Date;
  lengthInWeeks: number;
  scale: CalendarScale;
  zoom: number;
}

const timeUnits = {
  hour: 1,
  day: 24,
  week: 24 * 7,
  month: 24 * 31,
};

const times = (count: number, builder: (index: number) => JSX.Element | null): JSX.Element[] => {
  let elements = [];
  for (let i = 0; i < count; i++) {
    const element = builder(i);
    if (element) {
      elements.push(element);
    }
  }
  return elements;
};

const dateDay = { day: 'numeric' };
const dateMonth = { month: 'long' };

const dayToWeekBit: { [key: number]: WeekBitMask } = {
  0: WeekBitMask.Sunday,
  1: WeekBitMask.Monday,
  2: WeekBitMask.Tuesday,
  3: WeekBitMask.Wednesday,
  4: WeekBitMask.Thursday,
  5: WeekBitMask.Friday,
  6: WeekBitMask.Saturday,
};

const weekBitToDay: { [key: number]: number } = {
  [WeekBitMask.Sunday]: 0,
  [WeekBitMask.Monday]: 1,
  [WeekBitMask.Tuesday]: 2,
  [WeekBitMask.Wednesday]: 3,
  [WeekBitMask.Thursday]: 4,
  [WeekBitMask.Friday]: 5,
  [WeekBitMask.Saturday]: 6,
};

enum DateStep {
  Day = 1, Week = 7, Month, Year,
}

class IterableDate implements Iterable<Date> {
  private readonly start: Date;
  private readonly end: Date;
  private step: DateStep = DateStep.Day;
  private current: Date;

  constructor(start: Date, end: Date) {
    this.start = start.clone().moveToFirstDayOfMonth();
    this.end = end.clone().moveToLastDayOfMonth();
    this.current = start.clone();
  }

  iterateByMonths(step: DateStep): IterableDate {
    let copy = new IterableDate(this.start, this.end);
    copy.step = step;
    return copy;
  }

  map<T>(builder: (date: Date) => T): T[] {
    let result: T[] = [];
    for (let date of this) {
      result.push(builder(date));
    }
    return result;
  }

  done: boolean = false;

  [Symbol.iterator](): Iterator<Date> {
    return {
      next: (): IteratorYieldResult<Date> | IteratorReturnResult<any> => {
        if (this.done) {
          this.done = false;
          return { done: true, value: null };
        }
        let result = this.current.clone();
        let next = this.current.clone();
        switch (this.step) {
          case DateStep.Day: {
            next.next().day();
            break;
          }
          case DateStep.Week: {
            next.next().week();
            break;
          }
          case DateStep.Month: {
            next.next().month();
            break;
          }
          case DateStep.Year: {
            next.next().year();
            break;
          }
        }
        if (next > this.end) {
          this.current = this.start.clone();
          this.done = true;
        } else {
          this.current = next.clone();
        }
        return {
          value: result,
          done: false,
        };
      },
    };
  };
}

interface TaskCreator {
  start?: Date;
  end?: Date;
  parentID?: string;
}

const inline = (tree: GanttTree): GanttTree[] => {
  const subtreesInlined = [];
  for (let subtree of tree.subTrees ?? []) {
    subtreesInlined.push(...inline(subtree));
  }
  return [tree, ...subtreesInlined];
};

const GanttCalendar: React.FC<GanttProps & GanttCalendarProps> = ({ tree, weekMask, start, scale, zoom }) => {
  const ref = useRef(null);
  const size = useComponentSize(ref);
  const [endMonth, setEndMonth] = useState(start.clone().addMonths(2));
  const [lastDayInWeek, setLastDayInWeek] = useState(0);
  const taskGhost = useRef<HTMLDivElement>(null);
  const [iterableDate, setIterableDate] = useState<IterableDate>();

  const [taskConstructor, setTaskConstructor] = useState<TaskCreator>();

  useEffect(() => {
    setIterableDate(new IterableDate(start.addMonths(-2), endMonth));
  }, [endMonth]);

  useEffect(() => {
    let _lastDayInWeek = WeekBitMask.Sunday;
    if (!(weekMask & WeekBitMask.Sunday)) {
      for (let entry of Object.entries(WeekBitMask).reverse().filter((e) => typeof e[1] === 'number' && e[1] !== 0)) {
        if (weekMask & entry[1] as number) {
          _lastDayInWeek = entry[1] as number;
          break;
        }
      }
    }
    if (_lastDayInWeek !== lastDayInWeek) {
      setLastDayInWeek(weekBitToDay[_lastDayInWeek]);
    }
  }, [weekMask]);

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    if (event.currentTarget.scrollLeft + size.width + 200 > event.currentTarget.scrollWidth) {
      setEndMonth(endMonth.clone().next().month());
    }
  };

  const [atoms, updateAtoms] = useState<JSX.Element[]>([]);
  useEffect(() => {
    const groups: JSX.Element[] = [];
    for (let group of tree.subTrees ?? []) {
      let tasks = group.subTrees;
      if (!tasks) { continue; }
      let start = tasks.reduce<Date | null>((acc, task) => {
        if (!task.start) { return acc; }
        if (acc && task.start < acc) {
          return task.start;
        } else {
          return acc;
        }
      }, null);
      let end = tasks.reduce<Date | null>((acc, task) => {
        if (!task.end) { return acc; }
        if (acc && task.end > acc) {
          return task.end;
        } else {
          return acc;
        }
      }, null);

      let startTarget = start ? document.getElementById(start.toDateString()) : null;
      let endTarget = end ? document.getElementById(end.toDateString()) : null;
      let metaTarget = document.getElementById(group.id!);

      if(!metaTarget) { continue; }
      let noInitializedTasks = !start || !end;

      let groupAtom = (
          <div key={group.id} className="gantt__calendar_atom_group" style={{
            left: `${startTarget?.offsetLeft ?? 0}px`,
            right: `${((endTarget?.offsetWidth ?? 0) + (endTarget?.offsetLeft ?? 0))}px`,
            top: `${metaTarget.offsetTop}px`,
          }}>
            <div className={'gantt__calendar_atom_group_header' + (noInitializedTasks ? ' gantt__calendar_atom_group_header--hidden' : '')}>

            </div>
            { tasks?.map((task, index) => {
              let startTarget = task.start ? document.getElementById(task.start.toDateString()) : null;
              let endTarget = task.end ? document.getElementById(task.end.toDateString()) : null;

              return <div key={task.id} className="gantt__calendar_atom_group_task"
                          onMouseMove={event => {
                            if (task.start && task.end) {
                              return;
                            }
                            const mouseX = event.pageX - event.currentTarget.getBoundingClientRect().left;
                            console.log();
                            taskGhost.current?.style.setProperty('left', `${mouseX}px`);
                            taskGhost.current?.style.setProperty('width', '100px');
                            taskGhost.current?.style.setProperty('top', `${(metaTarget?.offsetTop ?? 0) + (index + 1) * 32}px`);
                          }}
                          style={{
                left: `${startTarget?.offsetLeft ?? 0}px`,
                right: `${((endTarget?.offsetWidth ?? 0) + (endTarget?.offsetLeft ?? 0))}px`,
                top: `${(index + 1) * 32}px`,
              }}/>;
            })}
          </div>
      );
      groups.push(groupAtom);
    }
    updateAtoms(groups);
  }, [tree]);

  return <div className="gantt__calendar_wrapper" ref={ref} onScroll={handleScroll}>
    <div
        className="gantt__calendar">
      <div className="gantt__calendar_atom gantt__calendar_atom--ghost" ref={taskGhost}>
      </div>
      {iterableDate?.iterateByMonths(DateStep.Month).map(date => {
        return (
            <div key={date.toString()} className="gantt__calendar_month">
              <p className="gantt__calendar_header">{date.toString('MMMM yyyy')}</p>
              <div className="gantt__calendar_content">
                {
                  new IterableDate(date.clone().moveToFirstDayOfMonth(), date.clone().moveToLastDayOfMonth()).map(dayDate => {
                    const day = dayDate.getDay();
                    if (!(weekMask & dayToWeekBit[day])) {
                      return null;
                    }
                    return (
                        <div key={dayDate.toString()}
                             id={dayDate.toDateString()}
                             className={'day-data gantt__calendar_column' + (day === lastDayInWeek ? ' gantt__calendar_column--last_in_week' : '')}
                             onMouseDown={(event) => {
                               // start task creation;
                               if (!taskConstructor) {
                                 return;
                               }
                               event.stopPropagation();
                               event.preventDefault();
                               setTaskConstructor({ start: dayDate });
                             }}>
                          {dayDate.toLocaleString(undefined, dateDay)}
                        </div>
                    );
                  })}
              </div>
            </div>
        );
      })}
      { atoms }
    </div>
  </div>;
};

interface GanttMetaPanelProps {
  onNewTask?: (source: GanttTree) => void;
  onNewMilestone?: (source: GanttTree) => void;
  onNewGroup?: (source: GanttTree) => void;
  onTaskMetaChanged?: (data: { title: string }) => void;
  onSubmit: () => void;
  formTarget: string;
  formData?: GanttTreeConstructor;
}

const GanttMetaPanel: React.FC<GanttProps & GanttMetaPanelProps> = ({
                                                                      tree,
                                                                      onNewTask,
                                                                      onNewGroup,
                                                                      onNewMilestone,
                                                                      onTaskMetaChanged,
                                                                      onSubmit,
                                                                      formTarget,
                                                                      formData,
                                                                    }) => {
  const [activeMeta, setActiveMeta] = useState<GanttTree>();
  const [showTools, setTools] = useState(false);

  const createMeta = (tree: GanttTree): JSX.Element => {
    let isGroup = tree.level === GanttTreeLevel.Group;
    return <Fragment key={tree.id}>
      <GanttAtomMeta id={tree.id!} title={tree.title} level={tree.level} isHovered={activeMeta?.id === tree.id} isForm={false}
                     onMouseEnter={() => setActiveMeta(tree)} onMouseLeave={() => setActiveMeta(undefined)}/>
      { tree.subTrees?.map(createMeta) }
      { isGroup && formData === undefined && (
          <div className="project_manager__task_toolbar" style={{ opacity: showTools ? undefined : 0, pointerEvents: showTools ? undefined : 'none' }}>
            <span className="fas fa-plus-circle flex-shrink-1"/>
            <button className="link" onClick={() => onNewTask?.(tree)}>Task</button>
            <span className="unselectable">|</span>
            <button className="link" onClick={() => onNewMilestone?.(tree)}>Milestone</button>
            <span className="unselectable">|</span>
            <button className="link" onClick={() => onNewGroup?.(tree)}>Group of tasks</button>
          </div>
      ) }
      { formData !== undefined && formTarget === tree.id && (
          <input type="text" value={formData?.title} onChange={(e) => onTaskMetaChanged?.({ title: e.currentTarget.value })} onBlur={onSubmit}/>
      ) }
    </Fragment>;
  };

  return <div className="gantt__meta_panel" onMouseEnter={() => setTools(true)} onMouseLeave={() => setTools(false)}>
    <div className="gantt__meta_header">

    </div>
    {createMeta(tree)}
  </div>;
};

const Gantt: React.FC<GanttProps> = (props) => {
  const [tree, setTree] = useState(props.tree);
  const [insertAfter, setAfter] = useState<string>();
  const [formData, setFormData] = useState<GanttTreeConstructor>();
  const [mutationSource, setMutationSource] = useState<string>();

  useEffect(() => {
    setTree(props.tree);
  }, [props.tree]);

  const newAtom = (parent: GanttTree, type: TaskType) => {
    setFormData({
                  level: GanttTreeLevel.Atom,
                  title: '',
                  type: type,
                  parentID: parent.id,
                });
  };
  const newTask = (source: GanttTree) => {
    setMutationSource(source.id);
    newAtom(source, TaskType.Task);
  };
  const newMilestone = (source: GanttTree) => {
    setMutationSource(source.id);
    newAtom(source, TaskType.Milestone);
  };
  const newGroup = (source: GanttTree) => {
    setMutationSource(source.id);
    setFormData({
                  level: GanttTreeLevel.Group,
                  title: '',
                  parentID: tree.id,
                });
    setAfter(source.id);
  };
  const applyMetaChange = ({ title }: { title: string }) => {
    setFormData({ ...formData!, title });
  };

  const resolveForm = (tree: GanttTree): boolean => {
    if (tree.id === formData?.parentID) {
      let subtrees = tree.subTrees;
      if (subtrees) {
        if (formData?.level === GanttTreeLevel.Group) {
          let sourceIndex = subtrees.findIndex(el => el.id === insertAfter);
          if (sourceIndex === subtrees.length - 1) {
            subtrees.push({ ...formData, id: cuid(), subTrees: [] });
          } else {
            subtrees.splice(sourceIndex + 1, 0, { ...formData, id: cuid(), subTrees: [] });
          }
        } else if (formData?.level === GanttTreeLevel.Atom) {
          subtrees.push({ ...formData, id: cuid(), subTrees: [] });
        }
        return true;
      } else {
        return false;
      }
    } else {
      for (let subtree of tree.subTrees ?? []) {
        let resolved = resolveForm(subtree);
        if (resolved) {
          return true;
        }
      }
      return false;
    }
  };

  const attachToTree = () => {
    if (formData?.title == undefined || formData?.title === '') {
      setFormData(undefined);
      return;
    }
    resolveForm(tree);
    setFormData(undefined);

    props.onTreeChanged({ type: formData.level === GanttTreeLevel.Group ? ChangeType.GroupCreated : ChangeType.AtomCreated, payload: formData }, tree);
  };

  return <div className="gantt">
    <GanttMetaPanel {...{ ...props, tree: tree }}
                    onNewTask={newTask}
                    onNewGroup={newGroup}
                    onNewMilestone={newMilestone}
                    onTaskMetaChanged={applyMetaChange}
                    formData={formData}
                    formTarget={mutationSource ?? ''}
                    onSubmit={attachToTree}/>
    <GanttCalendar {...{ ...props, tree: tree }}
                   lengthInWeeks={24}
                   zoom={1}
                   scale={CalendarScale.Days}/>
  </div>;
};

const ProjectPage: React.FC = () => {
  const dispatch = useDispatch();
  const { params } = useRouteMatch();
  const { projects, tasks, taskGroups, isFailed, isLoading, message } = useTypedSelector(state => state.projectsState);
  const [projectData, setProjectData] = useState(projects.find(p => p.id === params.id));
  const [projectTaskGroups, setGroups] = useState<TaskGroup[]>([]);
  const [projectTasks, setTasks] = useState<Map<TaskGroupID, Task[]>>();
  const [taskTree, setTree] = useState<GanttTree>();
  const [earliestDate, setDate] = useState(Date.today());

  useEffect(() => {
    setProjectData(projects.find(p => p.id === params.id));
  }, [projects]);
  useEffect(() => {
    console.log(taskGroups);
    setGroups(taskGroups.get(projectData?.id || '') ?? []);
  }, [projectData, taskGroups]);
  useEffect(() => {
    const newMap = new Map<TaskGroupID, Task[]>();
    for (let group of projectTaskGroups) {
      newMap.set(group.id, tasks.get(group.id) ?? []);
    }
    setTasks(newMap);
  }, [projectTaskGroups]);
  useEffect(() => {
    if (projectData) {
      dispatch(fetchTasksFor(projectData?.id ?? ''));
    }
  }, [projectData]);
  useEffect(() => {
    if (!projectData) {
      return;
    }
    const root: GanttTree = {
      id: projectData.id,
      level: GanttTreeLevel.Project,
      title: projectData.title,
      subTrees: [],
    };

    let _earliestDate = earliestDate;

    for (let group of projectTaskGroups) {
      const groupTree: GanttTree = {
        id: group.id,
        level: GanttTreeLevel.Group,
        title: group.title,
        parentID: root.id,
        subTrees: [],
      };

      for (let task of projectTasks?.get(group.id) ?? []) {
        const taskTree: GanttTree = {
          ...task,
          type: task.type,
          level: GanttTreeLevel.Atom,
          parentID: groupTree.id,
        };
        groupTree.subTrees?.push(taskTree);
        if (task.start && task.start < _earliestDate) {
          _earliestDate = task.start;
        }
      }
      root.subTrees?.push(groupTree);
    }
    setDate(_earliestDate);
    setTree(root);
  }, [projectTasks]);

  const commitChanges = ({ type, payload }: Change, newTree: GanttTree) => {
    switch (type) {
      case ChangeType.AtomCreated: {
        const newTask: TaskConstructor = {
          title: payload.title,
          progress: 0,
          projectID: projectData!.id,
          parentGroupID: payload.parentID!,
          comments: [],
          documents: [],
          history: [],
          notes: [],
        };
        dispatch(createTask(newTask));
        break;
      }
      case ChangeType.GroupCreated: {
        const newGroup: TaskGroupConstructor = {
          title: payload.title,
          notes: [],
          history: [],
          documents: [],
          comments: [],
          projectID: projectData!.id,
        };
        dispatch(createTaskGroup(newGroup));
        break;
      }
    }
    setTree(newTree);
  };

  return <>
    { taskTree && <Gantt tree={taskTree} weekMask={projectData?.daysInWeekBitMask ?? 0} start={earliestDate} onTreeChanged={commitChanges}/> }
  </>;
};

export default ProjectPage;
