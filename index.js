var express = require('express');
var fs = require('fs');
var replace = require('stream-replace');
var bodyParser = require('body-parser');
var formidable = require('formidable');
var path = require('path');
var base64Img = require('base64-img');
var Jimp = require('jimp');
var randomstring = require("randomstring");


var app = express();

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
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
  var newPath = null;
  var minifyPath = null;
  var fileBaseName = null;
  var data = null;

  form.multiples = true;
  form.uploadDir = path.join(__dirname, '/uploads');

  form.parse(req, function (err, fields, files) {
    res.status(200).end(data);
  });

  form.on('fileBegin', function (field, file) {
    if (file.type != 'image/png' && file.type != 'image/jpg' && file.type != 'image/jpeg')
      res.status(403).end("File not valid");
  });

  form.on('file', function (field, file) {
    fileBaseName = path.basename(file.name, path.extname(file.name));
    fileBaseName = randomstring.generate(7);
    minifyPath = path.join(form.uploadDir, "minify_" + fileBaseName + path.extname(file.name));
    newPath = path.join(form.uploadDir, fileBaseName + path.extname(file.name));
    fs.rename(file.path, newPath);
    Jimp.read(newPath).then(function (lenna) {
      lenna.resize(42, 42)
        .write(minifyPath);
    }).catch(function (err) {
      console.error(err);
    });
  });

  form.on('error', function (err) {
    console.log('An error has occured: \n' + err);
  });

  form.on('end', function () {
    //data = base64Img.base64Sync(minifyPath);
  });
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
