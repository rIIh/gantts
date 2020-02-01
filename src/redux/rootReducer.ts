import { combineReducers } from 'redux';
import commonReducer from '../bundles/common/store/reducers';
import userReducer from '../bundles/user/redux/reducer';
import { useSelector, TypedUseSelectorHook } from 'react-redux';
import { History } from 'history';
import { connectRouter, RouterState } from 'connected-react-router';
import { UserState } from '../bundles/user/types';
import projectsReducer from '../bundles/projects/redux/reducer';
import { ProjectsState } from '../bundles/projects/types/index';

export interface ApplicationState {
  common: null;
  userState: UserState;
  projectsState: ProjectsState;
  router: RouterState;
}

const createRootReducer = (history: History) => combineReducers({
  common: commonReducer,
  userState: userReducer,
  projectsState: projectsReducer,
  router: connectRouter(history),
});

export const useTypedSelector: TypedUseSelectorHook<ApplicationState> = useSelector;

export default createRootReducer;