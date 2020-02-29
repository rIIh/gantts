import styled from 'styled-components';

export const AssignButton = styled.button`
  background-color: transparent;
  font-style: italic;
  color: grey;
  cursor: text;
`;

export const AssignedList = styled.span`
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-end;
  align-items: center;
  white-space: nowrap;
  overflow: hidden;
  
  > :not(:last-child) {
    margin-right: 0.25rem;
  }
`;

export const Assigned = styled.p`
  //font-size: .725em;
  overflow: hidden;
  margin: 0;
  flex: 0 1 auto;
  
  &:not(:last-child)::after {
    content: ', ';
  }
  
  &:last-child {
    padding-right: 6px;
  }
`;
