import { useCallback } from 'react';
import _, { ThrottleSettings, DebounceSettings } from 'lodash';

export const useThrottle = <T extends (...args: any[]) => any>(callback: T, wait?: number, deps: [] = [], options?: ThrottleSettings) => {
  return useCallback(_.throttle(callback, wait, options), [wait, options, ...deps]);
};

export const useDebounce = <T extends (...args: any[]) => any>(callback: T, wait?: number, deps: [] = [], options?: DebounceSettings) => {
  return useCallback(_.debounce(callback, wait, options), [wait, options, ...deps]);
};
