import React from 'react';
import DatePicker from 'react-datepicker';
import { useField } from 'formik';
import 'react-datepicker/dist/react-datepicker.css';
import { Form } from 'react-bootstrap';


interface Props {
  name: string;
}

const FormikDatePicker: React.FC<Props> = ({ name }) => {
  const [field, { touched, error }, { setValue }]  = useField(name);
  
  return <DatePicker
        selected={field.value}
        dateFormat="MMMM d, yyyy"
        className="form-control"
        wrapperClassName="form-control"
        name={name}
        onChange={date => setValue(date)}
      />;
};

export default FormikDatePicker;