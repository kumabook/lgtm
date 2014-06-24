const widgets        = require('sdk/widget');
const panels         = require("sdk/panel");
const self           = require('sdk/self');
const request        = require("sdk/request");
const tabs           = require("sdk/tabs");
const promise        = require('sdk/core/promise');
const clipboard      = require("sdk/clipboard");
const xhr            = require("sdk/net/xhr");
const timers         = require('sdk/timers');
const perPage        = 3;
const lgtmUrl        = 'http://www.lgtm.in/g';
const tiqavUrl       = 'http://tiqav.com/';
const tiqavApiUrl    = 'http://api.tiqav.com/search/random.json';
const tiqavImgUrl    = 'http://img.tiqav.com/';
const horesaseUrl    = 'http://jigokuno.com/';
const horesaseApiUrl = 'http://horesase-boys.herokuapp.com/meigens.json';
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

var generateMarkdown = function(title, url, src) {
  return '[![' + title + '](' + url + ')](' + src + ')';
};

var fetchLGTM = function(images, requests) {
  var deferred = promise.defer();
  promise = fetchJSONAsync(lgtmUrl, requests).then(function(data) {
    images.push(data);
    deferred.resolve(data);
  }, function(event) {
    deferred.reject(event);
  });
  return deferred.promise;
};

var fetchTiqav = function(images, requests) {
  var deferred = promise.defer();
  promise = fetchJSONAsync(tiqavApiUrl, requests).then(function(imgs) {
    for (var i = 0; i < perPage; i++) {
      var img = imgs[i];
      var url = tiqavImgUrl + img.id + '.' + img.ext;
      var src = tiqavUrl + img.id;
      images.push({
        id: img.id,
        imageUrl: url,
        markdown: generateMarkdown('tiqav', url, src)
      });
    }
    deferred.resolve(imgs);
  }, function(event) {
    deferred.reject(event);
  });
  return deferred.promise;
};

var fetchHoresase = function(images, requests) {
  var deferred = promise.defer();
  promise = fetchJSONAsync(horesaseApiUrl, requests).then(function(boys) {
    for (var i = 0; i < perPage; i++) {
      var boyId = Math.floor(Math.random() * boys.length) + 1;
      var boy = boys[boyId];
      images.push({
        id: 'boy' + boy.id,
        imageUrl: boy.image,
        markdown: generateMarkdown(boy.body.split('\n').join(''),
                                   boy.image,
                                   horesaseUrl + '?eid=' + boy.eid)
      });
    }
    deferred.resolve(boys);
  }, function(event) {
    deferred.reject(event);
  });
  return deferred.promise;
};

var LgtmType = {
  horesase: 'horesase',
  tiqav: 'tiqav',
  lgtm: 'lgtm'
};

var getTypeRandomly = function() {
  var val = Math.random();
  if (val <= 0.1) {
    return LgtmType.horesase;
  } else if (val <= 0.3) {
    return LgtmType.tiqav;
  } else {
    return LgtmType.lgtm;
  }
};

var fetchImages = function(panel, requests) {
  var images = [];
  var promises = [];

  switch(getTypeRandomly()) {
  case LgtmType.tiqav:
    promises.push(fetchTiqav(images, requests));
    break;
  case LgtmType.horesase:
    promises.push(fetchHoresase(images, requests));
    break;
  case LgtmType.lgtm:
    for (var i = 0; i < perPage; i++) {
      promises.push(fetchLGTM(images, requests));
    }
    break;
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

  var activeTabWorker = tabs.activeTab.attach({
    contentScriptFile: self.data.url('insertTextarea.js')
  });
  activeTabWorker.port.emit('insertTextarea', data);
  timers.setTimeout(function() {
    panel.hide();
  }, 250);
});

var widget = widgets.Widget({
  id: 'lgtm-widget',
  label: 'lgtm',
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
