import { createAction } from 'typesafe-actions';
import { TaskGroup, Task, SharedState, RemoteDocument } from '../types';

const projectActions = {
  documentsReloaded: createAction('Docs_Fetched')<{ key: string; value: RemoteDocument[] }>(),
  calculatedPropertiesUpdate: createAction('Recalculated')<{ key: string; value: Partial<SharedState> }>(),
  calculatedPropertiesUpdateBatch: createAction('Recalculated_Batch')<{ [key: string]: Partial<SharedState> }>(),
  disposerCreated: createAction('Disposer_Created')<{ project: string; disposer: () => void }>(),
  groupsChanged: createAction('New_Groups_Fetched')<{ parent: string; groups: TaskGroup[] }>(),
  tasksChanged: createAction('New_Tasks_Fetched')<{ parent: string; tasks: Task[] }>(),
  loading: createAction('Loading_Changed')<{ state: boolean }>(),
  failed: createAction('Failed_Changed')<{ error?: Error }>(),
  clear: createAction('Clear_Projects_State')(),
};

export default projectActions;
