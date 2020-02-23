import React, { createContext, useCallback, useContext, useState } from 'react';
import { Modal, ModalProps } from 'react-bootstrap';
import { Stack } from 'immutable';
import { noop } from '../lib/noop';

type ModalBuilder = React.FC<ModalProps>;

interface ModalContext {
  last: Stack<ModalBuilder | null>;
  active: ModalBuilder | null;
  showModal: (builder: JSX.Element, opts?: ModalProps) => void;
  hideLastModal: () => void;
}

export const DynoModal = createContext<ModalContext>({
  last: Stack(),
  active: null,
  showModal: function(content, opts) {
    this.last = this.last.push(this.active);
    this.active = props => <Modal {...opts} {...props}>{content}</Modal>;
  },
  hideLastModal: function() {
    this.active = this.last.peek() ?? null;
    this.last = this.last.shift();
  },
});

export const ModalProvider: React.FC = ({ children }) => {
  const [last, setLast] = useState<Stack<ModalBuilder | null>>(Stack());
  const [ActiveModal, setActive] = useState<ModalBuilder | null>(null);
  
  const showModal = useCallback((content: JSX.Element, opts?: ModalProps) => {
    setLast(last => last.push((props) => <Modal {...opts} {...props}>{content}</Modal>));
    // setActive(() => ((props) => <Modal {...opts} {...props}>{content}</Modal>) as ModalBuilder);
  }, [setLast, setActive, last, ActiveModal]);
  
  const hideLastModal = useCallback(() => {
    // setActive(() => last.peek() ?? null);
    setLast(last => last.pop());
  }, [setLast, setActive, last, ActiveModal]);
  
  return <DynoModal.Provider value={{
    last,
    active: ActiveModal,
    showModal,
    hideLastModal,
  }}>
    {/*{ ActiveModal && <ActiveModal show onHide={hideLastModal}/> }*/}
    { last.reverse().map((Modal, i) => Modal && <Modal key={i} show onHide={hideLastModal}/>) }
    { children }
  </DynoModal.Provider>;
};

export const useModal = (content?: JSX.Element | null, opts?: ModalProps) => {
  const { showModal, hideLastModal } = useContext(DynoModal);
  const show = useCallback(() => content ? showModal(content, opts) : noop, [showModal, content, opts]);
  return { showModal: show, hideModal: hideLastModal };
};
