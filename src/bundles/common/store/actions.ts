import { createAction } from 'typesafe-actions';
import React from 'react';

export const appActions = {
  setActiveModal: createAction('Set_Active_Modal')<JSX.Element | null>(),
  hideActiveModal: createAction('Undo_Set_Active_Modal')<void>(),
};
