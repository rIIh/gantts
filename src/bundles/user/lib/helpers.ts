import firebase from 'firebase';
import _ from 'lodash';

export const getUserInfo = (user: firebase.User): firebase.UserInfo => {
  const userInfo: firebase.UserInfo = {
    displayName: '',
    email: '',
    phoneNumber: '',
    photoURL: '',
    providerId: '',
    uid: '',
  }; 

  return Object.assign({}, _.pick(user, _.keys(userInfo))) as firebase.UserInfo;
};