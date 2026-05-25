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
  // Choose entry HTML
  let entry = null;
  if (entryName) entry = findFileByName(files, entryName);
  if (!entry) entry = files.find(f => f.name.toLowerCase() === 'index.html');
  if (!entry) entry = files.find(f => f.extension === 'html');

  const entryContent = entry?.content || '<!doctype html><html><head><meta charset="utf-8"><title></title></head><body></body></html>';

  const parser = new DOMParser();
  const doc = parser.parseFromString(entryContent, 'text/html');

  const blobUrls = [];

  // Replace local stylesheet hrefs with blob URLs when possible
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

  // Replace local script src with blob URLs when possible
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
  const srcDoc = '<!DOCTYPE html>\n' + html;

  return { srcDoc, blobUrls };
}

function revokeBlobUrls(urls = []) {
  urls.forEach(u => {
    try { URL.revokeObjectURL(u); } catch (e) { /* ignore */ }
  });
}

export default { buildPreview, revokeBlobUrls };
