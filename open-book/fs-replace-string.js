var fs = require('fs')
const yaml = require('js-yaml');
var spaBucketName = "";
var replacement = "";

try {
    let fileContents = fs.readFileSync('./env.yml', 'utf8');
    let data = yaml.safeLoad(fileContents);
    spaBucketName = data.bucketSPA;
    console.log("Replacing PLACE_HOLDER_URL in spa/js/script.js with the designated API URL");
    replacement = "https://" + spaBucketName + ".s3.amazonaws.com/apiurl.env";
    console.log("Replacement string: " + replacement);
} catch (e) {
    console.log(e);
}

fs.readFile("spa/js/script.js", 'utf8', function (err,data) {
  if (err) {
    return console.log(err);
  }
  var result = data.replace("PLACE_HOLDER_URL", replacement);

  fs.writeFile("spa/js/script.js", result, 'utf8', function (err) {
     if (err) return console.log(err);
  });
});