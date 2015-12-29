System.config({
    defaultJSExtensions: true
});
if (typeof window !== 'undefined') {
    System.import('/Public/Scripts/Bindings.js');
}