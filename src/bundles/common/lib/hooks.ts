import React, { useCallback, useEffect, useRef, useState } from 'react';

export const useRefEffect = <T>(initialValue: T | null, callback: (newValue: (T | null), previousValue: (T | null)) => ((() => void) | void))
    :[(node: T) => void, React.RefObject<T>] => {
  const ref = useRef<T>(initialValue);
  const setRef = useCallback<(node: T) => void>(node => {
    callback(node, ref.current);
    // @ts-ignore
    ref.current = node;
  }, []);
  
  return [setRef, ref];
};

function useKey(event: 'keyup' | 'keydown', targetKey: string, callback: () => void) {
  function handler({ key }: KeyboardEvent) {
    if (key === targetKey) {
      callback?.();
    }
  }
  
  useEffect(() => {
    window.addEventListener(event, handler);
    return () => {
      window.removeEventListener(event, handler);
    };
  }, []);
}

export function useKeyDown(targetKey: string, callback: () => void) {
  return useKey('keydown', targetKey, callback);
}

export function useKeyUp(targetKey: string, callback: () => void) {
  return useKey('keyup', targetKey, callback);
}
