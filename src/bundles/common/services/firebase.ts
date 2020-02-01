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
const _FirebaseCloud = FirebaseInstance.firestore();
export class FirebaseCloud {
  static root = _FirebaseCloud;
  static projects = _FirebaseCloud.collection('projects');
  static taskGroups = (projectID: ProjectID) => _FirebaseCloud.collection(`/projects/${projectID}/task_groups`);
  static tasks = (projectID: ProjectID, taskGroupID: TaskGroupID) => 
    _FirebaseCloud.collection(`/projects/${projectID}/task_groups/${taskGroupID}/tasks`);
  // static taskGroups = (projectID: string) => _FirebaseCloud.collectionGroup('task_groups').where('projectID', '==', projectID);
  // static tasks = (taskGroupID: TaskGroupID) => _FirebaseCloud.collectionGroup('tasks').where('parentGroupID', '==', taskGroupID);
  // static taskGroups = (projectID: string) => _FirebaseCloud.collectionGroup('task_groups').where('').collection('tasks_groups');
  static users = _FirebaseCloud.collection('users');
}

FirebaseAuth.onAuthStateChanged(user => {
  console.log('auth state changed');
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
