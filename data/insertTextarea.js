var insertTextarea = function(data) {
  var selector = "textarea[name=\'comment[body]\']";
  var textarea = document.querySelector(selector);
  if (textarea) {
    var old = textarea.value;
    var msg = data.markdown;
    textarea.value = old + "\n\n" + msg;
  }
};

self.postMessage('ready');
self.port.on('insertTextarea', function(data) {
  insertTextarea(data);
});
