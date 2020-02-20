import React from 'react';
import styled from 'styled-components';

interface IconProps {
  icon: string;
  size?: number;
}

export const Icon = styled.span<IconProps>`
  color: #9ba2ab;
  font-size: ${({ size }) => size ? `${size}px` : '1em'};
  
  &:hover {
    color: #737982
  }
`;
