/**
 * Promise-based wrapper around chrome.storage.local.
 * All other modules use this — never call chrome.storage directly.
 */

export function load(key) {
  return new Promise((resolve) => {
    chrome.storage.local.get(key, (result) => {
      resolve(key ? result[key] : result);
    });
  });
}

export function save(data) {
  return new Promise((resolve) => {
    chrome.storage.local.set(data, resolve);
  });
}

export function loadAll() {
  return new Promise((resolve) => {
    chrome.storage.local.get(null, resolve);
  });
}
