const widgets = require('sdk/widget');
const panels = require("sdk/panel");
const self = require('sdk/self');
const request = require("sdk/request");
const pageMod = require('sdk/page-mod');
const {XMLHttpRequest} = require("sdk/net/xhr");
const promise = require('sdk/core/promise');
const images = [];
var fetchJSONAsync = function(url) {
  var deferred = promise.defer();
  let req = new XMLHttpRequest();
  req.open('GET', url, true);
  req.setRequestHeader('Accept', 'application/json');
  req.onload = function() {
    console.log("fetched " + req.responseText);
    deferred.resolve(JSON.parse(req.responseText));
  };
  req.onerror = function(event) {
    deferred.reject(event);
  };
  req.send();

  return deferred.promise;
};

var fetchImage = function() {
  var deferred = promise.defer();
  fetchJSONAsync('http://www.lgtm.in/g').then(function(data) {
    images.push(data);
    deferred.resolve(data);
  });
  return deferred.promise;
};

var fetchImages = function(panel) {
  promise.all([fetchImage(), fetchImage(), fetchImage()]).then(function() {
    console.log("fetched images");
    panel.port.emit('add-images', images);
  });
};

var panel = panels.Panel({
  height:500,
  contentURL: self.data.url('panel.html'),
  contentScriptFile: self.data.url("panel.js")
});
panel.port.on('select', function(data) {
  console.log('select:' + data);
  pageMod.PageMod({
    include: ['*', 'file://*', 'about:*', 'resource://*'],
    onAttach: function(worker) {
      console.log('onAttach');
    }
  });
});

var widget = widgets.Widget({
  id: 'lgtm-widget',
  label: 'logtm',
  contentURL: self.data.url('icon64.jpg'),
  panel: panel,
  onClick: function() {
    fetchImages(panel);
  }
});
