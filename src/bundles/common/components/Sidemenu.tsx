import React, { useState } from 'react';
import { Badge } from 'react-bootstrap';
import { Link, useHistory } from 'react-router-dom';
import { CSSTransition } from 'react-transition-group';
import { routes } from '../../../routes';

interface ButtonProps {
  color: string;
}

const SidemenuButton: React.FC<ButtonProps> = ({ color }) => {
  return <div className="side_toolbar__button_wrapper">
    <div className="side_toolbar__button" style={{
      backgroundColor: color,
      borderColor: color,
    }}>Me</div>
  </div>;
};

const Sidemenu: React.FC = () => {
  const [showPopover, setShow] = useState(false);
  const history = useHistory();

  return (
    <div  onMouseEnter={() => setShow(true)}
          onMouseLeave={() => setShow(false)}
          >
      <CSSTransition in={showPopover} 
          timeout={4000} 
          classNames="side_popover-"
          unmountOnExit
          >
          <div className="side_toolbar__popover side_popover">
            <div className="side_popover__header">
              <h3 className="side_popover__title">Me</h3>
              <div className="side_popover__right">
                <button className="side_popover__button"/>
                <button className="side_popover__button" onClick={() => {history.push('/projects/new');}}>
                  <span className="fas fa-plus"/>
                </button>
              </div>
            </div>
            <ul className="side_popover__list">
              <li>
                <Link to="/projects">My Projects</Link>
              </li>
              <li>
                <Link to="/tasks">My Tasks</Link>
                {/*<Badge variant="primary" pill>1</Badge>*/}
              </li>
            </ul>
          </div>
      </CSSTransition>
      <div className="side_toolbar">
        <Link className="side_toolbar__link" to="/">
          <div className="side_toolbar__brand_button">H</div>
        </Link>
        <Link className="side_toolbar__link" to="/my-tasks">
          <SidemenuButton color="#B970D7" />
        </Link>
      </div>
    </div>
  );
};

export default Sidemenu;
