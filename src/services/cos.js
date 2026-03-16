'use strict';

const COS = require('cos-nodejs-sdk-v5');

const client = new COS({
  SecretId: process.env.COS_SECRET_ID,
  SecretKey: process.env.COS_SECRET_KEY,
});

const Bucket = process.env.COS_BUCKET;
const Region = process.env.COS_REGION || 'ap-hongkong';

/**
 * Upload a buffer to COS
 * @param {string} key  - object key, e.g. 'assets/uuid/file.zip'
 * @param {Buffer} body - file buffer
 * @param {string} mime - content-type
 * @returns {Promise<string>} public URL
 */
async function upload(key, body, mime) {
  return new Promise((resolve, reject) => {
    client.putObject(
      {
        Bucket,
        Region,
        Key: key,
        Body: body,
        ContentType: mime || 'application/octet-stream',
      },
      (err, data) => {
        if (err) return reject(err);
        const url = `https://${Bucket}.cos.${Region}.myqcloud.com/${key}`;
        resolve(url);
      }
    );
  });
}

module.exports = { upload };
