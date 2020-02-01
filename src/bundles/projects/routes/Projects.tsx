import React, { useState } from 'react';
import '../styles/blocks/projects_list.scss';
import { Row, ToggleButtonGroup, ToggleButton, Button, Alert, Container } from 'react-bootstrap';
import { useHistory } from 'react-router';
import { Link } from 'react-router-dom';
import { ProjectsState } from '../types/index';
import { useSelector } from 'react-redux';
import ProjectLink from '../components/ProjectLink';

enum Filter {
  Active = 'Active',
  OnHold = 'On hold',
  Complete = 'Complete',
}

const Projects: React.FC = () => {
  const [filter, setFilter] = useState<Filter>(Filter.Active);
  const history = useHistory();
  const { projects, isFailed, message } = useSelector<{projectsState: ProjectsState}, ProjectsState>(
    state => state.projectsState);

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
    { isFailed && <Alert variant="danger" className="mt-3">{ message }</Alert>}
    <ul className="projects_list">
      { projects.map(project => (
        <ProjectLink key={project.id} project={project} className="projects_list__project"/>
      ))}
    </ul>
  </Container>;
};

export default Projects;