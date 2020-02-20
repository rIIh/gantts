import { createAsyncAction, createAction } from 'typesafe-actions';
import { Project, Task, ProjectID, TaskGroupID, LazyProject } from '../types';

const projectActions = {
  setLoading: createAction('Set_Loading')<boolean>(),
  setFailed: createAction('Set_Failed')<Error>(),
  clear: createAction('Clear_Projects_State')<void>(),
  projectsFetched: createAction('Projects_Fetched')<{ projects: LazyProject[] }>(),
  created: createAction('Project_Created')<LazyProject>(),
  updated: createAction('Project_Updated')<LazyProject>(),
  destroyed: createAction('Project_Destroyed')<string>(),
};

export default projectActions;
