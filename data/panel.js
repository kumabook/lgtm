const lgtmListView = document.getElementById('lgtm-list-view');
const magin = 20;
var currentItems = null;
var isLoading = false;

var showProgress = function() {
  isLoading = true;
  var loader = document.createElement('img');
  loader.id = 'loader';
  loader.src = 'loader.gif';
  loader.className = 'loader';
  lgtmListView.appendChild(loader);
};

var hideProgress = function() {
  isLoading = false;
  var loader = document.getElementById('loader');
  lgtmListView.removeChild(loader);
};

self.port.on('add-images', function(items) {
  hideProgress();
  currentItems = items;
  items.forEach(function(item) {
    console.log('image ' + item);
    var img = document.createElement('img');
    img.id = item.id;
    img.width = window.innerWidth - magin;
    img.className = 'image';
    img.src = item.imageUrl;
    lgtmListView.appendChild(img);
    img._clickListener =  function() {
      console.log('clicked:' + item);
      document.getElementById('message').style.display = '';
      self.port.emit('select', item);
    };
    img.addEventListener('click', img._clickListener);
  });
});

self.port.on('show', function() {
  console.log('show progress');
  document.getElementById('message').style.display = 'none';
  showProgress();
});


self.port.on('hide', function() {
  if (currentItems !== null) {
    currentItems.forEach(function(item) {
      var img = document.getElementById(item.id);
      img.removeEventListener('click', img._clickListener);
    });
    currentItems = null;
  }
  lgtmListView.innerHTML = '';
  if (isLoading) {
    self.port.emit('cancel');
  }
});
