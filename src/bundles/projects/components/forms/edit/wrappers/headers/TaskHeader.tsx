import React, { useCallback } from 'react';
import { Task } from '../../../../../types';
import { ModelHeader } from '../../ModelHeader';
import { Model } from '../../types';
import _ from 'lodash';

export const TaskHeader: React.FC<{ task: Task}> = ({ task }) => {
  const update = useCallback(_.debounce((model: Model) => {
    console.log(model);
    if (!(model.start && model.end) || model.end.compareTo(model.start) > 0) {
      task.selfReference().update({ ...model, title: model.title && model.title.length > 0 ? model.title : task.title });
    } else if (model.start && model.end) {
      task.selfReference().update({
        ...model,
        title: model.title && model.title.length > 0 ? model.title : task.title,
        start: model.end,
        end: model.start });
    }
  }, 500),[task]);
  const { title, progress = 0, start, end } = task;
  return <ModelHeader color={task.color} editable value={{ title, start, end, progress }} onChange={update}/>;
};
