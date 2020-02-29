import { createAction } from 'typesafe-actions';
import React from 'react';
import { Modal, ModalProps } from 'react-bootstrap';

export const appActions = {
  setBusy: createAction('App_Busy')<{ isBusy: boolean }>(),
};
