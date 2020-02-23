import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { RemoteDocument } from '../../../../types';
import TextareaAutosize from 'react-textarea-autosize';

const Attachment = styled.div`
  background-color: #F5F7F9;
  border-bottom-left-radius: 16px;
  border-top-right-radius: 16px;
  padding: 9px 14px 14px;
  width: 323px;
  
  display: flex;
  
  &:hover {
    background-color: #e2e3e5;
  }
  
  .thumbnail {
    width: 35px;
    margin-right: 14px;
  }
  
  .doc-name {
    font-size: 14px;
    font-weight: 600;
    line-height: 18px;
    padding: 2px 0;
    white-space: normal;
    word-wrap: break-word;
  }
`;

export const DocumentAttachment: React.FC<{ document: RemoteDocument; onDescription?: (description: string) => void }> = ({ document, onDescription }) => {
  const [description, setDescription] = useState(document.description);
  useEffect(() => setDescription(document.description), [document.description]);
  const [editDescription, setEditing] = useState(false);
  return <Attachment>
    <div className="thumbnail">
      <a href={document.downloadURL}>
        <img src={document.downloadURL} alt={document.title}/>
      </a>
    </div>
    <div className="meta">
      <div className="doc-name">{ document.title }</div>
      { !editDescription ? (
          <div className="doc-desc" onClick={() => setEditing(true)}>{ description.length == 0 ? 'Click to enter description' : description }</div>
      ) : (
          <TextareaAutosize value={description}
                            autoFocus
                            onChange={e => setDescription(e.currentTarget.value)}
                            onBlur={() => {
                              onDescription?.(description);
                              setEditing(false);
                            }}/>
      )}
    </div>
  </Attachment>;
};
