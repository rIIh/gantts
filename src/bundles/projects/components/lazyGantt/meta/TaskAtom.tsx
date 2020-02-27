import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { LazyTask, TaskType } from '../../../types';
import { MetaColumn } from '../styled/meta';
import { useHover } from 'react-use-gesture';
import styled from 'styled-components';
import { AssignModal } from '../../forms/AssignForm';
import { LGanttContext } from '../LazyGantt';
import { clearDependencies } from '../../../firebase/models';
import { useDispatch } from 'react-redux';
import { appActions } from '../../../../common/store/actions';
import _ from 'lodash';
import { clamp } from '../../../../common/lib/clamp';
import { useProgressUpdate } from '../../tasks/TaskItem';
import { DatesFilter } from '../FilterHeader';
import { TaskDetails } from '../../tasks/TaskDetails';
import { LazyUserInfo } from '../../../../user/types';
import { useSimpleCollection } from '../../../../firebase/hooks/useSimpleReference';
import { ExtraTools } from './ExtraTools';
import { prettyNum } from '../../utils';
import { DefaultCheckbox, FakeCheckbox } from '../styled';
import { Button, Modal } from 'react-bootstrap';
import { diffDays } from '../../../../date/date';
import { useModal } from '../../../../common/modal/context';
import { ProjectForm } from '../../forms/edit/wrappers/ProjectForm';
import { TaskForm } from '../../forms/edit/wrappers/TaskForm';
import { userReferences } from '../../../../user/firebase';

interface Props {
  task: LazyTask;
  level: number;
}

const AssignButton = styled.button`
  background-color: transparent;
  font-style: italic;
  color: grey;
  cursor: text;
`;

const AssignedList = styled.span`
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  overflow: hidden;
  white-space: nowrap;
`;

const Assigned = styled.p`
  font-size: 1em;
  overflow: hidden;
  margin: 0;
  padding-left: 4px;
  color: #646363;
  flex: 0 0 auto;
  
  &:not(:last-child)::after {
    content: ', ';
  }
`;

export const TaskAtom: React.FC<Props> = ({ task, level }) => {
  const { title } = task;
  const { sharedState, writeSharedState, filters } = useContext(LGanttContext)!;
  const [isHovered, setHovered] = useState(false);
  const hovered = useHover(({ hovering }) => setHovered(hovering));
  const [assigned] = useSimpleCollection<LazyUserInfo>(
      task.assignedUsers.length > 0 ?
      userReferences.users.where('uid','in', task.assignedUsers) : undefined,
      [task.assignedUsers]);
  const [remoteProgress, setRemoteProgress] = useState(task.progress);
  const progressRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (remoteProgress == undefined || remoteProgress == 0) { progressRef.current?.blur(); }}, [remoteProgress]);
  const [localProgress, setProgress] = useState(0);
  useProgressUpdate(task, remoteProgress ?? 0);
  const dispatch = useDispatch();
  
  const progressChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.currentTarget.type == 'checkbox') {
      console.log('changed');
      const newVal = e.currentTarget.checked ? 100 : 0;
      setRemoteProgress(newVal);
    } else {
      const float = parseFloat(e.currentTarget.value);
      const newVal = clamp(_.isNaN(float) ? 0 : float, 0, 100);
      setRemoteProgress(newVal);
    }
  }, [task, remoteProgress]);
  
  useEffect(() => {
    if (!task.progress || task.progress == 0) {
      const lastState = sharedState?.get(task.uid)?.progress as number | undefined;
      const newState = task.subtasks.length > 0 ? _.without(task.subtasks.map(st => st.completed), false).length / task.subtasks.length * 100 : 0;
      if (lastState != newState) {
        setProgress(newState);
        writeSharedState(task.uid, { progress: newState });
      }
    }
  }, [task]);

  const { showModal: showTaskDetails } = useModal(task && <TaskDetails taskReference={task.selfReference()}/>);

  const hideTask = useCallback((state: boolean) => {
    const hidden = sharedState?.get(task.uid)?.hidden;
    if (state) {
      hidden || writeSharedState(task.uid, { hidden: true });
    } else {
      hidden && writeSharedState(task.uid, { hidden: false });
    }
  }, [sharedState]);

  useEffect(() => {
    let needToHide = false;
    const hide = () => needToHide = true;

    if (filters.colorsFilter.length > 0 && !filters.colorsFilter.includes(task.color)) { hide(); }
    if (filters.hideCompleted && (remoteProgress == 100 || (localProgress == 100 && remoteProgress == 0))) { hide(); }
    if (filters.assignedFilter && !assigned?.some(user => filters.assignedFilter?.include.includes(user.uid))) { hide(); }
    switch (filters.dateFilter) {
      case DatesFilter.Completed: {
        if (remoteProgress != 100 && localProgress != 100) { hide(); }
        break;
      }
      case DatesFilter.DueToday: {
        if (!task.end || !task.end.isToday(Date.today())) { hide(); }
        break;
      }
      case DatesFilter.DueWithinOneWeek: {
        if (!task.end || !task.end.between(Date.today(), Date.today().addWeeks(1))) { hide(); }
        break;
      }
      case DatesFilter.DueWithinTwoWeek: {
        if (!task.end || !task.end.between(Date.today(), Date.today().addWeeks(2))) { hide(); }
        break;
      }
      case DatesFilter.DueWithinFourWeek: {
        if (!task.end || !task.end.between(Date.today(), Date.today().addWeeks(4))) { hide(); }
        break;
      }
      case DatesFilter.NotScheduled: {
        if (task.start && task.end) { hide(); }
        break;
      }
      case DatesFilter.StartingWithinOneWeek: {
        if (!task.start || !task.start.between(Date.today(), Date.today().addWeeks(1))) { hide(); }
        break;
      }
      case DatesFilter.StartingWithinTwoWeek: {
        if (!task.start || !task.start.between(Date.today(), Date.today().addWeeks(2))) { hide(); }
        break;
      }
      case DatesFilter.StartingWithinFourWeek: {
        if (!task.start || !task.start.between(Date.today(), Date.today().addWeeks(4))) { hide(); }
        break;
      }
      case DatesFilter.InProgress: {
        if (task.start && task.end && !Date.today().between(task.start, task.end)) { hide(); }
        break;
      }
      case DatesFilter.OnlyMilestones: {
        if (task.type != TaskType.Milestone) { hide(); }
        break;
      }
      case DatesFilter.Overdue: {
        if (!(localProgress != 100 && remoteProgress != 100 && task.end && task.end.compareTo(Date.today()) < 0)) { hide(); }
        break;
      }
    }
  
    if (needToHide) {
      hideTask(true);
    } else {
      hideTask(false);
    }
  }, [filters]);
  
  const assignRef = useRef<HTMLDivElement>(null);
  const { showModal: showAssigneesModal, hideModal } = useModal(<AssignModal task={task} initialValue={assigned} onHide={() => hideModal()}/>,
      { animation: false, dialogClassName: `a${task.uid}_assign_modal` });
  const showAssigneesForm = useCallback(() => {
    showAssigneesModal();
    requestAnimationFrame(() => {
      console.log(document.querySelector(`.a${task.uid}_assign_modal`));
      const doc = (document.querySelector(`.a${task.uid}_assign_modal`) as HTMLElement);
      if (!doc) { return; }
      const rect = assignRef.current?.getBoundingClientRect();
      const left = rect?.left ?? document.body.clientWidth / 2;
      const top = rect?.top ?? document.body.clientHeight / 2;
      const style = {
        position: 'absolute',
        width: '404px',
        left: `${(left) - 20}px`,
        top: `${(top) - (top > document.body.clientHeight / 3 * 2 ? doc.clientWidth / 2 + 40 : 60)}px`,
      };
      for (let [prop, val] of _.entries(style)) {
        doc.style.setProperty(prop, val);
      }
    });
  }, [task, showAssigneesModal]);
  
  const { showModal } = useModal(<TaskForm task={task}/>, { size: 'xl', animation: false });

  if (sharedState.get(task.uid)?.hidden) { return null; }
  
  return <div
      id={task.uid}
      className={'gantt__atom_meta' + (isHovered ? ' gantt__atom_meta--active' : '')}
      {...hovered()}
  >
    <MetaColumn type="extra">
      <ExtraTools target={task} withChecklist isParentHovered={isHovered}/>
    </MetaColumn>
    <MetaColumn type="main" style={{ paddingLeft: `calc(${level}rem + 8px)` }}>
      {<span>{title}</span>}
      <span className="gantt__atom_meta_toolbar" style={{ display: isHovered ? undefined : 'none' }}>
      <span className="badge toolbar__button link" onClick={showModal}>
        <span className="fas fa-pen"/>
      </span>
      <span className="badge toolbar__button link" onClick={() => {
        (async () => {
          await clearDependencies(task);
          await task.selfReference().delete();
        })();
      }}>
        <span className="fas fa-times"/>
      </span>
      <span className="badge toolbar__button link">
        <span className="fas fa-ellipsis-v"/>
      </span>
    </span>
    </MetaColumn>
    <MetaColumn ref={assignRef} type="assigns">
      <AssignedList onClick={showAssigneesForm}>
        {!assigned || assigned.length == 0 ?
            <AssignButton style={{ display: isHovered ? undefined : 'none' }}>assign</AssignButton> :
            assigned.map(user => <Assigned key={user.uid}>{user.displayName}</Assigned>)}
      </AssignedList>
    </MetaColumn>
    {/*<Modal show={showAssignList} >*/}
    {/*  <AssignModal task={task} initialValue={assigned} onHide={() => setAssignList(false)}/>*/}
    {/*</Modal>*/}
    <MetaColumn type="progress" style={{ justifyContent: 'center' }}>
      { task.type == TaskType.Task ? (
          <input type="text" ref={progressRef} onClick={() => progressRef.current?.select()} style={{
            width: '100%',
            height: '100%',
            border: 'none',
            textAlign: 'center',
            color: !remoteProgress || remoteProgress == 0 && localProgress == 0 ? 'lightgrey' : '#62676d',
          }}
                 value={`${prettyNum(!remoteProgress || remoteProgress == 0 ? localProgress : remoteProgress)}${document.activeElement == progressRef.current ? '' : '%'}`}
                 onChange={progressChange}/>
      ) : (
          <FakeCheckbox ref={progressRef}
                         checked={(!remoteProgress || remoteProgress == 0 ? localProgress : remoteProgress) == 100}
                         onChange={progressChange}/>
      )}
    </MetaColumn>
  </div>;
};
