const lgtmListView = document.getElementById('lgtm-list-view');
const magin = 20;
self.port.on('add-images', function(datum) {
  datum.forEach(function(data) {
    console.log('image ' + data);
    var img = document.createElement('img');
    img.width = window.innerWidth - magin;
    img.src = data.imageUrl;
    lgtmListView.appendChild(img);
    img.addEventListener('click', function() {
      console.log('click:' + data);
      self.port.emit('select', data);
    });
  });

});
