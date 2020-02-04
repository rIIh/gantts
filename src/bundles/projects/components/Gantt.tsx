import React, { useEffect, useState } from 'react';
import { CalendarScale, ChangeType, GanttProps, GanttTree, GanttTreeConstructor, GanttTreeLevel } from '../types/gantt';
import { TaskType } from '../types';
import cuid from 'cuid';
import { GanttMetaPanel } from './GanttMetaPanel';
import { GanttCalendar } from './GanttCalendar';

export const Gantt: React.FC<GanttProps> = (props) => {
  const [tree, setTree] = useState(props.tree);
  const [insertAfter, setAfter] = useState<string>();
  const [formData, setFormData] = useState<GanttTreeConstructor>();
  const [mutationSource, setMutationSource] = useState<string>();

  useEffect(() => {
    setTree(props.tree);
  }, [props.tree]);

  const newAtom = (parent: GanttTree, type: TaskType) => {
    setFormData({
                  level: GanttTreeLevel.Atom,
                  title: '',
                  type: type,
                  parentID: parent.id,
                });
  };
  const newTask = (source: GanttTree) => {
    setMutationSource(source.id);
    newAtom(source, TaskType.Task);
  };
  const newMilestone = (source: GanttTree) => {
    setMutationSource(source.id);
    newAtom(source, TaskType.Milestone);
  };
  const newGroup = (source: GanttTree) => {
    setMutationSource(source.id);
    setFormData({
                  level: GanttTreeLevel.Group,
                  title: '',
                  parentID: tree.id,
                });
    setAfter(source.id);
  };
  const applyMetaChange = ({ title }: { title: string }) => {
    setFormData({ ...formData!, title });
  };

  const resolveForm = (tree: GanttTree): boolean => {
    if (tree.id === formData?.parentID) {
      let subtrees = tree.subTrees;
      if (subtrees) {
        if (formData?.level === GanttTreeLevel.Group) {
          let sourceIndex = subtrees.findIndex(el => el.id === insertAfter);
          if (sourceIndex === subtrees.length - 1) {
            subtrees.push({ ...formData, id: cuid(), subTrees: [] });
          } else {
            subtrees.splice(sourceIndex + 1, 0, { ...formData, id: cuid(), subTrees: [] });
          }
        } else if (formData?.level === GanttTreeLevel.Atom) {
          subtrees.push({ ...formData, id: cuid(), subTrees: [] });
        }
        return true;
      } else {
        return false;
      }
    } else {
      for (let subtree of tree.subTrees ?? []) {
        let resolved = resolveForm(subtree);
        if (resolved) {
          return true;
        }
      }
      return false;
    }
  };

  const attachToTree = () => {
    if (formData?.title == undefined || formData?.title === '') {
      setFormData(undefined);
      return;
    }
    resolveForm(tree);
    setFormData(undefined);

    props.onTreeChanged({ type: formData.level === GanttTreeLevel.Group ? ChangeType.GroupCreated : ChangeType.AtomCreated, payload: formData },
                        tree
    );
  };

  return <div className="gantt">
    <GanttMetaPanel {...{ ...props, tree: tree }}
                    onNewTask={newTask}
                    onNewGroup={newGroup}
                    onNewMilestone={newMilestone}
                    onTaskMetaChanged={applyMetaChange}
                    formData={formData}
                    formTarget={mutationSource ?? ''}
                    onSubmit={attachToTree}/>
    <GanttCalendar {...{ ...props, tree: tree }}
                   lengthInWeeks={24}
                   zoom={1}
                   scale={CalendarScale.Days}/>
  </div>;
};
