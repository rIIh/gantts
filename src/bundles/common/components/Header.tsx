import React, { useEffect } from 'react';
import { Container, Row, Col, Popover, OverlayTrigger } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { UserState } from '../../user/types';
import { logoutThunk } from '../../user/redux/thunks';
import { useHistory } from 'react-router';
import { UserPic } from '../../user/components/UserPic';
import { Link } from 'react-router-dom';

const Header: React.FC = () => {
  const { user } = useSelector<{ userState: UserState }, UserState>((state) => state.userState);
  const dispatch = useDispatch();

  return <div className="header">
    <Container fluid className="header__container">
      <div className="header__right">
        <OverlayTrigger trigger="click" rootClose
          placement="bottom-end" overlay={
            <Popover id="popover-basic" className="user_dropdown__popover">
              <Popover.Content className="user_dropdown__content">
                <Row className="flex-nowrap">
                  <Col>
                    <h6 className="user_dropdown__title">Bookmarks</h6>
                    <ul className="user_dropdown__list">
                      {/*<li>Hello world</li>*/}
                    </ul>
                  </Col>
                  <Col>
                    <h6 className="user_dropdown__title">Settings</h6>
                    <ul className="user_dropdown__list">
                      <li><Link to="/account">Account Settings</Link></li>
                    </ul>
                  </Col>
                </Row>
              </Popover.Content>
              <Popover.Title className="px-4 py-2">
                <span className="mr-2">
                  You’re logged in as {user?.displayName}
                </span>
                <button className="link" onClick={() => dispatch(logoutThunk())}>
                  Log out
                </button>
              </Popover.Title>
            </Popover>
          }>
          <div className="header__user_dropdown user_dropdown">
            { user && <UserPic clickable user={user} size={42}/> }
          </div>
        </OverlayTrigger>
      </div>
    </Container>
  </div>;
};

export default Header;
