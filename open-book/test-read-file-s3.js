var AWS = require('aws-sdk');
var s3 = new AWS.S3();
var bucketName = "open-book-pages";
var keyName = "INITPAGE";
var params = {
    Bucket: bucketName, 
    Key: keyName 
}

console.log("Params: " + params);

//Fetch or read data from aws s3
s3.getObject(params, function (err, data) {
    if (err) {
        console.log(err);
    } else {
        console.log(data.Body.toString()); //this will log data to console
    }
})