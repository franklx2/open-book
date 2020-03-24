'use strict';
const ID_LENGTH = 10;
var AWS = require('aws-sdk');
var s3 = new AWS.S3();
var errors = [];
var data = "";
var text = "";
var s3_status = "";
var keyName = "";
var bucketName = process.env.bucketName;
var content = "";
var contentType = 'STRING_VALUE';
var acl = "public-read";


/*
 * @TODO: As of now I still need to complete the following:
 * 0. Create a DynamoDB table that will do what you want... just an Int increment column, and a Text column
 *    -03/24/2020 I was able to create a new DynamoDB table with a GSI attached that will allow the user to persist page data.
 *                The GSI is needed for a way to sort the page numbers. Since sorting is implemented via "range" keys, I needed a
 *                Hash key that will return all rows of the table. I chose to use "ID" and all rows have an ID of 1 at the moment.
 *                The "ID" attribute can be thought of as the ID of a book, meaning that these rows all belong to one logical book.
 *                So the GSI has the "ID" as the hash and "PAGE_NUM" as the range key. The code will be able to sort the query for 
 *                "ID" == 1 on descending, returning me the LAST page number. I will use that returned value to compute what the new 
 *                page numbers will be when persisting page data from S3. 
 * 1. /publish function that will read a file from S3 and write the data to DynamoDB
 * 2. Create a plugin that uploads a file to S3, pulls data with Lambda and writes to DynamoDB
 *    - This will be a QA plugin that satisfies the plugin requirement of the exercise
 * 3. Create The frontend page that displays the Open Book and also allows users to submit forms for editing/publishing
 */

// Creates new file and uploads to S3 with randomized key name
module.exports.create = (event, context, callback) => {
  createInit(event);
  uploadToS3(text, callback);
};

// Creates new file and uploads to S3 with an existing key name (performs overwrite)
module.exports.update = (event, context, callback) => {
  updateInit(event);
  uploadToS3(text, callback);
};

function updateInit(event) {
  // Parse the post body and extract text field
  // and keyName field
  try {
    data = JSON.parse(event.body); 
    text = data.text; 
    keyName = data.keyName;
  } catch (error) {
    errors.push(error.message);
    return false;
  }
}

function createInit(event) {
  // Parse the post body and extract text field
  try {
    data = JSON.parse(event.body); 
    text = data.text; 
    keyName = makeId(ID_LENGTH);
  } catch (error) {
    errors.push(error.message);
    return false;
  }
}

function uploadToS3(text, callback) {
  if(text!="")
  {
    content = text;
  }
  else
  {
    errors.push("ERROR. CONTENT EMPTY.");
  }

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
      console.log("Failed to save object to " + bucketName + "/" + keyName);
    }
    else {
      console.log("Successfully saved object to " + bucketName + "/" + keyName);
      callback(null, {
        statusCode: 200,
        body: JSON.stringify(
          {
            message: 'text: ' + text,
            errors: errors,
            s3KeyName: keyName,
            status: "success"
          },
          null,
          2
        ),
      });
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

