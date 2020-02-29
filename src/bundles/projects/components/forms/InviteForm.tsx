import React, { useCallback, useEffect, useState } from 'react';
import { Button, Modal, ModalProps } from 'react-bootstrap';
import { LazyProject } from '../../types';
import { useTypedSelector } from '../../../../redux/rootReducer';
import { UserPic } from '../../../user/components/UserPic';
import { LazyUserInfo } from '../../../user/types';
import { UsersRow } from '../../../user/routes/AccountSettings';
import { useCollectionReference, useReference } from '../../../firebase/hooks/useReference';
import { LazyReference } from '../../../firebase/types';
import { useDispatch } from 'react-redux';
import { appActions } from '../../../common/store/actions';
import { projectReferences } from '../../firebase';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import { useSimpleCollection } from '../../../firebase/hooks/useSimpleReference';
import { AssignModalProps } from './AssignForm';
import { useModal } from '../../../common/modal/context';
import { useHistory } from 'react-router';

interface Props {
  project: LazyProject;
}

export const InviteModal: React.FC<Props> = ({ project }) => {
  const { usersAtCompany } = useTypedSelector(state => state.userState);
  const [enrolled] = useSimpleCollection<LazyUserInfo>(project.enrolled());
  const history = useHistory();
  const { hideModal } = useModal();
  
  const invite = useCallback(async (user: LazyUserInfo) => {
    await projectReferences.projectEnrolled(project.uid).doc(user.uid).set(user);
  }, [project]);
  
  return <>
    <Modal.Header closeButton>
      <Modal.Title>Invite people</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <UsersRow>
        { usersAtCompany.filter(user => !(enrolled?.some(enrolledUser => enrolledUser.uid == user.uid))).map(user => (
            <UserPic withTooltip clickable key={user.uid} userID={user.uid} onClick={() => invite(user)}/>
        ))}
      </UsersRow>
    </Modal.Body>
    <Modal.Footer>
      <Button variant="link" onClick={() => history.push('/account/company')}>
        Enroll users
      </Button>
      <Button variant="primary" onClick={hideModal}>
        Close
      </Button>
    </Modal.Footer>
  </>;
};
