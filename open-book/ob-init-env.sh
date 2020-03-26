#!/bin/bash
# Get the APIGW ID. WIll use this to construct the endpoint hostname
ENV="dev"
APINAME="${ENV}-open-book"
REGION="us-east-1"
APIID=$(aws apigateway get-rest-apis --query "items[?name==\`${APINAME}\`].id" --output text --region us-east-1)
API_URL="https://${APIID}.execute-api.${REGION}.amazonaws.com/dev/"
echo ${API_URL} > apiurl