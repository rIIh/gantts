import React, { forwardRef, HTMLProps, useRef } from 'react';
import styled, { css, DefaultTheme, StyledComponent } from 'styled-components';
import _ from 'lodash';
import { adjust, Colors, Palette } from '../../../colors';
import { useForwardedRef } from '../../../../common/hooks/useForwardedRef';

export const GroupHeader = styled.div<{ filled?: number; dragging?: boolean }>`
  position: absolute;
  transition: ${props => props.dragging ? null : 'all 400ms'};
  height: ${props => props.hidden ? 0 : `${props.theme.atomHeight - props.theme.barVMargin * 2}px`};
  margin-top: ${props => `${props.theme.barVMargin}px`};
  background-color: #d9d9e5;
  border-radius: 8px;
  overflow: hidden;

  &::after {
    content: " ";
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: ${props => props.filled ?? 0}%;
    background-color: #aeaeba;
    transition: width 400ms;
  }
`;

interface Selectable {
  selected: boolean;
}

type WrapperProps = { checked?: boolean; expand?: boolean };
type FakeCheckboxProps = { styled?: StyledComponent<'div', DefaultTheme, WrapperProps> } & WrapperProps & HTMLProps<HTMLInputElement>;
export const FakeCheckbox = forwardRef<HTMLInputElement, FakeCheckboxProps>(({ styled, expand, ...props }, ref) => {
  const Wrapper = styled ?? DefaultCheckbox;
  const inputRef = useForwardedRef(ref);
  return <Wrapper checked={props.checked} expand={expand} onClick={() => {
    inputRef.current?.click();
  }}>
    <input type="checkbox" {...props} style={{ display: 'none' }} ref={inputRef}/>
  </Wrapper>;
});

export const DefaultCheckbox = styled.div.attrs(props => ({ children: <><i className="tg-icon check"/>{props.children}</> }))<{ checked?: boolean; expand?: boolean }>`
  align-items: center;
  background-color: #fff;
  border: 0.07143em solid #ddd;
  border-radius: 0.2143em;
  box-sizing: border-box;
  cursor: pointer !important;
  display: flex;
  height: 1.2em;
  justify-content: center;
  opacity: 0.7;
  width: 1.2em;
  
  > i {
    color: #fff;
    font-size: 0.7em;
    font-weight: bold;
    height: 1em;
    width: 1em;
  }
  
  ${props => props.expand && css`
    &::after {
      content: ' ';
      position: absolute;
      width: 100%;
      height: 100%;
      top: 0;
      left: 0;
    }
  `}
  
  ${props => props.checked && css`
    background-color: #1053eb;
    border: calc(0.07143em + 0.5px) solid #1053eb;
    opacity: 1;
  `}
`;

export const AtomWrapper = styled.div<Selectable>`
    position: absolute;
    height: ${({ theme }) => theme.atomHeight}px;
    left: 0;
    width: 100%;
    background-color: ${({ theme, selected }) => selected ? theme.selectedColor : 'transparent'};
  `;

export const AtomHandle = styled.div<{ placement: 'left' | 'right' }>`
  position: absolute;
  right: ${({ placement }) => placement == 'left' ? null : 0};
  border-right: ${({ placement }) => placement == 'right' ? null : '1px solid black'};
  border-left: ${({ placement }) => placement == 'left' ? null : '1px solid black'};
  top: 2px;
  bottom: 2px;
  width: 3px;
  opacity: 0.69;
  cursor: col-resize;
  z-index: 100;
`;

export const AtomDot = styled.div`
  position: absolute;
  background-color: #62676d;
  border: 0.6px solid #62676d;
  border-radius: 50%;
  box-shadow: inset 0 0 0 1px #fff;
  box-sizing: border-box;
  display: block;
  height: 0.6em;
  width: 0.6em;

  // background-color: lightgrey;
  // border: 1px grey solid;
   cursor: pointer;
   transform: translateX(-50%);
  // width: ${({ theme }) => theme.dotSize}px;
  // height: ${({ theme }) => theme.dotSize}px;
  // border-radius: ${({ theme }) => theme.dotSize / 2}px;
`;

export const AtomLabel = styled.div<{ placement: 'left' | 'right' }>`
  position: absolute;
  height: 100%;
  width: max-content;
  width: -moz-max-content;
  right: ${({ placement }) => placement == 'left' ? null : 0};
  transform: ${({ placement }) => placement == 'left' ? 'translateX(-100%)' : 'translateX(100%)'};
  display: flex;
  align-items: center;
  padding: 0 10px;
`;

// @ts-ignore
// export const Atom = styled(React.forwardRef((props, ref: React.Ref<HTMLDivElement>) => 
//   <div {..._.pick(props, _.keys(props).filter(key => !(/[A-Z]/.test(key))))}/>))<{ isDragging: boolean; atom_uid?: string }>`

interface AtomProps {
  isDragging?: boolean;
  color: Colors<Palette>;
  filled?: number;
  'data-atom_uid'?: string;
}

export const ColorPill = styled.div<{ color: Colors<Palette> }>`
  background-color: ${({ color }) => Palette[color].fill};
  border: 1px solid ${({ color }) => Palette[color].border};
  display: inline-flex;
  align-items: center;
`;

export const Group = styled.div`

`;

// export const Atom = styled.div<{ isDragging: boolean; atom_uid?: string }>`
export const Atom = styled.div<AtomProps>`
    position: absolute;
    height: ${({ theme }) => theme.atomHeight - theme.barVMargin * 2}px;
    top: ${({ theme }) => theme.barVMargin}px;
    border-radius: 0.2857em;
    background-color: ${({ color }) => Palette[color].fill};
    border: 1px solid ${({ color }) => Palette[color].border};
    transition: ${({ isDragging }) => isDragging ? null : 'all 400ms'};
    z-index: 50;
    
    &::after {
      content: " ";
      background-color: ${({ color }) => Palette[color].border};
      width: ${props => props.filled ?? 0}%;
      transition: width 400ms;
      height: 100%;
      position: absolute;
      left: 0;
      top: 0;
    }
  `;

// @ts-ignore
// export const Milestone = styled((props) => <div {..._.pickBy(props, _.isString)}/>)<{ isDragging?: boolean; atom_uid?: string }>`
export const Milestone = styled.div<AtomProps>`
  position: absolute;
  height: ${({ theme }) => theme.atomHeight - theme.barVMargin * 2}px;
  width: ${({ theme }) => theme.colWidth}px;
  top: ${({ theme }) => theme.barVMargin}px;
  transition: ${({ isDragging }) => isDragging ? null : 'all 400ms'};
  background-color: transparent;
  z-index: 50;
  
  &::before {
    content: " ";
    position: absolute;
    top: ${({ theme }) => theme.barVMargin + 1}px;
    left: ${({ theme }) => (theme.colWidth - theme.atomHeight + theme.barVMargin / 2) / Math.sin(Math.PI / 4)}px;
    height: ${({ theme }) => Math.sin(Math.PI / 4) * theme.atomHeight - theme.barVMargin * 2}px;
    width: ${({ theme }) => Math.sin(Math.PI / 4) * theme.atomHeight - theme.barVMargin * 2}px;
    background-color: ${({ color }) => Palette[color].fill};
    border: 1px solid ${({ color }) => Palette[color].border};
    transition: background-color 400ms, border 400ms;
    transform: rotateZ(45deg);
  }
  &::after {
    background-color: ${({ color }) => Palette[color].border};
    opacity: ${props => props.filled ?? 0};
    content: " ";
    position: absolute;
    top: ${({ theme }) => theme.barVMargin + 1}px;
    left: ${({ theme }) => (theme.colWidth - theme.atomHeight + theme.barVMargin / 2) / Math.sin(Math.PI / 4)}px;
    height: ${({ theme }) => Math.sin(Math.PI / 4) * theme.atomHeight - theme.barVMargin * 2}px;
    width: ${({ theme }) => Math.sin(Math.PI / 4) * theme.atomHeight - theme.barVMargin * 2}px;
    transition: opacity 400ms, border 400ms;
    transform: rotateZ(45deg);
  }
`;
