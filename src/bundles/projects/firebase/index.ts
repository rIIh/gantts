import { DocumentData, DocumentReference, FieldPath, Firestore } from '../../firebase/types';
import { FirestoreApp } from '../../common/services/firebase';
import { CompanyConverter, UserConverter } from '../../user/firebase/converters/users';
import { ProjectConverter, TaskConverter, TaskGroupConverter } from './project_converter';
import { ProjectID, TaskGroupID } from '../types';
import { LazyUserInfo } from '../../user/types';

class ProjectCollections {
  projectsCollection = 'projects';
  enrolledCollection = 'enrolled';
  assignedCollection = 'assigned';
  taskGroupsCollection = 'task_groups';
  tasksCollection = 'tasks';
}

export const projectCollections = new ProjectCollections();

class ProjectReferences extends Firestore {
  projects = FirestoreApp.collection(projectCollections.projectsCollection).withConverter(ProjectConverter);
  ownedProjects = (user: LazyUserInfo) => this.projects.where('owner.uid', '==', user.uid);
  projectEnrolled = (project: ProjectID) => this.projects.doc(project).collection(projectCollections.enrolledCollection).withConverter(UserConverter);
  taskGroups = (project: ProjectID) => this.projects.doc(project).collection(projectCollections.taskGroupsCollection).withConverter(TaskGroupConverter);
  tasks = (project: ProjectID, taskGroup: TaskGroupID) => this.taskGroups(project).doc(taskGroup).collection(projectCollections.tasksCollection).withConverter(TaskConverter);
  assigned = (user: LazyUserInfo) => FirestoreApp.collectionGroup(projectCollections.assignedCollection).where('uid', '==', user.uid);
}

export const projectReferences = new ProjectReferences();
