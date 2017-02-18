var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var spawn = require('child_process').spawn,
    vmstat    = spawn('vmstat', ['1']);

var WINDOW_LIMIT = 20;

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.get('/limit', function(req, res) {
  res.json({ "window-limit" : WINDOW_LIMIT });
});

io.on('connection', function(socket){
  console.log('a user connected');
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
});

vmstat.stdout.on('data', function (data) {
  var msgs = data.toString().trim().split("\n");
  for(var i = 0; i < msgs.length; i++) {
    io.emit('vmstat-out', new Date().toISOString() + " - " + msgs[i]);
  }
});

vmstat.stderr.on('data', function (data) {
  var msgs = data.toString().trim().split("\n");
  for(var i = 0; i < msgs.length; i++) {
    io.emit('vmstat-err', new Date().toISOString() + " - " + msgs[i]);
  }
});

vmstat.on('exit', function (code) {
  console.log('child process exited with code ' + code.toString());
});


http.listen(5601, function(){
  console.log('listening on *:5601');
});

