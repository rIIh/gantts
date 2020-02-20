import { createAsyncAction, createAction } from 'typesafe-actions';
import { LazyUserInfo, User, UserInfo } from '../types';

const userActions = {
  authenticate: createAsyncAction(
    'Authenticate_User_Request', 'Authenticate_User_Success', 'Authenticate_User_Failed'
    )<void, { user: LazyUserInfo | null }, Error>(),
  usersAtCompany: createAction('Users_At_Company_Fetched')<LazyUserInfo[]>(),
  logOut: createAsyncAction(
    'Logout_Request','Logout_Success','Logout_Failed'
    )<void, void, Error>(),
  setUser: createAction('Firebase_Reset')<LazyUserInfo>(),
};

export default userActions;
