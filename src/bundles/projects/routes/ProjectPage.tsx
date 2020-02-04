import React, { useEffect, useState } from 'react';
import 'datejs';
import '../../date/extension';
import { useRouteMatch } from 'react-router';
import { Task, TaskConstructor, TaskGroup, TaskGroupConstructor, TaskGroupID } from '../types/index';
import { Change, ChangeType, GanttTree, GanttTreeLevel } from '../types/gantt';
import { useDispatch } from 'react-redux';
import { createTask, createTaskGroup, fetchTasksFor } from '../redux/thunks';
import '../styles/blocks/project_manager.scss';
import '../styles/blocks/gantt.scss';
import { useTypedSelector } from '../../../redux/rootReducer';
import { Gantt } from '../components/Gantt';

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
