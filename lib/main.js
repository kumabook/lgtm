const widgets   = require('sdk/widget');
const panels    = require("sdk/panel");
const self      = require('sdk/self');
const request   = require("sdk/request");
const tabs      = require("sdk/tabs");
const promise   = require('sdk/core/promise');
const clipboard = require("sdk/clipboard");
const xhr       = require("sdk/net/xhr");
const timers    = require('sdk/timers');
const perPage   = 3;
const lgtmUrl = 'http://www.lgtm.in/g';
const XMLHttpRequest = xhr.XMLHttpRequest;

var fetchJSONAsync = function(url, requests) {
  var deferred = promise.defer();
  let req = new XMLHttpRequest();
  req.open('GET', url, true);
  req.setRequestHeader('Accept', 'application/json');
  req.onload = function() {
    console.log("fetched " + req.responseText);
    deferred.resolve(JSON.parse(req.responseText));
  };
  req.onabort = function(event) {
    console.log('abort:' + event);
    deferred.reject(event);
  };
  req.onerror = function(event) {
    console.log('error:' + event);
    deferred.reject(event);
  };
  req.send();
  requests.push(req);
  return deferred.promise;
};

var fetchImage = function(images, requests) {
  var deferred = promise.defer();
  promise = fetchJSONAsync(lgtmUrl, requests).then(function(data) {
    images.push(data);
    deferred.resolve(data);
  }, function(event) {
    deferred.reject(event);
  });
  return deferred.promise;
};

var fetchImages = function(panel, requests) {
  var images = [];
  var promises = [];

  for (var i = 0; i < perPage; i++) {
    promises.push(fetchImage(images, requests));
  }
  promise.all(promises).then(function() {
    console.log("fetched images");
    panel.port.emit('add-images', images);
  }, function(event) {
    console.log("error:" + event);
  });
  return promises;
};

var panel = panels.Panel({
  height:500,
  contentURL: self.data.url('panel.html'),
  contentScriptFile: self.data.url("panel.js"),
  onHide: function() {
    panel.port.emit('hide');
  }
});
panel.port.on('select', function(data) {
  clipboard.set(data.markdown);
  console.log('select:' + data);
  var script = 'var data = ' + JSON.stringify(data) + ';' +
               'var selector = ' + '"textarea[name=\'comment[body]\']";' +
               'var textarea = document.querySelector(selector);' +
               'if (textarea) {' +
                 'var old = textarea.value;' +
                 'var msg = data.markdown;' +
                 'textarea.value = old + \"\\\n\\\n\" + msg;' +
              '}';
  tabs.activeTab.attach({
    contentScript: script,
    onMessage: function (message) {
      console.log(message);
    }
  });
  timers.setTimeout(function() {
    panel.hide();
  }, 250);
});

var widget = widgets.Widget({
  id: 'lgtm-widget',
  label: 'logtm',
  contentURL: self.data.url('icon64.png'),
  panel: panel,
  onClick: function() {
    var requests = [];
    var promises = fetchImages(panel, requests);
    var cancel = function() {
      requests.forEach(function(req) {
        req.abort();
      });
    };
    var complete = function() {
      panel.port.removeListener('cancel', cancel);
      panel.port.removeListener('cancel', complete);
    };
    panel.port.on('cancel', cancel);
    panel.port.on('complete', complete);
    panel.port.emit('show');
  }
});
