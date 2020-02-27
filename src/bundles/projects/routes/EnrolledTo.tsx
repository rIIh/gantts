import React, {useMemo} from 'react';
import { Container } from 'react-bootstrap';
import { useCollectionReference } from '../../firebase/hooks/useReference';
import { projectCollections, projectReferences } from '../firebase';
import { useCollection, useDocument } from 'react-firebase-hooks/firestore';
import { useTypedSelector } from '../../../redux/rootReducer';
import { ErrorMessage } from 'formik';
import { Warning } from '../../common/components/Warning';
import { TaskItem } from '../components/tasks/TaskItem';
import { LazyTask } from '../types';
import { FieldPath, LazyReference } from '../../firebase/types';
import _ from 'lodash';
import { ProjectConverter, TaskConverter } from '../firebase/project_converter';
import { TaskList } from '../components/tasks/TaskList';
import ProjectLink from '../components/ProjectLink';
import {ProjectList} from '../components/list/ProjectList';

const EnrolledTo: React.FC = () => {
  const { user } = useTypedSelector(state => state.userState);
  const [enrolledTo] = useCollection(user ? projectReferences.enrolled(user) : undefined);
  const projectDocs = useMemo(() => _.compact(enrolledTo?.docs.map(doc => doc.ref.parent.parent?.withConverter(ProjectConverter))), [enrolledTo]);

  console.log(user);
  return <Container className="py-5 page__container flex-grow-1">
    <div>
      <span style={{ marginRight: '1rem' }}/>
      { projectDocs.map(doc => <ProjectList key={doc.id} doc={doc}/> )}
    </div>
  </Container>;
};

export default EnrolledTo;
