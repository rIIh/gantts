import React from 'react';
import { Provider } from 'react-redux';
import { AnyAction, Store } from 'redux';
import { History } from 'history';
import { ConnectedRouter } from 'connected-react-router';
import AppLayout from './App';
import { ModalProvider } from './bundles/common/modal/context';

interface Props {
  store: Store<any, AnyAction>;
  history: History;
}

const Main: React.FC<Props> = ({ store, history }) => {
  return <Provider store={store}>
    <ConnectedRouter history={history}>
      <ModalProvider>
        <AppLayout/>
      </ModalProvider>
    </ConnectedRouter>
  </Provider>;
};

export default Main;
