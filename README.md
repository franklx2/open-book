# open-book
Welcome to Open Book, a simple web application with a serverless backend that allows users to contribute anonymously to an open book.
Users will be able to create new pages and see it appended to the end of the book.

INSTRUCTIONS:
1. Clone the project into your local directory
2. Run `cd open-book`
2. Run `npm install` to setup your environment with the appropriate node packages
3. Run `npm run sls` to initiate the deploy script

This application consists of a simple frontend HTML/JS/CSS that makes requests to the API backend, hosted on a variety of serverless AWS components.

1. On application initial deploy, a user contributed plugin copies an init file into an AWS S3 bucket. This file contains the very first page to the Open Book, which is simple a brief message introducing the user to the intent behind Open Book:
Welcome to Open Book. An open source, open to the internet book available for anyone to contribute. Please be considerate of others when writing.
2. Another plugin syncs the frontend app directory into an S3 bucket configured via serverless.yml for static web hosting. 
3. My plugin checks to see if this is the very first deployment of the app, if it is, then it will extract the text of the init file from S3 and write it into DynamoDB. 
4. The API endpoints/Lambda functions are deployed

There are four total API calls that consist of the backend that the frontend application needs:
1. /create - Creates a new file depending on what the app posts to this endpoint and loads it into S3
2. /update - App supplies an S3 key name and the function updates the specified file with the new text value
3. /publish - App supplies an S3 key name and the function extracts the text from the S3 file and appends it into DynamoDB as a "new page"
4. /get - App calls this endpoint without any parameters to retrieve a list of all the Open Book pages in JSON format

When the user first loads the app, they are presented with the book showing the very first page. The user can then browse the pages at their leisure. They can also submit new pages (the app calls /create as the submit action). When saving the new page, they get one chance to review it after hitting "Save". If they would like to update it, they will submit another form, but this time the app is calling the /update function on the previously generated key name. When the user is finally satisfied, they may publish it live (the app calls the /publish function with the key name). The page reloads back to the open book and loads to the new page.



