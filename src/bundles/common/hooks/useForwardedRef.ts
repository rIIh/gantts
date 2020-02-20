import React, { Ref, useEffect, useRef } from 'react';
import _ from 'lodash';

export function useForwardedRef<T>(forwardedRef: Ref<T>) {
  // final ref that will share value with forward ref. this is the one we will attach to components
  const innerRef = useRef<T>(null);
  
  useEffect(() => {
    // after every render - try to share current ref value with forwarded ref
    if (!forwardedRef || _.isEqual(forwardedRef, innerRef.current)) {
      console.log('Refs are equal');
      return;
    }
    if (typeof forwardedRef === 'function') {
      forwardedRef(innerRef.current);
      return;
    } else {
      // by default forwardedRef.current is readonly. Let's ignore it
      // @ts-ignore
      forwardedRef.current = innerRef.current;
    }
  }, [forwardedRef]);
  
  return innerRef;
}
