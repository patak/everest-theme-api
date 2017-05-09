var express = require('express');
var fs = require('fs');
var replace = require('stream-replace');

var app = express();

app.get('/', function (req, res) {
  res.send('Hello World!');
});

app.get('/download', function(req, res){

  var file = __dirname + '/theme/app-theme.example.html';

  var rstream = fs.createReadStream(file);

  res.writeHead(200, {"Content-Type" : "application/force-download", "Content-Disposition" : "filename='app-theme.html'"});

  rstream.pipe(replace(/#darkPrimaryValue/g,'#FFFF' ))
  .pipe(res);

});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
