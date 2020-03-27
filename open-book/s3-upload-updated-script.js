const fs = require('fs');
const yaml = require('js-yaml');
// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');
// Set the region 
AWS.config.update({region: 'us-east-1'});
var spaBucketName = "";
try {
  let fileContents = fs.readFileSync('./env.yml', 'utf8');
  let data = yaml.safeLoad(fileContents);
  spaBucketName = data.bucketSPA;
  console.log("Uploading updated spa/js/script.js to SPA bucket");
  //console.log(spaBucketName);
} catch (e) {
    console.log(e);
}
// Create S3 service object
s3 = new AWS.S3({apiVersion: '2006-03-01'});

// call S3 to retrieve upload file to specified bucket
var uploadParams = {Bucket: spaBucketName, Key: '', Body: ''};
var file = "spa/js/script.js";

// Configure the file stream and obtain the upload parameters
var fileStream = fs.createReadStream(file);
fileStream.on('error', function(err) {
  console.log('File Error', err);
});
uploadParams.Body = fileStream;
var path = require('path');
var basename = path.basename(file);
uploadParams.Key = "js/" + basename;

// call S3 to retrieve upload file to specified bucket
s3.upload (uploadParams, function (err, data) {
  if (err) {
    console.log("Error", err);
  } if (data) {
    console.log("Upload Success", data.Location);
  }
});