var AWS = require('aws-sdk');
var s3 = new AWS.S3();

var bucketName = "open-book-pages";
var keyName = makeId(10);
var content = 'This is a sample text file';

var params = { 
    Bucket: bucketName, 
    Key: keyName, 
    Body: content 
};

console.log("Params: " + params);
console.log("api url: " + process.env.API_URL);

s3.putObject(params, function (err, data) {
    if (err)
        console.log(err)
    else
        console.log("Successfully saved object to " + bucketName + "/" + keyName);
});

function makeId(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }