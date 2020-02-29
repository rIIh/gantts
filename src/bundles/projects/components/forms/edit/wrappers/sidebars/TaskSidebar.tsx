import { Form, FormControl, OverlayTrigger, ToggleButton, ToggleButtonGroup } from 'react-bootstrap';
import ReactDatePicker from 'react-datepicker';
import { BitMaskInput } from '../../../../../../formik-bootstrap/components/FormikBitMaskInput';
import { LazyProject, LazyTask, ProjectState, TaskType, WeekBitMask } from '../../../../../types';
import React, { useEffect, useState } from 'react';
import { DestroyPopover } from '../../styled/Body';
import _ from 'lodash';
import { diffDays } from '../../../../../../date/date';
import { clamp } from '../../../../../../common/lib/clamp';
import { Colors, Palette } from '../../../../../colors';
import { ColorPill } from '../../../../lazyGantt/styled';

type Model = Pick<LazyTask, 'start' | 'type' | 'end' | 'color'>;

export const TaskSidebar: React.FC<{ model: Model; onDestroyRequest?: () => void; onChange?: (newVal: Model) => void }> = ({ model, onDestroyRequest, onChange }) => {
  const [local, setState] = useState(model);
  useEffect(() => setState(model), [model]);
  useEffect(() => { if (!_.isEqual(model, local)) { onChange?.(local); }}, [local]);
  return (
      <Form className="edit-project-overlay-sidebar">
        <h2 className="section-header">TASK SETTINGS</h2>
        { model.type == TaskType.Task && <Form.Group>
          <Form.Label>Days</Form.Label>
          <Form.Control value={local.start && local.end ? diffDays(local.start, local.end).toFixed(0) : undefined}
                        type="number"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const length = clamp(parseInt(e.currentTarget.value), 1, Number.POSITIVE_INFINITY);
                          const newEnd = local.start!.clone().addDays(length);
                          setState(l => ({ ...l, end: newEnd }));
                        }}
                        disabled={!local.start && !local.end}/>
        </Form.Group> }
        <Form.Group>
          <Form.Label>Color</Form.Label>
          { Object.keys(Palette).map((color, i) => (
              <>
                <ColorPill color={color as Colors<Palette>}
                           active={local.color == color}
                           onClick={() => setState(l => ({ ...l, color: color as Colors<Palette> }))}
                           style={{ width: '16px', height: '16px', marginRight: (i + 1) % 4 == 0 ? undefined : '8px', cursor: 'pointer' }}/>
                { (i + 1) % 4 == 0 && <br/>}
              </>
          ))}
        </Form.Group>
      </Form>
  );
};
