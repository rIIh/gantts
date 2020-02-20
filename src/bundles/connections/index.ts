function signum(x: number): number {
  return (x < 0) ? -1 : 1;
}
function absolute(x: number): number {
  return (x < 0) ? -x : x;
}

function number(val: string) {
  return parseFloat(val);
}

function drawPath(svg: SVGElement, path: SVGPathElement, startX: number, startY: number, endX: number, endY: number) {
  // get the path's stroke width (if one wanted to be  really precize, one could use half the stroke size)
  let stroke = parseFloat(path.getAttribute('stroke-width') ?? '');
  // check if the svg is big enough to draw the path, if not, set heigh/width
  if (number(svg.getAttribute('height')!) < endY)            {svg.setAttribute('height', `${endY}`);}
  if (number(svg.getAttribute('width' )!) < (startX + stroke)) {svg.setAttribute('width', `${startX + stroke}`);}
  if (number(svg.getAttribute('width' )!) < (endX   + stroke)) {svg.setAttribute('width', `${endX   + stroke}`);}
  
  let deltaX = (endX - startX) * 0.15;
  let deltaY = (endY - startY) * 0.15;
  // for further calculations which ever is the shortest distance
  let delta  =  deltaY < absolute(deltaX) ? deltaY : absolute(deltaX);
  
  // set sweep-flag (counter/clock-wise)
  // if start element is closer to the left edge,
  // draw the first arc counter-clockwise, and the second one clock-wise
  let arc1 = 0; let arc2 = 1;
  if (startX > endX) {
    arc1 = 1;
    arc2 = 0;
  }
  // draw tha pipe-like path
  // 1. move a bit down, 2. arch,  3. move a bit to the right, 4.arch, 5. move down to the end 
  path.setAttribute('d',  'M'  + startX + ' ' + startY +
      ' V' + (startY + delta) +
      ' A' + delta + ' ' +  delta + ' 0 0 ' + arc1 + ' ' + (startX + delta*signum(deltaX)) + ' ' + (startY + 2*delta) +
      ' H' + (endX - delta*signum(deltaX)) +
      ' A' + delta + ' ' +  delta + ' 0 0 ' + arc2 + ' ' + endX + ' ' + (startY + 3*delta) +
      ' V' + endY );
}

export function connectElements(svg: SVGSVGElement, path: SVGPathElement, startElem: HTMLElement, endElem: HTMLElement, container?: HTMLElement) {
  // if first element is lower than the second, swap!
  if (startElem.offsetTop > endElem.offsetTop) {
    let temp = startElem;
    startElem = endElem;
    endElem = temp;
  }
  
  // get (top, left) corner coordinates of the svg container   
  let svgTop  = container?.offsetTop ?? 0;
  let svgLeft = container?.offsetLeft ?? 0;
  
  // get (top, left) coordinates for the two elements
  let startCoord = { left: startElem.offsetLeft, top: startElem.offsetTop };
  let endCoord   = { left: endElem.offsetLeft, top: endElem.offsetTop };
  
  // calculate path's start (x,y)  coords
  // we want the x coordinate to visually result in the element's mid point
  let startX = startCoord.left + 0.5*startElem.clientWidth - svgLeft;    // x = left offset + 0.5*width - svg's left offset
  let startY = startCoord.top  + startElem.clientHeight - svgTop;        // y = top offset + height - svg's top offset
  
  // calculate path's end (x,y) coords
  let endX = endCoord.left + 0.5*endElem.clientWidth - svgLeft;
  let endY = endCoord.top  - svgTop;
  
  // call export function for drawing the path
  drawPath(svg, path, startX, startY, endX, endY);
}


export function connectAll() {
  // connect all the paths you want!
  // connectElements($('#svg1'), $('#path1'), $('#teal'),   $('#orange'));
}
