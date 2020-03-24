var AWS = require("aws-sdk");

AWS.config.update({
    region: "us-east-1"
});

var docClient = new AWS.DynamoDB.DocumentClient();

var params = {
    "TableName": "open-book-pages",
    "KeyConditionExpression": "#ID = :ID ",
    "ExpressionAttributeNames": {
        ":userid": "ID"
    },
    "ExpressionAttributeValues": {
        ":userid": {
            "S": "manaf1"
        }
    }
};

docClient.query(params, function (err, data) {
    if (err) {
        console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
    } else {
        console.log("Query succeeded.");
    }
});