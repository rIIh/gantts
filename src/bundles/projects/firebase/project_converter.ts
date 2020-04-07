import {
  Project,
  Task,
  TaskGroup,
  ProjectCreator,
  ProjectState,
  Subtask,
  TaskConstructor,
  TaskGroupConstructor,
  TaskType,
} from '../types';
import firebase from 'firebase';
import { CollectionReferencePath, DocumentReferencePath, Timestamp } from '../../firebase/types';
import { UserConverter } from '../../user/firebase/converters/users';
import _ from 'lodash';
import { FirestoreApp } from '../../common/services/firebase';
import { Colors, Palette } from '../colors';

interface ProjectSnapshot extends Omit<ProjectCreator, 'startDate'>{
  owner: DocumentReferencePath;
  enrolled: CollectionReferencePath;
  groups: CollectionReferencePath;
  startDate: Date;
  state: ProjectState;
}

interface TaskGroupSnapshot extends TaskGroupConstructor {
  tasks: CollectionReferencePath;
  taskGroups: CollectionReferencePath;
}

interface TaskSnapshot extends Omit<TaskConstructor, 'project' | 'parentGroup'> {
  type: TaskType;
  subtasks: Subtask[];
  color: Colors<Palette>;
  assignedUsers: string[];
  project: DocumentReferencePath;
  parentGroup: DocumentReferencePath;
  dependsOn?: DocumentReferencePath[];
  dependentOn?: DocumentReferencePath[];
}

const convertTimestampPropsToDate = <T extends Object>(object: T): T => {
  return  _.mapValues(object, prop => {
    if ( prop instanceof Timestamp) {
      return prop.toDate();
    } else if (prop instanceof Array) {
      return prop.map(val => val instanceof Object ? convertTimestampPropsToDate(val) : val);
    } else if (prop instanceof Object) {
      return convertTimestampPropsToDate(prop);
    }  else {
      return prop;
    }
  }) as T;
};

export const ProjectConverter: firebase.firestore.FirestoreDataConverter<Project> = {
  fromFirestore(snapshot: firebase.firestore.QueryDocumentSnapshot<ProjectSnapshot>,
      options: firebase.firestore.SnapshotOptions
  ): Project {
    let { owner, enrolled, groups, startDate, comments, state, ...raw } = convertTimestampPropsToDate(snapshot.data());
    return {
      ...raw,
      state: state ?? ProjectState.Active,
      startDate: startDate,
      uid: snapshot.id,
      comments: comments?.sort((l, r) => -l.updatedAt.compareTo(r.updatedAt)) ?? [],
      selfReference: () => snapshot.ref.withConverter(ProjectConverter),
      owner: () => FirestoreApp.doc(owner.path).withConverter(UserConverter),
      enrolled: () => FirestoreApp.collection(enrolled).withConverter(UserConverter),
      taskGroups: () => FirestoreApp.collection(groups).withConverter(TaskGroupConverter),
    };
  },
  toFirestore(modelObject: Project): ProjectSnapshot {
    const { owner, taskGroups, enrolled, selfReference, ...raw } = modelObject;
    return {
      ...raw,
      owner: {
        path: owner().path,
        uid: owner().id,
      },
      groups: taskGroups().path,
      enrolled: enrolled().path,
    };
  },
};

export const TaskGroupConverter: firebase.firestore.FirestoreDataConverter<TaskGroup> = {
  fromFirestore(snapshot: firebase.firestore.QueryDocumentSnapshot<TaskGroupSnapshot>,
      options: firebase.firestore.SnapshotOptions
  ): TaskGroup {
    const { tasks, taskGroups, comments, ...raw } = convertTimestampPropsToDate(snapshot.data());
    return {
      ...raw,
      comments: comments?.sort((l, r) => -l.updatedAt.compareTo(r.updatedAt)) ?? [],
      uid: snapshot.id,
      selfReference: () => snapshot.ref.withConverter(TaskGroupConverter),
      tasks: () => FirestoreApp.collection(tasks).withConverter(TaskConverter),
      taskGroups: () => FirestoreApp.collection(taskGroups).withConverter(TaskGroupConverter),
    };
  }, toFirestore(modelObject: TaskGroup): TaskGroupSnapshot {
    const { tasks, taskGroups, uid, selfReference, ...raw } = modelObject;
    const data: TaskGroupSnapshot = {
      ...raw,
      tasks: tasks().path,
      taskGroups: taskGroups().path,
    };
    return _.omitBy(data, _.isNil) as TaskGroupSnapshot;
  },
};

export const TaskConverter: firebase.firestore.FirestoreDataConverter<Task> = {
  fromFirestore(snapshot: firebase.firestore.QueryDocumentSnapshot<TaskSnapshot>,
      options: firebase.firestore.SnapshotOptions
  ): Task {
    const { dependentOn, dependsOn, comments, project, parentGroup, progress, color, ...raw } = convertTimestampPropsToDate(snapshot.data());
    return {
      ...raw,
      uid: snapshot.id,
      comments: comments?.sort((l, r) => -l.updatedAt.compareTo(r.updatedAt)) ?? [],
      color: Palette[color] != undefined ? color : 'Basic Blue',
      progress: progress == 0 ? undefined : progress,
      selfReference: () => snapshot.ref.withConverter(TaskConverter),
      dependsOn: dependsOn ? () => dependsOn.map(doc => FirestoreApp.doc(doc.path).withConverter(TaskConverter)) : undefined,
      dependentOn: dependentOn ? () => dependentOn.map(doc => FirestoreApp.doc(doc.path).withConverter(TaskConverter)) : undefined,
      project: () => FirestoreApp.doc(project.path).withConverter(ProjectConverter),
      parentGroup: () => FirestoreApp.doc(parentGroup.path).withConverter(TaskGroupConverter),
    };
  }, toFirestore(modelObject: Task): TaskSnapshot {
    const { dependentOn, dependsOn, selfReference, project, parentGroup, progress, ...raw } = modelObject;
    const data: TaskSnapshot = {
      ...raw,
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
    };
    return _.omitBy(data, _.isNil) as TaskSnapshot;
  },
};
