
function bind(func, context) {
    return function() {
        func.call(context);
    };
}