import { FirebaseAuth, FirebaseCloud, FirestoreApp } from '../../common/services/firebase';
import { Dispatch } from 'react';
import { ActionType } from 'typesafe-actions';
import userActions from './actions';
import { AuthData, Company, Invite, LazyUserInfo, SignUpData, UserInfo } from '../types';
import firebase from 'firebase';
import { getUserInfo } from '../lib/helpers';
import { userReferences } from '../firebase';
import { DocumentReference, LazyCollectionReference, LazyReference } from '../../firebase/types';
import { CompanyConverter, UserConverter } from '../firebase/converters/users';
import {CachedQueriesInstance} from "../../firebase/cache";

const Persistence = firebase.auth.Auth.Persistence;
type RootDispatch = Dispatch<ActionType<typeof userActions>>;

export const authenticateThunk = (authData: AuthData) => {
  return async (dispatch: RootDispatch) => {
    dispatch(userActions.authenticate.request());
    try {
      await FirebaseAuth.setPersistence(authData.rememberMe ? 
        Persistence.LOCAL : Persistence.SESSION);
      const { user } = await FirebaseAuth.signInWithEmailAndPassword(authData.email, authData.password);
      // @ts-ignore
      dispatch(initUser(user));
    } catch(e) {
      dispatch(userActions.authenticate.failure(e));
    }
  };
};

export const reinit = () => {
  return initUser(firebase.auth().currentUser);
};

export const initUser = (user: firebase.User | null) => {
  return async (dispatch: RootDispatch) => {
    dispatch(userActions.authenticate.request());
    console.log('Initing user', user);
    if (!user) {
      dispatch(userActions.authenticate.success({ user: null }));
      dispatch(userActions.usersAtCompany([]));
    } else {
      try {

        const _userInfo = (await userReferences.users.doc(user.uid).get()).data();
        if (_userInfo) {
          dispatch(userActions.authenticate.success({ user: _userInfo }));
          // const _usersAtCompany = (await userReferences.users.where('company.uid', '==', _userInfo.company.Reference.id).get()).docs.map(doc => doc.data());
          console.log('Getting enrolled');
          const enrolled = await (await _userInfo.company.Value).enrolled.Value;
          console.log('Got enrolled', enrolled);
          if (enrolled && enrolled.length > 0) {
            const _usersAtCompany = (await userReferences.users.where('uid', 'in', enrolled.map(user => user.uid)).get()).docs.map(doc => doc.data());
            dispatch(userActions.usersAtCompany(_usersAtCompany));
          }
          console.log('Users at company fetched');
        }
      } catch (e) {
        console.warn(e);
        dispatch(userActions.authenticate.failure(e));
      }
    }
  };
};

export const signUpThunk = ({ email, password, fullName, company: companyName, rememberMe, invite }: SignUpData) => {
  return async (dispatch: Dispatch<ActionType<typeof userActions>>) => {
    dispatch(userActions.authenticate.request());
    console.log('Signing up');
    try {
      await FirebaseAuth.setPersistence(Persistence.SESSION);
      const { user } = await FirebaseAuth
        .createUserWithEmailAndPassword(email, password);
      if (user) {
        console.log('Ready');
        await user.updateProfile({
          displayName: fullName,
        });
        console.log('Company resolve');
        let companyRef: DocumentReference;
        if (!invite) {
          console.log('Not invite');
          let companyDoc = userReferences.companies.doc();
          let company: Company = {
            name: companyName,
            uid: companyDoc.id,
            owner: new LazyReference<LazyUserInfo>(userReferences.users.doc(user.uid)).withFirestoreConverter(UserConverter),
            enrolled: new LazyCollectionReference<LazyUserInfo>(userReferences.companyEnrolled(companyDoc.id)),
          };
          await companyDoc.set(company);
          await company.enrolled.Reference.doc(user.uid).set({ ...getUserInfo(user), company: new LazyReference<Company>(companyDoc).withFirestoreConverter(CompanyConverter) });
          companyRef = companyDoc;
        } else {
          console.log('Invite');
          companyRef = userReferences.companies.doc(invite.companyID);
        }
        const userInfo = { ...getUserInfo(user), company: new LazyReference<Company>(companyRef).withFirestoreConverter(CompanyConverter) };
        await userReferences.users.doc(user.uid).set(userInfo);
        console.log('User', userInfo);
        dispatch(userActions.authenticate.success({ user: userInfo }));
        if (invite) {
          // @ts-ignore
          dispatch(acceptInvite(userInfo, invite));
        }
        // @ts-ignore
        dispatch(reinit());
      } else {
        throw new Error('Something goes wrong during sign up');
      }
    } catch(e) {
      firebase.auth().currentUser?.delete();
      dispatch(userActions.authenticate.failure(e));
    }
  };
};

export const logoutThunk = () => {
  return async (dispatch: Dispatch<ActionType<typeof userActions>>) => {
    dispatch(userActions.logOut.request());
    try {
      CachedQueriesInstance.clear();
      console.log(CachedQueriesInstance);
      await FirebaseAuth.signOut();
      dispatch(userActions.logOut.success());
      console.log('logged out');
    } catch(e) {
      dispatch(userActions.logOut.failure(e));
      console.log('logout failed');
    }
  };
};

export const acceptInvite = (user: LazyUserInfo, invite: Invite) => {
  return async (dispatch: RootDispatch) => {
    console.log('Accepting');
    try {
      await userReferences.companyEnrolled(invite.companyID).doc(user.uid).set({ ...user, invite: invite.inviteID });
      await userReferences.companyInvites(invite.companyID).doc(invite.inviteID).update({ accepted: true });
      const company = await user.company.Value;
      if (company.uid !== invite.companyID) {
        userReferences.users.doc(user.uid).update({ company: new LazyReference<Company>(userReferences.companies.doc(invite.companyID)).toJson() });
      }
      console.log('Invite successfully accepted');
      // @ts-ignore
      dispatch(reinit());
    } catch (e) {
      dispatch(userActions.authenticate.failure(e));
    }
  };
};
