import React, { useState, useEffect } from 'react';
import { Form, ToggleButton, ToggleButtonGroup, Button, Alert, Container } from 'react-bootstrap';
import { Formik } from 'formik';
import { Project, WeekBitMask, ProjectCreator } from '../types';
import InputField from '../../formik-bootstrap/components/InputField';
import FormikDatePicker from '../../formik-bootstrap/components/DatePicker';
import BitMaskInput from '../../formik-bootstrap/components/BitMaskInput';
import { useSelector, useDispatch } from 'react-redux';
import { ProjectsState } from '../types/index';
import { useHistory } from 'react-router';
import { createProject } from '../redux/thunks';

enum Filter {
  Active = 'Active',
  OnHold = 'On hold',
  Complete = 'Complete',
}

const initialProject: ProjectCreator = {
  title: '',
  startDate: new Date(),
  daysInWeekBitMask: 
    WeekBitMask.Monday |
    WeekBitMask.Tuesday |
    WeekBitMask.Wednesday |
    WeekBitMask.Thursday |
    WeekBitMask.Friday,
};

const NewProject: React.FC = () => {
  const { projects, isLoading, isFailed, message } = useSelector<{ projectsState: ProjectsState }, ProjectsState>(state => state.projectsState);
  const [isSubmitting, setSubmitting] = useState(false);
  const dispatch = useDispatch();
  const history = useHistory();
  useEffect(() => isSubmitting && !isLoading && !isFailed ? 
    history.push('/projects/' + projects[projects.length - 1].id) : undefined, [isLoading]);

  return <Container className="py-5 page__container flex-grow-1">
    <h1>Create a New Project</h1>
    { isLoading ? 'Is loading' : '' }
    { isFailed && <Alert variant="danger">{message}</Alert> }
    <Formik initialValues={initialProject}
            onSubmit={async (project) => {
              const promise = dispatch(createProject(project));
              setSubmitting(true);
              await promise;
              console.log('done');
            }}>
      {
        props => (
          <Form noValidate onSubmit={props.handleSubmit}>
            <InputField name="title" type="text" label="Project name"/>
            <Form.Group>
              <Form.Label>Start Date</Form.Label>
              <FormikDatePicker name="startDate"/>
            </Form.Group>
            <Form.Group>
              <Form.Label>Days in Week</Form.Label>
              <BitMaskInput name="daysInWeekBitMask" bitmask={WeekBitMask}/>
              {/* <ToggleButtonGroup type="checkbox" onChange={(values: number[]) => console.log(values.reduce((acc, val) => {acc += val; return acc;}))}>
                <ToggleButton variant="outline-secondary" value={WeekBitMask.Monday}>
                  { WeekBitMask[WeekBitMask.Monday] }
                </ToggleButton>
                <ToggleButton variant="outline-secondary" value={WeekBitMask.Tuesday}>
                  { WeekBitMask[WeekBitMask.Tuesday] }
                </ToggleButton>
                <ToggleButton variant="outline-secondary" value={WeekBitMask.Wednesday}>
                  { WeekBitMask[WeekBitMask.Wednesday] }
                </ToggleButton>
              </ToggleButtonGroup> */}
            </Form.Group>
            <Button type="submit">Create</Button>
          </Form>
        )
      }
    </Formik>
  </Container>;
};

export default NewProject;