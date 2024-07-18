
const storageManager = new StorageManager();

document.getElementById('openPage').addEventListener('click', function() {
    chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
});

document.getElementById('setData').addEventListener('click', function() {
    const inputValue = document.getElementById('inputValue').value;
    if (inputValue) {
      storageManager.setValue('exampleKey', inputValue, function() {
        document.getElementById('output').textContent = 'Data set successfully';
      });
    } else {
      document.getElementById('output').textContent = 'Please enter a value';
    }
});

document.getElementById('getData').addEventListener('click', function() {
  storageManager.getValue('exampleKey', function(value) {
    document.getElementById('output').textContent = 'Retrieved value: ' + value;
  });
});