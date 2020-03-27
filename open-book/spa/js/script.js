
const previewLoadingSpinerHTML = '<img class="mx-auto preview-loading-spinner" src="img/loading.gif"/>';
const tooltipTextHTML = `<span class="tooltip-text">Publish is available after saving</span>`;
const emptyStringErrorHTML = `<span class="empty-string-error" style="color:red">User input was empty. Please try again.</span>`;
var APIHOST = "";
var APICREATE = "";
var APIUPDATE = "";
var APIPUBLISH = "";
var APIGET = "";
var savedText = "";
var savedKey = "";
var pagesMap = new Map()
var currentPage = -999;
var totalNumberOfPages = -999;
var saveCounter = 0;
var saved = false;

const INIT_PAGE_NUM = 1;
const Http = new XMLHttpRequest();

function getPagesData() {
    return new Promise(function(resolve){
        console.log("sending post to: " + APIGET);
        $.post( APIGET, function( data ) {
            console.log("data: " , data);
            var pagesData = JSON.parse(data.pagesData);
            var pages = pagesData.book;
           
            pages.forEach(function(elem){
                var pageNum = elem.PAGE_NUM;
                var text = elem.TEXT;
                console.log("pageNum: " + pageNum);
                console.log("text: " + text);
    
                pagesMap.set(pageNum, text);
            });

            totalNumberOfPages = pagesMap.size;
            resolve();
        });

    });
}

// The publish action calls the /publish API. It only takes one parameter: keyName
function publishAction(){
    return new Promise(function(resolve){
        var postData;
        var APICALL;

        APICALL = APIPUBLISH;
        postData = {
            "keyName" : savedKey
        }

        if(saved)
        {   
            $.ajax({
                url: APICALL,
                type: 'POST',
                crossDomain: true,
                contentType: 'application/json',
                data: JSON.stringify(postData),
                dataType: 'json',
                success: function(data) {
                    // Switch the view back to the Open Book 
                    $(".new-page-close").hide();
                    $(".new-page-wrapper").fadeOut("fast").promise().done(function(){

                        $(".main-content-wrapper").children().show();
                        $(".main-content-wrapper").fadeIn("fast");
                    });
                    $(".new-page-open").show();

                    $(".loading-spinner").show();
                    getPagesData().then(function(){
                        var pageText = pagesMap.get(totalNumberOfPages);
                        currentPage = totalNumberOfPages;
                        $(".loading-spinner").hide();
                        $(".content p").text(pageText);
                        $(".page-number span").text(currentPage);
                    });
                },
                error: function(xhr, ajaxOptions, thrownError) {
                    console.log("PUBLISH FAILED");
                }
            });  
        }
        else
        {
            console.log("Not saved, skipping.")
        }

    });
}

function saveAction(text){
    return new Promise(function(resolve){
        var postData;
        var APICALL;
        // On the first save, we are creating a new file in S3. The endpoint to be called will be /create, which only takes one parameter: "text"
        // On the subsequent saves, we will call /update, which takes in "text" and "keyName"
        if(saveCounter >= 1)
        {
            APICALL = APIUPDATE;
            postData = {
                "text" : text,
                "keyName" : savedKey
            }
        }
        else
        {
            APICALL = APICREATE;
            postData = {
                "text" : text
            }
        }
        console.log("sending post to: " + APICREATE);
        console.log("postData: " , postData);
        if(text === "")
        {
            var emptyStringErrorElement = $.parseHTML(emptyStringErrorHTML);
            $(".preview-page-content").append(emptyStringErrorElement);
        }
        else
        {
            var previewLoadingSpinerElement = $.parseHTML(previewLoadingSpinerHTML);
            $(".preview-page-content").append(previewLoadingSpinerElement);
            $.ajax({
                url: APICALL,
                type: 'POST',
                crossDomain: true,
                contentType: 'application/json',
                data: JSON.stringify(postData),
                dataType: 'json',
                success: function(data) {
                    console.log("data: " , data);
                    // The calls /update and /create returns the same response data
                    // The first call dumps the returned data into the preview area, the subsequent calls should do the same
                    // This implementation implies that the user's "session" is tied to the "saved" and "saveCounter" variables
                    // When the user clicks on the "minus" icon, we should clear out the "session" by setting "saved" to false and "saveCounter" to 0
                    // This way, when the user comes back under the same "session" and wishes to create a new page, then they will submit a new page
                    // rather than continuously overwriting the same file.... but hold on, what does it matter if it's the same file or not? It's only when 
                    // they click on "Publish" will the records get written to in DynamoDB, so really, it doesn't matter if we make a new S3 file or not.
                    // The only difference is that if we overwrite the same file we will save in terms of S3 storage in the long term. So the current 
                    // implementation is fine. 
                    savedText = data.message;
                    savedKey = data.s3KeyName;
                    saved = true;
                    $(".publish-action").removeClass("not-saved");
                    $(".publish-action-wrapper .tooltip-text").remove();
                    saveCounter++;
    
                    console.log("savedText: " + savedText);
                    resolve();
                },
                error: function(xhr, ajaxOptions, thrownError) {
                    console.log("INTERNAL ERROR. SAVE FAILED.");
                }
            });
            
        }
    });
}

function init() {
    return new Promise(function(resolve){
        //Do not replace "https://open-book-spa.s3.amazonaws.com/apiurl.env"
        fetch('PLACE_HOLDER_URL').then((response) => {
            return response.json();
        }).then((data) => {
            APIHOST = data.url;
            console.log("APIHOST: " + APIHOST);

            APICREATE = APIHOST + "create";
            APIUPDATE = APIHOST + "update";
            APIPUBLISH = APIHOST + "publish";
            APIGET = APIHOST + "get";

            attachListeners();
            var tooltipTextElement = $.parseHTML(tooltipTextHTML);
            $(".publish-action-wrapper").append(tooltipTextElement);
            resolve();
        });

    });
}

function goToPage(pageNum){
    var pageText = pagesMap.get(pageNum);
    currentPage = pageNum;
    $(".loading-spinner").hide();
    $(".content p, .page-number").fadeOut().promise().done(function(){
        $(".content p").text(pageText);
        $(".page-number span").text(currentPage);
        $(".content p, .page-number").fadeIn();
    });
}

function attachListeners(){
    $(".next-page").click(function(){
        // Do nothing if current page == totalNumberOfPages
        if(currentPage != totalNumberOfPages)
        {   
            goToPage(currentPage + 1);
        }
    });
    $(".prev-page").click(function(){
        // Do nothing if current page == 1
        if(currentPage !=1 )
        {
            goToPage(currentPage - 1);
        }
    });
    $(".new-page-open").click(function(){
        $(this).hide();
        $(".main-content-wrapper").children().hide();
        $(".main-content-wrapper").fadeOut("fast");
        $(".new-page-wrapper").fadeIn("fast");
        $(".new-page-close").show();
    });
    $(".new-page-close").click(function(){
        $(this).hide();
        $(".new-page-wrapper").fadeOut("fast").promise().done(function(){

            $(".main-content-wrapper").children().show();
            $(".main-content-wrapper").fadeIn("fast");
        });
        $(".new-page-open").show();
    });
    $(".save-action").click(function(){
        var inputText = $("#new-page-text").val();
        console.log("input text: " + inputText);
        saveAction(inputText).then(function(){
            console.log("showing savedText");
            $(".preview-page-content").text(savedText);
        });
    });
    $(".publish-action").click(function(){
        publishAction();
    });
    
}

$(document).ready(function(){
    init().then(function(){
        //Call get /get API to fetch the pages data
        console.log("calling getpagesdata");
        getPagesData().then(function(){
            var pageText = pagesMap.get(INIT_PAGE_NUM);
            currentPage = INIT_PAGE_NUM;
            $(".loading-spinner").hide();
            $(".content p").text(pageText);
            $(".page-number span").text(currentPage);
        });
    });
});