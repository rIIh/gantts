import React from 'react';
import ReactDatePicker, { ReactDatePickerProps } from 'react-datepicker';

export const DatePicker: React.FC<ReactDatePickerProps> = (props) => <ReactDatePicker wrapperClassName="form-control" {...props}/>;
