'use strict';
// const querystring = require('querystring');

module.exports.hello = async event => {
  // Parse the post body
  // const data = querystring.parse(event.body);
  const data = JSON.parse(event.body); // should wrap in try/catch
  const text = data.text; // 'world'
  // Access variables from body
  // const text = data.text;

  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: 'text: ' + text,
        input: event.body,
      },
      null,
      2
    ),
  };

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
};
