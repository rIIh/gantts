import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DiscussionDetail, MainSidebar, CommentsSection, MainBody, Main, Dropzone, DocDropStyled, RichEditor } from './styled/Body';
import { Discussable, WithDocs, WithHistory, WithNotes, RemoteDocument, Message } from '../../../types';
import { CommentHeader, UserPic } from '../../../../user/components/UserPic';
import ReactMarkdown from 'react-markdown';
import _ from 'lodash';
import { useTypedSelector } from '../../../../../redux/rootReducer';
import { FireStorage } from '../../../../common/services/firebase';
import cuid from 'cuid';
import firebase from 'firebase';
import { DocumentReference } from '../../../../firebase/types';
import { documents } from '../../../firebase';
import { CachedQueriesInstance } from '../../../../firebase/cache';
import styled from 'styled-components';
import { DocumentAttachment } from './styled/Document';
import TextareaAutosize from 'react-textarea-autosize';

export type BodyModel = Discussable & WithNotes & WithDocs & WithHistory & { selfReference: () => DocumentReference };

interface Props {
  model: BodyModel;
  storagePath: string;
  onModelChanged: (newValue: BodyModel) => void;
  sidebar: React.FC;
}

export const uploadFile = async (storage: firebase.storage.Reference, file: File): Promise<firebase.storage.Reference> => {
  const ref = storage.child(cuid());
  await ref.put(file);
  return ref;
};

export const Doc = styled.div`
  display: flex;
  width: 100%;
  
  .document-meta {
    color: #6F6F6F;
    font-size: 12px;
    line-height: 14px;
    margin-bottom: 9px;
  }
  
  > .thumbnail {
    margin-right: 1rem;
    width: 50px;
    
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }
  
  > .info {
    flex: 1 0 auto;
    
    a {
      color: ${props => props.theme.colors}
    }
  }
`;

const Documents = styled.div`
  > :not(:last-child) {
    margin-bottom: 28px;
  }
`;

const Comment = styled.li`
  img {
    max-width: 100%;
  }
`;

const NoteWindow = styled.div<{ editing?: boolean }>`
  background-color: #F3F2E2;
  border: 1px solid transparent;
  font-size: 15px;
  line-height: 20px;
  display: block;
  overflow: hidden;
  padding: 12px 14px 22px;
  text-overflow: ellipsis;
  border: ${props => props.editing ? '#5CBCD6 1px solid' : null};
  
  textarea {
    &:focus {
      outline: none;
      border: none;
    }
  }
`;

export const ModelBody: React.FC<Props> = ({ model, storagePath, onModelChanged, sidebar: Sidebar }) => {
  const [state, setState] = useState({ ...model });
  const { user } = useTypedSelector(state => state.userState);
  const [editComment, setEditComment] = useState<string | null>(null);
  useEffect(() => setState(model), [model]);
  useEffect(() => {
    if (!_.isEqual(state, model)) {
      onModelChanged?.(state);
    }
  }, [state]);
  
  const filesRef = useRef<HTMLInputElement>(null);
  
  const uploadDoc = useCallback(_.throttle((doc: RemoteDocument) => {
    model.selfReference().update({
      documents: [...model.documents ?? [], doc],
    });
    
    return async () => {
      const currentState = await CachedQueriesInstance.getOnce(model.selfReference()) as WithDocs;
      const newValue = currentState.documents;
      newValue.splice(newValue.findIndex(_doc => _doc.uid == doc.uid), 1);
      model.selfReference().update({ documents: newValue });
    };
  }, 1000), [model.selfReference]);
  
  const deleteComment = useCallback(_.throttle((id: string) => {
    (async () => {
      const currentState = await CachedQueriesInstance.getOnce(model.selfReference()) as Discussable;
      const updatedComments = [...currentState.comments];
      updatedComments.splice(updatedComments.findIndex(comment => comment.uid == id), 1);
      model.selfReference().update({ comments: updatedComments });
    })();
  }, 1000), [model]);
  
  const updateComment = useCallback(_.throttle((comment: Message) => {
    (async () => {
      const currentState = await CachedQueriesInstance.getOnce(model.selfReference()) as Discussable;
      const updatedComments = [...currentState.comments];
      const index = updatedComments.findIndex(_comment => comment.uid == _comment.uid);
      const lastValue = updatedComments[index]!;
      if (_.isEqual(lastValue, comment)) { return; }
      updatedComments.splice(index, 1, { ...lastValue, ...comment });
      await model.selfReference().update({ comments: updatedComments });
      setEditComment(null);
    })();
  }, 1000), [model]);
  
  const updateDocument = useCallback(_.throttle((doc: RemoteDocument) => {
    (async () => {
      const currentState = await CachedQueriesInstance.getOnce(model.selfReference()) as WithDocs;
      const updatedDocuments = [...currentState.documents];
      const index = updatedDocuments.findIndex(_doc => doc.uid == _doc.uid);
      const lastValue = updatedDocuments[index]!;
      if (_.isEqual(lastValue, doc)) { return; }
      updatedDocuments.splice(index, 1, { ...lastValue, ...doc });
      await model.selfReference().update({ documents: updatedDocuments });
      setEditComment(null);
    })();
  }, 1000), [model]);
  
  const [editingNote, setEditingNote] = useState(false);
  const [note, setNote] = useState(model.note);
  useEffect(() => setNote(model.note), [model.note]);
  
  return <Main>
    <MainBody>
      <DiscussionDetail>
        <h2 className="section-header">Notes</h2>
        <NoteWindow editing={editingNote} className="editable-text section-body full is-empty-prompt">
          { !editingNote ? <p onClick={() => setEditingNote(true)}>{ model.note.length > 0 ? model.note : 'Pin a note to this project' }</p> : (
              <TextareaAutosize style={{ width: '100%', background: 'transparent', resize: 'none' }} value={note} autoFocus onChange={e => setNote(e.currentTarget.value)} onBlur={() => {
                model.selfReference().update({ note });
                setEditingNote(false);
              }}/>
          )}
        </NoteWindow>
        <h2 className="section-header">Comments</h2>
        <section className="target-discussions section-body">
          <ul className="comment-list">
            {model.comments.map((comment) => (
                <Comment className="task-comment" key={comment.uid}>
                  <UserPic userID={comment.creator} size={48}/>
                  <div style={{ width: '100%', marginLeft: '1rem' }}>
                    <CommentHeader userID={comment.creator} updatedDate={comment.updatedAt}
                                   onDelete={() => deleteComment(comment.uid)}
                                   onEdit={() => setEditComment(last => last != comment.uid ? comment.uid : null)}/>
                    { editComment == comment.uid ? <CommentsSection docUploaded={uploadDoc} initialValue={comment.content}
                                                                    storage={FireStorage.ref(storagePath)}
                                                                    onSubmit={(content) => updateComment({
                                                                      ...comment,
                                                                      content,
                                                                      updatedAt: new Date(),
                                                                    })}/>
                        :
                        <ReactMarkdown source={comment.content}/> }
                        <div style={{ height: '2rem' }}/>
                    { comment.documents?.map(doc => model.documents.find(_doc => _doc.uid == doc))
                        .filter((doc): doc is RemoteDocument => doc != null)
                        .map(doc => (
                        <DocumentAttachment key={doc.uid} document={doc} onDescription={description => updateDocument({ ...doc, description })}/>
                    ))}
                  </div>
                </Comment>
            ))}
          </ul>
          <CommentsSection docUploaded={uploadDoc} storage={FireStorage.ref(storagePath)} uploads onSubmit={(content, documents) => setState(l => ({
            ...l,
            comments: [...l.comments, {
              uid: cuid(),
              content,
              documents,
              creator: user!.uid,
              updatedAt: new Date(),
            }],
          }))}/>
        </section>
        <h2 className="section-header">Documents</h2>
        <Documents className="documents section-body">
          { model.documents.sort((l, r) => -l.updatedAt.compareTo(r.updatedAt)).map(doc => (
              <Doc key={doc.uid}>
                <div className="thumbnail">
                  <a href={doc.downloadURL} target="_blank">
                    <img src={doc.downloadURL} alt={doc.title}/>
                  </a>
                </div>
                <div className="info">
                  <a href={doc.downloadURL}><strong>{ doc.title }</strong></a>
                  <p>{ doc.description }</p>
                  <span className="document-meta">
                    by {doc.author}, {doc.updatedAt.toString('dd/MM/yy')}
                  </span>
                </div>
              </Doc>
          ))}
          <DocDropStyled>
            <i className="tg-icon file-add muted"/>To add a document, drop files here, or
            <button className="browse-button" onClick={() => { filesRef.current?.click(); }}>browse.</button>
            <input ref={filesRef} type="file" onChange={async e => {
              const files = e.currentTarget.files;
              e.currentTarget.files = null;
              for (let i = 0; i < (files?.length ?? 0); i++) {
                const file = files?.item(i);
                if (file) {
                  const ref = await uploadFile(FireStorage.ref(storagePath), file);
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
                  await uploadDoc(doc);
                }
              }
            }} multiple style={{ display: 'none' }}/>
          </DocDropStyled>
        </Documents>
      </DiscussionDetail>
      {/*<h2 className="section-header">History</h2>
      <section className="section-body">
        <ul className="history-list">
          <li className="target-history-item"><span className="user-icon item-user-pic"
                                                    style={{ width: '50px', height: '50px', lineHeight: '50px', fontSize: '25px' }}>T</span><span
              className="target-history-item-author">Test</span><span className="item-timestamp">Feb 20, 2020 @ 7:46 am</span>
            <div className="target-history-item-details"><span className="target-history-item-action grey1-text">Project days set to </span><span
                className="target-history-item-name"> </span><strong className="target-history-item-value ">Sunday, Monday, Tuesday, Wednesday,
                                                                                                            Thursday, Friday, Saturday</strong></div>
          </li>
        </ul>
      </section>*/}
    </MainBody>
    <MainSidebar>
      <Sidebar/>
    </MainSidebar>
  </Main>;
};
