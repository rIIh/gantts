import React, { useEffect } from 'react';
import { Container, Row, Col, Popover, OverlayTrigger } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { UserState } from '../../user/types';
import { logoutThunk } from '../../user/redux/thunks';
import { useHistory } from 'react-router';

const Header: React.FC = () => {
  const { user } = useSelector<{ userState: UserState }, UserState>((state) => state.userState);
  const dispatch = useDispatch();

  return <div className="header">
    <Container className="header__container">
      <div className="header__right">
        <OverlayTrigger trigger="click" rootClose
          placement="bottom-end" overlay={
            <Popover id="popover-basic" className="user_dropdown__popover">
              <Popover.Content className="user_dropdown__content">
                <Row className="flex-nowrap">
                  <Col>
                    <h6 className="user_dropdown__title">Bookmarks</h6>
                    <ul className="user_dropdown__list">
                      <li>Hello world</li>
                    </ul>
                  </Col>
                  <Col>
                    <h6 className="user_dropdown__title">Settings</h6>
                    <ul className="user_dropdown__list">
                      <li><a href="/admin/account-settings">Account Settings</a></li>
                      <li><a href="/admin/edit-profile">Edit My Profile</a></li>
                      <li><a href="https://prod.teamgantt.com/gantt/admin/email">Project Notifications</a></li>
                      <li>
                        <button className="link">Set as Homepage</button>
                      </li>
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
            <button className="header__user_avatar">
              <img src={user?.photoURL ?? 'https://picsum.photos/400'} alt=""/>
            </button>
          </div>
        </OverlayTrigger>
      </div>
    </Container>
  </div>;
};

export default Header;