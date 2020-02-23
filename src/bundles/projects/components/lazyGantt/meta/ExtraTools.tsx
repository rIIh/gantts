import React from 'react';
import { Discussable, LazyProject, LazyTask, LazyTaskGroup, Subtask } from '../../../types';
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
  const showComments = isParentHovered || target.comments.length > 0;
  const showChecklist = isParentHovered || target.comments.length > 0;
  const subtasks: Subtask[] | undefined = (target as LazyTask).subtasks;
  return <>
    <Meta className="icon" style={{ display: showComments ? undefined : 'none' }}>
      <span className="tg-icon discussion"/>
      { target.comments.length > 0 && <p style={{ fontSize: '0.8em', marginLeft: '0.25rem' }}> {target.comments.length}</p>}
    </Meta>
    { withChecklist && (
        <Meta className="icon" style={{ display: showChecklist ? undefined : 'none' }}>
          <span className="tg-icon checklist"/>
          { subtasks.length > 0 && (
              <p style={{ fontSize: '0.8em', marginLeft: '0.25rem' }}>
                {subtasks?.filter(st => st.completed).length}/{subtasks.length}
              </p>
          )}
        </Meta>
    )}
  </>;
};
