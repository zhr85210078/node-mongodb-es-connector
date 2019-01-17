var crypto = require('crypto');

var aesEncrypt = function (data, key) {
    const cipher = crypto.createCipher('aes192', key);
    var crypted = cipher.update(data, 'utf8', 'hex');
    crypted += cipher.final('hex');
    return crypted;
}

var aesDecrypt = function (encrypted, key) {
    const decipher = crypto.createDecipher('aes192', key);
    try {
        decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
    } finally {
        decrypted = encrypted;
        return decrypted;
    }
}

module.exports = {
    aesEncrypt: aesEncrypt,
    aesDecrypt: aesDecrypt
};