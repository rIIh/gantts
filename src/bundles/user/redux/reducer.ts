import { FirebaseAuth } from '../../common/services/firebase';
import { ActionType, createReducer } from 'typesafe-actions';
import userActions from './actions';
import { UserState } from '../types';

const initialState: UserState = {
  user: null,
  usersAtCompany: [],
  isLoading: false,
  isFailed: false,
  message: '',
};
const { authenticate, logOut, setUser, usersAtCompany } = userActions;
type RootAction = ActionType<typeof userActions>;

const userReducer = createReducer<UserState, RootAction>(initialState)
  .handleAction(setUser, (state, { payload: user }) => {
    return { ...state, user };
  })
  .handleAction([authenticate.request, logOut.request], (state) => {
    return { ...state, isLoading: true, isFailed: false }; 
  })
  .handleAction(usersAtCompany, (state, action) => {
    return { ...state, usersAtCompany: action.payload };
  })
  .handleAction(authenticate.success, (state, action) => {
    return { ...state, isLoading: false, user: action.payload.user }; 
  })
  .handleAction([authenticate.failure, logOut.failure], (state, action) => {
    return { ...state, isLoading: false, isFailed: true, message: action.payload.message }; 
  })
  .handleAction(logOut.success, (state) => {
    return { ...state, isLoading: false, user: null, usersAtCompany: [] };
  });

export default userReducer;
