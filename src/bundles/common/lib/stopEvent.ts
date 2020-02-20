const stopEvent = (event: Event) => {
  event.stopImmediatePropagation();
  event.preventDefault();
};

export default stopEvent;
