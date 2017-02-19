var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var spawn = require('child_process').spawn;
var vmstat_stream = spawn('vmstat', ['1']);

var WINDOW_LIMIT = 20;

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.get('/limit', function(req, res) {
  res.json({ "window-limit" : WINDOW_LIMIT });
});

io.on('connection', function(socket){
  console.log('a user connected');
  io.emit('vmstat-headers-clear', '');
  var vmstat_headers = spawn('vmstat', ['1', '1']);
  vmstat_headers.stdout.on('data', function(data) {
    var headers = data.toString().trim().split("\n");
    console.log(headers);
    for(var i = 0; i < headers.length; i++) {
	  if(~headers[i].indexOf('swpd') || ~headers[i].indexOf('procs')) {
        io.emit('vmstat-headers', "..........................." + headers[i]);
      }
    }
  });
  var get_host = spawn('hostname');
  get_host.stdout.on('data', function(data) {
    io.emit('vmstat-panel-title', data.toString().trim());
  });
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
});


vmstat_stream.stdout.on('data', function (data) {
  var msgs = data.toString().trim().split("\n");
  for(var i = 0; i < msgs.length; i++) {
	if(~msgs[i].indexOf('swpd') || ~msgs[i].indexOf('procs'))
	  continue;
    io.emit('vmstat-stream-out', new Date().toISOString() + " - " + msgs[i]);
  }
});

vmstat_stream.stderr.on('data', function (data) {
  var msgs = data.toString().trim().split("\n");
  for(var i = 0; i < msgs.length; i++) {
    io.emit('vmstat-stream-err', new Date().toISOString() + " - " + msgs[i]);
  }
});

vmstat_stream.on('exit', function (code) {
  console.log('child process exited with code ' + code.toString());
});

http.listen(5601, function(){
  console.log('listening on *:5601');
});

