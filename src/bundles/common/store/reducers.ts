import { ActionType, createReducer } from 'typesafe-actions';
import { AppState, initialState } from './index';
import { appActions } from './actions';
import projectActions from '../../projects/redux/actions';

type RootAction = ActionType<typeof appActions>;
const appReducer = createReducer<AppState, RootAction>(initialState)
    .handleAction(appActions.setBusy, (state, { payload: { isBusy } }) => {
      return { ...state, isBusy };
    });

export default appReducer;
