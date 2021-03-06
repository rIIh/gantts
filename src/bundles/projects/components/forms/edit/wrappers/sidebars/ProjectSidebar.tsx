import { Form, OverlayTrigger, ToggleButton, ToggleButtonGroup } from 'react-bootstrap';
import ReactDatePicker from 'react-datepicker';
import { BitMaskInput } from '../../../../../../formik-bootstrap/components/FormikBitMaskInput';
import { Project, ProjectState, WeekBitMask } from '../../../../../types';
import React, { useEffect, useState } from 'react';
import { DestroyPopover } from '../../styled/Body';
import _ from 'lodash';

type Model = Pick<Project, 'state' | 'startDate' | 'daysInWeekBitMask'>;

export const ProjectSidebar: React.FC<{ model: Model; onDestroyRequest?: () => void; onChange?: (newVal: Model) => void }> = ({ model, onDestroyRequest, onChange }) => {
  const [local, setState] = useState(model);
  useEffect(() => setState(model), [model]);
  useEffect(() => { if (!_.isEqual(model, local)) { onChange?.(local); }}, [local]);
  return (
      <Form className="edit-project-overlay-sidebar">
        <h2 className="section-header">PROJECT SETTINGS</h2>
        <Form.Group>
          <label>Status</label>
          <ToggleButtonGroup size="sm" type="radio" name="project_state" value={local.state}
                             onChange={(value: ProjectState) => setState(last => ({ ...last, state: value }))}>
            <ToggleButton variant="outline-secondary" value={ProjectState.Active}>Active</ToggleButton>
            <ToggleButton variant="outline-secondary" value={ProjectState.OnHold}>On Hold</ToggleButton>
            <ToggleButton variant="outline-secondary" value={ProjectState.Complete}>Complete</ToggleButton>
          </ToggleButtonGroup>
        </Form.Group>
        {/*<div className="form-group">
            <label>Template<i className="tg-icon circle-question sidebar-tooltip tooltip-target"><span className="tooltip undefined tooltip-center"
                                                                                                       style={{ width: '200px', marginLeft: '-100px' }}>This allows your project to be used as a template for new projects.</span></i></label>
            <div className="button-group">
              <button className="button toggle-button">Yes</button>
              <button className="button toggle-button selected" disabled>No</button>
            </div>
            <ToggleButtonGroup type="radio" name="project_is_template" value={0}>
              <ToggleButton variant="outline-secondary" value={0}>Yes</ToggleButton>
              <ToggleButton variant="outline-secondary" value={1}>No</ToggleButton>
            </ToggleButtonGroup>
          </div>*/}
        <Form.Group>
          <label>Start of Gantt</label>
          <div>
            <div className="react-datepicker-wrapper">
              <div className="react-datepicker__input-container">
                <ReactDatePicker wrapperClassName="form-control" selected={local.startDate} onChange={date => setState(last => ({ ...last, startDate: date ?? last.startDate }))}/>
              </div>
            </div>
          </div>
        </Form.Group>
        {/*<Form.Group>
            <label>Include in master workload view<i className="tg-icon circle-question sidebar-tooltip tooltip-target"><span
                className="tooltip undefined tooltip-center" style={{ width: '200px', marginLeft: '-100px' }}>Allow this project to be included when accessing the master workloads view (accessed from the sidebar)</span></i></label>
            <ToggleButtonGroup size="sm" type="radio" name="include_master_workload" value={0}>
              <ToggleButton variant="outline-secondary" value={0}>Yes</ToggleButton>
              <ToggleButton variant="outline-secondary" value={1}>No</ToggleButton>
            </ToggleButtonGroup>
          </Form.Group>*/}
        {/*<Form.Group>
          <label>Allow Scheduling on Holidays</label>
          <ToggleButtonGroup size="sm" type="radio" name="Scheduling on holidays" value={0}>
            <ToggleButton variant="outline-secondary" value={0}>Yes</ToggleButton>
            <ToggleButton variant="outline-secondary" value={1}>No</ToggleButton>
          </ToggleButtonGroup>
        </Form.Group>*/}
        <Form.Group>
          <label>Days in Week</label>
          <BitMaskInput shrink={3} bitmask={WeekBitMask} initialValue={local.daysInWeekBitMask} onChange={result => setState(last => ({ ...last, daysInWeekBitMask: result }))}/>
        </Form.Group>
        {/*<div className="form-group">
            <label>Export</label>
            <div>
              <a href="https://prod.teamgantt.com/gantt/export/pdf/print_setup.php?projects=2031621" target="_blank" style={{ marginRight: '10px' }}>
                <button className="tg-button tg-button--primary tg-button--x-small" type="button">PDF</button>
              </a>
              <button className="tg-button tg-button--primary tg-button--x-small" type="button">CSV</button>
            </div>
          </div>
          <div className="form-group">
            <label>Public Key</label>
            <input className="input full" placeholder="Must be at least 8 characters" type="text" defaultValue=""/>
          </div>*/}
        <div className="hr"/>
        <OverlayTrigger trigger="click" placement="top-end" rootClose={true} overlay={(
            <DestroyPopover className="confirm contained block ">
              <div className="confirm-backdrop"/>
              <div className="confirm-body">
                  <span className="confirm-message">
                    <div>
                      <p>Want to relive project memories and perfect your planning skills? Change your project status to complete instead. Completed projects don’t count against your plan limits.</p>
                      <p>Are you sure you want to delete <strong>NAMEOFPROJECT?</strong></p>
                    </div>
                  </span>
                <div className="confirm-actions">
                  <button className="confirm-action-confirm tg-button tg-button--primary tg-button--x-small tg-button--summer-heat"
                          onClick={() => { onDestroyRequest?.(); document.body.click(); }}
                          type="button">Yes,  Delete
                  </button>
                  <button className="confirm-action-cancel tg-button tg-button--text-complimentary tg-button--x-small" type="button"
                          onClick={e => document.body.click()}>Never mind
                  </button>
                </div>
              </div>
            </DestroyPopover>
        )}>
          <button className="link warning underlined delete-link" onClick={e => e.preventDefault()} style={{ color: '#FF8063' }}>Delete Project</button>
        </OverlayTrigger>
      </Form>
  );
};
