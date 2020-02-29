const scrollDiv = document.createElement('div');
scrollDiv.className = 'scrollbar-measure';
document.body.appendChild(scrollDiv);

// Get the scrollbar width
export const scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;
console.log('ScrollBar: Width - ' + scrollbarWidth); // Mac:  15

// Delete the DIV
document.body.removeChild(scrollDiv);
