import { ActionType, createReducer } from 'typesafe-actions';
import { AppState, initialState } from './index';
import { appActions } from './actions';
import projectActions from '../../projects/redux/actions';

const { setActiveModal, hideActiveModal } = appActions;
type RootAction = ActionType<typeof appActions>;
const appReducer = createReducer<AppState, RootAction>(initialState)
    .handleAction(setActiveModal, (state, payload) => {
      return { ...state, activeModal: payload.payload, past: state.past.push(state.activeModal) };
    })
    .handleAction(hideActiveModal, (state) => {
      return { ...state, activeModal: state.past.peek() ?? null, past: state.past.shift() };
    });

export default appReducer;
