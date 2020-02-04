import React from 'react';
import _ from 'lodash';
import { GanttTreeLevel } from '../types/gantt';

interface GanttRowProps {
  title: string;
  id: string;
  level: number;
  isHovered: boolean;
  onChange?: () => void;
  onDestroy?: () => void;
  onDots?: () => void;
  isForm: boolean;
}

const keys: GanttRowProps = {
  title: '',
  level: 0,
  isHovered: false,
  onChange: undefined,
  onDestroy: undefined,
  onDots: undefined,
  isForm: false,
  id: '',
};

export const GanttAtomMeta: React.FC<GanttRowProps & React.HTMLAttributes<HTMLDivElement>> = (props) => {
  const { id, title, level, isHovered, onChange, onDestroy, onDots, isForm } = props;
  const divProps = _.omit(props, Object.keys(keys));
  return <div
      id={id}
      className={'gantt__atom_meta' + (isHovered ? ' gantt__atom_meta--active' : '') + (level === GanttTreeLevel.Group ? ' gantt__atom_meta--group' : '')}
      style={{ paddingLeft: `calc(${level}rem + 12px)` }}
      {...divProps}
  >
    {isForm ? <input type="text"/> : title}
    <span className="gantt__atom_meta_toolbar" style={{ display: isHovered ? undefined : 'none' }}>
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
