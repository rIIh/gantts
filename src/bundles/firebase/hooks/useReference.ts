import { LazyCollectionReference, LazyReference } from '../types';
import I from 'immutable';
import { useEffect, useRef, useState } from 'react';
import { useTraceUpdate } from '../../common/hooks/useTraceUpdate';
import _ from 'lodash';

export const useReference = <Value>(reference?: LazyReference<Value>): [Value | null, Error | null, boolean] => {
  const [value, setValue] = useState<Value | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState<Error | null>(null);
  
  useTraceUpdate({ reference, value, loading, failed });
  
  useEffect(() => {
    (async () => {
      return reference!.Value;
    })().then(setValue);
    return reference?.connect().subscribe((data) => {
      setValue(data);
    });
  }, [reference]);
  
  return [value, failed, loading];
};

export const useCollectionReference = <Value>(reference?: LazyCollectionReference<Value>): [Value[] | null] => {
  const ref = useRef<LazyCollectionReference<Value>>(null);
  const [value, setValue] = useState<Value[] | null>(null);
  useTraceUpdate({ reference, value });
  
  useEffect(() => {
    console.log('Comparing references: ', ref.current, reference, _.isEqual(ref.current, reference));
    if (reference?.ID != ref.current?.ID) {
      // @ts-ignore
      ref.current = reference;
      return reference?.connect().subscribe((data) => setValue(data));
    }
  }, [reference]);
  
  return [value];
};

export const useMultiReference = <Value>(references?: LazyCollectionReference<Value>[]): [I.Map<string, Value[]>] => {
  const [refs, updateRefs] = useState<LazyCollectionReference<Value>[]>([]);
  const [value, setValue] = useState<I.Map<string, Value[]>>(I.Map());
  const disposers: Map<string, () => void> = new Map();
  
  useEffect(() => {
    if (_.isEqual(references, refs)) {
      return;
    }
    const newRefs = _.differenceBy(references, refs, l => l.ID);
    for (let ref of newRefs) {
      disposers.set(ref.ID, ref.connect().subscribe((data) => {
        setValue(prev => {
          return prev.set(ref.ID, data);
        });
      }));
    }
    const removedRefs = _.differenceBy(refs, references ?? [], l => l.ID);
    for (let ref of removedRefs) {
      disposers.get(ref.ID)?.();
    }
    setValue(prev => prev.deleteAll(removedRefs.map(ref => ref.ID)));
    updateRefs(references ?? []);
    newRefs && newRefs.length > 0 && console.log('MultiReference: Subscribed to store: ', newRefs?.map(ref => ref.Reference.path));
    removedRefs && removedRefs.length > 0 && console.log('MultiReference: Unsubscribed from store: ', removedRefs?.map(ref => ref.Reference.path));
  }, [references]);
  
  useEffect(() => () => {
    disposers.forEach(disposer => disposer());
    console.log('MultiReference: Disposed');
  }, []);
  
  return [value];
};
