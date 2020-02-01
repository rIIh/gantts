import { createAsyncAction, createAction } from 'typesafe-actions';
import { Project, Task, ProjectID, TaskGroupID } from '../types';
import Immutable from 'immutable';
import { TaskGroup } from '../types/index';

const projectActions = {
  setLoading: createAction('Set_Loading')<boolean>(),
  setFailed: createAction('Set_Failed')<Error>(),
  clear: createAction('Clear_Projects_State')<void>(),
  projectsFetched: createAction('Projects_Fetched')<{ projects: Project[] }>(),
  tasksFetched: createAction('Tasks_Fetched')<{ projectID: ProjectID; taskGroups: TaskGroup[]; tasks: Immutable.Map<TaskGroupID, Task[]> }>(),
  created: createAction('Project_Created')<Project>(),
  updated: createAction('Project_Updated')<Project>(),
  destroyed: createAction('Project_Destroyed')<string>(),
};

export default projectActions;