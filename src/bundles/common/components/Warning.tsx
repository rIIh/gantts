import React from 'react';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';

export const Warning: React.FC<{ message?: string }> = ({ message }) => {
  return <>
    { message && <OverlayTrigger overlay={(props: any) => <Tooltip {...props} show={props.show.toString()}>{ message }</Tooltip>}>
      <span className="fas fa-exclamation-triangle text-warning"/>
    </OverlayTrigger>}
  </>;
};
