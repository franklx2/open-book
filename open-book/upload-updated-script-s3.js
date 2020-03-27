const fs = require('fs');
const AWS = require('aws-sdk');
const yaml = require('js-yaml');
var spaBucketName = "";

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const fileName = 'spa/js/script.js';

console.log("Uploading updated spa/js/script.js to SPA bucket");

const uploadFile = () => {
  try {
    let fileContents = fs.readFileSync('./env.yml', 'utf8');
    let data = yaml.safeLoad(fileContents);
    spaBucketName = data.bucketSPA;
    // console.log(spaBucketName);
  } catch (e) {
      console.log(e);
  }
  fs.readFile(fileName, (err, data) => {
     if (err) throw err;
     const params = {
         Bucket: spaBucketName, 
         Key: 'js/script.js', 
         Body: JSON.stringify(data, null, 2)
     };
     s3.upload(params, function(s3Err, data) {
         if (s3Err) throw s3Err
         console.log(`File uploaded successfully at ${data.Location}`)
     });
  });
};

uploadFile();