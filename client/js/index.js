function ExtractCard(connect){
  this.user       = {};
  this.users      = [];
  this.myCards    = [];
  this.connect    = connect;
  this.boxes       = [];
  this.login = function(){
    this.user.ip   = $('#ip_address').val();
    this.user.name = $('#account').val();
    if(!this.user.ip || !this.user.name){
      alert('请正确填写IP和账号');
      return;
    }
    this.connect.connect(this.user.ip, this.user.name);
    $('#myModal').modal('hide');
  };
  this.showLoginDialog = function(){
    $('#myModal').modal('show');
  };
  this.send = function(){
    this.connect.send($('#msg').val());
    $('#msg').val('');
  };
  this.openBox = function(data){
    this.boxes.push(data);
    $('#box_list').html('');
    for(var i in this.boxes){
      var box = this.boxes[i];
      var style = "wcard";
      var card_content = '';
      for(var j in box){
        var card = box[j];
        card_content = card_content + card.name+";";
        if(card.rarity == '蓝'){
          style = "bcard";
        }
        if(card.rarity == '紫'){
          style = "pcard";
        }
        if(card.rarity == '橙'){
          style = "ocard";
        }
      }
      $('#box_list').append('<a rel="tooltip" href="#" data-toggle="tooltip" title data-original-title="'+card_content+'" class="card_item '+style+'" style="float:left;width:46px;">' + i + '</a>');
      //$('#box_list').append('<a rel="tooltip" href="#" data-toggle="tooltip" title class="card_item '+style+'" style="float:left;width:46px;">' + i + '</a>');
    }
    $('#box_list a').tooltip();
  };
  this.showCards = function(group){
    $('#all_cards').html('');
    for(var i in group){
      var card = group[i];
      var style = "wcard";
      if(card.rarity == '蓝'){
        style = "bcard";
      }
      if(card.rarity == '绿'){
        style = "gcard";
      }
      if(card.rarity == '紫'){
        style = "pcard";
      }
      if(card.rarity == '橙'){
        style = "ocard";
      }
      $('#all_cards').append('<div class="span1 card_item '+style+'" onmouseover="extractCard.showCardPic(\''+card.id+' '+card.name +'\')" onclick="extractCard.selecteCard(\''+card.id+'\',\''+card.name+'\')">'+card.name+'</div>'); 
    }
  };
  this.showChoosedCard = function(name,card){
    if(this.user.name != name)
      return;
    $('#my_cards').append('<div class="span1 card_item" onmouseover="extractCard.showCardPic(\''+card.id+' '+card.name+'\')">'+card.name+'</div>');
    var isNew = true;
    for(var i in this.myCards){
      if(this.myCards[i].id == card.id){
        this.myCards[i].amount = this.myCards[i].amount+1;
        isNew = false;
      }
    }
    if(isNew){
      this.myCards.push(card);
    }
    this.draw();
    var msg = {
      name : name,
      text : '我抽取了['+ card.name + ']'
    }
    this.message(msg);
  };
  this.showCardPic = function(card_id){
    $('#card_image').attr('src','./img/cards/'+card_id+'.jpg');
  };
  this.draw = function(){
    $('#export').html('');
    for(var i in this.myCards){
      //1 [SGZ] CY169 鱼鳞阵
      var card = this.myCards[i];
      var content = '<div onmouseover="showCard(\''+card.id+'\')">&nbsp;&nbsp;&nbsp;&nbsp;' + card.amount + ' [SGZ] ' + card.id + ' '  + card.name + '</div>';
      $('#export').append(content);
    }
  };
  this.roster = function(users){
    $('#user_list').html('');
    for(var i in users){
      var u = users[i];
      if(u.name != this.user.name){
        this.users.push(u);
      }
      if(u.isMaster){
        $('#user_list').append('<li id="name_'+u.name+'">' + u.name + ' 房主</li>');
      }else{
        if(u.isReady){
          $('#user_list').append('<li id="name_' + u.name+'">' + u.name + ' ready</li>');
        }else{
          $('#user_list').append('<li id="name_' + u.name+'">' + u.name + '</li>');
        }
      }
    }
  };
  this.selecteCard = function(card_id, card_name){
    this.user.selectedCardID = card_id;
    $('#selected_card').val(card_name);
  };
  this.chooseCard = function(){
    if(this.user.selectedCardID){
      connect.choose(this.user.selectedCardID);
      this.user.selectedCardID = null;
    }else{
      alert('请选择卡牌');
    }
  };
  this.chooseCardGroup = function(){
    $('#chooseCardGroup .modal-body').html('');
    for(var i in this.boxes){
      var box = this.boxes[i];
      var style = "wcard";
      var card_content = '';
      //for(var j in box){
      //   var card = box[j];
      //   card_content = card_content + card.name+";";
      //   if(card.rarity == '蓝'){
      //     style = "bcard";
      //   }
      //   if(card.rarity == '紫'){
      //     style = "pcard";
      //   }
      //   if(card.rarity == '橙'){
      //     style = "ocard";
      //   }
      // }
      // $('#chooseCardGroup .modal-body').append('<a rel="tooltip" href="#" onclick="selectedCardGroup(' + i + ')" data-toggle="tooltip" title data-original-title="'+card_content+'" class="card_item '+style+'" style="float:left;width:46px;">' + i + '</a>');
      $('#chooseCardGroup .modal-body').append('<a rel="tooltip" href="#" onclick="extractCard.selectedCardGroup(' + i + ')" data-toggle="tooltip" class="card_item '+style+'" style="float:left;width:46px;">' + i + '</a>');
    }
    $('#chooseCardGroup .modal-body a').tooltip();
    $('#chooseCardGroup').modal('show');
  };
  this.selectedCardGroup = function(cardGroupId){
    $('#selected_group').val(cardGroupId);
  };
  this.startTack = function(){
    var cardGroupId = $('#selected_group').val();
    if(!cardGroupId){
      alert('请选择轮抽的卡组');
      return;
    }
    $('#selected_group').val('');
    this.boxes.splice(cardGroupId, 1);
    this.connect.start(cardGroupId);
    $('#chooseCardGroup').modal('hide');
  };
  this.ready = function(user){
    debug(this.user.name + ' is ' + this.user.isReady);
    $('#name_'+this.user.name).html(this.user.name + ' ready');
  };
  this.message = function(msg){
    var content ='<tr><td class="span2">'+msg.name+'</td><td class="span7">'+msg.text+'</td></tr>';
    $('#msg_list').append(content);
    var scrollTop = $("#msg_list_wrapper")[0].scrollHeight;
    $("#msg_list_wrapper").scrollTop(scrollTop);
  };
}

function debug(msg){
  console.log(msg);
}

var connect = {
  socket : {},
  connect : function(ip,name){
    socket = io.connect(ip);
    socket.on('connect', function () {
      socket.emit('login', name);
    });
    socket.on('error', function (data) {
      debug(data);
    });
    socket.on('disconnect', function (data) { 
    });
    socket.on('message', function (msg) {
      extractCard.message(msg);
    });
    socket.on('roster', function (users) {
      extractCard.roster(users);
    });
    socket.on('ready', function(user){
      extractCard.ready(user);
    });
    socket.on('group_cards', function(data){
      extractCard.showCards(data);
    });
    socket.on('choose', function(data){
      extractCard.showChoosedCard(data.name, data.card);
    });
    socket.on('round', function(){
      $('#selected_card').val('');
      $('#bt_choose').prop('disabled', false);
    });
    socket.on('openBox', function(data){
      extractCard.openBox(data);
    });
  },
  send : function(msg){
    socket.emit('message', msg);
  },
  ready: function(){
    socket.emit('ready', true);
  },
  start: function(group_id){
    socket.emit('start', group_id);
  },
  choose: function(card_id){
    debug('choose ：'　+ card_id);
    socket.emit('choose', card_id);
    $('#bt_choose').prop('disabled', true);
  },
  openBox: function(){
    socket.emit('openBox');
  }
}

var extractCard = new ExtractCard(connect);

