import React from 'react';
import styled from 'styled-components';
import { LazyUserInfo, UserInfo } from '../types';
import { OverlayTrigger, Tooltip, Spinner } from 'react-bootstrap';
import { useSimpleReference } from '../../firebase/hooks/useSimpleReference';
import { projectCollections } from '../../projects/firebase';
import { userReferences } from '../firebase';
import { useTypedSelector } from '../../../redux/rootReducer';

interface Props {
  userID: string;
  size?: number;
  clickable?: boolean;
  withTooltip?: boolean;
  onClick?: (user: LazyUserInfo) => void;
}

interface AvatarProps {
  size: number;
}

export const Avatar = styled.div<AvatarProps>`
  display: flex;
  justify-content: center;
  align-items: center;
  width: ${({ size }) => `${size}px`};
  height: ${({ size }) => `${size}px`};
  border-radius: ${({ size }) => `${size / 2}px`};
  overflow: hidden;
  
  > img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

export const UserPic: React.FC<Props> = ({
  userID,
  size,
  clickable,
  withTooltip,
  onClick }) => {
  const [user] = useSimpleReference<LazyUserInfo>(userReferences.users.doc(userID));
  if (!user) { return <Spinner animation="border" />; }
  const element = withTooltip ? (
      <OverlayTrigger placement="bottom" overlay={(props: any) => <Tooltip {...props} show={props.show.toString()} id={`${user.uid}_tooltip`}>{ user.displayName }</Tooltip>}>
        <Avatar onClick={() => onClick?.(user)} size={size ?? 32}>
          <img src={user.photoURL ?? 'https://picsum.photos/400'} alt="user avatar"/>
        </Avatar>
      </OverlayTrigger>
  ): (
      <Avatar size={size ?? 32}>
        <img src={user.photoURL ?? 'https://picsum.photos/400'} alt="user avatar"/>
      </Avatar>
  );
  return <div style={{ cursor: clickable ? 'pointer' : undefined, height: `${size ?? 32}px`, width: `${size ?? 32}px` }}>
    { element }
  </div>;
};

interface CommentProps {
  userID: string;
  updatedDate: Date;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const CommentHeader: React.FC<CommentProps> = ({ userID, updatedDate, onEdit, onDelete }) => {
  const [user] = useSimpleReference<LazyUserInfo>(userReferences.users.doc(userID));
  const currentUser = useTypedSelector(state => state.userState.user);
  return <_CommentHeader>
    <div className="left">
      <strong>{ user?.displayName }</strong>
      <p>{ updatedDate.toString('dd/MM/yy') }</p>
    </div>
    { currentUser?.uid == user?.uid && <div className="edit-buttons-row">
      <span style={{ cursor: 'pointer' }} className="tg-icon edit-pencil icon-small" onClick={onEdit}/>
      <span style={{ cursor: 'pointer' }} className="tg-icon trash icon-small" onClick={onDelete}/>
    </div>}
  </_CommentHeader>;
};

export const _CommentHeader = styled.div`
  display: flex;
  width: 100%;
  justify-content: space-between;
  
  .left {
    display: flex;
    > :not(:last-child) {
      margin-right: 1rem;
    }
  }

  .edit-buttons-row {
    > :not(:last-child) {
      margin-right: 16px;
    }
  }
`;
