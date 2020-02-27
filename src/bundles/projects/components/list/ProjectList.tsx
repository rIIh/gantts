import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Spinner } from 'react-bootstrap';
import { DocumentReference } from '../../../firebase/types';
import { useSimpleCollection, useSimpleReference } from '../../../firebase/hooks/useSimpleReference';
import { LazyProject, LazyTask, LazyTaskGroup, TaskType } from '../../types';
import styled from 'styled-components';
import { FilterHeader } from '../lazyGantt/FilterHeader';
import { noop } from '../../../common/lib/noop';
import { useTypedSelector } from '../../../../redux/rootReducer';
import { MetaColumn } from '../lazyGantt/styled/meta';
import { attachToProject } from '../../redux/thunks';
import { prettyNum } from '../utils';
import { FakeCheckbox } from '../lazyGantt/styled';
import { clamp } from '../../../common/lib/clamp';
import _ from 'lodash';
import { useDebounce } from '../../../common/hooks/lodashHooks';
import { useDispatch } from 'react-redux';
import { Marker, ProgressBar } from '../tasks/TaskItem';
import { AssignButton, Assigned, AssignedList } from '../lazyGantt/styled/assign';
import { LazyUserInfo } from '../../../user/types';
import {userReferences} from "../../../user/firebase";

const ProjectRow = styled.div`
    border-bottom: 2px #e9e9e9 solid;
    clear: both;
    font-weight: 600;
    margin-top: 2em;
    height: 38px;
    display: flex;
    align-items: center;
    
    &:hover {
      background: #f6f6f4;
    }
`;

const ProjectContainer = styled.div`
    position: relative;
    margin: 0 5% 5em 5%;
    border: 1px #ccc solid;
    padding: 0 2em 0 2em;
    min-width: 685px;
`;

const GroupRow = styled.div<{ level?: number }>`
    display: flex;
    border-bottom: 1px #e9e9e9 solid;
    clear: both;
    color: #131313;
    font-size: 1.1em;
    font-weight: 600;
    margin-top: 1em;
    padding: 0.5em 0;

    &:hover {
      background: #f6f6f4;
    }
`;

const Meta = styled.div`
    color: #939393;
    float: left;
    font-size: 0.9em;
    height: 1em;
    white-space: nowrap;
    width: 7.5em;
`;

const Title = styled.div`
  flex: 1 0 auto;
`;

const ProgressColumn = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
`;

const PillColumn = styled.div`
  width: 100px;
  padding: 0 20px;
`;

export const ProjectList: React.FC<{ doc: DocumentReference }> = ({ doc }) => {
    const user = useTypedSelector(state => state.userState.user);
    const [project] = useSimpleReference<LazyProject>(doc);
    const isOwner = project && user && project.owner().id == user.uid;
    const [groups] = useSimpleCollection<LazyTaskGroup>(project?.taskGroups());
    const dispatch = useDispatch();
    useEffect(() => { project && dispatch(attachToProject(project)); }, [project]);
    if (!project) {
        return <Spinner animation="grow"/>;
    }
    return <ProjectContainer>
        <FilterHeader hiddenCount={0} project={project}
                      onAssignedFilter={isOwner ? noop : undefined}
                      onDateFilter={noop}
                      onColorsFilter={noop}
                      onCompletedFilter={noop}/>
        <ProjectRow>
            <Meta className="meta"/>
            <Title>
                <h3><strong>{project?.title}</strong></h3>
            </Title>
        </ProjectRow>
        {groups.map(g => <GroupList group={g}/>)}
    </ProjectContainer>;
};

const DateColumn = styled.div`
  width: 140px;
`;

const AssignedColumn = styled.div`
  width: 140px;
`;

const GroupList: React.FC<{ group: LazyTaskGroup; level?: number }> = ({ group, level = 0 }) => {
    const [groups] = useSimpleCollection<LazyTaskGroup>(group.taskGroups());
    const user = useTypedSelector(state => state.userState.user);
    const [tasks] = useSimpleCollection<LazyTask>(group.tasks()
        .where('assignedUsers','array-contains', user?.uid ?? 'no user'),[user?.uid]);
    const state = useTypedSelector(state => state.projectsState.calculatedProperties.get(group.uid));
    const [collapsed, setCollapsed] = useState(false);

    return <div style={{ marginBottom: '2em' }}>
        <GroupRow>
            <Meta/>
            <Title style={{ paddingLeft: `${(level ?? 0) + 1}rem` }}>
                <span className="project_manager__task_group_collapse" onClick={() => setCollapsed(l => !l)}>
            <span className={'fas ' + (collapsed ? 'fa-caret-right' : 'fa-caret-down')}/>
        </span>
                <h5><strong>{group.title}</strong></h5>
            </Title>
            <ProgressColumn>
                { prettyNum(state?.progress ?? 0) }%
            </ProgressColumn>
            <PillColumn/>
            <DateColumn>
                <strong>Start</strong>
            </DateColumn>
            <DateColumn>
                <strong>Due</strong>
            </DateColumn>
            <AssignedColumn>
                <strong>Assigned</strong>
            </AssignedColumn>
        </GroupRow>
        { !collapsed && <>
            {groups?.map(g => <GroupList group={g} level={level + 1}/>)}
            {tasks?.map(g => <TaskAtom task={g} level={level + 1}/>)}
        </> }
    </div>;
};

const StyledTask = styled.div`
    display: flex;
    border-bottom: 1px #e9e9e9 solid;
    clear: both;
    color: #131313;
    font-size: 1.1em;
    font-weight: 600;
    padding: 0.5em 0;

    &:hover {
      background: #f6f6f4;
    }`;

const TaskAtom: React.FC<{task: LazyTask; level: number}> = ({ task, level }) => {
    const state = useTypedSelector(state => state.projectsState.calculatedProperties.get(task.uid));
    const update = useDebounce((progress: number) => task.selfReference().update({ progress }), 600, [task]);
    const progressChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.currentTarget.type == 'checkbox') {
            console.log('changed');
            const newVal = e.currentTarget.checked ? 100 : 0;
            update(newVal);
            setProgress(newVal);
        } else {
            const float = parseFloat(e.currentTarget.value);
            const newVal = clamp(_.isNaN(float) ? 0 : float, 0, 100);
            update(newVal);
            setProgress(newVal);
        }
    }, [task]);

    const [assigned] = useSimpleCollection<LazyUserInfo>(
        task.assignedUsers.length > 0 ?
        userReferences.users.where('uid','in',task.assignedUsers) : undefined);

    const [progress, setProgress] = useState(state?.progress ?? task.progress);
    useEffect(() => setProgress(state?.progress ?? 0), [state?.progress, task.progress]);
    const [editing, setEditing] = useState(false);

    const progressRef = useRef<HTMLInputElement>(null);
    return <StyledTask>
        <Meta/>
        <Title style={{ paddingLeft: `${(level ?? 0) + 1}rem` }}>
            <h5>{task.title}</h5>
        </Title>
        <ProgressColumn>
            {task.type == TaskType.Task ? (
                <input type="text" onClick={e => e.currentTarget?.select()}
                       ref={progressRef}
                       style={{
                           width: '100%',
                           height: '100%',
                           border: 'none',
                           textAlign: 'center',
                           color: !state?.progress ? 'lightgrey' : '#62676d',
                       }}
                       onFocus={() => setEditing(true)}
                       onBlur={() => setEditing(false)}
                       value={`${prettyNum(progress ?? 0)}${editing ? '' : '%'}`}
                       onChange={progressChange}/>
            ) : (
                <FakeCheckbox ref={progressRef}
                              checked={(state?.progress ?? task.progress) == 100}
                              onChange={progressChange}/>
            )}
        </ProgressColumn>
        <PillColumn>
            <ProgressBar progress={state?.progress ?? task.progress ?? 0}
                         withoutInput
                         color={task.color}
                         dates={{ start: task.start, end: task.end }}/>
        </PillColumn>
        <DateColumn>
            { task.start?.toString('MMM dd, yyyy')}
        </DateColumn>
        <DateColumn>
            { task.end?.toString('MMM dd, yyyy')}
        </DateColumn>
        <AssignedColumn>
            <AssignedList >
                {!assigned || assigned.length == 0 ?
                    <AssignButton>assign</AssignButton> :
                    assigned.map(user => <Assigned key={user.uid}>{user.displayName}</Assigned>)}
            </AssignedList>
        </AssignedColumn>
    </StyledTask>;
};
