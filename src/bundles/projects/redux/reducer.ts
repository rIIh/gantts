import { ProjectsState, Project, TaskGroupID, Task } from '../types';
import { ActionType, createReducer } from 'typesafe-actions';
import Immutable from 'immutable';
import projectActions from './actions';

const initialState: ProjectsState = {
  projects: [] as Project[],
  taskGroups: Immutable.Map(),
  tasks: Immutable.Map(),
  isLoading: false,
  isFailed: false,
  message: '',
};
const { setLoading, setFailed, clear, projectsFetched, tasksFetched, created, updated, destroyed } = projectActions;
type RootAction = ActionType<typeof projectActions>;

const projectsReducer = createReducer<ProjectsState, RootAction>(initialState)
  .handleAction(setLoading, (state, { payload: isLoading }) => {
    return { ...state, isLoading, isFailed: isLoading ? false : state.isFailed };
  })
  .handleAction(setFailed, (state, { payload: error }) => {
    return { ...state, isFailed: true, message: error.message };
  })
  .handleAction(clear, (state) => {
    return { ...state, projects: [], taskGroups: Immutable.Map(), tasks: Immutable.Map() };
  })
  .handleAction(projectsFetched, (state, { payload: { projects } }) => {
    return { ...state, projects, isLoading: false };
  })
  .handleAction(tasksFetched, (state, { payload: { projectID, tasks, taskGroups } }) => {
    const taskGroupsCopy = state.taskGroups.set(projectID, taskGroups);
    //@ts-ignore
    const tasksCopy = state.tasks.merge(tasks);
    return { ...state, tasks: tasksCopy, taskGroups: taskGroupsCopy, isLoading: false };
  })
  .handleAction(created, (state, { payload: project }) => {
    return { ...state, projects: [ ...state.projects, project ] };
  })
  .handleAction(updated, (state, { payload: project }) => {
    let projectId = state.projects.findIndex(_project => _project.id === project.id);
    if (projectId < 0) {
      throw new Error(`Project doesn't exists. ID - ${project.id}`);
    }
    let updatedProjects = [...state.projects, project];
    updatedProjects.splice(projectId, 1);
    return { ...state, projects: updatedProjects };
  })
  .handleAction(destroyed, (state, { payload: projectID }) => {
    let projectIndex = state.projects.findIndex(_project => _project.id === projectID);
    if (projectIndex < 0) {
      throw new Error(`Project doesn't exists. ID - ${projectID}`);
    }
    let updatedProjects = [...state.projects];
    updatedProjects.splice(projectIndex, 1);
    return { ...state, projects: updatedProjects };
  })
  ;

export default projectsReducer;