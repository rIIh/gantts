import { Firestore } from '../../firebase/types';
import { FirestoreApp } from '../../common/services/firebase';
import firebase from 'firebase';
import { CompanyConverter, UserConverter } from './converters/users';

class UserReferences extends Firestore {
  users = FirestoreApp.collection('users').withConverter(UserConverter);
  companies = FirestoreApp.collection('companies').withConverter(CompanyConverter);
  companyEnrolled = (company: string) => this.companies.doc(company).collection('enrolled').withConverter(UserConverter);
  companyInvites = (company: string) => this.companies.doc(company).collection('invites');
}

export const userReferences = new UserReferences();
