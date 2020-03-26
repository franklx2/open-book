'use strict';
var AWS = require('aws-sdk');
var pagesData = "";
var data = "";
var text = "";
var keyName = "";
var content = "";
var contentType = 'STRING_VALUE';
var acl = "public-read";
var dataFromS3 = "";
var errors = [];
const ID_LENGTH = 10;
var maxPageNum = -999;
var newPageNum = -999;
var bucketName = process.env.bucketName;
var tableName = process.env.dynamoDB;
var readFromS3Promise;
var getPagesDataPromise;
var s3 = new AWS.S3();
var dynamodb = new AWS.DynamoDB();
var docClient = new AWS.DynamoDB.DocumentClient();
var apiGWURL = process.env.GW_URL;

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
 *    -03/24/2020 10:17 PM For the next hour, my next goal is to finish writing that test-dynamo-db-query.js file so that I can 
 *                         obtain the "next page number". 
 *    -03/24/2020 10:29 PM Actually just finished. Did not take that long. I will need to create the new API call now:
 *                         1. Create new endpoint in serverless.yml
 *                         2. Create new function in this file (handler.js) for writing to DynamoDB... What should I call it? "/publish" will do
 *    -03/24/2020 10:42 PM Forgot about another crucial piece of the puzzle: reading a file from S3! I just created a working test .js file that reads
 *                         a file from S3 given a keyName. I will be able to use this in the /publish function...
 *    -03/24/2020 11:32 PM Hallelujah! I was able get a successful post response back from the /publish endpoint containing the file data read from S3.
 *                         The next step is to create the function that will do the writing... Ah, I need to create yet another test file. This one
 *                         will take an input string and write it to the table, WITH THE APPROPRIATE PAGE_NUM!
 *    -03/25/2020 12:15 AM I am losing steam. This is bad. I might need to take a quick nap. I have, however, completed the test file for writing to 
 *                         DynamoDB. It does a query first and finds the current max page number, then does a simple increment on it to obtain the new 
 *                         page number to call DynamoDB's putItem API call with. Next step is to integrate that logic into handler.js. I will attempt to
 *                         do that now, before I pass out...
 *    -03/25/2020 01:12 AM And we have success... Almost an hour later. The /publish endpoint is working now. It takes a singular parameter: "keyName", 
 *                         The code does not currently handle the case when the keyName is not found, but I'm going out on a limb and making an assumption
 *                         that the keyName will always exist :) It reads the file from S3 with the given keyName and loads that string into DynamoDB 
 *                         with the "new page number". This facilitates the "appending" feature... Eventually we might get to a point where there is collision
 *                         on the page number, i.e., if two simultaneous /publish calls occur before the other is finished, there is a very slight, if not
 *                         altogether negligible TBH, chance that two different files can be published with the same page number. Will deal with that later.
 *                         Next step is to create a serverless plugin that would call /publish... Need to think of a efficient usecase for this plugin. 
 *                         Need to consider that this plugin gets called on each 'sls deploy'ment. 
 *    -03/25/2020 01:55 AM I actually just thought of something... I need one more endpoint that would be able to return all of the page data in JSON format. 
 *                         While not a requirement, it is definitely needed for the frontend app to utilize in order to generate the view. Under no circumstance
 *                         would we want to have the client make calls to the DynamoDB table and fetch rows... That just smells like trouble TBH. Lets do this
 *                         first before making the plugin.
 *    -03/25/2020 02:12 AM I completed the script for fetching DynamoDB rows and outputting as JSON string... Now to integrate with handler.js...
 *    -03/25/2020 03:16 AM I have to do some soul searching to see how far I want to take the frontend. It would be cool if I used Babylon.JS to do a 3D
 *                         rendering of the book with animation and cool materials. But to be honest that is considerable work that isn't the focus of this
 *                         project. What would NOT be cool is if I failed to deliver a frontend because I took on something way huge. Sigh. I have to ditch it.
 *                         At least that /get endpoint is complete. Next step is to complete the plugin that will be called on the initial sls deploy call. 
 *                         After that I can work on the frontend. I have tomorrow night (Wednesday), hopefully will get the barebones working of the frontend.
 * 1. /publish function that will read a file from S3 and write the data to DynamoDB
 * 2. Create a plugin that pulls data with Lambda and writes to DynamoDB
 *    -This will be a QA plugin that satisfies the plugin requirement of the exercise
 *    -03/26/2020 02:08 AM Turned out that this was not a QA plugin at all. It is going to be an initializer plugin. The trick is though, I need to make it
 *                         conditional -- conditional in the sense that it needs to be able to detect if the open book ddb table is empty. If it is empty,
 *                         then it knows for sure that it is the initial deployment of the app, and it will go ahead and run the plugin to load init file.
 *    -03/26/2020 03:19 AM I finished the plugin ... I am presented with the problem of, how will I get the API endpoint over to the frontend app? I need to
 *                         support that functionality during 'sls deploy's... So I will have to construct the URL and then load it into an env file on S3.
 *    -03/26/2020 04:16 AM Wow, that was incredibly painful. I was able to create a script that generates the API endpoint URL and upload it to the S3 bucket
 *                         the frontend app will use. I hope I can just go ahead and load the file from the app to get the URL for its API calls. I am pretty
 *                         sure it will work ... 
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

// Retrieves the content from a file in S3 and writes it into DynamoDB
module.exports.publish = (event, context, callback) => {
  publishInit(event);
  readFromS3Promise = readFromS3(keyName);
  readFromS3Promise.then(function(data){
    console.log('Success reading from S3');
    writeToDynamoDB(dataFromS3, callback);
  }).catch(function(error) {
    console.log(error);
    errors.push(error);
  });
}

module.exports.get = (event, context, callback) => {
  getPagesDataPromise = getPagesData();
  getPagesDataPromise.then(function(data){
    getResponse(callback);
  }).catch(function(error){
    console.log("Error: " + error);
  });
}

function getResponse(callback)
{
  callback(null, {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: 'Pages data from DynamoDB',
        pagesData: pagesData,
        errors: errors
      },
      null,
      2
    ),
  });
}

function getPagesData() {
  var getParams = {
    "TableName": tableName,
    "IndexName": "OBGSI",
    "KeyConditionExpression": "#ID = :ID",
    "ExpressionAttributeNames": {"#ID": "ID"},
    "ExpressionAttributeValues": {":ID":  "1"},
    "ScanIndexForward": "true"
  };

  var queryPromise = docClient.query(getParams, function (err, data) {
    if (err) {
        console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
    } else {
        console.log("Query succeeded.");
        var pages = [];
        var bookStruct;

        data.Items.forEach(function(item) {
            var PAGE_NUM = item.PAGE_NUM;
            var TEXT = item.TEXT;
            var pageStruct = {
                "PAGE_NUM": PAGE_NUM,
                "TEXT": TEXT
            }
            pages.push(pageStruct);
        });

        bookStruct = {
            "book" : pages
        }
        pagesData = JSON.stringify(bookStruct);
        console.log("book: " , pagesData);
    }
  }).promise();

  return queryPromise;
}

function publishResponse(callback) {
  callback(null, {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: 'Data from S3: ' + dataFromS3,
        errors: errors,
        s3KeyName: keyName,
      },
      null,
      2
    ),
  });
}

function publishInit(event) {
  // Parse the post body and extract text field
  // and keyName field
  try {
    data = JSON.parse(event.body); 
    keyName = data.keyName;
  } catch (error) {
    errors.push(error.message);
    return false;
  }
}

function writeToDynamoDB(text, callback) {
  var getNewPageNumPromise = getNewPageNum();
  
  getNewPageNumPromise.then(function(data){
    if(maxPageNum != -999)
    {
        console.log("maxPageNum: " + maxPageNum);
        newPageNum = parseInt(maxPageNum) + 1;
        console.log("newPageNum: " + newPageNum);
    }
    
    var putParams = {
        TableName: tableName,
        Item:{
            "PAGE_NUM" : { "N": newPageNum.toString()},
            "ID": { "S": "1"},
            "TEXT": { "S": text}
        }
    };

    var writePromise = dynamodb.putItem(putParams, function (err, data){
        if(err) {
            console.log("Write to DynamoDB failed. Error:", JSON.stringify(err, null, 2));
        }
        else {
            console.log("Write successful");
        }
    }).promise();
    
    writePromise.then(function(){
      publishResponse(callback);
    });
  }).catch(function(error){
      console.log(error);
  });

}

function getNewPageNum() {
  var getParams = {
    "TableName": tableName,
    "IndexName": "OBGSI",
    "KeyConditionExpression": "#ID = :ID",
    "ExpressionAttributeNames": {"#ID": "ID"},
    "ExpressionAttributeValues": {":ID":  "1"},
    "ScanIndexForward": "false"
  };

  var queryPromise = docClient.query(getParams, function (err, data) {
    if (err) {
        console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
        errors.push(JSON.stringify(err, null, 2));
    } 
    else {
        console.log("Query succeeded.");
        maxPageNum = data.Items[0].PAGE_NUM;
        console.log("Items[0].PAGE_NUM: " + maxPageNum);
    }
  }).promise();

  return queryPromise;
}

function readFromS3(inputKeyName) {
  // I need to make this function return a promise so I can call it in a wrapper function and make use of .then()
  var params = { 
    Bucket: bucketName, 
    Key: inputKeyName
  };

  var getObjectPromise = s3.getObject(params, function (err, data) {
      if (err) {
          console.log(err);
          errors.push(err);
      } else {
        dataFromS3 = data.Body.toString();
        console.log(dataFromS3); //this will log data to console
      }
  }).promise();

  return getObjectPromise;
}

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

