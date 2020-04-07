import React, { useState } from 'react';
import { Form, Button, Alert, Container } from 'react-bootstrap';
import { Formik } from 'formik';
import { WeekBitMask, ProjectCreator } from '../types';
import InputField from '../../formik-bootstrap/components/InputField';
import FormikDatePicker from '../../formik-bootstrap/components/DatePicker';
import FormikBitMaskInput from '../../formik-bootstrap/components/FormikBitMaskInput';
import { useDispatch } from 'react-redux';
import { useHistory } from 'react-router';
import { createProject } from '../redux/thunks';
import { useTypedSelector } from '../../../redux/rootReducer';
import * as Yup from 'yup';

const initialProject: ProjectCreator = {
  title: '',
  startDate: new Date(),
  comments: [],
  history: [],
  documents: [],
  note: '',
  daysInWeekBitMask:
    WeekBitMask.Monday |
    WeekBitMask.Tuesday |
    WeekBitMask.Wednesday |
    WeekBitMask.Thursday |
    WeekBitMask.Friday,
};

const NewProject: React.FC = () => {
  const { isLoading, isFailed } = useTypedSelector(state => state.projectsState);
  const [isSubmitting, setSubmitting] = useState(false);
  const dispatch = useDispatch();
  const history = useHistory();

  return <Container className="py-5 page__container flex-grow-1">
    <h1>Create a New Project</h1>
    { isLoading ? 'Is loading' : '' }
    { isFailed && <Alert variant="danger">{isFailed.message}</Alert> }
    <Formik initialValues={initialProject}
            validationSchema={Yup.object({
              title: Yup.string().required('Please enter project title'),
            })}
            onSubmit={async (project) => {
              const promise = dispatch(createProject(project, (id) => history.push('/projects/'+id)));
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
              <FormikBitMaskInput name="daysInWeekBitMask" bitmask={WeekBitMask}/>
            </Form.Group>
            <Button type="submit">Create</Button>
          </Form>
        )
      }
    </Formik>
  </Container>;
};

export default NewProject;
