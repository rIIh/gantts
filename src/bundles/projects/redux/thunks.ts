import {FirebaseAuth} from './../../common/services/firebase';
import {Dispatch} from 'react';
import {ActionType} from 'typesafe-actions';
import projectActions from './actions';
import {Project, Task, TaskGroup, ProjectCreator, ProjectState, SharedState} from '../types';
import {projectCollections, projectReferences} from '../firebase';
import {userReferences} from '../../user/firebase';
import {UserConverter} from '../../user/firebase/converters/users';
import {ProjectConverter, TaskGroupConverter} from '../firebase/project_converter';
import {CachedQueriesInstance} from '../../firebase/cache';
import {CollectionReference} from '../../firebase/types';
import {ApplicationState} from '../../../redux/rootReducer';
import {createInitialGroup} from './lib/createInitialGroup';
import _ from 'lodash';
import { LazyUserInfo } from '../../user/types';

type RootDispatch = Dispatch<ActionType<typeof projectActions>>;

const recalculateProjectTree = (project: string) => {
  return function(dispatch: RootDispatch, getState: () => ApplicationState) {
    const throttledDispatch = _.throttle(dispatch, 200, { leading: true });
    const { groups, tasks } = getState().projectsState;
    const projectGroups = groups.get(project);
    const changes: { [key: string]: Partial<SharedState> } = {};
    const apply = (key: string, value: Partial<SharedState>) => changes[key] = { ...changes[key], ...value };
    
    const calculateProgress = (group: TaskGroup): number => {
      const childGroups = groups.get(group.uid);
      const childTasks = tasks.get(group.uid);
      const count = (childGroups?.length ?? 0) + (childTasks?.length ?? 0);
      const childrenProgress = childGroups && childGroups.length > 0 ? childGroups.map(group => calculateProgress(group)).reduce((acc, p) => acc + p) : 0;
      const tasksProgress = childTasks && childTasks.length > 0 ? childTasks.map(task => {
        let result: number;
        if (task.progress) {
          result = task.progress;
        } else {
          result = task.subtasks.length > 0 ?
              task.subtasks.reduce<number>((acc, st) => st.completed ? acc + 1 : acc, 0) / task.subtasks.length * 100 : 0;
        }
        apply(task.uid, { progress: result });
        return result;
      }).reduce((acc, p) => acc + p) : 0;
      const result = count > 0 ? (childrenProgress + tasksProgress) / count : 0;
      console.log(result, childrenProgress, tasksProgress, count);
      apply(group.uid, { progress: result });
      // dispatch(projectActions.calculatedPropertiesUpdate({ key: group.uid, value: { progress: result } }));
      return result;
    };
    
    let projectProgress = projectGroups ? projectGroups.map(g => calculateProgress(g)).reduce((acc, p) => acc + p) / (projectGroups.length) : 0;
    apply(project, { progress: projectProgress });
    // throttledDispatch(projectActions.calculatedPropertiesUpdate({ key: project, value: { progress: projectProgress } }));
    
    const calculateDates = (group: TaskGroup): [Date | undefined, Date | undefined] => {
      const minimumInTasks = tasks?.get(group.uid)?.map(_task => _task.start).reduce((a, date) => {
        if (a && date && a.compareTo(date) < 0 || !date) {
          return a;
        } else {
          return date;
        }
      }, undefined);
      const maximumInTasks = tasks?.get(group.uid)?.map(_task => _task.end).reduce((a, date) => {
        if (a && date && a.compareTo(date) > 0 || !date) {
          return a;
        } else {
          return date;
        }
      }, undefined);
      const [minimumInGroups, maximumInGroups] = groups.get(group.uid)?.map(g => calculateDates(g)).reduce<[Date | undefined, Date | undefined]>((acc, [min, max]) => {
        let res = [...acc];
        if (min && res[0] && min.compareTo(res[0]) < 0 || !res[0]) {
          res[0] = min;
        }
        if (max && res[1] && max.compareTo(res[1]) > 0 || !res[1]) {
          res[1] = max;
        }
        return [res[0], res[1]];
      }, [undefined, undefined]) ?? [];
  
      let minimum: Date | undefined;
      let maximum: Date | undefined;
      if (minimumInGroups) {
        if (!minimumInTasks) { minimum = minimumInGroups; }
        else { minimum = minimumInGroups.compareTo(minimumInTasks) < 0 ? minimumInGroups : minimumInTasks; }
      } else { minimum = minimumInTasks; }
      if (maximumInGroups) {
        if (!maximumInTasks) { maximum = maximumInGroups; }
        else { maximum = maximumInGroups.compareTo(maximumInTasks) > 0 ? maximumInGroups : maximumInTasks; }
      } else { maximum = maximumInTasks; }
      
      apply(group.uid, { start: minimum, end: maximum });
      // throttledDispatch(projectActions.calculatedPropertiesUpdate({ key: group.uid, value: { start: minimum, end: maximum } }));
      return [minimum, maximum];
    };
    
    let [minimumDate, maximumDate] = projectGroups?.map(g => calculateDates(g)).reduce((acc, dates) => {
      if (acc[0] && acc[1]) {
        if (dates[0] && dates[1]) {
          return [acc[0].compareTo(dates[0]) < 0 ? acc[0] : dates[0], acc[1].compareTo(dates[1]) > 0 ? acc[1] : dates[1]];
        } else {
          return acc;
        }
      } else {
        return dates;
      }
    }) ?? [undefined, undefined];
    apply(project, { start: minimumDate, end: maximumDate });
    console.log(changes);
    dispatch(projectActions.calculatedPropertiesUpdateBatch(changes));
    // throttledDispatch(projectActions.calculatedPropertiesUpdate({ key: project, value: { start: minimumDate, end: maximumDate } }));
  };
};

const recalculate = _.debounce((dispatch, uid) => dispatch(recalculateProjectTree(uid)), 400);

export const attachToProject = (project: Project) => {
  return (dispatch: RootDispatch, getState: () => ApplicationState) => {
    const fetchTasks = (origin: { tasks: () => CollectionReference; uid: string }) => {
      dispatch(projectActions.disposerCreated({
        project: project.uid,
        disposer: CachedQueriesInstance.listenCollection(origin.tasks(), (tasks: Task[]) => {
          dispatch(projectActions.tasksChanged({ parent: origin.uid, tasks }));
          // @ts-ignore
          recalculate(dispatch, project.uid);
        }),
      }));
    };
    const fetchGroups = (origin: { taskGroups: () => CollectionReference; uid: string }) => {
      dispatch(projectActions.disposerCreated({
        project: project.uid,
        disposer: CachedQueriesInstance.listenCollection(origin.taskGroups(), (groups: TaskGroup[]) => {
          dispatch(projectActions.groupsChanged({ parent: origin.uid, groups }));
            groups.forEach(group => {
              fetchGroups(group);
              fetchTasks(group);
            });
          // @ts-ignore
          if (groups.length > 0) {
            recalculate(dispatch, project.uid);
          }
        }),
      }));
    };
    fetchGroups(project);
    CachedQueriesInstance.listenCollection(project.taskGroups(),groups => {
      createInitialGroup.cancel();
      if (groups.length == 0) {
        createInitialGroup(project);
      }
    });
  };
};                                                                                                                              
                                                                                                                               
export const createProject = (project: ProjectCreator, onCreated: (id: string) => void) => {
  return async (dispatch: RootDispatch) => {                                                                                    
    try {
      if (!FirebaseAuth.currentUser) {
        throw new Error('You are not authorized');
      }
      const currentUser = FirebaseAuth.currentUser;
      const projectDoc = projectReferences.projects.doc();
      const user = await CachedQueriesInstance.getOnce<LazyUserInfo & { roles: string[] }>(userReferences.users.doc(currentUser.uid));
      projectDoc.collection(projectCollections.enrolledCollection).withConverter(UserConverter).doc(currentUser.uid).set({ ...user, roles: ['owner'] });
      const lazyProject: Project = {
        uid: projectDoc.id,
        ...project,
        documents: [],
        state: ProjectState.Active,
        selfReference: () => projectDoc.withConverter(ProjectConverter),
        owner: () => userReferences.users.doc(currentUser.uid),
        enrolled: () => projectReferences.projectEnrolled(projectDoc.id).withConverter(UserConverter),
        taskGroups: () => projectReferences.taskGroups(projectDoc.id).withConverter(TaskGroupConverter),
      };
      await projectDoc.set(lazyProject);
      const initialGroupDoc = lazyProject.taskGroups().doc();
      const initialGroup: TaskGroup = {
        uid: initialGroupDoc.id,
        projectID: lazyProject.uid,
        title: 'First Task Group',
        selfReference: () => initialGroupDoc,
        tasks: () => projectReferences.tasks(lazyProject.uid, initialGroupDoc.id),
        taskGroups: () => initialGroupDoc.collection(projectCollections.taskGroupsCollection),
        comments: [],
        documents: [],
        history: [],
        note: '',
      };
      await initialGroupDoc.set(initialGroup);
      onCreated(projectDoc.id);
    } catch(e) {
      console.log(e);
    } 
  };
};
