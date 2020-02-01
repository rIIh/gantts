import React from 'react';
import { Route, Switch } from 'react-router';
import { Provider } from 'react-redux';
import { AnyAction, Store } from 'redux';
import { History } from 'history';
import { ConnectedRouter } from 'connected-react-router';
import { routes } from './routes';
import AppLayout from './App';
import { FirebaseAuth } from './bundles/common/services/firebase';

interface Props {
  store: Store<any, AnyAction>;
  history: History;
}

const Main: React.FC<Props> = ({ store, history }) => {
  return <Provider store={store}>
    <ConnectedRouter history={history}>
      <AppLayout/>
    </ConnectedRouter>
  </Provider>;
};

export default Main;
