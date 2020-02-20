import React from 'react';
import { Container } from 'react-bootstrap';
import { useCollectionReference } from '../../firebase/hooks/useReference';
import { projectCollections, projectReferences } from '../firebase';
import { useCollection, useDocument } from 'react-firebase-hooks/firestore';
import { useTypedSelector } from '../../../redux/rootReducer';
import { ErrorMessage } from 'formik';
import { Warning } from '../../common/components/Warning';
import { TaskItem } from '../components/tasks/TaskItem';
import { LazyTask } from '../types';
import { LazyReference } from '../../firebase/types';
import _ from 'lodash';
import { TaskConverter } from '../firebase/project_converter';
import { TaskList } from '../components/tasks/TaskList';

const MyTasks: React.FC = () => {
  const { user } = useTypedSelector(state => state.userState);
  const [assignedTo, loading, error] = useCollection(user ? projectReferences.assigned(user) : undefined);
  const taskDocs = _.compact(assignedTo?.docs.map(doc => doc.ref.parent.parent?.withConverter(TaskConverter)));
  
  return <Container className="py-5 page__container flex-grow-1">
    <div>
      <Warning message={ error?.message }/>
      <span style={{ marginRight: '1rem' }}/>
      <TaskList>
        { taskDocs?.map(doc => <TaskItem key={doc.id} task={new LazyReference<LazyTask>(doc)}/>) ?? 'No collection' }
      </TaskList>
    </div>
  </Container>;
};

export default MyTasks;
