var AWS = require('aws-sdk');
var s3 = new AWS.S3();
var fs = require('fs');
var bucketName = "open-book-spa";
var keyName = "apiurl.env";
var data = "";
try {
  var api = fs.readFileSync('./apiurl', 'utf8')
  data = '{"url":"' + api.trim() + '"}';
  console.log("API Hostname: " + data)
} catch (err) {
  console.error(err)
}

var params = { 
    Bucket: bucketName, 
    Key: keyName, 
    Body: data
};

s3.putObject(params, function (err, data) {
    if (err)
        console.log(err)
    else
        console.log("Successfully saved object to " + bucketName + "/" + keyName);
});
