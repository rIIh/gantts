import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Task, TaskGroup, TaskType } from '../../../types';
import { MetaColumn } from '../styled/meta';
import { useDrag, useHover } from 'react-use-gesture';
import styled from 'styled-components';
import { AssignModal } from '../../forms/AssignForm';
import { GanttContext } from '../Gantt';
import { clearDependencies } from '../../../firebase/models';
import { useDispatch } from 'react-redux';
import { appActions } from '../../../../common/store/actions';
import _ from 'lodash';
import { clamp } from '../../../../common/lib/clamp';
import { useProgressUpdate } from '../../tasks/TaskItem';
import { DatesFilter } from '../ProjectHeader';
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
import { datesFilters } from '../../../types/filter';
import { FieldValue } from '../../../../firebase/types';
import { FirestoreApp } from '../../../../common/services/firebase';
import { moveTask } from './GroupAtom';
import { TaskConverter, TaskGroupConverter } from '../../../firebase/project_converter';
import { projectCollections } from '../../../firebase';
import { linkedSorter } from '../helpers';

interface Props {
  task: Task;
  parentStack: string[];
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

export const TaskAtom: React.FC<Props> = ({ task, level, parentStack }) => {
  const { title } = task;
  const { atomsState, writeAtomsState, writeSharedState, groups, tasks, sharedState, filters } = useContext(GanttContext)!;
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
      const lastState = atomsState?.get(task.uid)?.progress as number | undefined;
      const newState = task.subtasks.length > 0 ? _.without(task.subtasks.map(st => st.completed), false).length / task.subtasks.length * 100 : 0;
      if (lastState != newState) {
        setProgress(newState);
        writeAtomsState(task.uid, { progress: newState });
      }
    }
  }, [task]);

  const { showModal: showTaskDetails } = useModal(task && <TaskDetails taskReference={task.selfReference()}/>);

  const hideTask = useCallback((state: boolean) => {
    const hidden = atomsState?.get(task.uid)?.hidden;
    if (state) {
      hidden || writeAtomsState(task.uid, { hidden: true });
    } else {
      hidden && writeAtomsState(task.uid, { hidden: false });
    }
  }, [atomsState]);

  useEffect(() => {
    let needToHide = false;
    const hide = () => needToHide = true;

    if (filters.colorsFilter.length > 0 && !filters.colorsFilter.includes(task.color)) { hide(); }
    if (filters.hideCompleted && (remoteProgress == 100 || (localProgress == 100)) ) { hide(); }
    if (filters.usersFilter && filters.usersFilter.include.length > 0 && !assigned?.some(user => filters.usersFilter?.include.includes(user.uid))) { hide(); }
    if (!datesFilters.get(filters.dateFilter)!(task)) { hide(); }
  
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
  let lastElement = useRef<{ element: HTMLElement; lastState: { [key: string]: string }; activeSide: -1 | 0 | 1; isToolbar: boolean; isTask: boolean }>(null);
  const bindDrag = useDrag(({ first, movement: [_, my], last, event }) => {
    if (first) {
      event?.preventDefault();
      writeSharedState( {
        verticalDraggingSubjectUID: task.uid,
      });
    }
    if (event instanceof MouseEvent) {
      const { x, y } = { x: event.pageX, y: event.pageY };
      const elementBelow = document.elementsFromPoint(event.pageX, event.pageY).filter(e => e.matches('[data-group-meta], [data-task-meta],' +
          ' [data-toolbar-meta]'));
      if (elementBelow.length > 0) {
        const target = elementBelow[0] as HTMLElement;
        const isTask = target.getAttribute('data-task-meta') != undefined;
        const isToolbar = target.getAttribute('data-toolbar-meta') != undefined;
        const rect = target.getBoundingClientRect();
        const side = isToolbar ? 0 : (y > rect.top && y < rect.top + rect.height / 2 ? -1 : (
            y > rect.top + rect.height / 2 && y < rect.top + rect.height ? 1 : 1
        ));
        
        if (lastElement.current) {
          Object.entries(lastElement.current.lastState).forEach(([key, val]) => lastElement.current!.element.style.setProperty(key, val));
        }
        
        // @ts-ignore
        lastElement.current = {
          element: target,
          lastState: {
            'border-top': target.style.borderTop,
            'background': target.style.background,
            'border-bottom': target.style.borderBottom,
          },
          activeSide: side,
          isTask,
          isToolbar,
        };
        switch (side) {
          case -1: target.style.setProperty('border-top', '1px solid black'); break;
          case 0: target.style.setProperty('background', 'black'); break;
          case 1: target.style.setProperty('border-bottom', '1px solid black'); break;
        }
      } else {
        if (lastElement.current) {
          Object.entries(lastElement.current.lastState).forEach(([key, val]) => lastElement.current!.element.style.setProperty(key, val));
          // @ts-ignore
          lastElement.current = null;
        }
      }
    }
    if (last) {
      resolve();
      if (lastElement.current) {
        Object.entries(lastElement.current.lastState).forEach(([key, val]) => lastElement.current!.element.style.setProperty(key, val));
        // @ts-ignore
        lastElement.current = null;
      }
      writeSharedState( {
        verticalDraggingSubjectUID: undefined,
      });
    }
  });
  
  const resolve = async () => {
    const target = lastElement.current;
    const parent = parentStack[parentStack.length - 1];
    if (!target) { return; }
    const batch = FirestoreApp.batch();
    if (target.isTask) {
      // * place before or after target task in target parent
      const targetParent = groups.find(g => g.uid == target.element.getAttribute('data-task-parent') ?? '');
      const targetTask = tasks.find(t => t.uid == target.element.getAttribute('data-task-meta') ?? '');
      if (!targetParent || !targetTask) { return; }
      else if (parent == targetParent.uid) {
        // * dont move task, just change next pointers
        // * if side -1 -> place before target
        // * before:  someTask.next -> target.next -> potentially draggedTask
        // * after: someTask.next -> draggedTask.next -> target.next -> next of draggedTask
        if (target.activeSide == -1) {
          const someTask = tasks.find(t => t.next == targetTask.uid);
          if (someTask) { batch.update(someTask.selfReference(), { next: task.uid }); }
          if (targetTask.next == task.uid) {
            batch.update(targetTask.selfReference(), { next: task.next ?? FieldValue.delete() });
          } else {
            const taskWithPointerToDraggedTask = tasks.find(_task => _task.next == task.uid);
            if (taskWithPointerToDraggedTask) { batch.update(taskWithPointerToDraggedTask.selfReference(), { next: task.next ?? FieldValue.delete() }); }
          }
          batch.update(task.selfReference(), { next: targetTask.uid });
        } else if (target.activeSide == 1) {
          // * if side 1 -> place after target
          if (targetTask.next == task.uid) { return; }
          else {
              batch.update(targetTask.selfReference(), { next: task.uid });
              batch.update(task.selfReference(), { next: targetTask.next ?? FieldValue.delete() });
              const taskWithPointerToDraggedTask = tasks.find(_task => _task.next == task.uid);
              if (taskWithPointerToDraggedTask) { batch.update(taskWithPointerToDraggedTask.selfReference(), { next: task.next ?? FieldValue.delete() }); }
          }
        }
      } else {
        // * need to move task in target parent collection and handle pointers change
        // * Task popped from task parent linked collection and pushed to target parent linked collection
        const taskBeforeDraggedTask = tasks.find(_task => _task.next == task.uid);
        if (taskBeforeDraggedTask) { batch.update(taskBeforeDraggedTask.selfReference(), { next: task.next ?? FieldValue.delete() }); }
        // Popped
        const currentClone: Task = {
          ...task,
          parentGroup: () => targetParent.selfReference(),
          selfReference: () => targetParent.tasks().doc(task.uid),
          next: target.activeSide == -1 ? targetTask.uid : targetTask.next,
        };
        
        if (target.activeSide == -1) {
          const taskBeforeTarget = tasks.find(_task => _task.next == targetTask.uid);
          if (taskBeforeTarget) { batch.update(taskBeforeTarget.selfReference(), { next: task.uid }); }
        } else {
          batch.update(targetTask.selfReference(), { next: task.uid });
        }
  
        batch.delete(task.selfReference());
        batch.set(targetParent.tasks().doc(task.uid), currentClone);
      }
    } else if (target.isToolbar) {
      // * Need to create new group after toolbar parent group
      const toolbarGroup = groups.find(g => g.uid == target.element.getAttribute('data-toolbar-meta') ?? '');
      if (toolbarGroup) {
        const siblingDoc = toolbarGroup.selfReference().parent.doc();
        const sibling: TaskGroup = {
          selfReference: () => siblingDoc,
          uid: siblingDoc.id,
          tasks: () => siblingDoc.collection(projectCollections.tasksCollection).withConverter(TaskConverter),
          taskGroups: () => siblingDoc.collection(projectCollections.taskGroupsCollection).withConverter(TaskGroupConverter),
          comments: [],
          next: toolbarGroup.next,
          documents: [],
          history: [],
          note: '',
          title: 'New group',
          projectID: toolbarGroup.projectID,
        };
        batch.set(siblingDoc, sibling);
        batch.update(toolbarGroup.selfReference(), { next: sibling.uid });
        const taskBeforeDraggedTask = tasks.find(_task => _task.next == task.uid);
        if (taskBeforeDraggedTask) { batch.update(taskBeforeDraggedTask.selfReference(), { next: task.next ?? FieldValue.delete() }); }
        // Popped
        const currentClone: Task = {
          ...task,
          parentGroup: () => sibling.selfReference(),
          selfReference: () => sibling.tasks().doc(task.uid),
          next: undefined,
        };
  
        batch.delete(task.selfReference());
        batch.set(sibling.tasks().doc(task.uid), currentClone);
      }
      // * target.next -> ** inserted **.next -> someNextSubject
    } else {
      if (target.activeSide == -1) {
        // * Target is group
        // * If side -1 place to target parent collection before target
        const targetGroup = groups.find(g => g.uid == target.element.getAttribute('data-group-meta') ?? '');
        if (targetGroup) {
          const groupBefore = groups.find(g => g.next == targetGroup.uid);
          if (groupBefore?.uid == task.parentGroup().id) {
            return;
          } else if (groupBefore) {
            const taskBeforeDraggedTask = tasks.find(_task => _task.next == task.uid);
            if (taskBeforeDraggedTask) {
              batch.update(taskBeforeDraggedTask.selfReference(), { next: task.next ?? FieldValue.delete() });
            }
            batch.delete(task.selfReference());
            // Popped
            const currentClone: Task = {
              ...task,
              parentGroup: () => groupBefore.selfReference(),
              selfReference: () => groupBefore.tasks().doc(task.uid),
              next: undefined,
            };
            const taskBefore = tasks.find(_t => _t.parentGroup().id == groupBefore.uid && _t.next == undefined);
            if (taskBefore) {
              batch.update(taskBefore.selfReference(), { next: currentClone.uid });
            }
        
            batch.set(groupBefore.tasks().doc(task.uid), currentClone);
          } else {
            const siblingDoc = targetGroup.selfReference().parent.doc();
            const sibling: TaskGroup = {
              selfReference: () => siblingDoc,
              uid: siblingDoc.id,
              tasks: () => siblingDoc.collection(projectCollections.tasksCollection).withConverter(TaskConverter),
              taskGroups: () => siblingDoc.collection(projectCollections.taskGroupsCollection).withConverter(TaskGroupConverter),
              comments: [],
              next: targetGroup.uid,
              documents: [],
              history: [],
              note: '',
              title: 'New group',
              projectID: targetGroup.projectID,
            };
            batch.set(siblingDoc, sibling);
            batch.update(targetGroup.selfReference(), { next: sibling.uid });
            const taskBeforeDraggedTask = tasks.find(_task => _task.next == task.uid);
            if (taskBeforeDraggedTask) {
              batch.update(taskBeforeDraggedTask.selfReference(), { next: task.next ?? FieldValue.delete() });
            }
            // Popped
            const currentClone: Task = {
              ...task,
              parentGroup: () => sibling.selfReference(),
              selfReference: () => sibling.tasks().doc(task.uid),
              next: undefined,
            };
        
            batch.delete(task.selfReference());
            batch.set(sibling.tasks().doc(task.uid), currentClone);
          }
        }
      } else if (target.activeSide == 1) {
        // * else place inside target collection in start
        const targetGroup = groups.find(g => g.uid == target.element.getAttribute('data-group-meta') ?? '');
        if (targetGroup) {
          const taskBeforeDraggedTask = tasks.find(_task => _task.next == task.uid);
          if (taskBeforeDraggedTask) {
            batch.update(taskBeforeDraggedTask.selfReference(), { next: task.next ?? FieldValue.delete() });
          }
          batch.delete(task.selfReference());
          // Popped
      
          const firstTask = tasks.filter(t => t.parentGroup().id == targetGroup.uid).sort(linkedSorter(el => el.uid))[0];
          const currentClone: Task = {
            ...task,
            parentGroup: () => targetGroup.selfReference(),
            selfReference: () => targetGroup.tasks().doc(task.uid),
            next: firstTask?.uid,
          };
      
          batch.set(targetGroup.tasks().doc(task.uid), currentClone);
        }
      }
    }
    await batch.commit();
  };

  if (atomsState.get(task.uid)?.hidden) { return null; }
  
  return <div
      id={task.uid}
      data-atom-meta={task.uid}
      data-task-meta={task.uid}
      data-task-parent={task.parentGroup().id}
      className={'gantt__atom_meta' + (isHovered ? ' gantt__atom_meta--active' : '')}
      style={parentStack.includes(sharedState.verticalDraggingSubjectUID ?? '') ? { pointerEvents: 'none', color: 'lightgrey' } : {}}
      {...hovered()}
  >
    <MetaColumn type="extra">
      <ExtraTools target={task} withChecklist isParentHovered={isHovered} projectID={parentStack[0]} isOwner={true}/>
    </MetaColumn>
    <MetaColumn type="main" style={{ paddingLeft: `calc(${level}rem + 18px)` }}>
      <span className="project_manager__task_group_move" style={{ display: !isHovered ? 'none' : undefined }} {...bindDrag()}>
        <span className="fas fa-arrows-alt-v"/>
      </span>
      {<span>{title}</span>}
      <span className="gantt__atom_meta_toolbar" style={{ display: isHovered ? undefined : 'none' }}>
      <span className="badge toolbar__button link" onClick={showModal}>
        <span className="fas fa-pen"/>
      </span>
      <span className="badge toolbar__button link" onClick={() => {
        (async () => {
          // await clearDependencies(task);
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
