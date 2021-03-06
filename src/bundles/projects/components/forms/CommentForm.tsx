import React, { useCallback, useEffect, useState } from 'react';
import { OverlayTrigger, Popover } from 'react-bootstrap';
import { Discussable, Subtask, WithDocs, WithHistory, WithNotes } from '../../types';
import styled from 'styled-components';
import { Discussion, FormBody } from './edit/FormBody';
import { DocumentReference } from '../../../firebase/types';
import { TaskConverter } from '../../firebase/project_converter';
import _ from 'lodash';
import { FakeCheckbox } from '../gantt/styled';
import cuid from 'cuid';

const CommentSection = styled.div`
  background: #ededed;
  border: 1px #c1c1c1 solid;
  border-radius: 3px;
  -moz-box-shadow: 0 0 25px 2px #2b2b2b;
  -webkit-box-shadow: 0 0 25px 2px #2b2b2b;
  box-shadow: 0 0 25px 2px #2b2b2b;
  color: #777;
  height: 70vh;
  padding: 0;
  width: 575px;
  z-index: 100000000;
`;

const Title = styled.h1`
  color: #363636;
  box-sizing: content-box;
  font-size: 1.25em;
  font-weight: normal;
  height: 1em;
  line-height: 1.5em;
  margin: 0;
  overflow: hidden;
  padding: 0.6em 1em 0.75em;
`;

const Body = styled.div`
  background: #fff;
  border: 1px #bdbdbd solid;
  padding: 1em;
  font-size: 1em;
  margin: 0 1em;
  height: 90%;
  overflow-y: auto;
`;

export const CommentFormTrigger: React.FC<{
  target: Discussable &
      WithDocs & WithHistory & WithNotes & { uid: string; title: string; selfReference: () => DocumentReference };
  storagePath: string;
}> = ({ target, storagePath, children }) => {
  const { title, uid, documents, comments, history, note, selfReference } = target;
  return <OverlayTrigger trigger="click" rootClose placement="auto" overlay={(
      <Popover id={`comment-window-${target.uid}`}>
        <CommentSection>
          <Title>{target.title}</Title>
          <Body>
            <Discussion model={{ note, history, comments, documents, selfReference }}
                        onModelChanged={model => target.selfReference().update(_.pick(model, ['comments', 'documents', 'note']))}
                        storagePath={storagePath}/>
          </Body>
        </CommentSection>
      </Popover>
  )}>
    {children}
  </OverlayTrigger>;
};

const ChecklistSection = styled(CommentSection)`
  background: #fff;
  height: 60vh;
  width: 450px;
  padding: 30px 40px;
`;

const ChecklistBody = styled(Body)`
  border: none;
  margin: 0;
  padding: 0;
`;

const ChecklistTitle = styled.h1`
  font-size: 23px;
  font-weight: 500;
  height: 30px;
  margin-bottom: 15px;
  overflow: hidden;
  padding-bottom: 30px;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Checklist = styled.h5`
  font-size: 13px;
  text-transform: uppercase;
  color: #373636;
  display: inline-block;
  line-height: 16px;
`;

const CompleteCount = styled.div`
  float: right;
  color: #373636;
  font-size: 13px;
  font-weight: 500;
  line-height: 16px;
`;

const HideCompleted = styled.span`
  cursor: pointer;
  float: right;
  color: #979797  ;
  font-size: 11px;
  font-weight: 500;
  line-height: 13px;
  padding-top: 2px;
`;

const StyledSubtask = styled.li`
  display: flex;
  align-items: center;
  position: relative;
  
  > :not(:last-child) {
    margin-right: 1rem;
  }
`;

export const ChecklistTrigger: React.FC<{ target: { uid: string; subtasks: Subtask[]; title: string; selfReference: () => DocumentReference }; isOwner?: boolean }> =
    ({ target, children, isOwner }) => {
  const [subtasks, setSubtasks] = useState(target.subtasks);
  const [completedHidden, setHidden] = useState(false);
  useEffect(() => setSubtasks(target.subtasks), [target.subtasks]);
  
  const checkSubtask = useCallback((state: boolean, id: string) => {
    const newArray = [...subtasks ?? []];
    const index = newArray.findIndex(st => st.id == id) ?? -1;
    newArray.splice(index, 1, { ...subtasks[index], completed: state });
    target.selfReference().update({ subtasks: newArray });
  }, [target, subtasks]);
  
  const updateSubtask = useCallback((title: string, id: string) => {
    const newArray = [...subtasks ?? []];
    const index = newArray.findIndex(st => st.id == id) ?? -1;
    newArray.splice(index, 1, { ...subtasks[index], title });
    target.selfReference().update({ subtasks: newArray });
  }, [target, subtasks]);
  
  const addTask = useCallback((title: string) => {
    target.selfReference().update({ subtasks: [...subtasks, { title, completed: false, id: cuid() }] as Subtask[] });
  }, [target, subtasks]);
  
  const removeTask = useCallback((id: string) => {
    const newArray = [...subtasks ?? []];
    const index = newArray.findIndex(st => st.id == id) ?? -1;
    newArray.splice(index, 1);
    target.selfReference().update({ subtasks: newArray });
  }, [target, subtasks]);
  
  return <OverlayTrigger trigger="click" rootClose placement="auto" overlay={(
      <Popover id={`comment-window-${target.uid}`}>
        <ChecklistSection>
          <ChecklistTitle>{target.title}</ChecklistTitle>
          <ChecklistBody>
            <div>
              <Checklist>Checklist</Checklist>
              <CompleteCount>{subtasks.filter(st => st.completed).length}/{subtasks.length} items completed</CompleteCount>
              <div style={{ textAlign: 'right' }}>
                <HideCompleted onClick={() => { setHidden(last => !last); }}>Hide Completed</HideCompleted>
              </div>
            </div>
            <ul style={{ marginTop: '2em' }}>
              { subtasks.filter(st => !completedHidden || !st.completed ).map((st) => (
                  <StyledSubtask key={st.id}>
                    { isOwner && <span className="fas fa-trash" onClick={() => removeTask(st.id)} style={{ position: 'absolute', right: '0', cursor: 'pointer' }}/> }
                    <FakeCheckbox checked={st.completed} onChange={e => checkSubtask(e.currentTarget.checked, st.id)}/>
                    <input type="text" placeholder="New item" readOnly={!isOwner} value={st.title} onChange={e => {
                      const title = e.currentTarget.value;
                      setSubtasks(l => {
                        const arr = [...l];
                        const index = subtasks.findIndex(_st => _st.id == st.id) ?? -1;
                        arr.splice(index, 1, { ...arr[index], title });
                        return arr;
                      });
                    }} onBlur={e => {
                      const index = subtasks.findIndex(_st => _st.id == st.id) ?? -1;
                      if (subtasks[index].title != target.subtasks[index].title) {
                        updateSubtask(e.currentTarget.value, st.id);
                      }
                    }}
                           style={{ flex: '1 0 auto', border: 'none', padding: '1rem', borderBottom: '1px solid lightgrey' }}/>
                  </StyledSubtask>
              ))}
              { isOwner && <StyledSubtask>
                <FakeCheckbox checked={false} disabled/>
                <input type="text" placeholder="New item" onBlur={e => {
                  addTask(e.currentTarget.value);
                  e.currentTarget.value = '';
                }}
                       style={{ flex: '1 0 auto', border: 'none', padding: '1rem', borderBottom: '1px solid lightgrey' }}/>
              </StyledSubtask> }
            </ul>
          </ChecklistBody>
        </ChecklistSection>
      </Popover>
  )}>
    {children}
  </OverlayTrigger>;
};
