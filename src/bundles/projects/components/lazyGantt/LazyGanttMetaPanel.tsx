import React, { Fragment, useEffect, useState } from 'react';
import { LazyProject,  } from '../../types';
import { useKeyUp, useRefEffect } from '../../../common/lib/hooks';
import { MetaBackground, MetaColumn } from './styled/meta';
import styled from 'styled-components';
import { useHover } from 'react-use-gesture';
import { useCollectionReference } from '../../../firebase/hooks/useReference';
import { GroupAtom } from './meta/GroupAtom';
import { ProjectAtom } from './meta/ProjectAtom';

const BackgroundColumn = styled(MetaColumn)<{ title?: string }>`
  position: relative;
  align-items: start;
  justify-content: center;
  color: #9aa1aa;
  font-size: 0.7857em;
  
  ::before {
    content: '${props => props.title ?? ' '}';
    position: absolute;
    top: 0;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    height: ${props => props.theme.headerHeight}px;
    border-bottom: #eaeaea 1px solid;
  }
`;

const Header = styled.div`
  height: ${(props) => props.theme.headerHeight + props.theme.atomHeight}px;
`;

export const LazyGanttMetaPanel: React.FC<{ project: LazyProject }> = ({ project: _project }) => {
  const [project, setProject] = useState(_project);
  const [showToolbar, setToolbar] = useState(false);
  const bind = useHover(({ hovering }) => setToolbar(hovering));
  
  return <div className="gantt__meta_panel" {...bind()}>
    <MetaBackground>
      <BackgroundColumn type="extra"/>
      <BackgroundColumn type="main"/>
      <BackgroundColumn type="assigns" title="Assigned"/>
      <BackgroundColumn type="progress" title="Progress"/>
    </MetaBackground>
    <div className="gantt__meta_panel_background">
      <div className="gantt__meta_panel_col gantt__meta_panel_col_main"/>
      <div className="gantt__meta_panel_col gantt__meta_panel_col_assigns"/>
      <div className="gantt__meta_panel_col gantt__meta_panel_col_progress"/>
    </div>
    <Header/>
    <ProjectAtom root={project} level={1} toolbar={showToolbar}/>
  {/* !  Place atoms here */}
  </div>;
};
