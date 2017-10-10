/* global browser:false */

function insertTextarea(item) {
  const selector = "textarea[name='comment[body]']";
  const textarea = document.querySelector(selector);
  if (textarea) {
    const old = textarea.value;
    const msg = item.markdown;
    textarea.value = `${old}\n\n${msg}\n\n`;
  }
}

function listen(request) {
  switch (request.type) {
    case 'hide':
      browser.runtime.onMessage.removeListener(listen);
      break;
    case 'select':
      insertTextarea(request.payload);
      break;
    default:
      break;
  }
}

browser.runtime.onMessage.addListener(listen);
