import React, { useState, useEffect, Fragment } from 'react';
import '../styles/blocks/project_link.scss';
import { Project } from '../types/index';
import { Link } from 'react-router-dom';
import { FirebaseAuth, FirebaseCloud } from '../../common/services/firebase';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';

interface Props {
  project: Project;
}

const ProjectLink: React.FC<React.ComponentProps<'li'> & Props> = ({ className, project }) => {
  const [assigned, setUsers] = useState<firebase.User[]>([]);
  console.log(project);
  
  return <li className={'project_link ' + className}>
    <Link className="project_link__title" to={`/projects/${project.id}`}>{ project.title }</Link>
    <div className="spacer"/>
    <div className="project_link__assigned_list">
      { [ project.owner, ...project.enrolled ].map((user: firebase.UserInfo) => (
        <Fragment key={user.uid ?? Math.random()}>
          <OverlayTrigger
              placement="bottom"
              overlay={
                <Tooltip id={`user-tooltip-${user.uid}`}>
                  { user.displayName }
                </Tooltip>
              }>
            <div className="project_link__user_pic">
              <b className="unselectable">{ user.displayName?.[0].toUpperCase() ?? 'A' }</b>
            </div>
          </OverlayTrigger>
        </Fragment>
      ))}
      <OverlayTrigger
              placement="bottom"
              overlay={
                <Tooltip id={'user-tooltip-invite'}>
                  Invite people to this project
                </Tooltip>
              }>
        <Link to={`/projects/${project.id}/people`} className="project_link__invite_user">
          <span className="fas fa-plus"></span>
        </Link>
      </OverlayTrigger>
    </div>
  </li>;
};

export default ProjectLink;