const express = require('express');
const fs = require('fs');
const replace = require('stream-replace');
const bodyParser = require('body-parser');
const formidable = require('formidable');
const path = require('path');
const base64Img = require('base64-img');
const Jimp = require('jimp');
const randomstring = require("randomstring");
const Promise = require('bluebird');



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
  var dataImage = null;

  form.multiples = true;
  form.uploadDir = path.join(__dirname, '/uploads');

  form.parse(req)
    .on('fileBegin', function (field, file) {
      if (file.type != 'image/png' && file.type != 'image/jpg' && file.type != 'image/jpeg') {
        form.emit('error', 'File not Valid');
        return;
      }
    })
    .on('file', function (field, file) {
      fileBaseName = path.basename(file.name, path.extname(file.name));
      fileBaseName = randomstring.generate(7);
      minifyPath = path.join(form.uploadDir, "minify_" + fileBaseName + path.extname(file.name));

      newPath = path.join(form.uploadDir, fileBaseName + path.extname(file.name));
      fs.rename(file.path, newPath);

      /**
       * Write new minify image
       */
      Jimp.read(newPath).then(function (image) {
        image.scale(0.1)
          .write(minifyPath);
      }).catch(function (err) {
        console.error(err);
      });
    })
    .on('error', function (err) {
      console.log('An error has occured: \n' + err);
      res.header('Connection', 'close');
      res.status(403).end("File not valid");
      return;
    })
    .on('end', function () {
      //dataImage = base64Img.base64Sync(minifyPath);
      res.status(200).end("Great success");;
    });
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
