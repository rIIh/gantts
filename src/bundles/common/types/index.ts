import React from 'react';
import { RouteComponentProps } from 'react-router';

export interface RouteToComponent {
  path: string;
  exact?: boolean;
  component: React.ComponentType<RouteComponentProps<any>> | React.ComponentType<any>;
}
