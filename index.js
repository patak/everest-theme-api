var express = require('express');
var app = express();

app.get('/', function (req, res) {
  res.send('Hello World!');
});

app.get('/download', function(req, res){
  var file = __dirname + '/theme/app-theme.example.html';

  res.download(file, 'app-theme.html'); // Set disposition and send it.
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
