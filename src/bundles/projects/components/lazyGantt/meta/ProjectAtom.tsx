import React, { Fragment, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useHover } from 'react-use-gesture';
import { MetaColumn } from '../styled/meta';
import { LazyProject, LazyTask, LazyTaskGroup, TaskType } from '../../../types';
import { GroupAtom, GroupState } from './GroupAtom';
import styled from 'styled-components';
import { useKeyUp, useRefEffect } from '../../../../common/lib/hooks';
import { ProjectConverter, TaskConverter, TaskGroupConverter } from '../../../firebase/project_converter';
import { documents, projectCollections, projectReferences } from '../../../firebase';
import { UserConverter } from '../../../../user/firebase/converters/users';
import { useHistory } from 'react-router';
import { LGanttContext } from '../LazyGantt';
import { FirestoreApp } from '../../../../common/services/firebase';
import { prettyNum } from '../../utils';
import { ExtraTools } from './ExtraTools';
import { useModal } from '../../../../common/modal/context';
import { useTypedSelector } from '../../../../../redux/rootReducer';
import { ProjectForm } from '../../forms/edit/wrappers/ProjectForm';

interface Props {
  root: LazyProject;
  level: number;
  toolbar: boolean;
}

const Toolbar = styled.span`
  display: flex;
  align-items: center;
  
  > :not(:last-child) {
    margin-right: 4px;
  }
  
  > * {
    color: grey;
    
    &:not(:last-child) {
      margin-right: 4px;
    }
  }
`;

enum CreatingState {
  Task, TaskGroup, Milestone, None,
}

export const ProjectAtom: React.FC<Props> = ({ root, level, toolbar }) => {
  const { title } = root;
  const testGroups = useTypedSelector(state => state.projectsState.groups.get(root.uid));
  const groupState = useTypedSelector(state => state.projectsState.calculatedProperties.get(root.uid));
  const history = useHistory();
  const { atomsState, sharedState, tasks, groups } = useContext(LGanttContext)!;
  const bind = useHover(({ hovering }) => setHovered(hovering));
  const [isHovered, setHovered] = useState(false);
  const [isCollapsed, setCollapsed] = useState(false);
  const [creating, setCreating] = useState<CreatingState>(CreatingState.None);
  const [targetGroup, setTarget] = useState<LazyTaskGroup | null>(null);
  const [input] = useRefEffect<HTMLInputElement>(null, (input) => input?.focus());
  const [formTitle, setTitle] = useState('');
  
  const startCreation = (type: CreatingState, target: LazyTaskGroup) => {
    setCreating(type);
    setTarget(target);
  };
  
  const submitForm = useCallback(async () => {
    if (!formTitle || formTitle.length == 0 || !targetGroup) {
      return;
    }
    switch (creating) {
      case CreatingState.Milestone:
      case CreatingState.Task: {
        const doc = targetGroup.tasks().withConverter(TaskConverter).doc();
        await tasks.filter(task => task.parentGroup().id == targetGroup.uid).find(task => task.next == undefined)?.selfReference().update({ next: doc.id });
        doc.set({
          uid: doc.id,
          type: creating == CreatingState.Task ? TaskType.Task : TaskType.Milestone,
          selfReference: () => doc,
          color: 'Basic Blue',
          note: '',
          history: [],
          documents: [],
          comments: [],
          assignedUsers: [],
          parentGroup: () => FirestoreApp.doc(targetGroup.selfReference().path).withConverter(TaskGroupConverter),
          title: formTitle,
          project: () => FirestoreApp.doc(root.selfReference().path).withConverter(ProjectConverter),
          subtasks: [],
        }).catch(console.warn);
        break;
      }
      case CreatingState.TaskGroup: {
        const doc = root.taskGroups().doc().withConverter(TaskGroupConverter);
        targetGroup.selfReference().update({ next: doc.id }).then(console.log);
        doc.set({
          selfReference: () => doc,
          uid: doc.id,
          tasks: () => doc.collection(projectCollections.tasksCollection).withConverter(TaskConverter),
          taskGroups: () => doc.collection(projectCollections.taskGroupsCollection).withConverter(TaskGroupConverter),
          comments: [],
          next: targetGroup.next,
          documents: [],
          history: [],
          note: '',
          title: formTitle,
          projectID: root.uid,
        });
        break;
      }
    }
    setCreating(CreatingState.None);
    setTarget(null);
  }, [formTitle, targetGroup, creating]);
  
  useEffect(() => setTitle(''), [creating]);
  useKeyUp('Enter', () => {
    submitForm();
  });
  
  const { showModal } = useModal(<ProjectForm project={root}/>, { size: 'xl', animation: false });
  
  return (
      <>
        <div
            id={root.uid}
            className={'gantt__atom_meta gantt__atom_meta--group' + (isHovered ? ' gantt__atom_meta--active' : '')}
            {...bind()}>
        <MetaColumn type="extra">
         <ExtraTools target={root} isParentHovered={isHovered} projectID={root.uid}/>
          </MetaColumn>
          <MetaColumn type="main" style={{ paddingLeft: `calc(${level}rem + 18px)` }}>
            {<span>{title}</span>}
            <span className="project_manager__task_group_collapse">
        <span className={'fas ' + (isCollapsed ? 'fa-caret-right' : 'fa-caret-down')} onClick={() => setCollapsed(!isCollapsed)}/>
      </span>
            <span className="gantt__atom_meta_toolbar" style={{ display: isHovered ? undefined : 'none' }}>
      <span className="badge toolbar__button link" onClick={showModal}>
        <span className="fas fa-pen"/>
      </span>
      <span className="badge toolbar__button link" onClick={async () => {
        await Promise.all((await root.taskGroups().get()).docs.map(doc => doc.ref.delete()));
        await Promise.all((await root.enrolled().get()).docs.map(doc => doc.ref.delete()));
        await root.selfReference().delete();
        console.log('Project Destroyed');
        history.goBack();
      }}>
        <span className="fas fa-times"/>
      </span>
      <span className="badge toolbar__button link">
        <span className="fas fa-ellipsis-v"/>
      </span>
    </span>
          </MetaColumn>
          <MetaColumn type="assigns"/>
          <MetaColumn type="progress" style={{ justifyContent: 'center', textAlign: 'center' }}>{prettyNum(groupState?.progress ?? 0)}%</MetaColumn>
        </div>
        { testGroups?.map(group => (
            <Fragment key={group.uid}>
              <GroupAtom level={level + 1} parentStack={[root.uid]} group={group}/>
              { !atomsState.get(group.uid)?.collapsed && !atomsState.get(group.uid)?.hidden && (
                  <div className="gantt__meta_panel_toolbar"
                       data-toolbar-meta={group.uid}
                       data-toolbar-path={group.selfReference().path}
                       style={{ opacity: toolbar ? undefined : 0, pointerEvents: toolbar && sharedState.verticalDraggingSubjectUID != group.uid ? undefined : 'none' }}>
                    <MetaColumn type="extra"/>
                    <>
                      { creating === CreatingState.None || targetGroup?.uid != group.uid ? (
                          <Toolbar>
                            <span className="fas fa-plus-circle flex-shrink-1"/>
                            <button className="link" onClick={() => startCreation(CreatingState.Task, group)}>Task</button>
                            <span className="unselectable">|</span>
                            <button className="link" onClick={() => startCreation(CreatingState.Milestone, group)}>Milestone</button>
                            <span className="unselectable">|</span>
                            <button className="link" onClick={() => startCreation(CreatingState.TaskGroup, group)}>Group of tasks</button>
                          </Toolbar>
                      ) : (
                          <input ref={input} type="text" value={formTitle}
                                 onChange={(e) => setTitle(e.currentTarget.value)}
                                 onBlur={submitForm}/>
                      )}
                    </>
                  </div>
              )}
            </Fragment>
        ))}
      </>
  );
};
