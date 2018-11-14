//NOTE: SERVER CONFIGURATION has 2 options. ENABLE 1 of 2 options

//NOTE: option (1) - https server (443) + redirection 80 to 443

//prepare credentials & etc
var fs = require('fs');
var https = require('https');
var privateKey = fs.readFileSync('/etc/letsencrypt/live/choir.run/privkey.pem', 'utf8');
var certificate = fs.readFileSync('/etc/letsencrypt/live/choir.run/fullchain.pem', 'utf8');
var credentials = {
  key: privateKey,
  cert: certificate
};

//https WWW server @ port 443
var express = require('express');
var app = express();
var httpsWebServer = https.createServer(credentials, app).listen(443, function() {
  console.log('[express] listening on *:443');
});

//http Redirection server @ port 80
//  ==> Don't get why this works.. all others not. ==> https://stackoverflow.com/a/23283173
var http = require('http');
var httpApp = express();
var httpRouter = express.Router();
httpApp.use('*', httpRouter);
httpRouter.get('*', function(req, res) {
  var host = req.get('Host');
  // replace the port in the host
  host = host.replace(/:\d+$/, ":" + app.get('port'));
  // determine the redirect destination
  var destination = ['https://', host, req.url].join('');
  return res.redirect(destination);
});
var httpServer = http.createServer(httpApp);
httpServer.listen(80);

//https socket.io server @ port 443 (same port as WWW service)
var io = require('socket.io')(httpsWebServer, {
  'pingInterval': 1000,
  'pingTimeout': 3000
});

// //NOTE: option (2) - simple http dev server (8080)
//
// var http = require('http');
// var express = require('express');
// var app = express();
// var httpServer = http.createServer(app);
// httpServer.listen(8080);
//
// //http socket.io server @ port 8080 (same port as WWW service)
// var io = require('socket.io')(httpServer, {
//   'pingInterval': 1000,
//   'pingTimeout': 3000
// });

//express configuration
app.use(express.static('public'));

//socket.io events
io.on('connection', function(socket) {

  //entry log.
  console.log('someone connected.');

  //on 'key'
  socket.on('key', function(key) {

    // //NOTE: option (1) - relay the message to everybody INCLUDING sender
    // io.emit('key', key);

    //NOTE: option (2) - relay the message to everybody EXCEPT sender
    socket.broadcast.emit('key', key);

    //DEBUG
    console.log('key.seat :' + key.seat);   // 'seat' should be a numeric!
    console.log('key.id :' + key.id);       // 'id' should be a numeric!
    console.log('key.name :' + key.name);   // 'name' is a string.
    //DEBUG
    console.log('key.value :' + key.value); // 'value' should be a numeric!: 1 or 0
    console.log('key.state :' + key.state); // 'state' is a string: 'on', or 'off'
  })

  //on 'disconnect'
  socket.on('disconnect', function() {
    console.log('someone disconnected.');
  });

});
