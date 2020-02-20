import { ThemeContext } from 'styled-components';
import { useContext } from 'react';

export function useTheme<T>(): T {
  return useContext(ThemeContext) as unknown as T;
}
