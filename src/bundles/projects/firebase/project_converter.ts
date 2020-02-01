import { Project, Task, TaskGroup, ProjectCreator } from '../types';
import _ from 'lodash';
import { FirebaseCloud } from '../../common/services/firebase';


export const FirestoreTaskGroupConverter: firebase.firestore.FirestoreDataConverter<TaskGroup> = {
  toFirestore({ comments, notes, documents, history }: TaskGroup): firebase.firestore.DocumentData {
    return {
      
    };
  },
  fromFirestore(
    snapshot: firebase.firestore.QueryDocumentSnapshot,
    options: firebase.firestore.SnapshotOptions
  ): TaskGroup {
    const data = snapshot.data(options)!;
    return {
      ...data as TaskGroup,
    };
  },
};

export const FirestoreUserConverter: firebase.firestore.FirestoreDataConverter<firebase.UserInfo> = {
  toFirestore(userInfo: firebase.UserInfo): firebase.firestore.DocumentData {
    return userInfo;
  },
  fromFirestore(
    snapshot: firebase.firestore.QueryDocumentSnapshot,
    options: firebase.firestore.SnapshotOptions
  ): firebase.UserInfo {
    const data = snapshot.data(options)!;
    return data as firebase.UserInfo;
  },
};