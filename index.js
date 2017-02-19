var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var spawn = require('child_process').spawn;
var bodyParser = require('body-parser');

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.post('/api/v1/watch', function(req, res) {
	var cmd = req.body.command;
	var args = req.body.args;
	var period = req.body.period;
	res.send(cmd + ' ' + args + ' ' + period);
});

function execute_command(cmd, args, period, io) {
	var fn = function() {
		var proc = spawn(cmd, args);
		proc.stdout.on('data', function(data) {
			io.emit('cmd-out', data);
		});
	}
	setTimeout(fn, period);
}

io.on('connection', function(socket){
  console.log('a user connected');
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
});


http.listen(5601, function(){
  console.log('listening on *:5601');
});

