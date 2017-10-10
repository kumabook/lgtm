/* global browser:false, setTimeout: false */
const lgtmListView       = document.getElementById('lgtm-list-view');
const margin             = 25;
const halfWidthClassName = 'half-width-list';
const defaultPerPage     = 3;
const lgtmUrl            = 'http://www.lgtm.in/g';
const horesaseUrl        = 'http://jigokuno.com/';
const horesaseApiUrl     = 'http://horesase.github.io/horesase-boys/meigens.json';
const horesaseRate       = 0.05;

let meigens      = null;
let currentItems = [];
let tabId        = null;
const requests   = [];
let isLoading    = false;
let isVisible    = false;
let max          = 3;
let type         = null;
let perPage      = defaultPerPage;

const LgtmType = {
  horesase: { name: 'horesase' },
  lgtm:     { name: 'lgtm', max: 500 },
};

function generateMarkdown(title, url, src) {
  return `[![${title}](${url})](${src})`;
}

function select(item) {
  const input = document.getElementById('input');
  input.value = item.markdown;
  input.select();
  document.execCommand('Copy');
  browser.tabs.executeScript({ file: './insertTextarea.js' });
  const gettingActiveTab = browser.tabs.query({ active: true, currentWindow: true });
  gettingActiveTab.then((tabs) => {
    tabId = tabs[0].id;
    browser.tabs.sendMessage(tabId, { type: 'select', payload: item });
  });
  setTimeout(hide, 250);
}

function showProgress() {
  isLoading = true;
  const loader = document.createElement('div');
  loader.className = 'loader-container';
  loader.id = 'loader';
  const loaderImage = document.createElement('img');
  loaderImage.src = 'loader.gif';
  loaderImage.className = 'loader';
  loader.appendChild(loaderImage);
  lgtmListView.appendChild(loader);
}

function hideProgress() {
  isLoading = false;
  const loader = document.getElementById('loader');
  if (loader) {
    lgtmListView.removeChild(loader);
  }
}

function addImages(items, _max) {
  max = _max;
  hideProgress();
  currentItems = currentItems.concat(items);
  items.forEach((item) => {
    const img = document.createElement('img');
    img.id = item.id;
    img.width = window.innerWidth - margin;
    img.className = 'image';
    img.src = item.imageUrl;
    lgtmListView.appendChild(img);
    img.onclick = () => {
      document.getElementById('message').style.display = '';
      select(item);
    };
  });
}

function fetchFailed() {
  hideProgress();
}

function clearItems() {
  currentItems.forEach((item) => {
    const img = document.getElementById(item.id);
    img.onclick = null;
  });
  currentItems = [];

  while (lgtmListView.firstChild) {
    lgtmListView.removeChild(lgtmListView.firstChild);
  }
}

function fetchJSONAsync(url) {
  return new Promise((resolve, reject) => {
    const req = new XMLHttpRequest();
    req.open('GET', url, true);
    req.setRequestHeader('Accept', 'application/json');
    req.onload = () => {
      resolve(JSON.parse(req.responseText));
    };
    req.onabort = (event) => {
      reject(event);
    };
    req.onerror = (event) => {
      reject(event);
    };
    req.send();
    requests.push(req);
  });
}

function fetchLGTM(images) {
  return fetchJSONAsync(lgtmUrl).then((data) => {
    images.push(data);
    return data;
  });
}

function addBoys(boys, images) {
  for (let i = 0; i < perPage; i += 1) {
    const boyId    = Math.floor(Math.random() * boys.length) + 1;
    const boy      = boys[boyId];
    const id       = `boy${boy.id}`;
    const imageUrl = boy.image;
    const markdown = generateMarkdown(boy.body.split('\n').join(''),
                                      boy.image,
                                      `${horesaseUrl}?eid=${boy.eid}`);
    images.push({ id, imageUrl, markdown });
  }
}

function fetchHoresase(images) {
  if (meigens) {
    return new Promise((resolve) => {
      setTimeout(() => {
        addBoys(meigens, images);
        resolve(meigens);
      }, 10);
    });
  }
  return fetchJSONAsync(horesaseApiUrl).then((_meigens) => {
    meigens = _meigens;
    LgtmType.horesase.max = meigens.length;
    addBoys(meigens, images);
    return meigens;
  });
}

function getTypeRandomly() {
  const val = Math.random();
  if (val <= horesaseRate) {
    return LgtmType.horesase;
  }
  return LgtmType.lgtm;
}

function fetchImages() {
  const images = [];
  const promises = [];
  switch (type.name) {
    case LgtmType.horesase.name:
      promises.push(fetchHoresase(images));
      break;
    case LgtmType.lgtm.name:
      for (let i = 0; i < perPage; i += 1) {
        promises.push(fetchLGTM(images));
      }
      break;
    default:
      break;
  }
  return Promise.all(promises).then(() => {
    addImages(images, LgtmType[type.name].max);
  }).catch(fetchFailed);
}

function show() {
  isVisible = true;
  document.getElementById('message').style.display = 'none';

  const halfBtn = document.getElementById('half-width-btn');
  halfBtn.onclick = () => {
    const className = lgtmListView.className;
    if (className.indexOf(halfWidthClassName) > 0) {
      return;
    }
    lgtmListView.className += ' half-width-list';
    perPage = defaultPerPage * 2;
  };

  const fullBtn = document.getElementById('full-width-btn');
  fullBtn.onclick = () => {
    const classes = lgtmListView.className;
    lgtmListView.className = classes.replace(' half-width-list', '');
    perPage = defaultPerPage;
  };

  const reloadBtn = document.getElementById('reload-btn');
  reloadBtn.onclick = () => {
    clearItems();
    fetchImages();
  };
  showProgress();
}

function hide() {
  isVisible = false;
  clearItems();
  if (tabId) {
    browser.tabs.sendMessage(tabId, { type: 'hide' });
    tabId = null;
  }
  requests.forEach(req => req.abort());
  window.close();
}

window.onload = () => {
  type = getTypeRandomly();
  show();
  fetchImages();
};

document.onwheel = (e) => {
  // only scroll down
  if (e.deltaY < 0) {
    return;
  }
  const d = document.documentElement;
  const bottom  = (d.scrollHeight - d.clientHeight) - d.scrollTop;
  if (isVisible && !isLoading && bottom <= 50 && currentItems.length < max) {
    showProgress();
    fetchImages();
  }
};
