export function preventDefault(fn: (event: Event) => void) {
    return function (this: HTMLElement, event: Event) {
        event.preventDefault();
        fn.call(this, event);
    };
};     