var AWS = require("aws-sdk");
AWS.config.update({
  region: 'us-east-1',
  apiVersions: {
    dynamodb: '2012-08-10',
  }
});

var dynamodb = new AWS.DynamoDB();
var s3 = new AWS.S3();
var docClient = new AWS.DynamoDB.DocumentClient();
var readFromS3Promise;
var getTableCountPromise;
var dataFromS3;
var tableCount;
var tableName = "open-book-pages-ddb";
var bucketName = "open-book-pages";
var keyName = "INITPAGE";
var isInitDeploy = false;


function getTableCount() {
  var params = {
      "TableName": "open-book-pages-ddb",
      "IndexName": "OBGSI",
      "KeyConditionExpression": "#ID = :ID",
      "ExpressionAttributeNames": {"#ID": "ID"},
      "ExpressionAttributeValues": {":ID":  "1"},
      "Select":"COUNT"
  };

  var queryPromise = docClient.query(params, function (err, data) {
    if (err) {
      console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
    } else {
      // console.log("Query succeeded.");
      tableCount = data.Count;
      if(tableCount === 0)
      {
        isInitDeploy = true;
      }
    }
  }).promise();

  return queryPromise;
}

function readFromS3(inputKeyName) {
  // I need to make this function return a promise so I can call it in a wrapper function and make use of .then()
  var params = { 
    Bucket: bucketName, 
    Key: keyName
  };

  var getObjectPromise = s3.getObject(params, function (err, data) {
      if (err) {
          console.log(err);
          errors.push(err);
      } else {
        dataFromS3 = data.Body.toString();
        // console.log(dataFromS3); 
      }
  }).promise();

  return getObjectPromise;
}

function writeToDynamoDB(text) {
  var putParams = {
      TableName: tableName,
      Item:{
          "PAGE_NUM" : { "N": "1"},
          "ID": { "S": "1"},
          "TEXT": { "S": text}
      }
  };

  dynamodb.putItem(putParams, function (err, data){
    if(err) {
        console.log("Write to DynamoDB failed. Error:", JSON.stringify(err, null, 2));
    }
    else {
        console.log("Write successful");
    }
  });
}

class OpenBookInitPlugin {
  constructor(serverless, options) {
    this.hooks = {
        'after:deploy:deploy': this.afterDeploy.bind(this)
    };
  }

  afterDeploy() {
    getTableCountPromise = getTableCount();
    getTableCountPromise.then(function(){
      console.log("The size of the DynamoDB table is: " + tableCount);
      console.log("Init deploy: " + isInitDeploy);
      if (!isInitDeploy) {
        console.log("This is not an initial deployment, skipping initialization");
      }
      else {
        console.log("Open Book DynamoDB table is empty. Initializing with data from S3");
        readFromS3Promise = readFromS3(keyName);
        readFromS3Promise.then(function(data){
          console.log('Success reading from S3');
          writeToDynamoDB(dataFromS3);
        }).catch(function(error) {
          console.log(error);
        });
      }
    });



  }
}

 module.exports = OpenBookInitPlugin;