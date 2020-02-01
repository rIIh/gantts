import React, { useEffect, useState, Fragment, useRef, Component } from 'react';
import { useRouteMatch } from 'react-router';
import { TaskGroup, TaskGroupID, Task } from '../types/index';
import { useDispatch } from 'react-redux';
import { fetchTasksFor } from '../redux/thunks';
import '../styles/blocks/project_manager.scss';
import { Alert, Overlay } from 'react-bootstrap';
import { useTypedSelector } from '../../../redux/rootReducer';
import { render } from '@testing-library/react';

interface GanttRowProps {
  title: string;
  level: number;
  active: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onChange?: () => void;
  onDestroy?: () => void;
  onDots?: () => void;
}

const GanttRow: React.FC<GanttRowProps> = ({ title, level, active, onChange, onDestroy, onDots, onMouseEnter, onMouseLeave }) => {
  return <div
      className={'project_manager__task_row' + (active ? ' project_manager__task_row--active' : '')}
      style={{ marginLeft: level + 'rem' }}
      onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
    { title }
    <span className="toolbar" style={{ display: active ? undefined : 'none' }}>
      <span className="badge toolbar__button link" onClick={onChange}>
        <span className="fas fa-pen"/>
      </span>
      <span className="badge toolbar__button link" onClick={onDestroy}>
        <span className="fas fa-times"/>
      </span>
      <span className="badge toolbar__button link" onClick={onDots}>
        <span className="fas fa-ellipsis-v"/>
      </span>
    </span>
  </div>;
};

interface GanttTree {
  id: string;
  parentID?: string;
  title: string;
  start?: Date;
  end?: Date;
  subTrees?: GanttTree[];
  dependsOn?: Task;
  dependentOn?: Task;
}

interface GanttProps {
  tree: GanttTree;
}

const Gantt: React.FC<GanttProps> = ({ tree }) => {
  const renderTree = (tree: GanttTree): JSX.Element => {
    return <>
      <p>{tree.title}</p>
      { tree.subTrees?.map(renderTree) }
    </>;
  };
  
  return <div>
    { renderTree(tree) }
  </div>;
};

const ProjectPage: React.FC = () => {
  const { params } = useRouteMatch();
  const { projects, tasks, taskGroups, isFailed, isLoading, message } = useTypedSelector(state => state.projectsState);
  const [projectData, setProjectData] = useState(projects.find(p => p.id === params.id));
  const [projectTaskGroups, setGroups] = useState<TaskGroup[]>([]);
  const dispatch = useDispatch();
  const [projectTasks, setTasks] = useState<Map<TaskGroupID, Task[]>>();
  const [taskTree, setTree] = useState();

  const [showCreatorToolbar, setCreatorToolbar] = useState(false);
  const [activeRow, setActiveRow] = useState('');

  useEffect(() => {
    setProjectData(projects.find(p => p.id === params.id));
  }, [projects]);
  useEffect(() => {
    console.log(taskGroups);
    setGroups(taskGroups.get(projectData?.id || '') ?? []);
  }, [projectData, taskGroups]);
  useEffect(() => {
    const newMap = new Map<TaskGroupID, Task[]>();
    for (let group of projectTaskGroups) {
      newMap.set(group.id, tasks.get(group.id) ?? []);
    }
    setTasks(newMap);
  }, [projectTaskGroups]);
  useEffect(() => {
    if (projectData) {
      dispatch(fetchTasksFor(projectData?.id ?? ''));
    }
  }, [projectData]);

  useEffect(() => {
    if (!projectData) { return; }
    const root: GanttTree = {
      id: projectData.id,
      title: projectData.title,
      subTrees: [],
    };

    for (let group of projectTaskGroups) {
      const groupTree: GanttTree = {
        id: group.id,
        title: group.title,
        parentID: root.id,
        subTrees: [],
      };

      for (let task of projectTasks?.get(group.id) ?? []) {
        const taskTree: GanttTree = {
          ...task,
          parentID: groupTree.id,
        };
        groupTree.subTrees?.push(taskTree);
      }
      root.subTrees?.push(groupTree);
    }

    setTree(root);
  }, [projectTasks]);

  return <>
    <Gantt tree={taskTree}/>
    {/* { isFailed && <Alert variant="danger">{ message }</Alert>}
    { isLoading ? 'Loading' : 'Not loading'}
    { taskGroups.entries.length }
    <Overlay show={true}>
      <div className="project_manager__context_menu">
        <ul>
          <li>Insert Task Below</li>
          <li>Insert Milestone Below</li>
          <li>Insert Group Below</li>
          <div className="project_manager__context_divider"></div>
          <li>Duplicate</li>
          <div className="project_manager__context_divider"></div>
          <li>Edit</li>
          <li>Delete</li>
        </ul>
      </div>
    </Overlay>
    <div className="project_manager">
      <div className="project_manager__meta_column">
        
      </div>
      <div className="project_manager__task_column" onMouseEnter={() => setCreatorToolbar(true)} onMouseLeave={() => setCreatorToolbar(false)}>
        <GanttRow title={projectData?.title ?? ''} level={0}
                  active={activeRow === projectData?.id ?? 'undefined'}
                  onMouseEnter={() => setActiveRow(projectData?.id ?? '')} onMouseLeave={() => setActiveRow('')}
                  />
        { projectTaskGroups.map(taskGroup => (
          <Fragment key={taskGroup.id}>
            <GanttRow title={taskGroup.title} level={1}
                      active={activeRow === taskGroup.id}
                      onMouseEnter={() => setActiveRow(taskGroup.id)} onMouseLeave={() => setActiveRow('')}/>
            { projectTasks?.get(taskGroup.id)?.map(task => (
              <GanttRow title={task.title} level={2}
                        active={activeRow === task.id}
                        onMouseEnter={() => setActiveRow(task.id)} onMouseLeave={() => setActiveRow('')}/>
            )) }
          </Fragment>
        ))}
        <div className="project_manager__task_toolbar" style={{ display: showCreatorToolbar ? undefined : 'none' }}>
          <span className="fas fa-plus-circle flex-shrink-1"/>
          <button className="link">Task</button>
          <span className="unselectable">|</span>
          <button className="link">Milestone</button>
          <span className="unselectable">|</span>
          <button className="link">Group of tasks</button>
        </div>
      </div>
      <div className="project_manager__gantt_column">
      </div>
    </div> */}
  </>;
};

export default ProjectPage;