import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { CalendarContext } from '../LazyGanttCalendar';
import { LazyTask } from '../../../types';
import Link from './Link';
import { useTheme } from '../../../../styled-components/hooks/useTheme';
import { hash } from 'immutable';
import { useTraceUpdate } from '../../../../common/hooks/useTraceUpdate';
import { GanttTheme } from '../types';
import { LGanttContext } from '../LazyGantt';

interface LinkerProps {
  // * [ from, to ][]
  links: ([string, string, boolean, boolean])[];
  container: HTMLElement;
}

export const Linker: React.FC<LinkerProps> = ({ links, container }) => {
  const { atomElements } = useContext(CalendarContext);
  const { atomHeight } = useTheme<GanttTheme>();
  const { atomsState } = useContext(LGanttContext)!;
  const [map, setMap] = useState(new Map<string, number>());
  
  // useTraceUpdate({links, atomElements, atomsState});

  useEffect(() => {
    const newMap = new Map<string, number>();
    console.log('Linker: Atoms changed');
    for (let [ from, to ] of links) {
      newMap.set(from + 'right', (newMap.get(from + 'right') ?? 0) + 1);
      newMap.set(to + 'left', (newMap.get(to + 'left') ?? 0) + 1);
    }
    setMap(newMap);
  }, [links]);
  
  const offsetResolver = useCallback((el): [number, number] => [el.offsetLeft, el.offsetTop + el.parentElement!.offsetTop], []);
  return <>
    { links.map(([from, to, fromCenter, toCenter]) => {
      const fromEl = atomElements.get(from);
      const toEl = atomElements.get(to);
      if (fromEl && toEl && fromEl.isConnected && toEl.isConnected) {
        return <Link key={`${from}-${to}`}
                     state={{ from: fromEl, to: toEl }}
                     fromCenter={fromCenter}
                     toCenter={toCenter}
                     theme={{ vOffset: atomHeight / 2, hOffset: 10, weight: 2 }}
                     vLeftPlace={1 / ((map.get(from + 'right') ?? 1) + 1)}
                     vRightPlace={1 / ((map.get(to + 'left') ?? 1) + 1)}
                     offsetResolver={offsetResolver}/>;
      }
    }) }
  </>;
};
