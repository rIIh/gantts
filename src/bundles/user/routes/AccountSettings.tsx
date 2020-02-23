import React, { PropsWithChildren, useEffect, useState } from 'react';
import { Col, Row, Card, Button, Container, Nav, ListGroup, ListGroupItem } from 'react-bootstrap';
import { Link, NavLink, useHistory, useRouteMatch } from 'react-router-dom';
import styled from 'styled-components';
import { useTypedSelector } from '../../../redux/rootReducer';
import { UserPic } from '../components/UserPic';
import { Company, LazyUserInfo } from '../types';
import { Warning } from '../../common/components/Warning';
import CompanyInvite from '../components/CompanyInvite';
import { useReference } from '../../firebase/hooks/useReference';

interface SubRouteProps {
  targetLink: string;
}

// const NavLink = styled.a<{ active?: boolean }>`
//
// `;

const StyledNavLink = styled(NavLink).attrs({
  activeClassName: 'is-active',
    }
)`
  color: black;
  
  &.is-active {
    color: grey;
    
    &:hover {
     text-decoration: none;
    }
  }
`;

const NavList = styled.ul`

`;

const Links: React.FC = () => {
  return <ListGroup className="py-4">
    <ListGroupItem>
      <StyledNavLink to="/account/profile">Profile settings</StyledNavLink>
    </ListGroupItem>
    <ListGroupItem>
      <StyledNavLink to="/account/company">Company settings</StyledNavLink>
    </ListGroupItem>
  </ListGroup>;
};

const Account: React.FC = ({ children }) => {
  return <Container>
    <Row>
      <Col xs={4}>
        <Links/>
      </Col>
      <Col>
        {children}
      </Col>
    </Row>
  </Container>;
};

export  const Profile: React.FC = () => {
  return <Account>
  
  </Account>;
};

export const UsersRow = styled.div`
  display: flex;
  
  > :not(:last-child) {
    margin-right: 0.5rem;
  }
`;

export const CompanySettings: React.FC = () => {
  const { usersAtCompany, user } = useTypedSelector(state => state.userState);
  const [company, failed] = useReference(user?.company);
  const [showInviteForm, setInviteForm] = useState(false);
  
  return <Account>
    <CompanyInvite show={showInviteForm} onHide={() => setInviteForm(false)}/>
    <div className="py-4">
      <Card id="enrolled-users">
        <Card.Body>
          <Card.Title>Users at company</Card.Title>
          <UsersRow>{ usersAtCompany.map(user => <UserPic key={user.uid} userID={user.uid} withTooltip size={company?.owner.Reference.id === user.uid ? 42 : undefined}/>)}</UsersRow>
        </Card.Body>
        { company !== null && company.owner.Reference.id === user?.uid && (
            <Card.Footer>
              <Button variant="primary" onClick={() => setInviteForm(true)}>Invite</Button>
            </Card.Footer>
        )}
        { failed && (
            <Card.Footer>
              <Warning message={failed?.message}/>
            </Card.Footer>
        )}
      </Card>
    </div>
  </Account>;
};
