import React from 'react';
import { Discussable, LazyProject, LazyTask, LazyTaskGroup, Subtask } from '../../../types';
import styled from 'styled-components';
import { OverlayTrigger } from 'react-bootstrap';
import { ChecklistTrigger, CommentFormTrigger } from '../../forms/CommentForm';

interface Props {
  projectID: string;
  target: (LazyTask | LazyTaskGroup | LazyProject) & Discussable;
  withChecklist?: boolean;
  isParentHovered: boolean;
  isOwner: boolean;
}

const Meta = styled.span`
  color: #9ba2ab;
  width: 50%;
`;

export const ExtraTools: React.FC<Props> = ({ target, withChecklist, projectID, isParentHovered, isOwner }) => {
  const showComments = isParentHovered || target.comments.length > 0;
  const subtasks: Subtask[] | undefined = (target as LazyTask).subtasks;
  const showChecklist = isParentHovered || (subtasks && subtasks.length > 0);
  return <>
    <Meta className="icon" >
      <CommentFormTrigger target={target} storagePath={`projects/${projectID}/documents/${target.uid}/`}>
        <span className="tg-icon discussion" style={{ opacity: showComments ? undefined : 0 }}/>
      </CommentFormTrigger>
      {target.comments.length > 0 && <p style={{ fontSize: '0.8em', marginLeft: '0.25rem' }}> {target.comments.length}</p>}
    </Meta>
    {withChecklist && (
        <Meta className="icon" >
          <ChecklistTrigger target={target as LazyTask} isOwner={isOwner}>
            <span className="tg-icon checklist" style={{ opacity: showChecklist ? undefined : 0 }}/>
          </ChecklistTrigger>
          {subtasks.length > 0 && (
              <p style={{ fontSize: '0.8em', marginLeft: '0.25rem' }}>
                {subtasks?.filter(st => st.completed).length}/{subtasks.length}
              </p>
          )}
        </Meta>
    )}
  </>;
};
