import React, { useEffect, useState } from 'react';
import { Route, Switch, useHistory } from 'react-router';
import Header from './bundles/common/components/Header';
import { routes } from './routes';
import { expectSignIn } from './bundles/common/services/firebase';
import { Overlay, Spinner, Row, Col, Alert, Modal } from 'react-bootstrap';
import SideMenu from './bundles/common/components/Sidemenu';
import { useTypedSelector } from './redux/rootReducer';
import styled, { ThemeProvider } from 'styled-components';
import { GanttTheme } from './bundles/projects/components/gantt/types';

const FilledSquare = styled.div`
  background-color: white;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const AppLayout: React.FC = () => {
  const { user, isLoading, isFailed, message } = useTypedSelector((state) => state.userState);
  const history = useHistory();
  const [isLoaded, setLoaded] = useState(false);
  useEffect(() => {
    setTimeout(() => setLoaded(true), 2000);
  }, []);
  useEffect(() => {
    if (!expectSignIn() && !user && !/^\/(signup.*|login)$/i.test(history.location.pathname)){
      history.push('/login');
    };
  }, [user, history]);
  
  return <>
    <Overlay target={document.body}  show={!isLoaded || isLoading}>
      <FilledSquare>
        <Spinner animation="grow"/>
      </FilledSquare>
    </Overlay>
    {/*<Modal show={!_.isNil(activeModal)} onHide={() => dispatch(appActions.hideActiveModal())}>*/}
    {/*  { activeModal }*/}
    {/*</Modal>*/}
    <ThemeProvider theme={new GanttTheme()}>
    { isLoaded && !isFailed &&
    <Row noGutters className="page">
      <Col className="flex-shrink-1 flex-grow-0" >
        { user && <SideMenu/> }
      </Col>
      <Col className="page__content" style={{ display: 'flex', flexFlow: 'column' }}>
        { user && <Header/> }
          <Switch>
              { (routes.map(({ path, exact, component }) => <Route exact={exact} key={path} path={path} component={component}/>)) }
          </Switch>
      </Col>
    </Row>
    }
    </ThemeProvider>
    { isFailed && (
        <Alert variant="danger">{ message }</Alert>
    ) }
  </>;
};

export default AppLayout;
