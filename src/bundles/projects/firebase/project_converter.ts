import {
  ProjectCreator,
  LazyProject,
  LazyTaskGroup,
  TaskGroupConstructor,
  LazyTask,
  TaskConstructor,
  TaskType, Subtask, WeekBitMask,
} from '../types';
import firebase from 'firebase';
import { CollectionReferencePath, DocumentReferencePath, LazyCollectionReference, LazyReference, Timestamp } from '../../firebase/types';
import { LazyUserInfo, UserInfo } from '../../user/types';
import { UserConverter } from '../../user/firebase/converters/users';
import _ from 'lodash';
import { FirestoreApp } from '../../common/services/firebase';
import { Colors, Palette } from '../colors';

interface ProjectSnapshot extends Omit<ProjectCreator, 'startDate'>{
  owner: DocumentReferencePath;
  enrolled: CollectionReferencePath;
  groups: CollectionReferencePath;
  startDate: Timestamp;
  complete: boolean;
  onHold: boolean;
}

interface TaskGroupSnapshot extends TaskGroupConstructor {
  tasks: CollectionReferencePath;
  taskGroups: CollectionReferencePath;
}

interface TaskSnapshot extends Omit<TaskConstructor, 'start' | 'end' | 'project' | 'parentGroup'> {
  type: TaskType;
  subtasks: Subtask[];
  color: Colors<Palette>;
  start?: Timestamp;
  end?: Timestamp;
  project: DocumentReferencePath;
  parentGroup: DocumentReferencePath;
  dependsOn?: DocumentReferencePath[];
  dependentOn?: DocumentReferencePath[];
  assigned: CollectionReferencePath;
}

export const ProjectConverter: firebase.firestore.FirestoreDataConverter<LazyProject> = {
  fromFirestore(snapshot: firebase.firestore.QueryDocumentSnapshot<ProjectSnapshot>,
      options: firebase.firestore.SnapshotOptions
  ): LazyProject {
    let { owner, enrolled, groups, startDate, ...raw } = snapshot.data();
    return {
      ...raw,
      startDate: startDate.toDate(),
      uid: snapshot.id,
      selfReference: () => snapshot.ref,
      owner: () => FirestoreApp.doc(owner.path).withConverter(UserConverter),
      enrolled: () => FirestoreApp.collection(enrolled).withConverter(UserConverter),
      taskGroups: () => FirestoreApp.collection(groups).withConverter(TaskGroupConverter),
    };
  },
  toFirestore(modelObject: LazyProject): ProjectSnapshot {
    const { owner, taskGroups, enrolled, startDate, selfReference, ...raw } = modelObject;
    return {
      ...raw,
      startDate: Timestamp.fromDate(startDate),
      owner: {
        path: owner().path,
        uid: owner().id,
      },
      groups: taskGroups().path,
      enrolled: enrolled().path,
    };
  },
};

export const TaskGroupConverter: firebase.firestore.FirestoreDataConverter<LazyTaskGroup> = {
  fromFirestore(snapshot: firebase.firestore.QueryDocumentSnapshot<TaskGroupSnapshot>,
      options: firebase.firestore.SnapshotOptions
  ): LazyTaskGroup {
    const { tasks, taskGroups, ...raw } = snapshot.data();
    return {
      ...raw,
      uid: snapshot.id,
      selfReference: () => snapshot.ref,
      tasks: () => FirestoreApp.collection(tasks).withConverter(TaskConverter),
      taskGroups: () => FirestoreApp.collection(taskGroups).withConverter(TaskGroupConverter),
    };
  }, toFirestore(modelObject: LazyTaskGroup): TaskGroupSnapshot {
    const { tasks, taskGroups, uid, selfReference, ...raw } = modelObject;
    const data: TaskGroupSnapshot = {
      ...raw,
      tasks: tasks().path,
      taskGroups: taskGroups().path,
    };
    return _.omitBy(data, _.isNil) as TaskGroupSnapshot;
  },
};

export const TaskConverter: firebase.firestore.FirestoreDataConverter<LazyTask> = {
  fromFirestore(snapshot: firebase.firestore.QueryDocumentSnapshot<TaskSnapshot>,
      options: firebase.firestore.SnapshotOptions
  ): LazyTask {
    const { dependentOn, dependsOn, assigned, start, end, project, parentGroup, progress, color, ...raw } = snapshot.data();
    return {
      ...raw,
      uid: snapshot.id,
      start: start?.toDate(),
      end: end?.toDate(),
      color: Palette[color] != undefined ? color : 'Basic Blue',
      progress: progress == 0 ? undefined : progress,
      selfReference: () => snapshot.ref.withConverter(TaskConverter),
      dependsOn: dependsOn ? () => dependsOn.map(doc => FirestoreApp.doc(doc.path).withConverter(TaskConverter)) : undefined,
      dependentOn: dependentOn ? () => dependentOn.map(doc => FirestoreApp.doc(doc.path).withConverter(TaskConverter)) : undefined,
      // project: new LazyReference<LazyProject>(project.path).withFirestoreConverter(ProjectConverter),
      // parentGroup: new LazyReference<LazyTaskGroup>(parentGroup.path).withFirestoreConverter(TaskGroupConverter),
      // assigned: new LazyCollectionReference<LazyUserInfo>(assigned).withFirestoreConverter(UserConverter),
      project: () => FirestoreApp.doc(project.path).withConverter(ProjectConverter),
      parentGroup: () => FirestoreApp.doc(parentGroup.path).withConverter(TaskGroupConverter),
      assigned: () => FirestoreApp.collection(assigned).withConverter(UserConverter),
    };
  }, toFirestore(modelObject: LazyTask): TaskSnapshot {
    const { dependentOn, dependsOn, assigned, selfReference, start, end, project, parentGroup, progress, ...raw } = modelObject;
    const data: TaskSnapshot = {
      ...raw,
      start: start ? Timestamp.fromDate(start) : undefined,
      end: end ? Timestamp.fromDate(end) : undefined,
      project: { uid: project().id, path: project().path },
      progress: progress == 0 ? undefined : progress,
      parentGroup: { uid: parentGroup().id, path: parentGroup().path },
      dependentOn: dependentOn ? dependentOn().map(ref => ({
        path: ref?.path,
        uid: ref?.id,
      })) : undefined,
      dependsOn: dependsOn ? dependsOn().map(ref => ({
        path: ref?.path,
        uid: ref?.id,
      })) : undefined,
      assigned: assigned().path,
    };
    return _.omitBy(data, _.isNil) as TaskSnapshot;
  },
};
