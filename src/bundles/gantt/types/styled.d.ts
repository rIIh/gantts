// import original module declarations
import 'styled-components';

type HexColor = string;

// and extend them!
declare module 'styled-components' {
  export interface DefaultTheme {
    headerHeight: number;
    atomHeight: number;
    dotSize: number;
    barVMargin: number;
    selectedColor: HexColor;
    dangerColor: HexColor;
    colWidth: number;
    meta_columns: { [key: string]: number };
    colors: { [key: string]: HexColor };
  }
}
