import React, { useState, useEffect, Fragment } from 'react';
import '../styles/blocks/project_link.scss';
import { LazyProject, Project } from '../types/index';
import { Link } from 'react-router-dom';
import { Badge, Button, Modal, OverlayTrigger, Tooltip, Spinner } from 'react-bootstrap';
import { Avatar, UserPic } from '../../user/components/UserPic';
import { useCollectionReference, useReference } from '../../firebase/hooks/useReference';
import { Warning } from '../../common/components/Warning';
import { appActions } from '../../common/store/actions';
import { InviteModal } from './forms/InviteForm';
import { AssignModal } from './forms/AssignForm';
import { useDispatch } from 'react-redux';
import { LazyReference } from '../../firebase/types';
import { useCollectionData, useDocumentData } from 'react-firebase-hooks/firestore';
import { LazyUserInfo } from '../../user/types';
import { useSimpleCollection } from '../../firebase/hooks/useSimpleReference';

interface Props {
  project: LazyProject;
}

const ProjectLink: React.FC<React.ComponentProps<'li'> & Props> = ({ className, project }) => {
  const [enrolled] = useSimpleCollection<LazyUserInfo>(project.enrolled());
  const dispatch = useDispatch();
  
  
  return <li className={'project_link ' + className}>
    <Link className="project_link__title" to={`/projects/${project.uid}`}>{ project.title }</Link>
    <div className="spacer"/>
    <div className="project_link__assigned_list">
      { enrolled?.map((user) => (
          <UserPic key={user.uid} user={user} size={24} withTooltip/>
      ))}
      {/*{ enrolledFailed && <Warning message={enrolledFailed?.message}/>}*/}
      <OverlayTrigger
              placement="bottom"
              overlay={
                <Tooltip id={'user-tooltip-invite'}>
                  Invite people to this project
                </Tooltip>
              }>
        <Avatar size={18} style={{ backgroundColor: 'lightgrey', cursor: 'pointer' }}
                onClick={() => dispatch(appActions.setActiveModal(<InviteModal project={project}/>))}>
          <span className="fas fa-plus" style={{ fontSize: '0.75em' }}/>
        </Avatar>
      </OverlayTrigger>
    </div>
  </li>;
};

export default ProjectLink;
