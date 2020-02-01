import { createAsyncAction, createAction } from 'typesafe-actions';

const userActions = {
  authenticate: createAsyncAction(
    'Authenticate_User_Request', 'Authenticate_User_Success', 'Authenticate_User_Failed'
    )<void, { user: firebase.User | null }, Error>(),
  logOut: createAsyncAction(
    'Logout_Request','Logout_Success','Logout_Failed'
    )<void, void, Error>(),
  setUser: createAction('Firebase_Reset')<firebase.User>(),
};

export default userActions;