export function preventDefault(fn: (event: Event) => void) {
    return function (this: HTMLElement, event: Event) {
        event.preventDefault();
        fn.call(this, event);
    };
};     
export  function stopPropagation(handler: any) {
    return (e: Event) => {
      e.stopPropagation();
      handler(e);
    };
};