const lgtmListView = document.getElementById('lgtm-list-view');
const magin = 20;
var currentItems = [];
var isLoading = false;
var isVisible = false;
var max = 3;
var type = null;

var showProgress = function() {
  isLoading = true;
  var loader = document.createElement('div');
  loader.className = 'loader-container';
  loader.id = 'loader';
  var loaderImage = document.createElement('img');
  loaderImage.src = 'loader.gif';
  loaderImage.className = 'loader';
  loader.appendChild(loaderImage);
  lgtmListView.appendChild(loader);
};

var hideProgress = function() {
  isLoading = false;
  var loader = document.getElementById('loader');
  if (loader) {
    lgtmListView.removeChild(loader);
  }
};

self.port.on('add-images', function(items, _max) {
  max = _max;
  hideProgress();
  currentItems = currentItems.concat(items);
  items.forEach(function(item) {
    var img = document.createElement('img');
    img.id = item.id;
    img.width = window.innerWidth - magin;
    img.className = 'image';
    img.src = item.imageUrl;
    lgtmListView.appendChild(img);
    img.onclick = function() {
      console.log('clicked:' + item);
      document.getElementById('message').style.display = '';
      self.port.emit('select', item);
    };
  });
});

self.port.on('fetch-failed', function() {
  hideProgress();
  self.port.emit('complete');
});

self.port.on('show', function(_type) {
  type = _type;
  isVisible = true;
  document.getElementById('message').style.display = 'none';
  showProgress();
});


self.port.on('hide', function() {
  isVisible = false;
  currentItems.forEach(function(item) {
    var img = document.getElementById(item.id);
    img.onclick = null;
  });
  currentItems = [];

  while (lgtmListView.firstChild){
    lgtmListView.removeChild(lgtmListView.firstChild);
  }
  self.port.emit('cancel');
  self.port.emit('complete');
});

document.onscroll = function() {
  var docElem = this.documentElement;
  var bottom  = (docElem.scrollHeight - docElem.clientHeight) -
                 docElem.scrollTop;
  if (isVisible && !isLoading &&
      bottom <= 50 &&
      currentItems.length < max) {
    showProgress();
    self.port.emit('next', type);
  }
};
