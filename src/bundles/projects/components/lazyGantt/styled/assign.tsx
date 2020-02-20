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
  align-items: center;
`;

export const Assigned = styled.p`
  font-size: .725em;
  overflow: hidden;
  margin: 0;
  
  &:not(:last-child)::after {
    content: ', ';
  }
`;
