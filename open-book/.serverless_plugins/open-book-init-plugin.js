var AWS = require("aws-sdk");

AWS.config.update({
    region: "us-east-1"
});

var docClient = new AWS.DynamoDB.DocumentClient();

var params = {
    "TableName": "open-book-pages-ddb",
    "IndexName": "OBGSI",
    "KeyConditionExpression": "#ID = :ID",
    "ExpressionAttributeNames": {"#ID": "ID"},
    "ExpressionAttributeValues": {":ID":  "1"},
    "ScanIndexForward": "true"
};

var keyName = "INITPAGE";
var readFromS3Promise;
var dataFromS3;

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
    readFromS3Promise = readFromS3(keyName);
    readFromS3Promise.then(function(data){
      console.log('Success reading from S3');
      writeToDynamoDB(dataFromS3);
    }).catch(function(error) {
      console.log(error);
    });
  }
 }
 module.exports = OpenBookInitPlugin;