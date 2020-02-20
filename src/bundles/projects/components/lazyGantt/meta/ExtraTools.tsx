import React from 'react';
import { Discussable, LazyProject, LazyTask, LazyTaskGroup } from '../../../types';
import styled from 'styled-components';

interface Props {
  target: (LazyTask | LazyTaskGroup | LazyProject) & Discussable;
  withChecklist?: boolean;
  isParentHovered: boolean;
}

const Meta = styled.span`
  color: #9ba2ab;
`;

export const ExtraTools: React.FC<Props> = ({ target, withChecklist, isParentHovered }) => {
  if (!isParentHovered) { return null; }
  return <>
    <Meta className="icon">
      <span className="tg-icon discussion"/>
    </Meta>
    { withChecklist && (
        <Meta className="icon">
          <span className="tg-icon checklist"/>
        </Meta>
    )}
  </>;
};
