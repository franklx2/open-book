var AWS = require("aws-sdk");

AWS.config.update({
    region: "us-east-1"
});

var docClient = new AWS.DynamoDB.DocumentClient();
var dynamodb = new AWS.DynamoDB();
var maxPageNum = -999;
var newPageNum = -999;
var text = "This is test data that contains absolutely nothing.";
var getParams = {
    "TableName": "open-book-pages-ddb",
    "IndexName": "OBGSI",
    "KeyConditionExpression": "#ID = :ID",
    "ExpressionAttributeNames": {"#ID": "ID"},
    "ExpressionAttributeValues": {":ID":  "1"},
    "ScanIndexForward": "false"
};


var queryPromise = docClient.query(getParams, function (err, data) {
    if (err) {
        console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
    } 
    else {
        console.log("Query succeeded.");
        // data.Items.forEach(function(item) {
        //     console.log(" -", item.PAGE_NUM + ": " + item.TEXT);
        // });
        maxPageNum = data.Items[0].PAGE_NUM;
        console.log("Items[0].PAGE_NUM: " + maxPageNum);
    }
}).promise();

queryPromise.then(function(data){
    if(maxPageNum != -999)
    {
        console.log("maxPageNum: " + maxPageNum);
        newPageNum = parseInt(maxPageNum) + 1;
        console.log("newPageNum: " + newPageNum);
    }
    var putParams = {
        TableName:"open-book-pages-ddb",
        Item:{
            "PAGE_NUM" : { "N": newPageNum.toString()},
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
}).catch(function(error){
    console.log(error);
});