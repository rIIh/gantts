import React from 'react';
import { Provider } from 'react-redux';
import { AnyAction, Store } from 'redux';
import { History } from 'history';
import { ConnectedRouter } from 'connected-react-router';
import AppLayout from './App';

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
