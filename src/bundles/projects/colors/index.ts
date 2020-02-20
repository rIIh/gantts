export class Palette  {
  static 'Basic Blue' = { fill: '#bbe6ef', border: '#62bdd5' };
  static 'Golfer\'s Green' = { fill: '#d8e5ae', border: '#a2bf55' };
  static 'Productive Purple' = { fill: '#d5a8e7', border: '#b86fd7' };
  static 'Rosy Red' = { fill: '#e3b3aa', border: '#c14b3a' };
  static 'Operation Orange' =  { fill: '#f1c89c', border: '#e49b53' };
  static 'Blueberry' = { fill: '#b6c4ea', border: '#6286d7' };
  static 'Get it Done Grey' = { fill: '#dadada', border: '#a1a1a1' };
  static 'Mustard' = { fill: '#eee69a', border: '#d3c432' };
  static 'Blissful Blue'  = { fill: '#90c5df', border: '#0087c8' };
  static 'Magnifying Magenta'  = { fill: '#e8b5d6', border: '#b7378a' };
  static 'Pretty Pink'  = { fill: '#ffcaee', border: '#ff6dcf' };
  static 'Great Green'  = { fill: '#b3e7d2', border: '#4dc495' };
  static 'Prolific Purple'  = { fill: '#ded2ff', border: '#8870ff' };
  static 'Outstanding Orange'  = { fill: '#ffcbc0', border: '#ff856a' };
  static 'Beneficial Brown'  = { fill: '#dec2af', border: '#c6875e' };
  static 'Gainful Green'  = { fill: '#afd3c5', border: '#528e77' };
}

export type Colors<Palette> = keyof Omit<typeof Palette, 'prototype'>;

export function adjust(color: string, amount: number) {
  return '#' + color.replace(/^#/, '').replace(/../g, color => ('0'+Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2));
}

