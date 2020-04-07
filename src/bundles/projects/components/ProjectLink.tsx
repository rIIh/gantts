import React from 'react';
import '../styles/blocks/project_link.scss';
import { Project } from '../types';
import { Link } from 'react-router-dom';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { Avatar, UserPic } from '../../user/components/UserPic';
import { InviteModal } from './forms/InviteForm';
import { LazyUserInfo } from '../../user/types';
import { useSimpleCollection } from '../../firebase/hooks/useSimpleReference';
import { useModal } from '../../common/modal/context';

interface Props {
  project: Project;
}

const ProjectLink: React.FC<React.ComponentProps<'li'> & Props> = ({ className, project }) => {
  const [enrolled] = useSimpleCollection<LazyUserInfo>(project.enrolled());
  const { showModal } = useModal(<InviteModal project={project}/>);
  
  return <li className={'project_link ' + className}>
    <Link className="project_link__title" to={`/projects/${project.uid}`}>{ project.title }</Link>
    <div className="spacer"/>
    <div className="project_link__assigned_list">
      { enrolled?.map((user) => (
          <UserPic key={user.uid} userID={user.uid} size={24} withTooltip/>
      ))}
      <OverlayTrigger
              placement="bottom"
              overlay={
                <Tooltip id={'user-tooltip-invite'}>
                  Invite people to this project
                </Tooltip>
              }>
        <Avatar size={18} style={{ backgroundColor: 'lightgrey', cursor: 'pointer' }}
                onClick={showModal}>
          <span className="fas fa-plus" style={{ fontSize: '0.75em' }}/>
        </Avatar>
      </OverlayTrigger>
    </div>
  </li>;
};

export default ProjectLink;
