
var APIHOST = "";
var APICREATE = "";
var APIUPDATE = "";
var APIPUBLISH = "";
var APIGET = "";

const Http = new XMLHttpRequest();

function getPagesData() {
    console.log("sending post to: " + APIGET);
    // Http.open("POST", APIGET);
    // Http.send();
    
    // Http.onreadystatechange = (e) => {
    //   console.log(Http.responseText)
    // }
    $.post( APIGET, function( data ) {
        console.log(data);
    });
}

function init() {
    return new Promise(function(resolve){
        //Do not replace "https://open-book-spa.s3.amazonaws.com/apiurl.env"
        fetch('https://open-book-spa.s3.amazonaws.com/apiurl.env').then((response) => {
            return response.json();
        }).then((data) => {
            APIHOST = data.url;
            console.log("APIHOST: " + APIHOST);

            APICREATE = APIHOST + "create";
            APIUPDATE = APIHOST + "update";
            APIPUBLISH = APIHOST + "publish";
            APIGET = APIHOST + "get";

            readTextFile("env.yml");

            resolve();
        });

    });
}

function readTextFile(file)
{
    fetch(file)
  .then(response => response.text())
  .then(text => console.log(text))
}

$(document).ready(function(){
    init().then(function(){
        //Call get /get API to fetch the pages data
        console.log("calling getpagesdata");
        getPagesData();
    });
});