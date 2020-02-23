import React from 'react';
import { render } from '@testing-library/react';
import AppLayout from '../App';

test('renders learn react link', () => {
  const { getByText } = render(<AppLayout />);
  const linkElement = getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});
