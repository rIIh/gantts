import React, { useCallback, useEffect, useRef, useState } from 'react';
import { connectElements } from '../../../../connections';
import styled from 'styled-components';
import { useTheme } from '../../../../styled-components/hooks/useTheme';
import { random } from '../../../../common/lib/random';
import { useTraceUpdate } from '../../../../common/hooks/useTraceUpdate';
import _ from 'lodash';
import { GanttTheme } from '../types';

export interface LinkState {
  from: HTMLElement | [number, number];
  to: HTMLElement | [number, number];
}

interface Props {
  state: LinkState;
  offsetResolver: (element: HTMLElement) => [number, number];
  // 0 to 100%
  color?: string;
  fromCenter?: boolean;
  toCenter?: boolean;
  vLeftPlace?: number;
  vRightPlace?: number;
  hDelta?: number;
  theme?: { hOffset: number; vOffset: number; weight?: number };
}

const Line = styled.div.attrs<{ style: { borderColor: string }}>(props => ({
  style: {
    borderColor: props.color,
  },
}))<{ lineType: 'v' | 'h'; color: string; weight?: number }>`
  position: absolute;
  border-right: ${({ lineType, weight = 1 }) => lineType == 'v' ? `${weight}px solid` : null};
  border-bottom: ${({ lineType, weight = 1 }) => lineType == 'h' ? `${weight}px solid` : null};
  z-index: 20;
`;

const floor = Math.floor;

const Link: React.FC<Props> = (props) => {
  const { state: { from, to }, offsetResolver, theme, fromCenter, toCenter, ...placement } = props;
  const { hOffset, vOffset } = theme ?? { hOffset: 10, vOffset: 15 };
  const [lines, setLines] = useState<JSX.Element[]>();
  const ganttTheme = useTheme<GanttTheme>();
  
  useEffect(() => {
    from instanceof HTMLElement && from.addEventListener('transitionend', update);
    to instanceof HTMLElement && to.addEventListener('transitionend', update);
    return () => {
      from instanceof HTMLElement && from.removeEventListener('transitionend', update);
      to instanceof HTMLElement && to.removeEventListener('transitionend', update);
    };
  }, [from, to]);
  
  const update = useCallback(() => {
    const elements: JSX.Element[] = [];
    const [fromX, fromY] = from instanceof HTMLElement ? offsetResolver(from) : [];
    const [toX, toY] = to instanceof HTMLElement ? offsetResolver(to) : [];
    const { hDelta, vLeftPlace, vRightPlace } = _.cloneDeep(placement);
    const fromWidth = from instanceof HTMLElement ? from.getBoundingClientRect().width : 0;
    const toWidth = to instanceof HTMLElement ? to.getBoundingClientRect().width : 0;
    const [linkFromX, linkFromY] = from instanceof HTMLElement ? [
      floor((fromX!) + (fromCenter ? fromWidth / 2 : fromWidth)),
      floor(fromY! + ((vRightPlace ? vRightPlace * 2 : 1) * from.clientHeight) / 2),
    ] : from.map(v => Math.round(v));
    const [linkToX, linkToY] = to instanceof HTMLElement ? [
      floor(toX! + (toCenter ? toWidth / 2 : 0)),
      floor(toY! + ((vLeftPlace ? vLeftPlace * 2 : 1) * to.clientHeight) / 2),
    ] : to.map(v => Math.round(v));
  
    const fOffset = fromCenter ? fromWidth / 2 : 0;
    const tOffset = toCenter ? toWidth / 2 : 0;
    
    let ltr = linkFromX + hOffset * 2 < linkToX;
    let utb = linkFromY < linkToY;
    const color = props.color ?? (linkFromX - 0.001 < linkToX ? '#c0c0c0' : ganttTheme.dangerColor);
      
        elements.push(<Line key={0} weight={theme?.weight} color={color} lineType="h" style={{ left: `${linkFromX}px`, width: `${hOffset + fOffset}px`, top: `${linkFromY}px` }}/>);
    elements.push(<Line key={1} weight={theme?.weight} color={color} lineType="v" style={{
      left: `${linkFromX + hOffset + fOffset}px`,
      height: `${ltr ? Math.abs(linkToY - linkFromY) : vOffset + (theme?.weight ?? 1)}px`,
      top: `${utb ? linkFromY : (ltr ? linkToY  + (theme?.weight ?? 1) : linkFromY - vOffset)}px`,
    }}/>);
    if (!ltr) {
      elements.push(<Line key={2} weight={theme?.weight} color={color} lineType="h" style={{
        left: `${linkToX - hOffset - tOffset}px`,
        width: `${linkFromX - linkToX + hOffset * 2 + tOffset + fOffset }px`,
        top: `${linkFromY + (!utb ? -vOffset : vOffset)}px`,
      }}/>);
      elements.push(<Line key={3} weight={theme?.weight} color={color} lineType="v" style={{
        left: `${linkToX - hOffset - tOffset}px`,
        height: `${Math.abs(linkToY - linkFromY) - vOffset}px`,
        top: `${utb ? linkFromY + vOffset : linkToY}px`,
      }}/>);
    }
    elements.push(<Line key={4} weight={theme?.weight} color={color} lineType="h" style={{
      left: `${ltr ? linkFromX + hOffset + fOffset : linkToX - hOffset - tOffset}px`,
      width: `${ltr ? linkToX - linkFromX - hOffset - fOffset : hOffset + tOffset}px`,
      top: `${linkToY}px`,
    }}/>);
    setLines(elements);
  }, [from, to, placement]);
  
  useEffect(() => {
    update();
  }, [from, to, props]);
  
  return <>
    {lines}
  </>;
};

export default Link;
