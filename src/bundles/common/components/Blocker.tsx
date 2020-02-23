import React from 'react';
import styled from 'styled-components';

const RelativeContainer = styled.div`
  position: relative;
`;

const Backdrop = styled.div.attrs<{ show: boolean }>(props => ({ style: {
  background: props.show ? 'rgba(255,255,255,0.8)' : null,
  pointerEvents: props.show ? null : 'none',
} }))<{ show: boolean }>`
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
`;

export const Blocker: React.FC<{ show: boolean; backdrop?: JSX.Element }> = ({ show, children, backdrop }) => {
  return <RelativeContainer>
    { children }
    <Backdrop show={show}>
      { show && backdrop }
    </Backdrop>
  </RelativeContainer>;
};
