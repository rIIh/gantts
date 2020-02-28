import { Form, FormControl, OverlayTrigger, ToggleButton, ToggleButtonGroup } from 'react-bootstrap';
import ReactDatePicker from 'react-datepicker';
import { BitMaskInput } from '../../../../../../formik-bootstrap/components/FormikBitMaskInput';
import { LazyProject, LazyTask, ProjectState, WeekBitMask } from '../../../../../types';
import React, { useEffect, useState } from 'react';
import { DestroyPopover } from '../../styled/Body';
import _ from 'lodash';
import { diffDays } from '../../../../../../date/date';
import { clamp } from '../../../../../../common/lib/clamp';

type Model = Pick<LazyTask, 'start' | 'end' | 'dependsOn' | 'dependentOn'>;

export const TaskSidebar: React.FC<{ model: Model; onDestroyRequest?: () => void; onChange?: (newVal: Model) => void }> = ({ model, onDestroyRequest, onChange }) => {
  const [local, setState] = useState(model);
  useEffect(() => setState(model), [model]);
  useEffect(() => { if (!_.isEqual(model, local)) { onChange?.(local); }}, [local]);
  return (
      <Form className="edit-project-overlay-sidebar">
        <h2 className="section-header">TASK SETTINGS</h2>
        <Form.Group>
          <Form.Label>Days</Form.Label>
          <Form.Control value={local.start && local.end ? diffDays(local.start, local.end).toFixed(0) : undefined}
                        type="number"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const length = clamp(parseInt(e.currentTarget.value), 1, Number.POSITIVE_INFINITY);
                          const newEnd = local.start!.clone().addDays(length);
                          setState(l => ({ ...l, end: newEnd }));
                        }}
                        disabled={!local.start && !local.end}/>
        </Form.Group>
      </Form>
  );
};
