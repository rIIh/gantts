import React from 'react';
import { DiscussionDetail, MainSidebar, CommentsSection, MainBody, Main, Dropzone, DocDrop } from './styled/Body';
import { Discussable } from '../../../types';
import { Model } from './types';

interface Props {
  model: Discussable;
  onCommentCreated: (comment: Comment) => void;
  onDocumentAttached: (doc: File) => void;
  sidebar: React.FC;
}

export const Body: React.FC<Props> = ({ model, onCommentCreated, onDocumentAttached, sidebar: Sidebar }) => {
  return <Main>
    <MainBody>
      <DiscussionDetail>
        <h2 className="section-header">Notes</h2>
        <div className="editable-text message section-body task-note full is-empty-prompt">Pin a note to this project</div>
        <h2 className="section-header">Comments</h2>
        <section className="target-discussions section-body">
          <ul className="comment-list"/>
          <CommentsSection/>
          <Dropzone/>
          <div className="muted sub-text left"><span className="link underline">Want to notify anyone?</span></div>
          <button className="right tg-button tg-button--primary tg-button--slim" type="button">Reply</button>
        </section>
        <h2 className="section-header">Documents</h2>
        <div className="documents section-body">
          <DocDrop/>
        </div>
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
