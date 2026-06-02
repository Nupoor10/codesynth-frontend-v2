const findFileByName = (files, name) => {
  if (!name) return null;
  const base = name.split('/').pop();
  return files.find(f => f.name.toLowerCase() === base.toLowerCase());
};

const isExternal = (url) => {
  if (!url) return false;
  return /^(https?:)?\/\//i.test(url);
};

function buildPreview(files = [], entryName, title) {
  console.debug('[previewBuilder] buildPreview called', { time: Date.now(), fileIds: files.map(f => f.id) });
  let entry = null;
  if (entryName) entry = findFileByName(files, entryName);
  if (!entry) entry = files.find(f => f.name.toLowerCase() === 'index.html');
  if (!entry) entry = files.find(f => f.extension === 'html');

  const entryContent = entry?.content || '';
  if (!entryContent.trim()) {
    return { srcDoc: '', blobUrls: [] };
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(entryContent, 'text/html');

  const blobUrls = [];

  const links = Array.from(doc.querySelectorAll('link[rel="stylesheet"][href]'));
  links.forEach(link => {
    const href = link.getAttribute('href');
    if (!href || isExternal(href)) return;
    const file = findFileByName(files, href);
    if (!file) return;
    const blob = new Blob([file.content || ''], { type: 'text/css' });
    const url = URL.createObjectURL(blob);
    blobUrls.push(url);
    link.setAttribute('href', url);
  });

  const scripts = Array.from(doc.querySelectorAll('script[src]'));
  scripts.forEach(script => {
    const src = script.getAttribute('src');
    if (!src || isExternal(src)) return;
    const file = findFileByName(files, src);
    if (!file) return;
    const blob = new Blob([file.content || ''], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    blobUrls.push(url);
    script.setAttribute('src', url);
  });

  if (title) {
    const titleEl = doc.querySelector('title');
    if (titleEl) titleEl.textContent = title;
    else {
      const head = doc.querySelector('head') || doc.createElement('head');
      const t = doc.createElement('title');
      t.textContent = title;
      head.appendChild(t);
    }
  }

  const serializer = new XMLSerializer();
  const html = serializer.serializeToString(doc);
  const srcDoc = html;

  return { srcDoc, blobUrls };
}

function revokeBlobUrls(urls = []) {
  urls.forEach(u => {
    try {
      URL.revokeObjectURL(u);
    } catch (e) {
    }
  });
}

export default { buildPreview, revokeBlobUrls };
