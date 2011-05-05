exports.version = '0.0.1';

var sys = require('sys'),
  events = require('events'),
  fs = require('fs'),
  querystring = require('querystring');

var staticLogin = fs.readFileSync(__dirname + '/../static/login.html');

var SecurityProvider = function() {

  events.EventEmitter.call(this);

  var self = this;
  var defaultEvents = ['show-login','login','login-success','login-failure'];
  var matchers = {};

  this.define = function(eventName, matchFunction) {
    matchers[eventName] = matchFunction;
  }

  this.match = function(req, res) {

    for (var key in matchers) {
      var fn = matchers[key];
      if (fn(req, res))
        self.emit(key, req, res);
    }
    
  }

  this.filter = function(req, res, next) {
    self.match(req, res);
  }

  // define default events
  this.define('show-login', function(req, res) {
    if (req.method == 'GET' && req.url == '/c/secure/login')
      return true;
    return false;
  });

  this.define('login', function(req, res) {
    console.log(req.body);
    if (req.method == 'POST' && req.url == '/c/secure/login')
      return true;
    return false;
  });

  // define default listeners
  this.on('show-login', function(req, res) {
    res.writeHead(200, {'Content-Type':'text/html'});
    res.end(staticLogin);
  });

  this.on('login', function(req, res) {
    req.on('data', function(data) {
      var credentials = querystring.parse(data.toString());
      console.log(credentials);
      if (credentials.username == 'bcarr' && credentials.password == 'bcarr') {
        self.emit('login-success', req, res);
      } else {
        self.emit('login-failure', req, res);
      }
    });
  });

  this.on('newListener', function(event, listener) {

    // make sure we properly override the default behaviors
    for (var i = 0; i < defaultEvents.length; i++) {
      if (event == defaultEvents[i]) {
        delete matchers[event];
        return;
      }
    }
     
  });

}

sys.inherits(SecurityProvider, events.EventEmitter);

exports.SecurityProvider = SecurityProvider;