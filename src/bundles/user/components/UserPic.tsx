import React from 'react';
import styled from 'styled-components';
import { LazyUserInfo, UserInfo } from '../types';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';

interface Props {
  user: LazyUserInfo;
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
  user,
  size,
  clickable,
  withTooltip,
  onClick }) => {
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
