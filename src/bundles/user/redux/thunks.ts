import { FirebaseAuth, FirebaseCloud } from './../../common/services/firebase';
import { Dispatch } from 'react';
import { ActionType } from 'typesafe-actions';
import userActions from './actions';
import { AuthData, SignUpData } from '../types';
import firebase from 'firebase';
import { getUserInfo } from '../lib/helpers';

const Persistence = firebase.auth.Auth.Persistence;

export const authenticateThunk = (authData: AuthData) => {
  return async (dispatch: Dispatch<ActionType<typeof userActions>>) => {
    dispatch(userActions.authenticate.request());
    try {
      await FirebaseAuth.setPersistence(authData.rememberMe ? 
        Persistence.LOCAL : Persistence.SESSION);
      const { user } = await FirebaseAuth.signInWithEmailAndPassword(authData.email, authData.password);
      dispatch(userActions.authenticate.success({ user }));
    } catch(e) {
      dispatch(userActions.authenticate.failure(e));
    }
  };
};

export const signUpThunk = ({ email, password, fullName, company }: SignUpData) => {
  return async (dispatch: Dispatch<ActionType<typeof userActions>>) => {
    dispatch(userActions.authenticate.request());
    try {
      // const { user } = await FirebaseAuth.signInWithEmailAndPassword(authData.email, authData.password);
      const { user } = await FirebaseAuth
        .createUserWithEmailAndPassword(email, password);
      if (user) {
        await user.sendEmailVerification();
        await user.updateProfile({
          displayName: fullName,
        });
        await FirebaseCloud.users.doc(user.uid).set({ ...getUserInfo(user), company });
        dispatch(userActions.authenticate.success({ user }));
      } else {
        throw new Error('Something goes wrong during sign up');
      }
    } catch(e) {
      dispatch(userActions.authenticate.failure(e));
    }
  };
};

export const logoutThunk = () => {
  return async (dispatch: Dispatch<ActionType<typeof userActions>>) => {
    dispatch(userActions.logOut.request());
    try {
      await FirebaseAuth.signOut();
      dispatch(userActions.logOut.success());
      console.log('logged out');
    } catch(e) {
      dispatch(userActions.logOut.failure(e));
      console.log('logout failed');
    }
  };
};