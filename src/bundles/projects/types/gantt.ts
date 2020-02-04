import { Task, TaskType, WeekBitMask } from './index';

export enum GanttTreeLevel {
  Project, Group, Atom,
}

export interface GanttTreeConstructor {
  level: GanttTreeLevel;
  type?: TaskType;
  parentID?: string;
  title: string;
  start?: Date;
  end?: Date;
}

export interface GanttTree extends GanttTreeConstructor {
  id?: string;
  subTrees?: GanttTree[];
  dependsOn?: Task;
  dependentOn?: Task;
}

export enum ChangeType {
  AtomCreated, AtomRemoved, AtomUpdated,
  GroupCreated, GroupRemoved, GroupUpdated,
  ProjectUpdated,
}

export interface Change {
  type: ChangeType;
  payload: GanttTree;
}

export interface GanttProps {
  tree: GanttTree;
  weekMask: WeekBitMask;
  start: Date;
  onTreeChanged: (changes: Change, newTree: GanttTree) => void;
}

export enum CalendarScale {
  Days,
  Weeks,
  Months,
}

export interface TaskCreator {
  start?: Date;
  end?: Date;
  parentID?: string;
}
