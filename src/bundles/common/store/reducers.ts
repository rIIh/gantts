import { ActionType, createReducer } from 'typesafe-actions';
import { AppState, initialState } from './index';
import { appActions } from './actions';
import projectActions from '../../projects/redux/actions';

type RootAction = ActionType<typeof appActions>;
const appReducer = createReducer<AppState, RootAction>(initialState);

export default appReducer;
