$(document).ready(function () {

    var socket = io();

    //make sidebar static width
    var containerWidth = $("body").width();
    var sideNavWidth = $("#side-nav").innerWidth();
    //var sideNavWidthPercent = (sideNavWidth / containerWidth).toFixed(2);
    var pixelValOfSNWidth = (0.16) * containerWidth;

    $("#side-nav").css({
      "min-width": pixelValOfSNWidth
    });
    
    //handle channel join button highlights
    $(document).on("click", ".channelJoinBtn", function () {
      // Remove active class from all buttons
      $(".channelJoinBtn").removeClass("channelJoinBtnActive");
      // Add active class to the clicked button
      $(this).addClass("channelJoinBtnActive");
  
      // Reset all icons to the default state
      $(".channelJoinBtn i").removeClass("bi bi-chat-left-fill").addClass("bi bi-chat-left");
      // Update the icon of the clicked button
      $(this).find("i").removeClass("bi bi-chat-left").addClass("bi bi-chat-left-fill");
    });
  
    //handle create new channel button
    $(document).on("click", ".createChannelBtn", function () {
      var channelName = prompt("Please enter a channel name:");
  
      if (channelName) {
          alert("You entered: " + channelName);
          socket.emit("createNewChannelReq", channelName);
      } else {
          alert("No channel name entered.");
      }
    });
    
    //handling joining channels--------------------------
    $(document).on("click", ".channelJoinBtn", function () {
      var channelToJoin = $(this).text();
  
      // Emit the event to the socket server
      socket.emit("userJoinChannelRequest", channelToJoin);
    });

    //handling sending chat messages----------------------------
    $('form').submit(function(e){
      e.preventDefault();
      socket.emit('processNewChat', $('#m').val());
      $('#m').val('');
      return false;
    });

    //build the HTML element for a chat and add it to the history
    socket.on('updateClientChat', function(msgObj){
      var chatContainer = $('#chatHistoryContainer');

      var newChat = buildMessageElement(msgObj);

      chatContainer.prepend(newChat);
    });

    //update ui whenever user succesfully joins new channel
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

    //render the sidenav button for each channel
    socket.on("renderChannelBtn", function(channelName) {
      buildChannelJoinBtn(channelName);
    });
    //----------------------------------------------

    
    function buildMessageElement(msgObj) {
      var newChat = $("<div>").addClass("userMessage");

      var msgText = $("<p>").addClass("msgText").text(msgObj.message);
      var msgSender = $("<span>").addClass("msgSender").text(msgObj.sender);
      var msgTime = $("<span>").addClass("msgTime").text(msgObj.time);

      newChat.append(msgSender, msgTime, msgText);

      return newChat;
    }

    function buildChannelJoinBtn(channelName) {
      var channelListContainer = $("#channelList");
      console.log(`building ${channelName}`);
      var newChannelJoinButton = $("<button>").addClass("channelJoinBtn");
      var icon = $("<i>").addClass("bi bi-chat-left");

      newChannelJoinButton.append(icon).append(channelName);

      channelListContainer.append(newChannelJoinButton);
    }
  });

  