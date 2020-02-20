import Immutable from 'immutable';
import _ from 'lodash';
import { LazyUserInfo, User, UserInfo } from '../../user/types';
import { CollectionReference, DocumentReference, DocumentReferencePath, LazyCollectionReference, LazyReference } from '../../firebase/types';
import { Colors, Palette } from '../colors';

export type ProjectID = string;
export type TaskGroupID = string;

export interface ProjectsState {
  projects: Project[];
  lazy: LazyProject[];
  taskGroups: Immutable.Map<ProjectID, TaskGroup[]>;
  tasks: Immutable.Map<TaskGroupID, Task[]>;
  isLoading: boolean;
  isFailed: boolean;
  message: string;
}

export interface ProjectCreator extends Discussable {
  title: string;
  startDate: Date;
  daysInWeekBitMask: WeekBitMask; // 1001001 mask
}

export interface LazyProject extends ProjectCreator {
  uid: string;
  complete: boolean;
  onHold: boolean;
  selfReference: () => DocumentReference;
  owner: () => DocumentReference;
  enrolled: () => CollectionReference;
  taskGroups: () => CollectionReference;
}

export interface Project extends ProjectCreator {
  id: string;
  owner: UserInfo;
  complete: boolean;
  enrolled: UserInfo[];
  onHold: boolean;
}

export interface TaskCreator {
  start?: Date;
  end?: Date;
  parentID?: string;
}

export enum CalendarScale {
  Days,
  Weeks,
  Months,
}

export enum WeekBitMask {
  None,
  Sunday = 1 << 1,
  Monday = 1 << 2,
  Tuesday = 1 << 3,
  Wednesday = 1 << 4,
  Thursday = 1 << 5,
  Friday = 1 << 6,
  Saturday = 1 << 7,
  All = Sunday | Monday | Tuesday | Wednesday | Thursday | Friday | Saturday,
}

type DocumentID = string;

export interface Orderable {
  past?: DocumentID;
  next?: DocumentID;
}

export interface TaskGroupConstructor extends Discussable, WithNotes, WithDocs, WithHistory {
  title: string;
  projectID: ProjectID;
}

export interface TaskGroup extends TaskGroupConstructor {
  id: string;
}

export interface LazyTaskGroup extends TaskGroupConstructor, Orderable {
  uid: string;
  selfReference: () => DocumentReference;
  tasks: () => CollectionReference;
  taskGroups: () => CollectionReference;
}

export interface TaskConstructor extends Discussable, WithNotes, WithDocs, WithHistory {
  title: string;
  progress?: number;
  start?: Date;
  end?: Date;
  project: () => DocumentReference;
  parentGroup: () => DocumentReference;
}

export enum TaskType {
  Task, Milestone,
}

export interface LazyTask extends TaskConstructor {
  uid: string;
  color: Colors<Palette>;
  type: TaskType;
  subtasks: Subtask[];
  selfReference: () => DocumentReference;
  dependsOn?: () => DocumentReference[];
  dependentOn?: () => DocumentReference[];
  assigned: () => CollectionReference;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface Task extends TaskConstructor {
  id: string;
  type: TaskType;
  subtasks: Subtask[];
  dependsOn?: Task;
  dependentOn?: Task;
  assigned: UserInfo[];
}

export interface Subtask {
  title: string;
  id: string;
  completed: boolean;
}

export interface HistorySnapshot {
  performedAction: string;
  changes: string;
  date: Date;
  message?: string;
}

export interface Document {
  previewURL: string;
  docURL: string;
  title: string;
}

export interface Message {
  creator: firebase.User;
  content: string;
}

export interface Discussable {
  comments: Message[];
}

export interface WithNotes {
  notes: Message[];
}

export interface WithDocs {
  documents: Document[];
}

export interface WithHistory {
  history: HistorySnapshot[];
}

export interface Meta {
  path: DocumentReference;
  owner?: LazyUserInfo;
  assigns?: LazyUserInfo[];
  enrolled?: LazyUserInfo[];
}

export interface LGanttProps {
  project: LazyProject;
}

