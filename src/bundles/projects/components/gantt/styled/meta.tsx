import React from 'react';
import styled from 'styled-components';

export const MetaBackground = styled.div`
  pointer-events: none;
  position: absolute;
  display: flex;
  left: 0;
  top: 0;
  height: 100%;
  width: 100%;
`;

export const MetaColumn = styled.div<{ type: string }>`
  height: 100%;
  flex: ${({ theme, type }) => theme.meta_columns[type] ? null : '1 0 auto'};
  width: ${({ theme, type }) => `${theme.meta_columns[type]}px` ?? null};
  display: flex;
  color: #62676d;
  align-items: center;
  padding: 2px 4px;
  font-size: 13px;
  justify-content: space-between;
  
  > span.icon {
    flex: 1 0 auto;
  }

  &:not(:first-child) {
    border-left: 1px solid #eaeaea;
  }
`;
//
// export const MetaItem = styled.div<{ type: string }>`
//   height: 100%;
//   flex: ${({ theme, type }) => theme.meta_columns[type] ? null : '1 0 auto'};
//   width: ${({ theme, type }) => `${theme.meta_columns[type]}px` ?? null};
// `;
