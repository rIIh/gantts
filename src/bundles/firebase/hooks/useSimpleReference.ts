import firebase from 'firebase';
import I, { Map } from 'immutable';
import {useEffect, useRef, useState} from 'react';
import { useTraceUpdate } from '../../common/hooks/useTraceUpdate';
import _ from 'lodash';
import { CachedQueriesInstance } from '../cache';

export var docReads = 0;

export const useSimpleReference = <Model>(document: firebase.firestore.DocumentReference): [Model | null, boolean, Error | null] => {
  const [value, setValue] = useState<Model | null>(null);
  const [reference, setReference] = useState(document);
  
  useEffect(() => {
    if (!_.isEqualWith(reference, document, (l, r) => l?.path == r?.path)) {
      console.log('Reference changed: ', document);
      setReference(document);
    }
  }, [document]);
  
  useEffect(() => {
    console.log('reference changed');
    return CachedQueriesInstance.listenDocument(reference, data => { setValue(data); });
  }, [reference]);
  
  return [value, false, null];
};

export const useSimpleCollection = <Model>(collection?: firebase.firestore.CollectionReference | firebase.firestore.Query, deps: any[] = []): [Model[], boolean, Error | null] => {
  const lastDeps = useRef<any[]>(deps);
  const [values, setValues] = useState<Model[]>([]);
  const [reference, setReference] = useState(collection);
  
  useTraceUpdate({ reference });
  
  useEffect(() => {
    if (!_.isEqualWith(reference, collection, (l, r) => l?.path == r?.path) || !_.isEqual(lastDeps.current, deps)) {
      setReference(collection);
      if (!_.isEqual(lastDeps.current, deps)) { console.log('deps changed'); }
      lastDeps.current = deps;
    }
  }, [collection, deps]);
  
  useEffect(() => {
    if (reference) {
      console.log('Reference updated', reference);
      return CachedQueriesInstance.listenCollection(reference, data => {
        setValues(data);
        console.log('Simple collection Hook: new data ', data);
      });
    } else {
      setValues([]);
    }
  }, [reference]);
  
  return [values, false, null];
};

export const useMultiCollection = <Model>(references?: firebase.firestore.CollectionReference[]): [Model[][], boolean, Error | null] => {
  const [values, setValues] = useState<Map<string, Model[]>>(Map());
  const [reduced, setReduced] = useState<Model[][]>([]);
  const [refs, updateRefs] = useState<firebase.firestore.CollectionReference[]>([]);
  const disposers: Map<string, () => void> = Map();
  
  useTraceUpdate({ values, refs, disposers, references });
  
  useEffect(() => {
    if (_.isEqual(references, refs)) {
      return;
    }
    const newRefs = _.differenceBy(references, refs, l => l.path);
    for (let ref of newRefs) {
      disposers.set(ref.path, CachedQueriesInstance.listenCollection(ref, data => setValues(prev => prev.set(ref.path, data))));
    }
    const removedRefs = _.differenceBy(refs, references ?? [], l => l.path);
    for (let ref of removedRefs) {
      disposers.get(ref.path)?.();
    }
    setValues(prev => prev.deleteAll(removedRefs.map(ref => ref.path)));
    updateRefs(references ?? []);
    newRefs && newRefs.length > 0 && console.log('MultiReference: Subscribed to store: ', newRefs?.map(ref => ref.path));
    removedRefs && removedRefs.length > 0 && console.log('MultiReference: Unsubscribed from store: ', removedRefs?.map(ref => ref.path));
  }, [references]);
  
  useEffect(() => () => {
    disposers.forEach(disposer => disposer());
    console.log('MultiReference: Disposed');
  }, []);
  
  useEffect(() => {
    console.log('Reducing');
    setReduced(values.reduce<Model[][]>((acc, val) => { acc.push(val); return acc; }, []));
  }, [values]);
  
  return [values.reduce<Model[][]>((acc, val) => { acc.push(val); return acc; }, []), false, null];
};
