$(document).ready(function () {

    var socket = io();
    var username;

    //make sidebar static width
    var containerWidth = $("body").width();
    var sideNavWidth = $("#side-nav").innerWidth();
    //var sideNavWidthPercent = (sideNavWidth / containerWidth).toFixed(2);
    var pixelValOfSNWidth = (0.16) * containerWidth;

    $("#side-nav").css({
      "min-width": pixelValOfSNWidth
    });
    
  //handle channel join button highlights
    $('.channelJoinBtn').click(function() {
        $('.channelJoinBtn').removeClass('channelJoinBtnActive');
        $(this).addClass('channelJoinBtnActive');

        $(".channelJoinBtn i").removeClass("bi bi-chat-left-fill").addClass("bi bi-chat-left");
        $(this).find("i").removeClass("bi bi-chat-left").addClass("bi bi-chat-left-fill");
    });
  
  



    //handling chat messages----------------------------
    $('form').submit(function(e){
      e.preventDefault();
      socket.emit('clientChatEvent', $('#m').val());
      $('#m').val('');
      return false;
    });

    socket.on('serverChatEvent', function(msgObj){
      var chatContainer = $('#chatHistoryContainer');

      var newChat = buildMessageElement(msgObj);

      chatContainer.prepend(newChat);
    });




    //----------------------------------------------------


    //handling joining channels--------------------------
    $(".channelJoinBtn").click(function() {
      var channelToJoin = $(this).text();

      socket.emit("userJoinChannelRequest", channelToJoin);
    });

    socket.on("userJoinChannelRes", function(res) {
      var channelToJoin = res.channelName;
      var chatHistory = res.channelChatHistory;

      var chatHistoryContainer = $("#chatHistoryContainer");

      var header = $("#channelHeader");
      header.text(channelToJoin);

      chatHistoryContainer.empty();

      //load chat history
      for (var i=0; i<chatHistory.length; i++) {
        var chatObj = chatHistory[i];
        var builtChatMsg = buildMessageElement(chatObj);
        chatHistoryContainer.prepend(builtChatMsg);
      }

    });

    socket.on("channelCreated", function(channelInfo) {
      var channelListContainer = $("channelList");
      var newChannel = $("<button>").addClass("channelJoinBtn").text(channelInfo.channelName);
      channelListContainer.append(newChannel);
    });
    //----------------------------------------------

    //extra functions---------------------
    function buildMessageElement(msgObj) {
      var newChat = $("<div>").addClass("userMessage");

      var msgText = $("<p>").addClass("msgText").text(msgObj.message);
      var msgSender = $("<span>").addClass("msgSender").text(msgObj.sender);
      var msgTime = $("<span>").addClass("msgTime").text(msgObj.time);

      newChat.append(msgSender, msgTime, msgText);

      return newChat;
    }
  });