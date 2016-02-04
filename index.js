const toggle         = require('sdk/ui/button/toggle');
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
const horesaseApiUrl = 'http://horesase.github.io/horesase-boys/meigens.json';
const XMLHttpRequest = xhr.XMLHttpRequest;
var meigens = null;
const horesaseRate = 0.05;
var fetchJSONAsync = function(url, requests) {
  var deferred = promise.defer();
  let req = new XMLHttpRequest();
  req.open('GET', url, true);
  req.setRequestHeader('Accept', 'application/json');
  req.onload = function() {
    deferred.resolve(JSON.parse(req.responseText));
  };
  req.onabort = function(event) {
    deferred.reject(event);
  };
  req.onerror = function(event) {
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
  fetchJSONAsync(lgtmUrl, requests).then(function(data) {
    images.push(data);
    deferred.resolve(data);
  }, function(event) {
    deferred.reject(event);
  });
  return deferred.promise;
};

var fetchTiqav = function(images, requests) {
  var deferred = promise.defer();
  fetchJSONAsync(tiqavApiUrl, requests).then(function(imgs) {
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
var addBoys = function(boys, images) {
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
};
var fetchHoresase = function(images, requests) {
  var deferred = promise.defer();
  if (meigens) {
    timers.setTimeout(function() {
      addBoys(meigens, images);
      deferred.resolve(meigens);
    }, 10);
  } else {
    fetchJSONAsync(horesaseApiUrl, requests).then(function(_meigens) {
      meigens = _meigens;
      LgtmType.horesase.max = meigens.length;
      addBoys(meigens, images);
      deferred.resolve(meigens);
    }, function(event) {
      deferred.reject(event);
    });
  }
  return deferred.promise;
};

var LgtmType = {
  horesase: { name: 'horesase'},
  tiqav: { name: 'tiqav', max: 15},
  lgtm: { name: 'lgtm', max: 500}
};

var getTypeRandomly = function() {
  var val = Math.random();
  if (val <= horesaseRate) {
    return LgtmType.horesase;
  } else {
    return LgtmType.lgtm;
  }
};

var fetchImages = function(panel, type, requests) {
  var images = [];
  var promises = [];

  switch(type.name) {
  case LgtmType.tiqav.name:
    promises.push(fetchTiqav(images, requests));
    break;
  case LgtmType.horesase.name:
    promises.push(fetchHoresase(images, requests));
    break;
  case LgtmType.lgtm.name:
    for (var i = 0; i < perPage; i++) {
      promises.push(fetchLGTM(images, requests));
    }
    break;
  }
  promise.all(promises).then(function() {
    panel.port.emit('add-images', images, LgtmType[type.name].max);
  }, function(event) {
    panel.port.emit('fetch-failed');
  });
  return promises;
};

var panel = panels.Panel({
  height:500,
  contentURL: self.data.url('panel.html'),
  contentScriptFile: self.data.url("panel.js"),
  onHide: function() {
    panel.port.emit('hide');
    handleHide();
  }
});
panel.port.on('select', function(data) {
  clipboard.set(data.markdown);

  var activeTabWorker = tabs.activeTab.attach({
    contentScriptFile: self.data.url('insertTextarea.js')
  });
  activeTabWorker.port.emit('insertTextarea', data);
  timers.setTimeout(function() {
    panel.hide();
  }, 250);
});

var handleHide = function () {
  button.state('window', {checked: false});
};

var handleChange = function(state) {
  if (state.checked) {
    panel.show({
      position: button
    });
    initializePanel();
  }
};
var initializePanel = function() {
  var type     = getTypeRandomly();
  var requests = [];
  var promises = fetchImages(panel, type, requests);
  var cancel = function() {
    requests.forEach(function(req) {
      req.abort();
    });
  };
  var next = function(_type) {
    var promises = fetchImages(panel, _type, requests);
  };
  var complete = function() {
    panel.port.removeListener('cancel', cancel);
    panel.port.removeListener('cancel', complete);
    panel.port.removeListener('next', next);
  };
  panel.port.on('cancel', cancel);
  panel.port.on('complete', complete);
  panel.port.on('next', next);
  panel.port.emit('show', type);
};

var button = toggle.ToggleButton({
  id: "lgtm-toggle-button",
  label: "lgtm",
  icon: {
    "16": self.data.url('icon16.png'),
    "32": self.data.url('icon32.png'),
    "64": self.data.url('icon64.png')
  },
  onChange: handleChange
});
