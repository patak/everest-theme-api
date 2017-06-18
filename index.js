var express = require('express');
var fs = require('fs');
var replace = require('stream-replace');
var bodyParser = require('body-parser');
var formidable = require('formidable');
var path = require('path');

var app = express();

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/', function (req, res) {
  res.send('Hello World!');
});

app.post('/download', bodyParser.urlencoded(true), function (req, res) {
  var file = path.join(__dirname, '/theme/app-theme.example.html');
  var rstream = fs.createReadStream(file);

  var obj = req.body;
  res.writeHead(200, { "Content-Type": "application/force-download", "Content-Disposition": "filename='app-theme.html'" });

  for (var property in obj) {
    if (obj.hasOwnProperty(property)) {
      var re = new RegExp(property, "g");
      rstream = rstream.pipe(replace(re, obj[property]));
    }
  }
  rstream.pipe(replace(/(#.*#)+/gmi, "inherit"))
    .pipe(res);

});

app.post('/upload', function (req, res) {
  var form = new formidable.IncomingForm();

  form.multiples = true;

  form.uploadDir = path.join(__dirname, '/uploads');

  form.on('file', function (field, file) {
    fs.rename(file.path, path.join(form.uploadDir, file.name));
  });

  form.on('error', function (err) {
    console.log('An error has occured: \n' + err);
  });

  form.on('end', function () {
    res.status(200).end('success');
  });

  form.parse(req);
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
