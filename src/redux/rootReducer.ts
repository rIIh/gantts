import { combineReducers } from 'redux';
import appReducer from '../bundles/common/store/reducers';
import userReducer from '../bundles/user/redux/reducer';
import { useSelector, TypedUseSelectorHook } from 'react-redux';
import { History } from 'history';
import { connectRouter, RouterState } from 'connected-react-router';
import { UserState } from '../bundles/user/types';
import projectsReducer from '../bundles/projects/redux/reducer';
import { ProjectsState } from '../bundles/projects/types/index';
import { AppState } from '../bundles/common/store';

export interface ApplicationState {
  app: AppState;
  userState: UserState;
  projectsState: ProjectsState;
  router: RouterState;
}

const createRootReducer = (history: History) => combineReducers({
  app: appReducer,
  userState: userReducer,
  projectsState: projectsReducer,
  router: connectRouter(history),
});

export const useTypedSelector: TypedUseSelectorHook<ApplicationState> = useSelector;

export default createRootReducer;
