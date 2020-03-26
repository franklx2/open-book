var AWS = require("aws-sdk");

AWS.config.update({
    region: "us-east-1"
});

var apigateway = AWS.Request();

var params = {
    limit: '5',
    position: '5'
  };
apigateway.getRestApis(params, function(err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else     console.log(data);           // successful response
});