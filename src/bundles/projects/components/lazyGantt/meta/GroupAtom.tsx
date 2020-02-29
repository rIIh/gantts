import React, { CSSProperties, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { LazyProject, LazyTask, LazyTaskGroup } from '../../../types';
import { MetaColumn } from '../styled/meta';
import { useDrag, useHover } from 'react-use-gesture';
import { TaskAtom } from './TaskAtom';
import { allTasks, clearDependencies } from '../../../firebase/models';
import { LGanttContext, Meta } from '../LazyGantt';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import { useSimpleCollection } from '../../../../firebase/hooks/useSimpleReference';
import { prettyNum } from '../../utils';
import { ExtraTools } from './ExtraTools';
import { linkedSorter } from '../helpers';
import { useTypedSelector } from '../../../../../redux/rootReducer';
import { useModal } from '../../../../common/modal/context';
import { ProjectForm } from '../../forms/edit/wrappers/ProjectForm';
import { GroupForm } from '../../forms/edit/wrappers/GroupForm';
import { noop } from '../../../../common/lib/noop';
import { projectCollections } from '../../../firebase';
import { TaskConverter, TaskGroupConverter } from '../../../firebase/project_converter';
import { FirestoreApp } from '../../../../common/services/firebase';
import { CachedQueriesInstance } from '../../../../firebase/cache';
import firebase from 'firebase';
import { FieldPath, FieldValue } from '../../../../firebase/types';

interface Props {
  group: LazyTaskGroup;
  parentStack: string[];
  level: number;
}

export interface GroupState {
  progress?: number;
  collapsed?: boolean;
}

export const moveTask = async (from: string, to: string, batch: firebase.firestore.WriteBatch = FirestoreApp.batch(), initial = true) => {
  const fromRef = FirestoreApp.doc(from).withConverter(TaskConverter);
  const toRef = FirestoreApp.doc(to).withConverter(TaskConverter);
  
  const currentValue = await CachedQueriesInstance.getOnce<LazyTask>(fromRef);
  const currentClone: LazyTask = {
    ...currentValue,
    parentGroup: () => toRef.parent.parent!,
    selfReference: () => toRef.withConverter(TaskGroupConverter),
  };

  batch.delete(fromRef);
  batch.set(toRef, currentClone);
};

export const moveGroup = async (from: string, to: string, batch: firebase.firestore.WriteBatch = FirestoreApp.batch(), initial = true) => {
  const fromRef = FirestoreApp.doc(from).withConverter(TaskGroupConverter);
  const toRef = FirestoreApp.doc(to).withConverter(TaskGroupConverter);
  
  const currentValue = await CachedQueriesInstance.getOnce<LazyTaskGroup>(fromRef);
  const currentClone: LazyTaskGroup = {
    ...currentValue,
    taskGroups: () => toRef.collection(projectCollections.taskGroupsCollection),
    tasks: () => toRef.collection(projectCollections.tasksCollection),
    selfReference: () => toRef.withConverter(TaskGroupConverter),
    next: undefined,
  };
  const sibling = (await CachedQueriesInstance.getManyOnce<LazyTaskGroup | undefined>( fromRef.parent
      .where('next','==', currentValue.uid).withConverter(TaskGroupConverter)))[0];
  sibling && batch.update(sibling.selfReference(), { next: currentValue.next ?? null });
  batch.delete(fromRef);
  batch.set(toRef, currentClone);
  
  const groups = (await CachedQueriesInstance.getManyOnce<LazyTaskGroup>(currentValue.taskGroups()));
  for (let g of groups) {
    await moveGroup(g.selfReference().path, currentClone.taskGroups().doc(g.uid).path, batch, false);
  }
  
  const tasks = (await CachedQueriesInstance.getManyOnce<LazyTask>(currentValue.tasks()));
  for (let t of tasks) {
    await moveTask(t.selfReference().path, currentClone.tasks().doc(t.uid).path, batch, false);
  }
  
  if (initial) {
    await batch.commit();
  }
};

export const GroupAtom: React.FC<Props> = ({ group, level, parentStack }) => {
  const { title } = group;
  const { atomsState, writeAtomsState, sharedState, writeSharedState, findNode, groups, filters: { hideCompleted } } = useContext(LGanttContext)!;
  const groupState = useTypedSelector(state => state.projectsState.calculatedProperties.get(group.uid));
  const meta = atomsState.get(group.uid) as GroupState | undefined;
  const [isHovered, setHovered] = useState(false);
  const hovered = useHover(({ hovering }) => setHovered(hovering));
  const [subGroups] = useSimpleCollection<LazyTaskGroup>(group.taskGroups());
  const [groupTasks] = useSimpleCollection<LazyTask>(group.tasks());
  const sortedTasks = useMemo(() => [...groupTasks].sort(linkedSorter(el => el.uid)), [groupTasks]);
  const { showModal } = useModal(<GroupForm group={group}/>, { size: 'xl', animation: false });
  
  let lastElement = useRef<{ element: HTMLElement; lastState: { [key: string]: string }; activeSide: -1 | 0 | 1; isToolbar: boolean; isTask: boolean }>(null);
  const bindDrag = useDrag(({ first, movement: [_, my], last, event }) => {
    if (first) {
      event?.preventDefault();
      writeSharedState( {
        verticalDraggingSubjectUID: group.uid,
      });
    }
    if (event instanceof MouseEvent) {
      const { x, y } = { x: event.pageX, y: event.pageY };
      const elementBelow = document.elementsFromPoint(event.pageX, event.pageY).filter(e => e.matches('[data-group-meta], [data-group-meta] +' +
          ' [data-task-meta],' +
          ' [data-toolbar-meta]'));
      if (elementBelow.length > 0) {
        const target = elementBelow[0] as HTMLElement;
        const isTask = target.getAttribute('data-task-meta') != undefined;
        const isToolbar = target.getAttribute('data-toolbar-meta') != undefined;
        const rect = target.getBoundingClientRect();
        const side = isTask ? -1 : isToolbar ? 0 : (y > rect.top && y < rect.top + rect.height / 2 ? -1 : (
            y > rect.top + rect.height / 2 && y < rect.top + rect.height ? 1 : 0
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
    if (target.isTask) {
      // place to target parent
      const targetParent = groups.find(g => g.uid == target.element.getAttribute('data-task-parent') ?? '');
      if (!targetParent || parent == targetParent.uid) { return; }
      const newGroup = targetParent.taskGroups().doc(group.uid);
      await moveGroup(group.selfReference().path, newGroup.path);
    } else if (target.isToolbar) {
      const targetParent = groups.find(g => g.uid == target.element.getAttribute('data-toolbar-meta') ?? '');
      if (!targetParent) { return; }
      if (targetParent.selfReference().parent.parent!.id == parent) {
        // same group, just change next
        groups.find(g => g.next == group.uid)?.selfReference().update({ next: group.next ?? FieldValue.delete() });
        const next = targetParent.next ?? FieldValue.delete();
        targetParent.selfReference().update({ next: group.uid });
        await group.selfReference().update({ next });
      } else {
        const newGroup = targetParent.selfReference().parent.doc(group.uid);
        await moveGroup(group.selfReference().path, newGroup.path);
        const next = targetParent.next ?? FieldValue.delete();
        targetParent.selfReference().update({ next: newGroup.id });
        await newGroup.update({ next });
      }
    }
    else {
      switch (target.activeSide) {
        case -1: {
          // target is group; place before target
          const targetParent = groups.find(g => g.uid == target.element.getAttribute('data-group-meta') ?? '');
          if (!targetParent) { return; }
          groups.find(g => g.next == targetParent.uid)?.selfReference().update({ next: group.uid ?? FieldValue.delete() });
          groups.find(g => g.next == group.uid)?.selfReference().update({ next: group.next ?? FieldValue.delete() });
          if (targetParent.next == group.uid) {
            await targetParent.selfReference().update({ next: group.next ?? FieldValue.delete() });
          }
          await group.selfReference().update({ next: targetParent.uid });
          break;
        }
        case 1: // place inside target
          const targetParent = groups.find(g => g.uid == target.element.getAttribute('data-group-meta') ?? '');
          if (!targetParent || parent == targetParent.uid) { return; }
          const newGroup = targetParent.taskGroups().doc(group.uid);
          await moveGroup(group.selfReference().path, newGroup.path);
          break;
      }
    }
  };
  
  useEffect(() => {
      if (groupState?.progress == 100 && hideCompleted && !atomsState.get(group.uid)?.hidden) {
        writeAtomsState(group.uid, { hidden: true });
      } else if (atomsState.get(group.uid)?.hidden) {
        writeAtomsState(group.uid, { hidden: false });
      }
  }, [groupState?.progress, hideCompleted]);

  if (hideCompleted && groupState?.progress == 100) { return null; }
  
  const ignoreDrag =
      parentStack.includes(sharedState.verticalDraggingSubjectUID ?? '') ||
      group.uid == sharedState.verticalDraggingSubjectUID ||
      groupTasks.some(t => t.uid == sharedState.verticalDraggingSubjectUID);

  return (
      <>
        <div
            id={group.uid}
            data-group-meta={group.uid}
            data-group-parent={parentStack[parentStack.length - 1]}
            data-atom-meta={group.uid}
            className={'gantt__atom_meta gantt__atom_meta--group' + (isHovered ? ' gantt__atom_meta--active' : '')}
            style={ignoreDrag ? { pointerEvents: 'none', color: 'lightgrey' } : {}}
            {...hovered()}
        >
          <MetaColumn type="extra">
            <ExtraTools target={group} isParentHovered={isHovered} projectID={parentStack[0]} isOwner={true}/>
          </MetaColumn>
          <MetaColumn type="main" style={{ paddingLeft: `calc(${level}rem + 18px)` }}>
            {<span>{title}</span>}
            <span className="project_manager__task_group_collapse" onClick={() => writeAtomsState(group.uid, { collapsed: !meta?.collapsed })}>
        <span className={'fas ' + (meta?.collapsed ? 'fa-caret-right' : 'fa-caret-down')} />
      </span>
            <span className="project_manager__task_group_move" style={{ display: !isHovered ? 'none' : undefined }} {...bindDrag()}>
        <span className="fas fa-arrows-alt-v"/>
      </span>
            <span className="gantt__atom_meta_toolbar" style={{ display: isHovered ? undefined : 'none' }}>
      <span className="badge toolbar__button link" onClick={showModal}>
        <span className="fas fa-pen"/>
      </span>
      <span className="badge toolbar__button link" onClick={async () => {
        const promises: Promise<void>[] = [];
        // for (let task of await allTasks(group) ?? []) {
        //   promises.push(clearDependencies(task));
        // }
        await Promise.all(promises);
        await (await group.selfReference().parent.where('next', '==', group.uid).get()).docs[0]?.ref.update({ next: group.next ?? null });
        await group.selfReference().delete();
      }}>
        <span className="fas fa-times"/>
      </span>
      <span className="badge toolbar__button link">
        <span className="fas fa-ellipsis-v"/>
      </span>
    </span>
          </MetaColumn>
          <MetaColumn type="assigns"/>
          <MetaColumn type="progress" style={{ justifyContent: 'center', textAlign: 'center' }}>{ prettyNum(Math.floor((groupState?.progress ?? 0) * 10)/10) }%</MetaColumn>
        </div>
        { !meta?.collapsed && (
            <>
              { sortedTasks.map(task => <TaskAtom key={task.uid} task={task} parentStack={[...parentStack, group.uid]} level={level + 1}/>)}
              { subGroups?.sort(linkedSorter(el => el.uid)).reverse().map(_group => <GroupAtom key={_group.uid} parentStack={[...parentStack, group.uid]} level={level + 1} group={_group}/>)}
            </>
        )}
      </>
  );
};
