'use strict';
const ID_LENGTH = 10;
var AWS = require('aws-sdk');
var s3 = new AWS.S3();
var errors = [];
var data = "";
var text = "";
var s3_status = "";
var s3KeyName = "";

/*
 * @TODO: For whatever reason I am not able to get the key name back on the response. But at least the file is being uploaded now. Thank God.
 */

module.exports.hello = (event, context, callback) => {
  init(event);
  uploadToS3(text);
  callback(null, {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: 'text: ' + text,
        input: event.body,
        errors: errors,
        s3_status: s3_status,
        s3KeyName: s3KeyName
      },
      null,
      2
    ),
  })
};

function init(event) {
  // Parse the post body and extract text field
  try {
    data = JSON.parse(event.body); 
    text = data.text; 
  } catch (error) {
    errors.push(error.message);
    return false;
  }
  
}

function uploadToS3(text) {
  var bucketName = process.env.bucketName;
  var keyName = makeId(ID_LENGTH)
  var content = text;
  var contentType = 'STRING_VALUE';
  var acl = "public-read";
  var params = { 
    Bucket: bucketName, 
    Key: keyName, 
    Body: content, 
    ContentType: contentType, 
    ACL: acl
  };
  console.log("Upload to S3 in progress");
  console.log(params);
  s3.putObject(params, function (err, data) {
    if(err) {
      errors.push(err);
      s3_status = "Failed to save object to " + bucketName + "/" + keyName;
    }
    else {
      s3_status = "Successfully saved object to " + bucketName + "/" + keyName;
      s3KeyName = keyName;
    }
  });
}

function makeId(length) {
  var result           = '';
  var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for ( var i = 0; i < length; i++ ) {
     result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

