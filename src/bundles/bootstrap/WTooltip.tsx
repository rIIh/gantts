import React from 'react';
import { Tooltip } from 'react-bootstrap';
import styled from 'styled-components';

export const WTooltip = styled(Tooltip)<{ width?: number }>`
  > .tooltip-inner {
    max-width: ${props => props.width}px;
  }
`;
