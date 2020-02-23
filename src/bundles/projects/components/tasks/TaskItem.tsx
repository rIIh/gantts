import React, { ChangeEvent, forwardRef, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { LazyTask } from '../../types';
import { LazyReference } from '../../../firebase/types';
import { useCollectionReference, useReference } from '../../../firebase/hooks/useReference';
import styled from 'styled-components';
import { FormCheck, Modal } from 'react-bootstrap';
import { clamp } from '../../../common/lib/clamp';
import _ from 'lodash';
import { Warning } from '../../../common/components/Warning';
import { useCollection, useCollectionData, useDocumentData } from 'react-firebase-hooks/firestore';
import { UserPic } from '../../../user/components/UserPic';
import { UsersRow } from '../../../user/routes/AccountSettings';
import { useDispatch } from 'react-redux';
import { appActions } from '../../../common/store/actions';
import { TaskDetails } from './TaskDetails';
import { LazyUserInfo } from '../../../user/types';
import { useSimpleCollection, useSimpleReference } from '../../../firebase/hooks/useSimpleReference';
import { fractionByTruth, prettyNum } from '../utils';
import { useModal } from '../../../common/modal/context';

interface Props {
  task: LazyReference<LazyTask>;
}

const Item = styled.div`
  display: flex;
  height: 74px;
  border: 2px solid #eee;
  border-radius: 4px;
  padding: 13px;
`;

const Progress = styled.div`
  position: relative;
  width: 74px;
  height: 100%;
  margin-right: 20px;
`;

const Marker = styled.div<{ state?: number }>`
  position: absolute;
  left: ${props => props.state ?? 0}%;
  width: 1px;
  height: 100%;
  background-color: grey;
`;

const Field = styled.div<{ filled?: number }>`
//#D8E5AE
  background-color: #D8E5AE;
  border-radius: 4px;
  position: absolute;
  display: flex;
  align-items: center;
  padding: 4px;
  top: 4px;
  width: 100%;
  height: calc(100% - 8px);
  overflow: hidden;
  
  ::before {
    content: ' ';
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    background-color: #88d04c;
    width: ${props => props.filled}%;
    z-index: 10;
    
    transition: width 200ms;
  }
  
  > * {
    z-index: 50;
  }
`;

const Check = styled.span<{ checked?: boolean }>`
  height: 24px;
  width: 24px;
  
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  
  background-color: white;
  border-radius: 4px;
  cursor: pointer;
  
  > span {
    color: ${({ checked }) => checked ? 'black' : 'lightgrey'}
  }
`;

const Input = styled.input.attrs(props => ({ type: 'text' }))`
  width: 100%;
  margin: auto 4px;
  font-size: 0.8em;
  background-color: transparent;
  border: none;
`;

const Checkbox: React.FC<{ checked?: boolean; onChange?: (newValue: boolean) => void }> = ({ checked, onChange }) => {
  const [value, setChecked] = useState(checked ?? false);
  useEffect(() => setChecked(checked ?? value), [checked]);
  const check = () => setChecked(prev => {
    onChange?.(!prev);
    return !prev;
  });
  
  return <Check checked={value} onClick={check}>
    <span className="fas fa-check"/>
  </Check>;
};

interface ProgressProps {
  progress: number;
  dates?: { start: Date; end: Date };
  onChange?: (newValue: number) => void;
}

const ProgressBar = forwardRef<HTMLInputElement, ProgressProps>(({ progress, dates, onChange }, ref) => {
    const [state, setState] = useState(progress);
    useEffect(() => setState(progress), [progress]);
    
    const progressChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const float = parseFloat(e.currentTarget.value);
      const newVal = clamp(_.isNaN(float) ? 0 : float, 0, 100);
      setState(newVal);
      console.log('ProgressBar: Change');
      onChange?.(newVal);
    }, [onChange]);
    
    const markerState = useMemo((): number => {
      if (!dates) { return 0; }
      const { start, end } = dates;
      const total = end.getTime() - start.getTime();
      const offset = Date.today().getTime() - start.getTime();
      return clamp(offset / total * 100, 0, 100);
    }, [dates]);
    
    return <Progress>
      { dates && <Marker state={markerState}/> }
      <Field filled={state}>
        <Checkbox checked={state == 100} onChange={checked => { checked ? setState(100) : setState(0); onChange?.(checked ? 100 : 0); }}/>
        <Input ref={ref} placeholder="0" value={prettyNum(state) + '%'} onChange={progressChange}/>
      </Field>
    </Progress>;
});

export async function updateProgress(task: LazyTask, progress: number | undefined) {
  if (!task.progress && progress == 0 || task.progress == progress) { return; }
  try {
    await task.selfReference().update({ progress: progress });
    console.log('Progress updated: ', progress);
  } catch (e) {
    console.warn(e);
  }
}

export const useProgressUpdate = (task: LazyTask | null, progress: number | undefined) => {
  const debounceAction = useCallback(_.debounce(updateProgress, 600), []);
  useEffect(() => { task && debounceAction(task, progress); }, [progress]);
};


export const TaskItem: React.FC<Props> = ({ task }) => {
  const [taskData, loading, error] = useSimpleReference<LazyTask>(task.Reference);
  const [assigned] = useSimpleCollection<LazyUserInfo>(taskData?.assigned());
  const [remoteProgress, setProgress] = useState(taskData?.progress);
  const [localProgress, setLocalProgress] = useState(0);
  const progressRef = useRef<HTMLInputElement>(null);
  const { showModal } = useModal(taskData && <TaskDetails taskReference={taskData.selfReference() || null}/>);
  useEffect(() => { console.log(progressRef.current); if (remoteProgress == undefined) { progressRef.current?.blur(); } }, [remoteProgress]);
  useEffect(() => setProgress(taskData?.progress), [taskData]);
  useEffect(() => setLocalProgress(fractionByTruth(taskData?.subtasks ?? [], e => e.completed) * 100), [taskData]);
  useEffect(() => {task.connect();}, []);
  
  useProgressUpdate(taskData ?? null, remoteProgress);
  
  return <Item >
    <Warning message={error?.message}/>
    <ProgressBar progress={remoteProgress ?? localProgress} ref={progressRef} dates={taskData && taskData.start ? { start: taskData.start!, end: taskData.end! } : undefined} onChange={setProgress}/>
    <p onClick={showModal}>{ taskData?.title }</p>
    <UsersRow style={{ marginLeft: 'auto' }}>
      { assigned?.map(user => <UserPic key={user.uid} withTooltip userID={user.uid}/>)}
    </UsersRow>
  </Item>;
};
