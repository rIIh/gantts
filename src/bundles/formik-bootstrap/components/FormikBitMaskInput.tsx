import React, { Fragment, useEffect, useState } from 'react';
import { ToggleButtonGroup, ToggleButton, OverlayTrigger, Tooltip, Overlay } from 'react-bootstrap';
import { useField } from 'formik';
import _ from 'lodash';

interface BitMaskInputProps {
  name: string;
  bitmask: any;
}

const bitmaskValues = (bitmask: number, flags: number[]): number[] => flags.filter((_, index) => bitmask & (1 << (index + 1)));
const reduceToBitmask = (values: number[]) => values.reduce((acc, val) => { acc += val; return acc; });

const isNumber = (n: string | number): boolean => 
    !isNaN(parseFloat(String(n))) && isFinite(Number(n));

const FormikBitMaskInput: React.FC<BitMaskInputProps> = ({ bitmask, name }) => {
  const [field, _, { setValue }] = useField(name);
  const flags = Object.entries(bitmask).filter(e => !isNumber(e[0]) && e[1] as number > 0 && e[1] != 254);

  return <ToggleButtonGroup 
      type="checkbox"
      className="d-block"
      value={bitmaskValues(field.value, flags.map(flag => flag[1] as number))}
      onChange={(values: number[]) => setValue(values.length > 0 ? reduceToBitmask(values) : field.value)}>
    { flags.map((entry: any) => (
      <ToggleButton key={entry[1]} value={entry[1]}>{ entry[0] }</ToggleButton>
    )) }  
  </ToggleButtonGroup>;
};

export const BitMaskInput: React.FC<{ bitmask: any; initialValue?: number; shrink?: number; onChange?: (result: number) => void }> = ({ bitmask, onChange, initialValue, shrink }) => {
  const [state, setState] = useState(initialValue ?? 0);
  useEffect(() => setState(initialValue ?? 0), [initialValue]);
  useEffect(() => { if (!_.isEqual(state, initialValue)) { onChange?.(state); }}, [state]);
  const flags = Object.entries(bitmask).filter(e => !isNumber(e[0]) && e[1] as number > 0 && e[1] != 254);

  return <ToggleButtonGroup
      type="checkbox"
      className="d-block"
      size="sm"
      style={{
        width: shrink && shrink > 0 ? '100%' : undefined,
        display: shrink && shrink > 0 ? 'flex!important' : undefined,
      }}
      value={bitmaskValues(state, flags.map(flag => flag[1] as number))}
      onChange={(values: number[]) => setState(values.length > 0 ? reduceToBitmask(values) : state)}>
    { flags.map((entry: any) => (
          <ToggleButton key={entry[1]} style={{ overflow: 'hidden' }}
                        value={entry[1]}>
            { shrink && shrink > 0 ? (entry[0] as String).substring(0, shrink) : entry[0] }
          </ToggleButton>
    )) }
  </ToggleButtonGroup>;
};

export default FormikBitMaskInput;

