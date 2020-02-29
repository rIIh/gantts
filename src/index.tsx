import React from 'react';
import ReactDOM from 'react-dom';
import './bundles/common/styles/index.scss';
import './bundles/formik-bootstrap/styles/index.scss';
import './bundles/user/styles/index.scss';
import './bundles/bootstrap/styles/index.scss';
import 'datejs';
import './bundles/projects/utils/index';
import './bundles/datepicker/styles.scss';
import Main from './Main';
import * as serviceWorker from './serviceWorker';
import { createBrowserHistory } from 'history';
import { createStore, combineReducers, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import createRootReducer from './redux/rootReducer';
import { FirebaseAuth } from './bundles/common/services/firebase';
import projectActions from './bundles/projects/redux/actions';
import { composeWithDevTools } from 'redux-devtools-extension';
import { initUser } from './bundles/user/redux/thunks';
import registerDev from './serviceWorkerDev';
import { CachedQueriesInstance } from './bundles/firebase/cache';

const history = createBrowserHistory();

const store = createStore(createRootReducer(history), composeWithDevTools(applyMiddleware(thunk)));

let inited: (() => void) | null = FirebaseAuth.onAuthStateChanged(user => {
  //@ts-ignore
  store.dispatch(initUser(user));
  inited!();
  inited = null;
});

FirebaseAuth.onAuthStateChanged(user => {
  store.dispatch(projectActions.clear());
});


ReactDOM.render(<Main history={history} store={store}/>, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
registerDev();
// serviceWorker.register();
