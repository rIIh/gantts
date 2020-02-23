import React, { useCallback, useEffect, useState } from 'react';
import { LazyProject, LazyTask, Subtask } from '../../types';
import { FormControl, Modal, Row, Form, Col, Button, Figure, ListGroup, ListGroupItem, InputGroup, Spinner, Badge, Dropdown } from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import { Avatar, UserPic } from '../../../user/components/UserPic';
import { UsersRow } from '../../../user/routes/AccountSettings';
import { useDispatch } from 'react-redux';
import AssignForm, { AssignModal } from '../forms/AssignForm';
import { CheckField, DropdownLink } from '../lazyGantt/LazyGanttHeader';
import { LazyUserInfo } from '../../../user/types';
import { useSimpleCollection, useSimpleReference } from '../../../firebase/hooks/useSimpleReference';
import { DocumentReference } from '../../../firebase/types';
import _ from 'lodash';
import { useProgressUpdate } from './TaskItem';
import { clamp } from '../../../common/lib/clamp';
import cuid from 'cuid';
import { fractionByTruth, prettyNum } from '../utils';
import { ColorPill } from '../lazyGantt/styled';
import { Colors, Palette } from '../../colors';
import { useModal } from '../../../common/modal/context';

interface Props {
  taskReference: DocumentReference;
}

export const TaskDetails: React.FC<Props> = ({ taskReference }) => {
  const [task, loading] = useSimpleReference<LazyTask>(taskReference);
  const [assigned] = useSimpleCollection<LazyUserInfo>(task?.assigned());
  const [subtask, setSubtask] = useState('');
  const dispatch = useDispatch();
  const createSubtask = useCallback(() => {
    if (task && subtask.length > 0) {
      task.selfReference().update({ subtasks: [...task.subtasks, { title: subtask, completed: false, id: cuid() }] as Subtask[] });
    }
  }, [task, subtask]);
  
  const [localProgress, setProgress] = useState(0);
  const [remoteProgress, setRemoteProgress] = useState(task?.progress);
  useEffect(() => setRemoteProgress(task?.progress), [task]);
  
  useProgressUpdate(task, remoteProgress);
  
  const progressChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const float = parseFloat(e.currentTarget.value);
    const newVal = clamp(_.isNaN(float) ? 0 : float, 0, 100);
    setRemoteProgress(newVal);
    console.log('ProgressBar: Change');
  }, []);
  
  const checkSubtask = useCallback((state: boolean, id: number) => {
    if (task) {
      const newArray = [...task?.subtasks ?? []];
      newArray.splice(id, 1, { ...task.subtasks[id], completed: state });
      taskReference.update({ subtasks: newArray });
    }
  }, [task]);
  
  useEffect(() => {
    if (task && (!task.progress || task.progress == 0) && task.subtasks.length > 0) {
      const checklistProgress = fractionByTruth(task.subtasks, t => t.completed) * 100;
      console.log(checklistProgress, task.progress);
      if (!_.isEqual(localProgress, checklistProgress)) {
        setProgress(checklistProgress);
      }
    } else {
      if (localProgress != 0) {
        setProgress(0);
      }
    }
  }, [task, remoteProgress]);
  
  const { showModal } = useModal(task && <AssignModal task={task} initialValue={assigned ?? undefined}/>);
  
  if (!task || loading) { return <Spinner animation="grow" />; }
  
  return <>
    <Modal.Header style={{ alignItems: 'center' }}>
      <Modal.Title>
        {task.title}
      </Modal.Title>
      <Dropdown className="ml-2" >
        <Dropdown.Toggle as={DropdownLink} id="color-picker">
            <ColorPill color={task.color}
                       style={{ display: 'inline-block', height: '10px', width: '20px', cursor: 'pointer' }}/>
        </Dropdown.Toggle>
        <Dropdown.Menu>
          { _.entries(Palette).map(([name, color]) => (
              <Dropdown.Item onClick={() => taskReference.update({ color: name })}>
                <ColorPill color={name as Colors<Palette>}
                           style={{ display: 'inline-block', height: '10px', width: '20px', cursor: 'pointer', marginRight: '0.5rem' }}/>
                { name }
              </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown>
      <UsersRow style={{ marginLeft: 'auto' }}>
        {assigned?.map(user => <UserPic key={user.uid} withTooltip userID={user.uid}/>)}
        <Avatar size={32} style={{ backgroundColor: 'lightgrey', cursor: 'pointer' }}
                onClick={showModal}>
          <span className="fas fa-plus" style={{ margin: 'auto' }}/>
        </Avatar>
      </UsersRow>
    </Modal.Header>
    <Modal.Body>
      <Form.Row>
        <Form.Group as={Col} controlId="progress">
          <Form.Label column={false}>Progress</Form.Label>
          <Form.Control type="text" placeholder="0%" value={`${prettyNum(remoteProgress ?? localProgress)}%`} onChange={progressChange}/>
        </Form.Group>
        <Form.Group as={Col} controlId="progress">
          <Form.Label column={false}>Start</Form.Label>
          <DatePicker
              selected={task.start}
              dateFormat="MMMM d, yyyy"
              className="form-control"
              wrapperClassName="form-control"
              onChange={console.log}
          />
        </Form.Group>
        <Form.Group as={Col} controlId="progress">
          <Form.Label column={false}>End</Form.Label>
          <DatePicker
              selected={task.end}
              dateFormat="MMMM d, yyyy"
              className="form-control"
              wrapperClassName="form-control"
              onChange={console.log}
          />
        </Form.Group>
      </Form.Row>
      <h4>CHECKLIST</h4>
      <ListGroup>
        { task.subtasks.map((subtask, index) => (
            <ListGroupItem key={index}>
              <CheckField label={subtask.title} checked={subtask.completed} onChecked={checked => checkSubtask(checked, index)}/>
            </ListGroupItem>
        ))}
        <ListGroupItem>
          <InputGroup className="mb-3">
            <FormControl
                placeholder="Subtask title"
                aria-label="Subtask title"
                aria-describedby="basic-addon2"
                value={subtask}
                onChange={(e: { currentTarget: { value: React.SetStateAction<string> } }) => setSubtask(e.currentTarget.value)}
            />
            <InputGroup.Append>
              <Button variant="primary" onClick={createSubtask}>Send</Button>
            </InputGroup.Append>
          </InputGroup>
        </ListGroupItem>
      </ListGroup>
    </Modal.Body>
  </>;
};
