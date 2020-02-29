import React, { useMemo } from 'react';
import { Container } from 'react-bootstrap';
import { projectCollections, projectReferences } from '../firebase';
import { useCollection, useDocument } from 'react-firebase-hooks/firestore';
import { useTypedSelector } from '../../../redux/rootReducer';
import _ from 'lodash';
import { ProjectConverter, TaskConverter } from '../firebase/project_converter';
import { ProjectList } from '../components/list/ProjectList';

const EnrolledTo: React.FC = () => {
  const { user } = useTypedSelector(state => state.userState);
  const [enrolledTo] = useCollection(user ? projectReferences.enrolled(user) : undefined);
  const projectDocs = useMemo(() => _.compact(enrolledTo?.docs.map(doc => doc.ref.parent.parent?.withConverter(ProjectConverter))), [enrolledTo]);

  console.log(user);
  return <Container className="py-5 page__container flex-grow-1" fluid style={{ overflow: 'auto' }}>
    <div>
      <span style={{ marginRight: '1rem' }}/>
      { projectDocs.map(doc => <ProjectList key={doc.id} doc={doc}/> )}
    </div>
  </Container>;
};

export default EnrolledTo;
