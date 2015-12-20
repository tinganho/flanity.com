System.config({
    defaultJSExtensions: true
});
if (typeof window !== 'undefined') {
    System.import('/public/scripts/bindings.js');
}