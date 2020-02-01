import React from 'react';
import { Form } from 'react-bootstrap';
import { FormikProps, InjectedFormikProps, Field, FieldAttributes, useField } from 'formik';

interface Props {
  name: string;
  label: string;
}

const Checkbox: React.FC<Props> = ({ name, label }) => {
  const [field, { touched, error }] = useField(name);

  return (
    <Form.Group>
      <Form.Check 
      type="checkbox" 
      label={label}
      {...field}
      isInvalid={touched && error !== undefined}
      feedback={error}
      />
    </Form.Group>
        );
};

export default Checkbox;