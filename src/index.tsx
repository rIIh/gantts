import React from 'react';
import ReactDOM from 'react-dom';
import './bundles/common/styles/index.scss';
import './bundles/formik-bootstrap/styles/index.scss';
import './bundles/user/styles/index.scss';
import Main from './Main';
import * as serviceWorker from './serviceWorker';
import { createBrowserHistory } from 'history';
import { createStore, combineReducers, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import createRootReducer from './redux/rootReducer';
import { FirebaseAuth } from './bundles/common/services/firebase';
import userActions from './bundles/user/redux/actions';
import projectActions from './bundles/projects/redux/actions';
import { fetchProjects } from './bundles/projects/redux/thunks';
import { composeWithDevTools } from 'redux-devtools-extension';

const history = createBrowserHistory();


const store = createStore(createRootReducer(history), composeWithDevTools(applyMiddleware(thunk)));

let inited: (() => void) | null = FirebaseAuth.onAuthStateChanged(user => {
  store.dispatch(userActions.setUser(user!));
  inited!();
  inited = null;
});

FirebaseAuth.onAuthStateChanged(user => {
  store.dispatch(projectActions.clear());
  if (user) {
    //@ts-ignore
    store.dispatch(fetchProjects(user));
  }
});

ReactDOM.render(<Main history={history} store={store}/>, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
