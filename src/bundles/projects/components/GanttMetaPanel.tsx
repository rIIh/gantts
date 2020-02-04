import { GanttProps, GanttTree, GanttTreeConstructor, GanttTreeLevel } from '../types/gantt';
import React, { Fragment, useState } from 'react';
import { GanttAtomMeta } from './GanttMetaAtom';

interface GanttMetaPanelProps {
  onNewTask?: (source: GanttTree) => void;
  onNewMilestone?: (source: GanttTree) => void;
  onNewGroup?: (source: GanttTree) => void;
  onTaskMetaChanged?: (data: { title: string }) => void;
  onSubmit: () => void;
  formTarget: string;
  formData?: GanttTreeConstructor;
}

export const GanttMetaPanel: React.FC<GanttProps & GanttMetaPanelProps> = ({
                                                                      tree,
                                                                      onNewTask,
                                                                      onNewGroup,
                                                                      onNewMilestone,
                                                                      onTaskMetaChanged,
                                                                      onSubmit,
                                                                      formTarget,
                                                                      formData,
                                                                    }) => {
  const [activeMeta, setActiveMeta] = useState<GanttTree>();
  const [showTools, setTools] = useState(false);

  const createMeta = (tree: GanttTree): JSX.Element => {
    let isGroup = tree.level === GanttTreeLevel.Group;
    return <Fragment key={tree.id}>
      <GanttAtomMeta id={tree.id!} title={tree.title} level={tree.level} isHovered={activeMeta?.id === tree.id} isForm={false}
                     onMouseEnter={() => setActiveMeta(tree)} onMouseLeave={() => setActiveMeta(undefined)}/>
      {tree.subTrees?.map(createMeta)}
      {isGroup && formData === undefined && (
          <div className="project_manager__task_toolbar"
               style={{ opacity: showTools ? undefined : 0, pointerEvents: showTools ? undefined : 'none' }}>
            <span className="fas fa-plus-circle flex-shrink-1"/>
            <button className="link" onClick={() => onNewTask?.(tree)}>Task</button>
            <span className="unselectable">|</span>
            <button className="link" onClick={() => onNewMilestone?.(tree)}>Milestone</button>
            <span className="unselectable">|</span>
            <button className="link" onClick={() => onNewGroup?.(tree)}>Group of tasks</button>
          </div>
      )}
      {formData !== undefined && formTarget === tree.id && (
          <input type="text" value={formData?.title} onChange={(e) => onTaskMetaChanged?.({ title: e.currentTarget.value })} onBlur={onSubmit}/>
      )}
    </Fragment>;
  };

  return <div className="gantt__meta_panel" onMouseEnter={() => setTools(true)} onMouseLeave={() => setTools(false)}>
    <div className="gantt__meta_header">

    </div>
    {createMeta(tree)}
  </div>;
};
