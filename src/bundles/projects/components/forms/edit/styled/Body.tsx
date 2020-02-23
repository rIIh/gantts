import styled from 'styled-components';
import Textarea from 'react-textarea-autosize';
import React, { useEffect, useRef, useState } from 'react';
import { Map } from 'immutable';
import { Modal, Overlay, Spinner } from 'react-bootstrap';
import { RemoteDocument } from '../../../../types';
import { uploadFile } from '../ModelBody';
import firebase from 'firebase';
import md5 from 'md5';
import { useTypedSelector } from '../../../../../../redux/rootReducer';
import cuid from 'cuid';
import { Blocker } from '../../../../../common/components/Blocker';

export const Main = styled(Modal.Body)`
  display: flex;
  flex: 1;
`;

export const MainBody = styled.div`
  overflow-x: hidden;
  padding: 40px 100px 40px 43px;
  width: 100%;
  word-break: break-word;
`;

export const MainSidebar = styled.div`
  border-left: 1px solid #DDD;
  flex: 0 0 320px;
  margin-left: auto;
  max-width: 320px;
  padding: 40px 30px 20px;
  position: relative;
  
  .form-group {
    > label {
      display: block;
      color: rgb(55, 54, 54);
    }
  }
`;

export const DiscussionDetail = styled.div`
  .section-header {
    font-size: 12px;
    font-weight: bold;
    letter-spacing: 2px;
    line-height: 14px;
    margin-bottom: 25px;
    text-transform: uppercase;
  }
  
  .full {
    width: 100%;
  }
  
  .section-body {
    margin-bottom: 70px;
  }
  
  .task-note {
    background-color: #F3F2E2;
    border: 1px solid transparent;
    font-size: 15px;
    line-height: 20px;
  }
  
  .task-note.message {
    display: block;
    overflow: hidden;
    padding: 12px 14px 22px;
    text-overflow: ellipsis;
  }
  
  .task-comment {
    margin-bottom: 50px;
    display: flex;
  }
`;

export const TaskCommentForm = styled.div`
  position: relative;
`;

export const StyledTextarea = styled(Textarea)`
  border: none;
  resize: none;
  
  &:focus {
   outline: none;
  }
`;

// export interface File {
//   name: string;
//   size: string;
// }

export const Dropzone = styled.div<{ show?: boolean }>`
  display: ${props => props.show ? null : 'none'};
  background-color: #f5f5f5;
  border: 1px dashed #ddd;
  font-size: 13px;
  margin-bottom: 12px;
  margin-top: 5px;
  padding: 8px 12px 7px;
`;

export const RichEditor = styled.div`
  min-height: 80px;
  line-height: normal;
  position: relative;
  z-index: 0;
  margin-top: 32px;
  padding: 11px 12px 35px 12px;
  background-color: #FFFFFF;
  border: 1px solid #CCCCCC;
  border-radius: 2px;
  color: inherit;
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  outline: none;
  
  ${StyledTextarea} {
      width: 100%;
  }
  
  .rich-editor-tools {
    bottom: 4px;
    position: absolute;
    right: 6px;
    
    i {
      cursor: pointer;
      margin: 7px;
      
      &.attachment {
        font-size: 15px;
      }
      &.tg-icon {
        background-image: none !important;
        color: #9ba2ab;
      }
    }
  }
  .dropzone {
    bottom: -1px;
    left: -1px;
    position: absolute;
    right: -1px;
    top: -1px;
  }
`;

type Remover = () => void;

interface CommentsProps {
  storage: firebase.storage.Reference;
  docUploaded?: (doc: RemoteDocument) => Remover;
  onSubmit?: (content: string, docs: string[]) => void;
  initialValue?: string;
  uploads?: boolean;
}

const StyledCommentsSection = styled.div`
  position: relative;
`;

export const CommentsSection: React.FC<CommentsProps> = ({ storage, docUploaded, onSubmit, initialValue, uploads }) => {
  const textRef = useRef<HTMLTextAreaElement>(null);
  const filesRef = useRef<HTMLInputElement>(null);
  const user = useTypedSelector(store => store.userState.user);
  const [state, setState] = useState(initialValue ?? '');
  const [files, setFiles] = useState<File[]>([]);
  const [docs, setRefs] = useState<Map<string, [firebase.storage.Reference, RemoteDocument, Remover | undefined]>>(Map());
  const [loading, setLoading] = useState(false);
  
  const attachFile = async (file: File) => {
    try {
      setFiles(l => [...l, file]);
      const ref = await uploadFile(storage, file);
      const doc: RemoteDocument = {
        uid: cuid(),
        title: file.name,
        updatedAt: new Date(),
        description: '',
        author: user!.uid,
        refPath: ref.fullPath,
        downloadURL: await ref.getDownloadURL(),
        versions: [],
      };
  
      const remover = docUploaded?.(doc);
  
      setRefs(l => l.set(md5(file.name + file.size), [ref, doc, remover]));
      setState(l => l + `\n![${file.name}](${doc.downloadURL})\n`);
    } catch (e) {
      alert(e.message);
    }
  };
  
  const deleteFile = (file: File, index: number) => {
    const [ref, date, remove] = docs.get(md5(file.name + file.size)) ?? [];
    if (ref) {
      ref.delete();
      remove?.();
      setRefs(l => l.delete(md5(file.name + file.size)));
      setFiles(l => {
        const result = [...l];
        result.splice(index, 1);
        return result;
      });
    }
  };
  
  return <Blocker show={loading} backdrop={<Spinner animation="border"/>}>
    <RichEditor onClick={() => {
      textRef.current?.focus();
    }}>
      <div className="muted sub-text right top-tip">Learn about <a className="muted underlined"
                                                                   href="http://support.teamgantt.com/article/120-markdown-formatting-for-comments"
                                                                   target="_blank">Markdown</a></div>
      <div className="dropzone">
        <input type="file" multiple style={{ display: 'none' }}/>
      </div>
      <StyledTextarea inputRef={textRef} placeholder="Enter comment here..." value={state} onChange={e => setState(e.currentTarget.value)}/>
      { uploads && <div className="rich-editor-tools" onClick={() => filesRef.current?.click()}><i className="tg-icon attachment"/></div> }
    </RichEditor>
    <Dropzone show={files.length > 0}>
      <ul>
        { files.map((file, i) => (
            <li key={i}>Attached <strong>{file.name}</strong>&nbsp;&nbsp;{file.size}&nbsp;&nbsp;
              <i className="tg-icon remove static delete-button right" onClick={() => deleteFile(file, i)}/>
            </li>
        ))}
      </ul>
      <input ref={filesRef} type="file" onChange={async e => {
        const files = e.currentTarget.files;
        e.currentTarget.files = null;
        setLoading(true);
        for (let i = 0; i < (files?.length ?? 0); i++) {
          const file = files?.item(i);
          if (file) {
            await attachFile(file);
          }
        }
        setLoading(false);
      }} multiple style={{ display: 'none' }}/>
    </Dropzone>
    <div className="muted sub-text left"><span className="link underline">Want to notify anyone?</span></div>
    <button className={'right tg-button tg-button--primary tg-button--slim' + (loading ? ' tg-button--disabled' : '')}
            disabled={loading} type="button" onClick={() => {
      onSubmit?.(state, [...docs.map(value => value[1].uid).values()]);
      setState('');
      setFiles([]);
      setRefs(Map());
    }
    }>Reply</button>
  </Blocker>;
};

export const DocDropStyled = styled.div`
  background-color: #F9F9F9;
  border: 1px dashed #DDD;
  border-radius: 2px;
  color: #979797;
  font-size: 14px;
  padding: 19px 0;
  text-align: center;
  width: 100%;
  
  i {
    font-size: 17px;
    margin-right: 5px;
    vertical-align: middle;
  }
  
  .browse-button {
    color: #373636;
    background-color: transparent;
    text-decoration: underline;
  }
`;

export const DestroyPopover = styled.div`
  z-index: 100000;
  width: 300px;
  position: relative;
  padding: 20px;
  box-shadow: 0 20px 20px 1px rgba(0, 0, 0, 0.09);

  .confirm-backdrop {
    background-color: rgba(255, 255, 255, 1);
    bottom: 0;
    left: 0;
    position: absolute;
    right: 0;
    top: 0;
    z-index: -10;
  }
  
  .confirm-body {
    text-align: center;
      z-index: 0;
  }
  
  .confirm-message {
    display: block;
    font-size: 0.9em;
    font-weight: 500;
    line-height: 1.5em;
    margin-bottom: 20px;
    
    p {
      color: #373636;
      font-size: 13px;
      line-height: 16px;
      text-align: center;
    }
  }
  
  .confirm-actions {
    > :not(:last-child) {
        margin-right: 10px;
    }
  }
`;
