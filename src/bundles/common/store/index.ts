import React from 'react';
import { Stack } from 'immutable';

export interface AppState {
  past: Stack<JSX.Element | null>;
  activeModal: JSX.Element | null;
}

export const initialState: AppState = {
  past: Stack(),
  activeModal: null,
};
