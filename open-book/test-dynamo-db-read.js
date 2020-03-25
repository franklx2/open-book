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

docClient.query(params, function (err, data) {
    if (err) {
        console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
    } else {
        console.log("Query succeeded.");
        var pages = [];
        data.Items.forEach(function(item) {
            //console.log(" -", item.PAGE_NUM + ": " + item.TEXT);
            
            var PAGE_NUM = item.PAGE_NUM;
            var TEXT = item.TEXT;
            var pageStruct = {
                "PAGE_NUM": PAGE_NUM,
                "TEXT": TEXT
            }
            pages.push(pageStruct);
        });
        var bookStruct = {
            "book" : pages
        }
        console.log("book: " , JSON.stringify(bookStruct));
    }
});