import React, { Fragment, useContext, useEffect, useState } from 'react';
import { useHover } from 'react-use-gesture';
import { useCollectionReference } from '../../../../firebase/hooks/useReference';
import { MetaColumn } from '../styled/meta';
import { LazyProject, LazyTask, LazyTaskGroup, TaskType } from '../../../types';
import { GroupAtom, GroupState } from './GroupAtom';
import styled from 'styled-components';
import { useKeyUp, useRefEffect } from '../../../../common/lib/hooks';
import { ProjectConverter, TaskConverter, TaskGroupConverter } from '../../../firebase/project_converter';
import { projectCollections, projectReferences } from '../../../firebase';
import _ from 'lodash';
import { UserConverter } from '../../../../user/firebase/converters/users';
import { useHistory } from 'react-router';
import { LGanttContext } from '../LazyGantt';
import { FirestoreApp } from '../../../../common/services/firebase';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import { useSimpleCollection } from '../../../../firebase/hooks/useSimpleReference';
import { prettyNum } from '../../utils';
import { Palette } from '../../../colors';
import { ExtraTools } from './ExtraTools';
import { linkedSorter, sortOrderable } from '../helpers';

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

const createInitialGroup = _.debounce(function(root: LazyProject) {
  const initialGroupDoc = root.taskGroups().doc();
  const initialGroup: LazyTaskGroup = {
    uid: initialGroupDoc.id,
    projectID: root.uid,
    title: 'First Task Group',
    selfReference: () => initialGroupDoc,
    tasks: () => projectReferences.tasks(root.uid, initialGroupDoc.id).withConverter(TaskConverter),
    taskGroups: () => initialGroupDoc.collection(projectCollections.taskGroupsCollection).withConverter(TaskGroupConverter),
    comments: [],
    documents: [],
    history: [],
    notes: [],
  };
  initialGroupDoc.set(initialGroup);
}, 1000);

export const ProjectAtom: React.FC<Props> = ({ root, level, toolbar }) => {
  const { title } = root;
  const [subGroups] = useSimpleCollection<LazyTaskGroup>(root.taskGroups());
  const history = useHistory();
  const { sharedState } = useContext(LGanttContext)!;
  const bind = useHover(({ hovering }) => setHovered(hovering));
  const [isHovered, setHovered] = useState(false);
  const [isCollapsed, setCollapsed] = useState(false);
  const [creating, setCreating] = useState<CreatingState>(CreatingState.None);
  const [targetGroup, setTarget] = useState<LazyTaskGroup | null>(null);
  const [input] = useRefEffect<HTMLInputElement>(null, (input) => input?.focus());
  const [formTitle, setTitle] = useState('');
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    if (subGroups && subGroups.length > 0) {
      const newProgress = Math.floor(subGroups.map(g => (sharedState.get(g.uid) as GroupState | undefined)?.progress ?? 0)
          .reduce((acc, p) => acc + p) / subGroups.length * 10) / 10;
      if (progress != newProgress) {
        setProgress(newProgress);
      }
    } else {
      if (progress != 0) {
        setProgress(0);
      }
    }
  }, [sharedState]);
  
  useEffect(() => {
    createInitialGroup.cancel();
    if (subGroups?.length === 0) {
      createInitialGroup(root);
    }
    // createInitialGroup(root);
  }, [subGroups]);
  
  const startCreation = (type: CreatingState, target: LazyTaskGroup) => {
    setCreating(type);
    setTarget(target);
  };
  
  const submitForm = () => {
    if (!formTitle || formTitle.length == 0 || !targetGroup) {
      return;
    }
    switch (creating) {
      case CreatingState.Milestone:
      case CreatingState.Task: {
        const doc = targetGroup.tasks().withConverter(TaskConverter).doc();
        doc.set({
          uid: doc.id,
          type: creating == CreatingState.Task ? TaskType.Task : TaskType.Milestone,
          selfReference: () => doc,
          assigned: () => doc.collection(projectCollections.assignedCollection).withConverter(UserConverter),
          color: 'Basic Blue',
          notes: [],
          history: [],
          documents: [],
          comments: [],
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
          notes: [],
          title: formTitle,
          projectID: root.uid,
        });
        break;
      }
    }
    setCreating(CreatingState.None);
    setTarget(null);
  };
  
  useKeyUp('Enter', () => {
    submitForm();
  });
  
  useEffect(() => setTitle(''), [creating]);
  return (
      <>
        <div
            id={root.uid}
            className={'gantt__atom_meta gantt__atom_meta--group' + (isHovered ? ' gantt__atom_meta--active' : '')}
            {...bind()}>
        <MetaColumn type="extra">
         <ExtraTools target={root} isParentHovered={isHovered}/>
          </MetaColumn>
          <MetaColumn type="main" style={{ paddingLeft: `calc(${level}rem + 8px)` }}>
            {<span>{title}</span>}
            <span className="project_manager__task_group_collapse">
        <span className={'fas ' + (isCollapsed ? 'fa-caret-right' : 'fa-caret-down')} onClick={() => setCollapsed(!isCollapsed)}/>
      </span>
            <span className="gantt__atom_meta_toolbar" style={{ display: isHovered ? undefined : 'none' }}>
      <span className="badge toolbar__button link">
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
          <MetaColumn type="progress" style={{ justifyContent: 'center', textAlign: 'center' }}>{prettyNum(progress)}%</MetaColumn>
        </div>
        { sortOrderable(subGroups ?? [], e => e.uid).map(group => (
            <Fragment key={group.uid}>
              <GroupAtom level={level + 1} group={group}/>
              {!sharedState.get(group.uid)?.collapsed && (
                  <div className="gantt__meta_panel_toolbar"
                       style={{ opacity: toolbar ? undefined : 0, pointerEvents: toolbar ? undefined : 'none' }}>
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
