import { FirebaseAuth, FirebaseCloud } from './../../common/services/firebase';
import { Dispatch } from 'react';
import { ActionType } from 'typesafe-actions';
import projectActions from './actions';
import firebase from 'firebase';
import _ from 'lodash';
import Immutable from 'immutable';
import { Project, ProjectCreator, Task, ProjectID, TaskGroupID, TaskGroupCreator, ProjectsState } from '../types';
import { TaskGroup } from '../types/index';

type RootDispatch = Dispatch<ActionType<typeof projectActions>>;

export const fetchProjects = (user: firebase.User) => {
  return async (dispatch: RootDispatch) => {
    dispatch(projectActions.setLoading(true));
    try {
      const projectsForState: Project[] = [];
      
      const docsOfMyProjects = (await FirebaseCloud.projects.where('owner','==',user.uid).get()).docs;
      const myProjectsResolver = docsOfMyProjects.map(async doc => {
        const data = doc.data();
        const owner = (await FirebaseCloud.users.doc(data.owner).get()).data() as firebase.UserInfo;
        const enrolled = (await FirebaseCloud.users.where('owner', '==', user.uid).get()).docs.map(doc => doc.data() as firebase.UserInfo);
        return doc.exists ? { ...doc.data(), id: doc.id, owner, enrolled } as Project : null;
      });
      const myProjects = (await Promise.all(myProjectsResolver)).filter((data): data is Project => data !== null);

      projectsForState.push(...myProjects);

      dispatch(projectActions.projectsFetched({ projects: projectsForState }));
    } catch(e) {
      dispatch(projectActions.setFailed(e));
    } finally {
      dispatch(projectActions.setLoading(false));
    }
  };
};

export const fetchTasksFor = (id: ProjectID) => {
  return async (dispatch: RootDispatch) => {
    dispatch(projectActions.setLoading(true));

    try {
      const taskGroupsForState: TaskGroup[] = [];
      let tasksForState: Immutable.Map<TaskGroupID, Task[]> = Immutable.Map();

      let taskGroups = (await FirebaseCloud.taskGroups(id).get()).docs.map(doc => <TaskGroup>{ ...doc.data(), id: doc.id });
      taskGroupsForState.push(...taskGroups);

      for (let taskGroup of taskGroups) {
        const tasks = (await FirebaseCloud.tasks(id, taskGroup.id).get()).docs.map(doc => doc.data());
        tasksForState = tasksForState.set(taskGroup.id, tasks.map(data => data as Task));
      }
      dispatch(projectActions.tasksFetched({ projectID: id, tasks: tasksForState, taskGroups: taskGroupsForState }));
    } catch(e) {
      dispatch(projectActions.setFailed(e));
    } finally {
      dispatch(projectActions.setLoading(false));
    }
  };
};

export const createProject = (project: ProjectCreator) => {
  return async (dispatch: RootDispatch) => {
    dispatch(projectActions.setLoading(true));
    try {
      if (!FirebaseAuth.currentUser) {
        throw new Error('You are not authorized');
      }
      const currentUser = FirebaseAuth.currentUser;
      const data = await FirebaseCloud.projects
        .add({ 
          ...project,
          owner: currentUser.uid,
          enrolled: [
            currentUser.uid,
          ],
          complete: false,
          onHold: false,
      });
      const createdProject = (await data.get()).data() ?? {};
      await data.collection('task_groups').doc().set({
        title: 'First task group',
        projectID: data.id,
        comments: [],
        documents: [],
        history: [],
        notes: [],
      } as TaskGroupCreator);
      console.log(createdProject);
      dispatch(projectActions.created({ 
        ...createdProject as Project,
        id: data.id,
      }));
    } catch(e) {
      console.log(e);
      dispatch(projectActions.setFailed(e));
    } finally {
      dispatch(projectActions.setLoading(false));
    }
  };
};
