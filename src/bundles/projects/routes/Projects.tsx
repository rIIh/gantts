import React, {useState} from 'react';
import '../styles/blocks/projects_list.scss';
import {Alert, Button, Container, Row, ToggleButton, ToggleButtonGroup} from 'react-bootstrap';
import {Link} from 'react-router-dom';
import {Project, ProjectState} from '../types/index';
import ProjectLink from '../components/ProjectLink';
import {projectReferences} from '../firebase';
import {useTypedSelector} from '../../../redux/rootReducer';
import {useSimpleCollection} from '../../firebase/hooks/useSimpleReference';

enum Filter {
  Active = 'Active',
  OnHold = 'On hold',
  Complete = 'Complete',
}

const equals = (filter: Filter, state: ProjectState) => {
  if (filter == Filter.Active && state == ProjectState.Active) { return true; }
  if (filter == Filter.OnHold && state == ProjectState.OnHold) { return true; }
  return !!(filter == Filter.Complete && state == ProjectState.Complete);
};

const Projects: React.FC = () => {
  const [filter, setFilter] = useState<Filter>(Filter.Active);
  const { user } = useTypedSelector(state => state.userState);
  const [projects, loading, isFailed] = useSimpleCollection<Project>(user ? projectReferences.ownedProjects(user) : undefined);
  
  return <Container className="py-5 page__container flex-grow-1">
    <Row className="mt-2">
      <ToggleButtonGroup  type="radio" 
                          value={filter}
                          name="test"
                          onChange={setFilter}>
        { Object.values(Filter).map(value => (
          <ToggleButton variant="outline-secondary"  key={value} value={value}>
            { value }
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
      <div className="flex-grow-1"/>
      <Link to="/projects/new">
        <Button>Create Project</Button>
      </Link>
    </Row>
    { isFailed && <Alert variant="danger" className="mt-3">{ isFailed?.message }</Alert>}
    <ul className="projects_list">
      { projects?.filter(p => equals(filter, p.state)).map(project => (
        <ProjectLink key={project.uid} project={project} className="projects_list__project"/>
      ))}
    </ul>
  </Container>;
};

export default Projects;
