import React, { useCallback, useEffect, useRef, useState } from 'react';
import { OverlayTrigger, Popover, Spinner } from 'react-bootstrap';
import { DocumentReference } from '../../../firebase/types';
import { useSimpleCollection, useSimpleReference } from '../../../firebase/hooks/useSimpleReference';
import { Project, Task, TaskGroup, TaskType } from '../../types';
import styled, { css } from 'styled-components';
import { DatesFilter, ProjectHeader } from '../gantt/ProjectHeader';
import { useTypedSelector } from '../../../../redux/rootReducer';
import { attachToProject } from '../../redux/thunks';
import { prettyNum } from '../utils';
import { ColorPill, FakeCheckbox, Milestone } from '../gantt/styled';
import { clamp } from '../../../common/lib/clamp';
import _ from 'lodash';
import { useDebounce } from '../../../common/hooks/lodashHooks';
import { useDispatch } from 'react-redux';
import { ProgressBar } from '../tasks/TaskItem';
import { AssignButton, Assigned, AssignedList } from '../gantt/styled/assign';
import { LazyUserInfo } from '../../../user/types';
import { userReferences } from '../../../user/firebase';
import { datesFilters, Filters } from '../../types/filter';
import { Colors, Palette } from '../../colors';
import { useModal } from '../../../common/modal/context';
import { AssignModal } from '../forms/AssignForm';
import { ExtraTools } from '../gantt/meta/ExtraTools';
import { useHover } from 'react-use-gesture';

const ProjectRow = styled.div`
    border-bottom: 2px #e9e9e9 solid;
    clear: both;
    font-weight: 600;
    font-size: 1.1em;
    margin-top: 1em;
    height: 38px;
    display: flex;
    align-items: center;
    
    &:hover {
      background: #f6f6f4;
    }
    
    &:last-child {
    }
`;

const ProjectContainer = styled.div`
    position: relative;
    margin: 0 5% 5em 5%;
    border: 1px #ccc solid;
    padding: 0 2em 2em 2em;
    min-width: 685px;
`;

const GroupRow = styled.div<{ level?: number }>`
    display: flex;
    border-bottom: 1px #e9e9e9 solid;
    clear: both;
    color: #131313;
    font-size: 1em;
    font-weight: 600;
    margin-top: ${props => props.level == 0 ? 1 : 0}em;
    padding: 0.5em 0;
    
    &:hover {
      background: #f6f6f4;
    }
`;

const Meta = styled.div`
    display: flex;
    padding-left: 12px;
    flex-flow: row nowrap;
    align-items: center;
    height: auto;
    color: #939393;
    float: left;
    font-size: 0.9em;
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
  position: relative;
`;

export const ProjectList: React.FC<{ doc: DocumentReference }> = ({ doc }) => {
    const user = useTypedSelector(state => state.userState.user);
    const [project, loading] = useSimpleReference<Project>(doc);
    const isOwner = project && user && project.owner().id == user.uid;
    const [groups] = useSimpleCollection<TaskGroup>(project?.taskGroups());
    const dispatch = useDispatch();
    useEffect(() => { project && dispatch(attachToProject(project)); }, [project]);
    
    const [filters, setFilters] = useState<Filters>({
        dateFilter: DatesFilter.DueToday,
        usersFilter: { include: [] },
        colorsFilter: [],
        hideCompleted: false,
    });
    
    const [isHovered, setHovered] = useState(false);
    const hover = useHover(({ hovering }) => setHovered(hovering));
    
    if (loading) {
        return <Spinner animation="grow"/>;
    } else if (!project) {
        return null;
    }

    return <ProjectContainer>
        <ProjectHeader hiddenCount={0} project={project}
                       initial={filters}
                       onAssignedFilter={isOwner ? filter => setFilters(l => ({ ...l, usersFilter: filter })) : undefined}
                       onDateFilter={filter => setFilters(l => ({ ...l, dateFilter: filter }))}
                       onColorsFilter={filter => setFilters(l => ({ ...l, colorsFilter: filter }))}
                       onCompletedFilter={filter => setFilters(l => ({ ...l, hideCompleted: filter }))}/>
        <ProjectRow {...hover()}>
            <Meta>
                <ExtraTools target={project} projectID={project.uid} isParentHovered={isHovered} isOwner={isOwner ?? false}/>
            </Meta>
            <Title>
                <h3><strong>{project?.title}</strong></h3>
            </Title>
        </ProjectRow>
        {groups.map(g => <GroupList isOwner={isOwner != null && isOwner} filters={filters} group={g}/>)}
    </ProjectContainer>;
};

const DateColumn = styled.div<{ overdue?: boolean }>`
  width: 140px;
  color: ${props => props.overdue ? '#c14b3a' : null};
`;

const AssignedColumn = styled.div`
  width: 20%;
  padding-right: 12px;
  text-align: end;
`;

const GroupList: React.FC<{ group: TaskGroup; level?: number; filters: Filters; isOwner: boolean }> = ({ group, level = 0, filters, isOwner }) => {
    const [groups] = useSimpleCollection<TaskGroup>(group.taskGroups());
    const user = useTypedSelector(state => state.userState.user);
    const [tasks] = useSimpleCollection<Task>(isOwner ? group.tasks() :
        group.tasks().where('assignedUsers','array-contains', user?.uid ?? 'no user'),[user?.uid]);
    const state = useTypedSelector(state => state.projectsState.calculatedProperties.get(group.uid));
    const calculated = useTypedSelector(state => state.projectsState.calculatedProperties);
    const [collapsed, setCollapsed] = useState(false);
    
    const filteredTasks = tasks.filter(task => datesFilters.get(filters.dateFilter)!(task) &&
        (filters.usersFilter.include.length == 0 || task.assignedUsers.some(u => filters.usersFilter.include.includes(u))) &&
        (filters.colorsFilter.length == 0 || filters.colorsFilter.includes(task.color)) &&
        ((!filters.hideCompleted || calculated.get(task.uid)?.progress != 100))
    );
    
    const [isHovered, setHovered] = useState(false);
    const hover = useHover(({ hovering }) => setHovered(hovering));
    
    if (filteredTasks.length == 0) { return null; }
    
    return <div>
        <GroupRow level={level ?? 0} {...hover()}>
            <Meta>
                <ExtraTools target={group} projectID={group.projectID} isParentHovered={isHovered} isOwner={isOwner}/>
            </Meta>
            <Title style={{ paddingLeft: `${(level ?? 0) + 1}rem` }}>
                <span className="project_manager__task_group_collapse" onClick={() => setCollapsed(l => !l)}>
            <span className={'fas ' + (collapsed ? 'fa-caret-right' : 'fa-caret-down')}/>
        </span>
                <b>{group.title}</b>
            </Title>
            <ProgressColumn>
                { prettyNum(state?.progress ?? 0) }%
            </ProgressColumn>
            <PillColumn/>
            <DateColumn>
                { level == 0 && 'Start' }
            </DateColumn>
            <DateColumn>
                { level == 0 && 'Due' }
            </DateColumn>
            <AssignedColumn>
                { level == 0 && 'Assigned' }
            </AssignedColumn>
        </GroupRow>
        { !collapsed && <>
            {groups?.map(g => <GroupList isOwner={isOwner} group={g} filters={filters} level={level + 1}/>)}
            {filteredTasks.map(g => <TaskAtom isOwner={isOwner} task={g} level={level + 1}/>)}
        </> }
    </div>;
};

const StyledTask = styled.div`
    display: flex;
    border-bottom: 1px #e9e9e9 solid;
    clear: both;
    color: #131313;
    padding: 0.5em 0;

    &:hover {
      background: #f6f6f4;
    }`;

const TaskAtom: React.FC<{task: Task; level: number; isOwner: boolean }> = ({ task, level, isOwner }) => {
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
        userReferences.users.where('uid','in', task.assignedUsers) : undefined);

    const [progress, setProgress] = useState(state?.progress ?? task.progress);
    useEffect(() => setProgress(state?.progress ?? 0), [state?.progress, task.progress]);
    const { showModal: showAssigneesModal, hideModal } = useModal(<AssignModal task={task} initialValue={assigned} onHide={() => hideModal()}/>,
        { animation: false, dialogClassName: `a${task.uid}_assign_modal` });
    const [editing, setEditing] = useState(false);
    const [isHovered, setHovered] = useState(false);
    const hover = useHover(({ hovering }) => setHovered(hovering));

    const progressRef = useRef<HTMLInputElement>(null);
    return <StyledTask {...hover()}>
        <Meta>
            <ExtraTools target={task} projectID={task.project().id} withChecklist isParentHovered={isHovered} isOwner={isOwner}/>
        </Meta>
        <Title style={{ paddingLeft: `${(level ?? 0) + 1}rem` }}>
            {task.title}
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
        { isOwner ? <OverlayTrigger trigger="click" placement="bottom" rootClose
                                    overlay={<Popover id="color-picker">
                                        <Popover.Content>
                                            { Object.keys(Palette).map((color, i) => (
                                                <>
                                                    <ColorPill color={color as Colors<Palette>}
                                                               onClick={() => task.selfReference().update({ color })}
                                                               style={{ width: '14px', height: '14px', marginRight: (i + 1) % 4 == 0 ? undefined : '4px', cursor: 'pointer' }}/>
                                                    { (i + 1) % 4 == 0 && <br/>}
                                                </>
                                            ))}
                                        </Popover.Content>
                                    </Popover>}>
            <PillColumn>
                { task.type == TaskType.Task ? <ProgressBar progress={state?.progress ?? task.progress ?? 0}
                                                            withoutInput
                                                            color={task.color}
                                                            dates={{ start: task.start, end: task.end }}/>
                : <Milestone color={task.color} style={{ margin: 'auto', position: 'relative', cursor: 'pointer' }}/>}
            </PillColumn>
        </OverlayTrigger> : <PillColumn>
            <ProgressBar progress={state?.progress ?? task.progress ?? 0}
                         withoutInput
                         color={task.color}
                         dates={{ start: task.start, end: task.end }}/>
        </PillColumn> }
        <DateColumn>
            { task.start?.toString('MMM dd, yyyy')}
        </DateColumn>
        <DateColumn overdue={(task.end?.compareTo(Date.today()) ?? 1) < 0}>
            { task.end?.toString('MMM dd, yyyy')}
        </DateColumn>
        <AssignedColumn>
            <AssignedList >
                {!assigned || assigned.length == 0 ?
                    (isOwner ? <AssignButton onClick={showAssigneesModal}>assign</AssignButton> : null) :
                    assigned.map(user => <Assigned key={user.uid}>{user.displayName}</Assigned>)}
            </AssignedList>
        </AssignedColumn>
    </StyledTask>;
};
