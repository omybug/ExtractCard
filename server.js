//
// # SimpleServer
//
// A simple chat server using Socket.IO, Express, and Async.
// http://www.rritw.com/a/bianchengyuyan/C__/20140220/429023.html
// http://freewind.me/
// 
var http = require('http');
var path = require('path');
var fs = require('fs');

var async = require('async');
var socketio = require('socket.io');
var express = require('express');


var DATA_PATH = './node_modules/data/';
var f = require(DATA_PATH+'factory.js');

//
// ## SimpleServer `SimpleServer(obj)`
//
// Creates a new instance of SimpleServer with the following options:
//  * `port` - The HTTP port to listen on. If `process.env.PORT` is set, _it overrides this value_.
//
var router = express();
var server = http.createServer(router);
var io = socketio.listen(server);

router.use(express.static(path.resolve(__dirname, 'client')));
var messages = [];
var users = [];
var chooseUsers = [];
var sockets = [];
var roundIndex = 0;
var groups = [];

io.on('connection', function (socket) {
    messages.forEach(function (data) {
      socket.emit('message', data);
    });

    if(!socket.factory){
      socket.factory = new f();
      socket.factory.init();
      socket.groups = [];
    }
    sockets.push(socket);

    socket.on('disconnect', function () {
      socket.get('name', function (err, name){
        users.splice(users.indexOf(name), 1);
      });
      sockets.splice(sockets.indexOf(socket), 1);
      if(1 == sockets.length){
        sockets[0].set('isMaster', true);
      }
      updateRoster();
    });

    socket.on('message', function (msg) {
      var text = String(msg || '');
      if (!text)
        return;
      socket.get('name', function (err, name) {
        var data = {
          name: name,
          text: text
        };
        broadcast('message', data);
        messages.push(data);
      });
    });

    socket.on('login', function (name) {
      debug('login');
      if(1 == sockets.length){
        socket.set('isMaster', true);
      }else{
        socket.set('isMaster', false);
      }
      if(users.indexOf(name) > -1){
        var data = {
          name: '系统提示',
          text: '账号"'+name+'"已存在！请刷新界面重新登录。'
        };
        socket.emit(message, data);
      }else{
        users.push(name);
        socket.set('name', String(name || 'Anonymous'), login);
      }
    });

    socket.on('ready', function (r){
      debug('ready');
      socket.set('isReady', true, ready);
    });

    socket.on('start', function(group_id){
      socket.get('name', function(err,name){
        debug(group_id);
        start(name, socket.groups[group_id]);
      });
    });

    socket.on('export', function(){
      socket.get('name', function(err, name){
      });
    });

    socket.on('openBox', function(){
      socket.get('name', function(err,name){
        //开1盒，也就是10包.
        var cg = socket.factory.create();
        socket.groups.push(cg);
        socket.emit('openBox', cg);
      });
    });

    socket.on('choose', function(card_id){
      debug('--- choose card : ' + card_id);
      var index = sockets.indexOf(socket);
      var isSend = false;
      var groupIndex = (parseInt(roundIndex) + index) % users.length;
      var group = groups[groupIndex];
      group.forEach(function(card){
        debug(card);
        if(card.id == card_id){
          if(card.amount == 1){
            group.splice(group.indexOf(card), 1);
            debug('group length : ' + group.length );
          }else{
            card.amount = card.amount-1;
          }
          socket.get('name', function(err, name){
            var data = {
              name : name,
              card : {
                name : card.name,
                id : card.id,
                amount : 1
              }
            }
            broadcast('choose', data);
            //进行下一轮操作
            nextRound(name);
          });
        }
      });
    });

  });

//开始游戏
function start(name, card_group){
  if(chooseUsers.indexOf(name) < 0)
    chooseUsers.push(name);
  for(var i = 0 ; i < users.length; i++){
    if(users[i] == name){
      groups[i] = card_group
    }
  }
  if(chooseUsers.length != users.length)
    return;
  chooseUsers = [];
  roundIndex = 0;
  sockets.forEach(function(socket){
    var index = sockets.indexOf(socket);
    var groupIndex = (parseInt(roundIndex)+index) % users.length;
    socket.emit('group_cards', groups[groupIndex]);
    socket.emit('round',null);
  });
}

function nextRound(name){
  debug('nextRound : ' + name);
  if(chooseUsers.indexOf(name) < 0)
    chooseUsers.push(name);
  debug(chooseUsers);
  debug('--------------------');
  //所有的人都选择了，然后进行下一轮
  debug('chooseUsers: ' + chooseUsers.length);
  if(chooseUsers.length == users.length){
    chooseUsers = [];
    roundIndex = (parseInt(roundIndex)+1) % users.length;
    debug('*** roundIndex : ' + roundIndex + ' ***');
    sockets.forEach(function(socket){
      var index = sockets.indexOf(socket);
      var groupIndex = (parseInt(roundIndex)+index) % users.length;
      debug('*** groupIndex:' + groupIndex + ' ***');
      socket.emit('group_cards', groups[groupIndex]);
      socket.emit('round',null);
    });
  }
}

function ready(){
  updateRoster();
}

function login(err){
  updateRoster();
}

function updateRoster() {
  async.map(
    sockets,
    function (socket, callback) {
      socket.get('name', function (err, name){
        socket.get('isReady', function (err, isReady){
          socket.get('isMaster', function (err, isMaster){
          var user = {
            name : name,
            isReady : isReady,
            isMaster : isMaster,
          };
          callback(err, user);
          });
        });
      });
    },
    function (err, users) {
      broadcast('roster', users);
    }
  );
}

function broadcast(event, data) {
  sockets.forEach(function (socket) {
    socket.emit(event, data);
  });
}

server.listen(process.env.PORT || 80, process.env.IP || "0.0.0.0", function(){
  var addr = server.address();
  debug("Chat server listening at", addr.address + ":" + addr.port);
});

function debug(msg){
  console.log(msg);
}
