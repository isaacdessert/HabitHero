class StorageManager {
    constructor() {
      if (!chrome || !chrome.storage || !chrome.storage.local) {
        throw new Error('This class requires the chrome.storage.local API');
      }
    }
  
    // Method to get a value by field name
    getValue(fieldName, callback) {
      chrome.storage.local.get([fieldName], function(result) {
        callback(result[fieldName]);
      });
    }
  
    // Method to set a value by field name
    setValue(fieldName, value, callback) {
      let data = {};
      data[fieldName] = value;
      chrome.storage.local.set(data, function() {
        if (callback) callback();
      });
    }
  }