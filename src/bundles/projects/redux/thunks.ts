import { FirebaseAuth, FirebaseCloud, FirestoreApp } from './../../common/services/firebase';
import { Dispatch } from 'react';
import { ActionType } from 'typesafe-actions';
import projectActions from './actions';
import firebase from 'firebase';
import _ from 'lodash';
import Immutable from 'immutable';
import {
  Project,
  ProjectCreator,
  TaskConstructor,
  LazyProject,
  LazyTaskGroup, LazyTask,
} from '../types';
import { LazyUserInfo, UserInfo } from '../../user/types';
import { projectCollections, projectReferences } from '../firebase';
import { userReferences } from '../../user/firebase';
import { LazyCollectionReference, LazyReference } from '../../firebase/types';
import { UserConverter } from '../../user/firebase/converters/users';
import { TaskGroupConverter } from '../firebase/project_converter';

type RootDispatch = Dispatch<ActionType<typeof projectActions>>;

export const createProject = (project: ProjectCreator) => {
  return async (dispatch: RootDispatch) => {
    dispatch(projectActions.setLoading(true));
    try {
      if (!FirebaseAuth.currentUser) {
        throw new Error('You are not authorized');
      }
      const currentUser = FirebaseAuth.currentUser;
      const projectDoc = projectReferences.projects.doc();
      const lazyProject: LazyProject = {
        uid: projectDoc.id,
        ...project,
        selfReference: () => projectDoc,
        owner: () => userReferences.users.doc(currentUser.uid),
        enrolled: () => projectReferences.projectEnrolled(projectDoc.id).withConverter(UserConverter),
        taskGroups: () => projectReferences.taskGroups(projectDoc.id).withConverter(TaskGroupConverter),
        complete: false,
        onHold: false,
      };
      await projectDoc.set(lazyProject);
      const initialGroupDoc = lazyProject.taskGroups().doc();
      const initialGroup: LazyTaskGroup = {
        uid: initialGroupDoc.id,
        projectID: lazyProject.uid,
        title: 'First Task Group',
        selfReference: () => initialGroupDoc,
        tasks: () => projectReferences.tasks(lazyProject.uid, initialGroupDoc.id),
        taskGroups: () => initialGroupDoc.collection(projectCollections.taskGroupsCollection),
        comments: [],
        documents: [],
        history: [],
        notes: [],
      };
      await initialGroupDoc.set(initialGroup);
      dispatch(projectActions.created(lazyProject));
    } catch(e) {
      console.log(e);
      dispatch(projectActions.setFailed(e));
    } finally {
      dispatch(projectActions.setLoading(false));
    }
  };
};
