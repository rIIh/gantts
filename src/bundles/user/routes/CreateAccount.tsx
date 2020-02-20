import React, { useEffect } from 'react';
import { Formik } from 'formik';
import { Form, Button, Container, Spinner, Card, Alert } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, useRouteMatch } from 'react-router';
import { Link } from 'react-router-dom';
import { Invite, UserState } from '../types';
import * as Yup from 'yup';
import styled from 'styled-components';
import InputField from '../../formik-bootstrap/components/InputField';
import Checkbox from '../../formik-bootstrap/components/CheckBox';
import { acceptInvite, signUpThunk } from '../redux/thunks';
import { useTypedSelector } from '../../../redux/rootReducer';
import { useDocumentData } from 'react-firebase-hooks/firestore';
import { userReferences } from '../firebase';

export const AcceptInvite: React.FC = () => {
  const { user, isLoading } = useTypedSelector(state => state.userState);
  const dispatch = useDispatch();
  const router = useHistory();
  const { params: { invite: inviteID, company } } = useRouteMatch<{ invite: string; company: string }>();
  const [invite, loading] = useDocumentData<{ accepted?: boolean }>(userReferences.companyInvites(company).doc(inviteID));
  const Invite: Invite = {
    inviteID,
    companyID: company,
  };
  
  if (loading) {
    return <Spinner animation="grow"/>;
  }
  
  if (invite?.accepted) {
    return (
        <Card>
      <Card.Body>
        Invite { invite } already accepted
        Go <Link to="/">Home</Link>;
      </Card.Body>
    </Card>);
  }
  
  const form = user ? (<Card>
    <Card.Body>
      Accept invite { invite }
    </Card.Body>
    <Card.Footer>
      <Button variant="primary" onClick={() => {
        dispatch(acceptInvite(user, { inviteID, companyID: company }));
        router.push('/');
      }}>Accept</Button>
    </Card.Footer>
  </Card>) : <CreateAccount invite={Invite}/>;
  const result = isLoading ? <Spinner animation="grow"/> : form;
  return <Container className="auth-form py-5 page__container flex-grow-1 justify-content-center">
    { result }
  </Container>;
};

interface SignUpProps {
  invite?: Invite;
}

const CreateAccount: React.FC<SignUpProps> = ({ invite }) => {
  const dispatch = useDispatch();
  const { user, isLoading, isFailed, message } = useTypedSelector(state => state.userState);
  const history = useHistory();

  useEffect(() => user ? history.push('/') : undefined, [user, history]);

  return <Container className="auth-form py-5 page__container flex-grow-1">
    { isFailed && <Alert variant="danger">{ message }</Alert> }
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
      company: !invite ? Yup.string().required('Please enter the name of your company') : Yup.string(),
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
      console.log('submit');
      dispatch(signUpThunk({ ...data, rememberMe: true, invite }));
    }}
    >
      {( { handleSubmit }) => (
      <Form noValidate onSubmit={handleSubmit} className="mx-auto">
        <InputField name="fullName" type="text" label="Full name"/>
        <InputField name="email" type="email" label="Email"/>
        { !invite && <InputField name="company" type="text" label="Company"/> }
        <InputField name="password" type="password" label="Password"/>
        <InputField name="confirm" type="password" label="Confirm password"/>
        <Checkbox name="acceptedTerms" label="Agree to terms and conditions"/>
        <Button type="submit">Sign up</Button>
      </Form>)}
    </Formik>
  </Container>;
};

export default CreateAccount;
