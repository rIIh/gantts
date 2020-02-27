import { RouteToComponent } from '../bundles/common/types';
import Authentication from '../bundles/user/routes/Authenticate';
import CreateAccount, { AcceptInvite } from '../bundles/user/routes/CreateAccount';
import Projects from '../bundles/projects/routes/Projects';
import EnrolledTo from '../bundles/projects/routes/EnrolledTo';
import NewProject from '../bundles/projects/routes/NewProject';
import ProjectPage from '../bundles/projects/routes/ProjectPage';
import { CompanySettings, Profile } from '../bundles/user/routes/AccountSettings';

export const routes: RouteToComponent[] = [
  { path: '/', exact: true, component: Projects },
  { path: '/login', component: Authentication },
  { path: '/signup', exact: true, component: CreateAccount },
  { path: '/signup/:invite/:company', component: AcceptInvite },
  { path: '/account', exact: true, component: Profile },
  { path: '/account/profile', component: Profile },
  { path: '/account/company', component: CompanySettings },
  { path: '/projects', exact: true, component: Projects },
  { path: '/projects/new', exact: true, component: NewProject },
  { path: '/projects/:id', component: ProjectPage },
  { path: '/tasks', component: EnrolledTo },
];
