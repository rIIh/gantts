import React, { useEffect } from 'react';
import { Formik } from 'formik';
import { Form, Button, Container, Alert, ButtonToolbar } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router';
import { UserState } from '../types';
import * as Yup from 'yup';
import styled from 'styled-components';
import InputField from '../../formik-bootstrap/components/InputField';
import Checkbox from '../../formik-bootstrap/components/CheckBox';
import { authenticateThunk } from '../redux/thunks';
import { Link } from 'react-router-dom';

const Authentication: React.FC = () => {
  const dispatch = useDispatch();
  const { user, isLoading, isFailed, message } = useSelector<{ userState: UserState }, UserState>((state) => state.userState);
  const history = useHistory();

  useEffect(() => user ? history.push('/') : undefined, [user, history]);
  console.log(user);

  return <Container className="auth-form py-5 page__container flex-grow-1">
    { isFailed && 
    <Alert variant="danger">
      { message }
    </Alert>
    }
    <Formik initialValues={{
      email: '',
      password: '',
      rememberMe: false,
    }}
    validationSchema={Yup.object({
      email: Yup.string()
        .email('Invalid email address')
        .required('Email is required'),
      password: Yup.string()
        .min(8, 'Password should be at least 8 symbols')
        .required('Required'),
    })}
    onSubmit={(data) => {
      dispatch(authenticateThunk(data));
    }}
    >
      {({ handleSubmit, isSubmitting }) => (
      <Form noValidate onSubmit={handleSubmit} 
            className="mx-auto auth-form__form-body">
        <InputField name="email" type="email" label="Email" />
        <InputField name="password" type="password" label="Password" />
        <Checkbox name="rememberMe" label="Remember me"/>
        <Button type="submit">Sign in</Button>
      </Form>)}
    </Formik>
    <div className="auth-form__create-account-block">
      <b className="auth-form__create-account-text">Don't already have an account?</b>
      <Link className="auth-form__create-account-link" to="/signup">
        Create an account
      </Link>
    </div>
  </Container>;
};

export default Authentication;