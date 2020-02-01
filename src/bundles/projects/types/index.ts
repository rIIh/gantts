import { User } from '../../user/types';
import Immutable from 'immutable';

export type ProjectID = string;
export type TaskGroupID = string;

export interface ProjectsState {
  projects: Project[];
  taskGroups: Immutable.Map<ProjectID, TaskGroup[]>;
  tasks: Immutable.Map<TaskGroupID, Task[]>;
  isLoading: boolean;
  isFailed: boolean;
  message: string;
}

export interface ProjectCreator {
  title: string;
  startDate: Date;
  daysInWeekBitMask: WeekBitMask; // 1001001 mask
}

export interface Project extends ProjectCreator {
  id: string;
  owner: firebase.UserInfo;
  complete: boolean;
  enrolled: firebase.UserInfo[];
  onHold: boolean;
}

export enum WeekBitMask {
  None,
  Sunday    = 1 << 1,
  Monday    = 1 << 2,
  Tuesday   = 1 << 3,
  Wednesday = 1 << 4,
  Thursday  = 1 << 5,
  Friday    = 1 << 6,
  Saturday  = 1 << 7,
}

export interface TaskGroupCreator extends Discussable, WithNotes, WithDocs, WithHistory {
  title: string;
  projectID: ProjectID;
}

export interface TaskGroup extends TaskGroupCreator {
  id: string;
}

export interface TaskConstructor extends Discussable, WithNotes, WithDocs, WithHistory {
  title: string;
  progress: number;
  start: Date;
  end: Date;
  projectID: ProjectID;
  parentGroupID: TaskGroupID;
}

export interface Task extends TaskConstructor {
  id: string;
  subtasks: Subtask[];
  dependsOn?: Task;
  dependentOn?: Task;
  assigned: firebase.User[];
}

export interface Subtask {
  title: string;
  completed: boolean;
}

export interface Milestone extends Discussable, WithNotes, WithDocs, WithHistory {
  date: Date;
  title: string;
  achieved: boolean;
  assigned: firebase.User[];
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