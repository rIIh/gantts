import { DefaultTheme } from 'styled-components';

export class GanttTheme implements DefaultTheme {
  atomHeight: number = 24;
  headerHeight: number = 36;
  barVMargin: number = 3;
  dotSize = 8;
  selectedColor = '#f0f0f0';
  dangerColor = '#ed8484';
  colWidth: number = 29;
  meta_columns: { [key: string]: number } = {
    extra: 80,
    assigns: 120,
    progress: 72,
  };
  colors = {
    lightgrey: '#eaeaea',
    lightgrey2: '#e7e7e7',
    grey: '#ccc',
    weekend: '#f5f4f3',
  };
}

export interface PropsWithConfig {
  config?: GanttTheme;
}

