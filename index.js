const express = require('express');
const fs = require('fs');
const replace = require('stream-replace');
const bodyParser = require('body-parser');
const path = require('path');
const base64Img = require('base64-img');
const Jimp = require('jimp');
const randomstring = require("randomstring");
const Promise = require('bluebird');
const formidable = Promise.promisifyAll(require('formidable'));




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
  var newFileName = null;
  var dataImage = null;

  form.multiples = true;
  form.uploadDir = path.join(__dirname, '/uploads');


  form.on('fileBegin', function (field, file) {
    if (file.type != 'image/png' && file.type != 'image/jpg' && file.type != 'image/jpeg') {
      form.emit('error', 'File not Valid');
      return;
    }
  });

  form.on('file', function (field, file) {
    fileBaseName = path.basename(file.name, path.extname(file.name));
    fileBaseName = randomstring.generate(7);

    newFileName = fileBaseName + path.extname(file.name);

    minifyPath = path.join(form.uploadDir, "m_" + newFileName);
    newPath = path.join(form.uploadDir, newFileName);

    fs.rename(file.path, newPath);
  });

  form.on('error', function (err) {
    console.log('An error has occured: \n' + err);
    res.header('Connection', 'close');
    return res.status(403).end(err);
  });

  form.parse(req, function (err) {

    if (err)
      return err;

    /**
    * Write new minify image
    */
    var plop = new Promise(function (resolve, reject) {
      Jimp.read(newPath).then(function (image) {
        image.quality(10)
          .write(minifyPath, resolve);
      }).catch(function (err) {
        console.error(err);
        return res.status(403).end("Incorrect File");
      });
    });

    plop.then(function () {
      dataImage = base64Img.base64Sync(minifyPath);
      res.status(200).json({
        imageName: '' + newFileName + '',
        imageBase64: '' + dataImage + ''
      });
    });

    return;
  });

});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
