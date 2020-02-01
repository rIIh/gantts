import React from 'react';
import { Form } from 'react-bootstrap';
import { FormikProps, InjectedFormikProps, Field, FieldAttributes, useField } from 'formik';
import { Transition } from 'react-transition-group';
import { TransitionStatus } from 'react-transition-group/Transition';

interface Props {
  name: string;
  type: string; 
  label: string;
  placeholder?: string;
}

const InputField: React.FC<Props & React.InputHTMLAttributes<'input'>> = ({ name, type, label, placeholder }) => {
  const [field, { touched, error }] = useField(name);

  return (
      <Form.Group>
        <Form.Label>{ label }</Form.Label>
        <Form.Control
          type={type}
          placeholder={placeholder}
          {...field}
          isInvalid={touched && error !== undefined}/>
        <Form.Control.Feedback type="invalid">{ error }</Form.Control.Feedback>
      </Form.Group>
          
        );
};

export default InputField;