var express = require('express'),
    app = express();

var path         = require('path'),
    http         = require('http').Server(app),
    serialport   = require("serialport"),
    SerialPort   = serialport.SerialPort;
var io           = require('socket.io')(http);
var routes = require('./routes/index');

var connected    = false,
    spirit_array = ["Vodka", "Gin", "Rum"],
    mixer_array  = ["Lemon Lime Soda", "Orange Juice", "Cranberry Juice"];

process.env.PWD = process.cwd();
var port = process.env.PORT || process.env.NODE_PORT || 3000;



// view engine setup
app.use(express.static(path.join(process.env.PWD, 'public')));
app.set('views', path.resolve(path.join(process.env.PWD, 'views')));
app.set('view engine', 'jade');

app.get('/', function(req, res){
  //the html string being sent
  var filepath = path.resolve(__dirname + '/views/index.html');
  res.sendFile(filepath);
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

/////////////////////////////////////
//SOCKET IO STUFF
/////////////////////////////////////
io.on('connection', function(socket){
  //Handles begin event from client
  socket.on('begin', function(data){
    
  });
  //Handles ready event from client
  socket.on('ready', function(data){

  });
});

// Loop over all available serial ports looking for open-able data ports
serialport.list(function (err, ports) {
  ports.forEach(function(port) {
    console.log(port.comName);

    p = new SerialPort(port.comName, {
      baudrate: 9600,
      parser: serialport.parsers.readline("\r\n")
    });

    p.on('error', function(e) { console.log(e); });

    p.open(function (error) {
      if (error) {
        console.log("Couldn't connect to: " + port.comName);
      }
      else {
        p.on('data', function (data) {
          console.log(data);

          if (is_a_scanner(data)) {
            close_response();
          }
          else if (is_drink_order(data)) {
            var drink = JSON.parse(data).drink;
            // send drink to the view with socket.io
            var processed_data = convert_drink_response(port, drink);
            io.emit("new", processed_data);
            close_response();
          }
          else if (is_drink_ready(data)) {
            var finish = true;
            // send finish to the view with socket.io
            // TODO
            close_response();
          }
        });
      }
    });
  });
});

/** EMIT THESE
 * New
 * End
 * io.emit('end', data);
 */

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


// Helper Methods

// send a byte to the serial port to tell it that we're done
function close_response(port) {
  port.flush();
  port.write('$');
}

function convert_drink_response(port, data) {
  return { "id":     port.comName,
           "spirit": data[0],
           "mixer":  data[1] };
}

function is_a_scanner(data) {
  if (data === "connect") {
    return true;
  }
  else {
    return false;
  }
}

function is_drink_order(data) {
  try {
    json_res = JSON.parse(data);
  }
  catch (e) {
    return false;
  }

  if (typeof json_res.drink !== "undefined") {
    return true;
  }
  else  {
    return false;
  }
}

function is_drink_ready(data) {
  if (data === "ready") {
    return true;
  }
  else {
    return false;
  }
}

module.exports = app;

http.listen(8000, function(){
  console.log('listening on *:3000');
});