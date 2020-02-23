import React from 'react';
import DatePicker from 'react-datepicker';
import '../../datepicker/styles.scss';
import { useField } from 'formik';

interface Props {
  name: string;
}

const FormikDatePicker: React.FC<Props> = ({ name }) => {
  const [field, { touched, error }, { setValue }]  = useField(name);
  
  return <DatePicker
        selected={field.value}
        dateFormat="MMMM d, yyyy"
        wrapperClassName="form-control"
        name={name}
        onChange={date => setValue(date)}
      />;
};

export default FormikDatePicker;
