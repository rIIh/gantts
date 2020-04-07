import React, { CSSProperties } from 'react';
import styled from 'styled-components';

interface Props {
  left: number;
  width: number;
}

const ProjectHead = styled.div`
  position: absolute;
  //bottom: ${({theme}) => theme.barVMargin}px;
  transition: left 400ms, width 400ms;
  background-color: #909ba4;
  top: -2px;
  height: 6px;
`;

export const ProjectLine = styled.div.attrs((props: Props & { style?: CSSProperties }) => ({
  children: <ProjectHead style={{ left: props.left, width: props.width }}/>,
}))<Props>`
  top: ${({theme}) => theme.headerHeight + theme.atomHeight * 2 - 1 - theme.barVMargin}px;
  position: absolute;
  height: 2px;
  background-color: #909ba4;
  left: 0;
  width: 100%;
`;
