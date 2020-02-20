import React, { useState } from 'react';
import '../styles/blocks/projects_list.scss';
import { Row, ToggleButtonGroup, ToggleButton, Button, Alert, Container } from 'react-bootstrap';
import { useHistory } from 'react-router';
import { Link } from 'react-router-dom';
import { LazyProject, ProjectsState } from '../types/index';
import { useSelector } from 'react-redux';
import ProjectLink from '../components/ProjectLink';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import { projectReferences } from '../firebase';
import { ProjectConverter } from '../firebase/project_converter';
import { useTypedSelector } from '../../../redux/rootReducer';
import { useSimpleCollection } from '../../firebase/hooks/useSimpleReference';

enum Filter {
  Active = 'Active',
  OnHold = 'On hold',
  Complete = 'Complete',
}

const Projects: React.FC = () => {
  const [filter, setFilter] = useState<Filter>(Filter.Active);
  const history = useHistory();
  // const { lazy: projects, isFailed, message } = useSelector<{projectsState: ProjectsState}, ProjectsState>(
  //   state => state.projectsState);
  
  const { user } = useTypedSelector(state => state.userState);
  const [projects, loading, isFailed] = useSimpleCollection<LazyProject>(user ? projectReferences.ownedProjects(user) : undefined);
  
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
      { projects?.map(project => (
        <ProjectLink key={project.uid} project={project} className="projects_list__project"/>
      ))}
    </ul>
  </Container>;
};

export default Projects;
