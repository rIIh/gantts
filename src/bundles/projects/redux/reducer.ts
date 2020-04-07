import { ProjectsState } from '../types';
import { ActionType, createReducer } from 'typesafe-actions';
import Immutable from 'immutable';
import projectActions from './actions';
import { sortOrderable } from '../components/gantt/helpers';
import _ from 'lodash';

const initialState: ProjectsState = {
  documents: Immutable.Map(),
  attachedProjects: Immutable.Map(),
  groups: Immutable.Map(),
  tasks: Immutable.Map(),
  calculatedProperties: Immutable.Map(),
  isLoading: false,
};
const { groupsChanged, tasksChanged, failed, loading, disposerCreated, calculatedPropertiesUpdate, calculatedPropertiesUpdateBatch, clear } = projectActions;
type RootAction = ActionType<typeof projectActions>;

const projectsReducer = createReducer<ProjectsState, RootAction>(initialState)
    .handleAction(groupsChanged, ({ groups: lastGroups, ...state }, { payload: { parent, groups }}) => {
      const result = sortOrderable(groups, g => g.uid);
      return { ...state, isFailed: undefined, groups: lastGroups.set(parent, result) };
    })
    .handleAction(calculatedPropertiesUpdate, (state, { payload: { key, value } }) => {
      const lastValue = state.calculatedProperties.get(key);
      return { ...state, calculatedProperties: state.calculatedProperties.set(key, { progress: 0, ...lastValue, ...value } ) };
    })
    .handleAction(calculatedPropertiesUpdateBatch, (state, { payload }) => {
      let currentState = state.calculatedProperties;
      for (let [key, value] of _.entries(payload)) {
        currentState = currentState.update(key, lastValue => ({ ...lastValue, ...value }));
      }
      return { ...state, calculatedProperties: currentState };
    })
    .handleAction(tasksChanged, ({ tasks: lastTasks, ...state }, { payload: { parent, tasks }}) => {
      return { ...state, isFailed: undefined, tasks: lastTasks.set(parent, tasks) };
    })
    .handleAction(failed, (state, { payload: { error } }) => {
      return { ...state, isFailed: error };
    })
    .handleAction(loading, (lastState, { payload: { state } }) => {
      return { ...lastState, isFailed: undefined, isLoading: state };
    })
    .handleAction(disposerCreated, (state, { payload: { project, disposer } }) => {
      return { ...state, attachedProjects: state.attachedProjects.set(project, [...state.attachedProjects.get(project) ?? [], disposer]) };
    })
    .handleAction(clear, (state) => {
      state.attachedProjects.forEach(disposers => disposers.forEach(disposer => disposer()));
      return { ...state, attachedProjects: state.attachedProjects.clear(), groups: state.groups.clear(), tasks: state.tasks.clear(), calculatedProperties: state.calculatedProperties.clear() };
    })
  ;

export default projectsReducer;
