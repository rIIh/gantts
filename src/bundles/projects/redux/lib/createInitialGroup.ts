import _ from 'lodash';
import { LazyProject, LazyTaskGroup } from '../../types';
import { documents, projectCollections, projectReferences } from '../../firebase';
import { TaskConverter, TaskGroupConverter } from '../../firebase/project_converter';
import { CollectionReference } from '../../../firebase/types';

export const createInitialGroup = _.debounce(function(root: { taskGroups: () => CollectionReference; uid: string }) {
  const doc = root.taskGroups().doc();
  const initialGroup: LazyTaskGroup = {
    uid: doc.id,
    projectID: root.uid,
    title: 'First Task Group',
    selfReference: () => doc,
    tasks: () => projectReferences.tasks(root.uid, doc.id).withConverter(TaskConverter),
    taskGroups: () => doc.collection(projectCollections.taskGroupsCollection).withConverter(TaskGroupConverter),
    comments: [],
    documents: [],
    history: [],
    note: '',
  };
  doc.set(initialGroup);
}, 1000);
