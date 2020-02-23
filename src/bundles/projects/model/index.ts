import {
  Discussable, HistorySnapshot,
  LazyProject,
  LazyTask,
  LazyTaskGroup, Message,
  ProjectCreator,
  ProjectID,
  WeekBitMask,
  WithDocs,
  WithHistory,
  WithNotes
} from '../types';
// import { Map } from 'immutable';
import { CollectionReference, DocumentReference } from '../../firebase/types';
import { LazyUserInfo } from '../../user/types';

// export class Project extends ProjectCreator {
//   uid: string;
//   complete: boolean = false;
//   onHold: boolean = false;
//   selfReference: Promise<DocumentReference>;
//   owner: Promise<LazyUserInfo>;
//   enrolled: () => CollectionReference;
//   taskGroups: () => CollectionReference;
// }

// export class Project implements Discussable, WithNotes, WithDocs, WithHistory {
//   title: string;
//   startDate: Date;
//   daysInWeekBitMask: WeekBitMask; // 1001001 mask
//   uid: string;
//   complete: boolean;
//   onHold: boolean;
//   owner: () => DocumentReference;
//   enrolled: () => CollectionReference;
//   taskGroups: () => CollectionReference;
//   documents: Document[];
//   history: HistorySnapshot[];
//   notes: Message[];
//   comments: Message[];
//
//   constructor(title: string, start: Date, uid: string, complete: boolean, onHold: boolean, owner: string, enrolled: string[], taskGroups: TaskGroup[]) {
//
//   }
// }
//
// export class TaskGroup extends Discussable, WithNotes, WithDocs, WithHistory {
//   title: string;
//   projectID: ProjectID;
//   uid: string;
//   selfReference: () => DocumentReference;
//   tasks: () => CollectionReference;
//   taskGroups: () => CollectionReference;
// }
//
// export class ProjectsCache {
//   const projects: Map<string, LazyProject>
//   get(id: string) {
//     return new Promise()
//   }
// }
// export const t = 0;
