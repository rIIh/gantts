import React, { useEffect } from 'react';
import { Formik } from 'formik';
import { Form, Button, Container } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router';
import { Link } from 'react-router-dom';
import { UserState } from '../types';
import * as Yup from 'yup';
import styled from 'styled-components';
import InputField from '../../formik-bootstrap/components/InputField';
import Checkbox from '../../formik-bootstrap/components/CheckBox';
import { signUpThunk } from '../redux/thunks';

const CreateAccount: React.FC = () => {
  const dispatch = useDispatch();
  const { user, isLoading, isFailed, message } = useSelector<{ userState: UserState }, UserState>((state) => state.userState);
  const history = useHistory();

  useEffect(() => user ? history.push('/') : undefined, [user, history]);

  return <Container className="auth-form py-5 page__container flex-grow-1">
    <Formik initialValues={{
      fullName: '',
      email: '',
      company: '',
      password: '',
      confirm: '',
      acceptedTerms: false,
    }}
    validationSchema={Yup.object({
      fullName: Yup.string().required('Please enter your name'),
      email: Yup.string()
        .email('Please enter a valid email address')
        .required('Please enter a valid email address'),
      company: Yup.string().required('Please enter the name of your company'),
      password: Yup.string()
        .min(8, 'Password should be at least 8 symbols')
        .required('Required'),
      confirm: Yup.string()
        .test('passwords-match', 'Passwords must match', function(value) {
          return this.parent.password === value;
        })
        .required('Required'),
      acceptedTerms: Yup.boolean()
        .required('Required')
        .oneOf([true], 'You must accept the terms and conditions.'),
    })}
    onSubmit={(data) => {
      dispatch(signUpThunk({ ...data, rememberMe: true }));
      // console.log(data);
    }}
    >
      {( {values,
          errors,
          touched,
          handleChange,
          handleBlur,
          handleSubmit,
          isSubmitting }) => (
      <Form noValidate onSubmit={handleSubmit} className="mx-auto">
        <InputField name="fullName" type="text" label="Full name"/>
        <InputField name="email" type="email" label="Email"/>
        <InputField name="company" type="text" label="Company"/>
        <InputField name="password" type="password" label="Password"/>
        <InputField name="confirm" type="password" label="Confirm password"/>
        <Checkbox name="acceptedTerms" label="Agree to terms and conditions"/>
        <Button type="submit">Sign up</Button>
      </Form>)}
    </Formik>
  </Container>;
};

export default CreateAccount;