const express = require('express');
const fs = require('fs');
const replace = require('stream-replace');
const bodyParser = require('body-parser');
const path = require('path');
const base64Img = require('base64-img');
const Jimp = require('jimp');
const randomstring = require("randomstring");
const Promise = require('bluebird');
const multer = require('multer')

/**
 * upload configuration
 */
var fileBaseName = null;
var minifyBaseName = null;
var newFileName = null;
var filePath = null;
var minifyPath = null;

/**
 * files configuration.
 * To determine if a file is an valid we can read the first bytes of the stream and compare it with magic numbers
 */
var MAGIC_NUMBERS = {
    jpg: 'ffd8ffe0',
    jpg1: 'ffd8ffe1',
    png: '89504e47',
    gif: '47494638'
}

function checkMagicNumbers(magic) {
    if (magic == MAGIC_NUMBERS.jpg || magic == MAGIC_NUMBERS.jpg1 || magic == MAGIC_NUMBERS.png || magic == MAGIC_NUMBERS.gif)
        return true;
}

/**
 * multer storage configuration
 */
var storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, path.join(__dirname, '/uploads'));
    },
    filename: function (req, file, callback) {
        fileBaseName = path.basename(file.originalname, path.extname(file.originalname));
        fileBaseName = randomstring.generate(7);

        newFileName = fileBaseName + path.extname(file.originalname);

        filePath = path.join(__dirname, '/uploads', newFileName);
        minifyPath = path.join(__dirname, '/uploads', "m_" + newFileName);

        callback(null, newFileName);
    }
});

var app = express();

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use('/images', express.static('uploads'));

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
    var upload = multer({
        storage: storage
    }).any();

    upload(req, res, function (err) {

        var bitmap = fs.readFileSync('./uploads/' + req.files[0].filename).toString('hex', 0, 4);
        if (!checkMagicNumbers(bitmap)) {
            fs.unlinkSync('./uploads/' + req.files[0].filename);
            res.status(403).end('File is not valid');
        }

        var minifyOriginalImage = new Promise(function (resolve, reject) {
            Jimp.read(filePath).then(function (image) {
                image.quality(10)
                    .write(minifyPath, resolve);
            }).catch(function (err) {
                console.error(err);
                return res.status(400).end("Error during minify process");
            });
        });

        minifyOriginalImage.then(function () {
            dataImage = base64Img.base64Sync(minifyPath);
            res.status(200).json({
                imageName: newFileName,
                imageBase64: dataImage
            });
        });

    })
});


app.listen(3000, function () {
  console.log('Everest Theme API listening on port 3000!');
});
