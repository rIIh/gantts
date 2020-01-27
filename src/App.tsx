import React, { useEffect, useState } from 'react';
import { Route, Switch, useHistory } from 'react-router';
import { useSelector } from 'react-redux';
import Header from './bundles/common/components/Header';
import { routes } from './routes';
import { UserState } from './bundles/user/types';
import { expectSignIn } from './bundles/common/services/firebase';
import { Overlay, Spinner, Container, Row, Col } from 'react-bootstrap';
import Sidemenu from './bundles/common/components/Sidemenu';
import { ProjectsState } from './bundles/projects/types/index';

const AppLayout: React.FC = () => {
  const { user, isLoading } = useSelector<{ userState: UserState }, UserState>((state) => state.userState);
  const { isLoading: projectsLoading } = useSelector<{ projectsState: ProjectsState }, ProjectsState>((state) => state.projectsState);
  const history = useHistory();
  const [isLoaded, setLoaded] = useState(false);
  useEffect(() => {
    setTimeout(() => setLoaded(true), 2000);
  }, []);
  useEffect(() => {
    if (!expectSignIn() && !user && !/^\/(signup|login)$/i.test(history.location.pathname)){
      history.push('/login');
    };
  }, [user, history]);

  return <>
    <Overlay show={!isLoaded || isLoading}>
      <div style={{
        backgroundColor: 'white',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Spinner animation="grow"/>
      </div>
    </Overlay>
    { isLoaded &&
    <Row noGutters className="page">
      <Col className="flex-shrink-1 flex-grow-0" >
        { user && <Sidemenu/> }
      </Col>
      <Col style={{ display: 'flex', flexFlow: 'column' }}>
        { user && <Header/> }
          <Switch>
              { (routes.map(({ path, exact, component }) => <Route exact={exact} key={path} path={path} component={component}/>)) }
          </Switch>
      </Col>
    </Row>
    }
  </>;
};

export default AppLayout;
