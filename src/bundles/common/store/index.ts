import React from 'react';
import { Stack } from 'immutable';
import { Modal, ModalProps } from 'react-bootstrap';

export interface AppState {
  isBusy: boolean;
}

export const initialState: AppState = {
  isBusy: false,
};
