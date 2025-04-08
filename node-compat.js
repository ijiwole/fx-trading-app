// Simple polyfill for crypto
const crypto = require('crypto');

// Ensure crypto.randomUUID is available
if (!crypto.randomUUID) {
  crypto.randomUUID = function () {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
      /[xy]/g,
      function (c) {
        var r = (Math.random() * 16) | 0,
          v = c == 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      },
    );
  };
}

// Polyfill webcrypto if needed
if (!global.crypto) {
  global.crypto = crypto;
} else if (!global.crypto.randomUUID) {
  global.crypto.randomUUID = crypto.randomUUID;
}

require('./dist/main');
