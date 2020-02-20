import firebase from 'firebase';
import { LazyCollectionReference, LazyReference } from '../../firebase/types';

export interface Company {
  uid: string;
  name: string;
  owner: LazyReference<LazyUserInfo>;
  enrolled: LazyCollectionReference<LazyUserInfo>;
}

export interface ExtraUserInfo {
  company: Company;
}

export type User = firebase.User;
export type UserInfo = firebase.UserInfo & ExtraUserInfo;
export type LazyUserInfo = firebase.UserInfo & { company: LazyReference<Company>; invite?: string };

export interface UserState {
  user: LazyUserInfo | null;
  usersAtCompany: LazyUserInfo[];
  isLoading: boolean;
  isFailed: boolean;
  message: string;
}

export interface AuthData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface Invite {
  inviteID: string;
  companyID: string;
}

export interface SignUpData extends AuthData {
  fullName: string;
  company: string;
  invite?: Invite;
}
