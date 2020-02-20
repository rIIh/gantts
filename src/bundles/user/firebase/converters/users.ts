import firebase from 'firebase';
import { attachID, FirebaseCloud } from '../../../common/services/firebase';
import { Company, LazyUserInfo, UserInfo } from '../../types';
import {
  CollectionReference,
  CollectionReferencePath,
  DocumentReference,
  DocumentReferencePath,
  LazyCollectionReference,
  LazyReference,
} from '../../../firebase/types';

interface UserInfoSnapshot extends firebase.firestore.DocumentData, firebase.UserInfo {
  company: DocumentReferencePath;
}

interface CompanySnapshot extends firebase.firestore.DocumentData {
  name: string;
  owner: DocumentReferencePath;
  enrolled: CollectionReferencePath;
}

export const UserConverter: firebase.firestore.FirestoreDataConverter<LazyUserInfo> = {
  fromFirestore(snapshot: firebase.firestore.QueryDocumentSnapshot<UserInfoSnapshot>,
      options: firebase.firestore.SnapshotOptions
  ): LazyUserInfo {
    const { company: companyRef, ...raw } = snapshot.data();
    return {
      ...raw, company: new LazyReference<Company>(companyRef.path).withFirestoreConverter(CompanyConverter),
    };
  },
  toFirestore(modelObject: LazyUserInfo): UserInfoSnapshot {
    const { company, ...model } = modelObject;
    return {
      ...model,
      company: {
        path: modelObject.company.Reference.path,
        uid: modelObject.company.Reference.id,
      },
    };
  },
};

export const CompanyConverter: firebase.firestore.FirestoreDataConverter<Company> = {
  fromFirestore(snapshot: firebase.firestore.QueryDocumentSnapshot<CompanySnapshot>,
      options: firebase.firestore.SnapshotOptions
  ): Company {
    const { enrolled, name, owner } = snapshot.data();
    return {
      name,
      uid: snapshot.id,
      owner: new LazyReference<LazyUserInfo>(owner.path).withFirestoreConverter(UserConverter),
      enrolled: new LazyCollectionReference<LazyUserInfo>(enrolled).withFirestoreConverter(UserConverter),
    };
  },
  toFirestore(modelObject: Company): CompanySnapshot {
    const { uid, owner, ...model } = modelObject;
    return {
      ...model,
      owner: owner.toJson(),
      enrolled: modelObject.enrolled.Reference.path,
    };
  },
};
