import { RouteToComponent } from '../bundles/common/types';
import Authentication from '../bundles/user/routes/Authenticate';
import CreateAccount from '../bundles/user/routes/CreateAccount';
import Projects from '../bundles/projects/routes/Projects';
import MyTasks from '../bundles/projects/routes/MyTasks';
import { createProject } from '../bundles/projects/redux/thunks';
import NewProject from '../bundles/projects/routes/NewProject';
import ProjectPage from '../bundles/projects/routes/ProjectPage';

export const routes: RouteToComponent[] = [
  { path: '/', exact: true, component: Projects },
  { path: '/login', component: Authentication },
  { path: '/signup', component: CreateAccount },
  { path: '/projects', exact: true, component: Projects },
  { path: '/projects/new', exact: true, component: NewProject },
  { path: '/projects/:id', component: ProjectPage },
  { path: '/tasks', component: MyTasks },
];