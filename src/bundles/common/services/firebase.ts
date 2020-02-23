import firebase from 'firebase';
import { TaskGroupID, ProjectID } from '../../projects/types';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGE_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

const FirebaseInstance = firebase.initializeApp(firebaseConfig);
export const FirebaseAuth = FirebaseInstance.auth();
export const FirestoreApp = FirebaseInstance.firestore();
export const FireStorage = FirebaseInstance.storage();

export function attachID<Return, Snapshot = Return>(document: firebase.firestore.DocumentSnapshot<Snapshot>) {
  return { ...document.data(), uid: document.id } as unknown as Return;
}

export class FirebaseCloud {
  static root = FirestoreApp;
  static projects = FirestoreApp.collection('projects');
  static projectInvites = (projectID: ProjectID) => FirebaseCloud.projects.doc(projectID).collection('invites');
  static companies = FirestoreApp.collection('companies');
  static companyInvites = (companyID: string) =>  FirestoreApp.collection('companies').doc(companyID).collection('invites');
  static taskGroups = (projectID: ProjectID) => FirestoreApp.collection(`/projects/${projectID}/task_groups`);
  static tasks = (projectID: ProjectID, taskGroupID: TaskGroupID) =>
    FirestoreApp.collection(`/projects/${projectID}/task_groups/${taskGroupID}/tasks`);
  // static taskGroups = (projectID: string) => _FirebaseCloud.collectionGroup('task_groups').where('projectID', '==', projectID);
  // static tasks = (taskGroupID: TaskGroupID) => _FirebaseCloud.collectionGroup('tasks').where('parentGroupID', '==', taskGroupID);
  // static taskGroups = (projectID: string) => _FirebaseCloud.collectionGroup('task_groups').where('').collection('tasks_groups');
  static users = FirestoreApp.collection('users');
}

FirebaseAuth.onAuthStateChanged(user => {
  console.log('Firebase: Auth state changed');
  if (user) {
    localStorage.setItem('myPage.expectSignIn', '1');
  } else {
    localStorage.removeItem('myPage.expectSignIn');
  }
});

window.addEventListener('close', () => {
  localStorage.getItem('');
});

export const expectSignIn = () => localStorage.getItem('myPage.expectSignIn') !== null;
