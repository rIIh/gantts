import React, { useCallback, useEffect, useState } from 'react';
import { Project, Task } from '../../types';
import styled from 'styled-components';
import { Button, Modal, FormControl } from 'react-bootstrap';
import { useKeyUp } from '../../../common/lib/hooks';
import { LazyUserInfo } from '../../../user/types';
import { InviteModal } from './InviteForm';
import { useDispatch } from 'react-redux';
import { appActions } from '../../../common/store/actions';
import { useSimpleCollection, useSimpleReference } from '../../../firebase/hooks/useSimpleReference';
import { FakeCheckbox } from '../gantt/styled';
import { MyButton } from '../../../common/components/styled/Button';
import { useModal } from '../../../common/modal/context';
import _ from 'lodash';

export interface FormProps {
  task: Task;
  onChange: (selected: LazyUserInfo[]) => void;
  initialValue?: LazyUserInfo[];
}

const Input = styled.div`
  display: flex;
  align-items: center;
  
  > :not(:last-child) {
    margin-right: 4px;
  }
`;

const AssignForm: React.FC<FormProps> = ({ task, onChange, initialValue }) => {
  const filterPredicate = (user: LazyUserInfo) => user.displayName?.includes(filter);
  const [project] = useSimpleReference<Project>(task.project());
  const [filter, setFilter] = useState('');
  const [enrolled] = useSimpleCollection<LazyUserInfo>(project?.enrolled());
  const [selected, setSelected] = useState<LazyUserInfo[]>(initialValue ?? []);
  useEffect(() => setSelected(initialValue ?? []), [initialValue]);
  
  useEffect(() => {
    if (!_.isEqual(selected, initialValue)) {
      onChange(selected);
    }
  }, [selected]);
  
  return <div>
      <FormControl type="text" className="mb-4" placeholder="Search people or Resources" value={filter}
                   onChange={({ currentTarget }: React.ChangeEvent<HTMLInputElement>) => setFilter(currentTarget.value)}/>
      <h6>People</h6>
      { enrolled?.filter(filterPredicate).map(user => (
          <Input key={user.uid} style={{ position: 'relative' }} className="my-2">
            <FakeCheckbox expand checked={selected.map(u => u.uid).includes(user.uid)} onChange={({ currentTarget }) => {
              if (currentTarget.checked) {
                setSelected([...selected, user]);
              } else {
                setSelected(selected.filter(_user => !_user.displayName?.includes(user.displayName ?? '')));
              }
            }}/>
            <p className="pl-2 m-0" style={{ color: '#373636' }}>{user.displayName}</p>
          </Input>
      )) }
  </div>;
};

export interface AssignModalProps {
  task: Task;
  initialValue?: LazyUserInfo[];
  onHide?: () => void;
}

export const AssignModal: React.FC<AssignModalProps> = ({ task, initialValue, onHide }) => {
  const [selected, setSelected] = useState<LazyUserInfo[]>(initialValue ?? []);
  const [project] = useSimpleReference<Project>(task.project());
  const dispatch = useDispatch();
  const { showModal } = useModal(project && <InviteModal project={project}/>);
  
  useEffect(() => setSelected(initialValue ?? []), [initialValue]);
  
  const onSubmit = useCallback(async (selected: LazyUserInfo[]) => {
    dispatch(appActions.setBusy({ isBusy: true }));
    await task.selfReference().update({ assignedUsers: selected.map(s => s.uid) });
    dispatch(appActions.setBusy({ isBusy: false }));
    onHide?.();
  }, []);
  
  useKeyUp('Enter', () => {
    onSubmit(selected);
  });
  
  return <>
      <Modal.Body style={{ maxWidth: '404px' }}>
        {task && <AssignForm task={task} onChange={setSelected} initialValue={selected}/>}
        { project && <Button variant="link" onClick={showModal}>Add new person/resource</Button> }
      </Modal.Body>
      <Modal.Footer style={{ border: 'none' }}>
        <MyButton onClick={() => {
          onSubmit(selected);
        }}>
          Done
        </MyButton>
      </Modal.Footer>
  </>;
};

export default AssignForm;
