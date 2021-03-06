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
    "Select":"COUNT"
};

docClient.query(params, function (err, data) {
    if (err) {
        console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
    } else {
        console.log("Query succeeded.");
        // data.Items.forEach(function(item) {
        //     console.log(" -", item.PAGE_NUM + ": " + item.TEXT);
        // });
        // console.log("Items[0].PAGE_NUM: " + data.Items[0].PAGE_NUM);
        console.log("data: " + data.Count);
    }
});