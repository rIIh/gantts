import React, { createContext, useCallback, useContext } from 'react';
import { ModalProps } from 'react-bootstrap';
import { Stack } from 'immutable';
import { noop } from '../lib/noop';

type ModalBuilder = React.FC<ModalProps>;

interface ModalContext {
  last: Stack<ModalBuilder | null>;
  active: ModalBuilder | null;
  showModal: (builder: ModalBuilder) => void;
  hideLastModal: () => void;
}

export const DynoModal = createContext<ModalContext>({
  last: Stack(),
  active: null,
  showModal: function(builder) {
    this.last = this.last.push(this.active);
    this.active = builder;
  },
  hideLastModal: function() {
    this.active = this.last.peek() ?? null;
    this.last = this.last.shift();
  },
});

export const useModal = (builder?: ModalBuilder) => {
  const { showModal, hideLastModal } = useContext(DynoModal);
  const show = useCallback(builder ? () => showModal(builder) : noop, [showModal, builder]);
  return { showModal: show, hideModal: hideLastModal };
};
