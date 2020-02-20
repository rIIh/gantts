import React, { useCallback, useEffect, useState } from 'react';
import { useTypedSelector } from '../../../redux/rootReducer';
import { useReference } from '../../firebase/hooks/useReference';
import { Button, FormControl, InputGroup, Modal } from 'react-bootstrap';
import AssignForm from '../../projects/components/forms/AssignForm';
import cuid from 'cuid';
import { userReferences } from '../firebase';
import styled from 'styled-components';
import _ from 'lodash';

interface CompanyInviteProps {
  show: boolean;
  onHide: () => void;
}

const ClickToCopy = styled.div<{ copied?: boolean; tip?: boolean }>`
  overflow: hidden;
  display: flex;
  position: absolute;
  height: 100%;
  width: 100%;
  align-items: center;
  font-size: 0.9em;
  cursor: pointer;
  
  &::before {
    opacity: ${props => props.tip ? 1 : 0};
    content: '${props => !props.copied ? 'click to copy' : 'copied'}';
    position: absolute;
    bottom: 0;
    left: 0;
    font-size: 0.7em;
  }
`;

const CompanyInvite: React.FC<CompanyInviteProps> = ({ show, onHide }) => {
  const { user } = useTypedSelector(state => state.userState);
  const [company, failed] = useReference(user?.company);
  
  const [inviteLink, setInviteLink] = useState('');
  
  const createInviteLink = () => {
    const invite = cuid();
    userReferences.companies.doc(company?.uid).collection('invites').doc(invite).set({});
    setInviteLink(`${window.location.origin}/signup/${invite}/${company?.uid}`);
  };
  
  const [copied, setCopied] = useState(false);
  useEffect(() => setCopied(false), [inviteLink]);
  const copy = useCallback(() => {
    const textarea = document.createElement('textarea');
    if (!inviteLink) {
      return;
    }
    textarea.value = inviteLink;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
    setCopied(true);
  }, [inviteLink]);
  
  
  return <Modal show={show} onHide={onHide}>
    <Modal.Header closeButton>
      <Modal.Title>Company invite</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <InputGroup className="mb-3">
        <InputGroup.Prepend className="flex-grow-1">
          <ClickToCopy tip={!_.isEmpty(inviteLink)} copied={copied} onClick={copy}>{ !_.isEmpty(inviteLink) ? inviteLink : 'Generate invite link' }</ClickToCopy>
        </InputGroup.Prepend>
        <InputGroup.Append>
          <Button variant="primary" onClick={createInviteLink}>Generate</Button>
        </InputGroup.Append>
      </InputGroup>
    </Modal.Body>
  </Modal>;
};

export default CompanyInvite;
