const socket = io.connect()

window.appState = {
  currentUser: null,
  currentRoom: null,
  roomList: []
}

function login (username) {
  socket.emit('login', username, (error) => {
    if (error) {
      console.log(error)
      return
    }
    // Update the page to show the chat UI
  })
}


function joinPublicRoom (room) {
  socket.emit('join-room', room.name, (error, room) => {
    if (error) {
      console.log(error)
      return
    }
    window.appState.currentRoom = room
    renderUsersList(room)
    showChat();
  })
}

function joinPrivateRoom (room) {
  let enteredPw = prompt(`Please enter the password for ${room.name}`);
  if (enteredPw === null){
    alert ("Field is empty!");
  }
  else if (enteredPw !== room.password){  
    alert ("Password is incorrect!");
  }
  else {
    socket.emit('join-room', room.name, (error, room) => {
    if (error) {
      console.log(error)
      return
    }
    window.appState.currentRoom = room
    renderUsersList(room)
    })
  }
}

function leaveRoom (onFinish) {
  if (!window.appState.currentRoom) {
    return;
  }
  socket.emit('leave-room', (error) => {
    if (error) {
      console.log(error)
      return
    }
    renderUsersList(null)
    const chat = document.getElementById('chat')
    chat.innerHTML = ''
    if(typeof onFinish === 'function')
      onFinish(null);
  });
}

function renderUsersList (room) {
  const usersListElement = document.getElementById('users-list');
  const dmUsernameElement = document.getElementById('dmUsername');
  usersListElement.innerHTML = '';
  dmUsernameElement.innerHTML = '';
  if (room === null) {
    return;
  }
  const isAdmin = room.adminUser.username == appState.currentUser.username;
  console.log(room, appState, isAdmin);
  showUserRoom();
  room.users.forEach(user => {
    //generating user list
    const userItemElement = document.createElement('li');
    userItemElement.className = 'list-group-item';
    userItemElement.textContent = user.username;
    usersListElement.appendChild(userItemElement);
      if (isAdmin && user.username !== appState.currentUser.username){
        let banKickButtons = `<div class="btn-group btn-group-sm" role="group" aria-label="banKickButtons">
                            <input type="submit" class="btn btn-light kick" value="Kick" data-user="${user.username}"/>
                            <input type="submit" class="btn btn-light ban" value="Ban"  data-user="${user.username}"/></div>`;
                            userItemElement.innerHTML += banKickButtons;            
      }
    //generating user list in dropdown for DM 
    const dmOption = document.createElement('option');
    if (user.username !== appState.currentUser.username){
    dmOption.textContent = user.username;
    dmUsernameElement.appendChild(dmOption);
    }
  })
}

function renderRoomList (rooms) {
  const roomListElement = document.getElementById('room-list')
  roomListElement.innerHTML = ''

  rooms.forEach(function(room){
    const roomItemElement = document.createElement('li')
    roomItemElement.className = 'list-group-item';
    roomItemElement.textContent = room.name
    roomItemElement.addEventListener("click", function(){
      if (room.password != null){
        leaveRoom();
        joinPrivateRoom(room);
      }
      else {
        leaveRoom();
        joinPublicRoom(room);
      }
    })
    roomListElement.appendChild(roomItemElement)
  });
}

//Display current user and current room 
function showUserRoom (){
  console.log('Changing user room', appState.currentRoom);
  if (appState.currentRoom){
    document.getElementById("currentEnteredRoom").innerHTML = `You are currently in <strong>${appState.currentRoom.name}</strong>.`;
  }
  else {
    document.getElementById("currentEnteredRoom").innerHTML = `You are currently not in a chatroom.`;
  }
  document.getElementById("currentLoggedInUser").innerHTML = `Welcome, <strong>${appState.currentUser.username}</strong>!`
}

function showHome() {
  appState.currentRoom = null;
  $("#users-list").html('');
  $("#chatArea").addClass('disabled');
}

function showChat() {
  $("#chatArea").removeClass('disabled');
}

function initialize () {
  let $messageForm = $('#messageForm');
  let $message = $('#chat-message');
  let $dmForm = $('#dmForm');
  let $dm = $('#dm-message');
  let $dmUsername = $('#dmUsername');
  let $chat = $('#chat');
  let $dmChat = $('#dmChat');
  let $messageArea = $('#messageArea');
  let $userFormArea = $('#userFormArea');
  let $userForm = $('#userForm');
  let $publicRoom = $('#publicRoom');
  let $privateRoom = $('#privateRoom');
  let $username = $('#username');
  let $password = $('#password');
  let $roomName = $('#roomName');
 
  $publicRoom.on("click", function (){
    let rn = $.trim( $roomName.val() ); 
    let pw = $.trim( $password.val() ); 

    //check to see if password field is empty and room name is entered
    if (rn.length === 0){
      alert("Please enter a room name!");
      return;
    }
    else if (pw.length === 0){
    socket.emit("create-public-room", $("#roomName").val(), function(err, room) {
      console.log('Public room created', room);
      window.appState.currentRoom = room
      renderUsersList(room)
    });
    }
    else {
      alert("Please remove password if creating a public room!");
      return;
    }
  })

  $privateRoom.on("click", function (){
    //check to see if room name and password field is empty
    let rn = $.trim( $password.val() );
    let pw = $.trim( $password.val() ); 
    if (rn.length === 0){
      alert("Please fill in a room name!")
      return;
    }
    else if (pw.length === 0){
      alert("Please fill in a password!")
      return;
    }
    else {
      socket.emit("create-private-room", $("#roomName").val(), $("#password").val(), function(err, room) {
        console.log('Private room created');
      });
    }
 
  })

  $(document).on("click", ".kick", function(){
    console.log('Kick', $(this).data('user'));
    socket.emit('kick-user', $(this).data('user'));
  });
  $(document).on("click", ".ban", function(){
    console.log('ban', $(this).data('user'));
    socket.emit('ban-user', $(this).data('user'));
  });
  

  // User login
  $userForm.submit(function(e){
    e.preventDefault();
    if ($username.val().length === 0) {
      alert ("Field cannot be empty!");
      return;
    } 
    
    socket.emit('login', $username.val(), function(error, currentUser){
      if (error) {
        alert(error.message);
        return;
      }
      window.appState.currentUser = currentUser;
      $userFormArea.hide();
      $messageArea.show();
      showUserRoom();
      $username.val('');
    });
  });




  // User sends message
  $messageForm.submit(function(e){
    e.preventDefault();
    let field = $.trim( $message.val() ); 
    if (field.length === 0){
      alert("Cannot send empty message!")
      return;
    }
    socket.emit('message-sent', $message.val());
    $message.val('');
  });

  // User sends direct message
  $dmForm.submit(function(e){
    e.preventDefault();
    let field1 = $.trim( $dmUsername.val() ); 
    let field2 = $.trim( $dm.val() ); 
    if (field1.length === 0 || field2.length === 0){
      alert("Cannot send empty message!")
      return;
    }
    socket.emit('dm-sent', $dmUsername.val(), $dm.val());
    $dm.val('');
  });

  // Append video iframe
  function handleLinks(message) {

    let youtubeId = (message.match(/youtube\.com\/watch\?.*?v=([^&]+)/i) || [])[1];

    // Regex to extract video id
    if(youtubeId)
      return '<div class="videoDiv"><iframe width="500" height="281.25" src="https://www.youtube.com/embed/'+ youtubeId +'" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>';
    
    let vimeoId = (message.match(/vimeo\.com(?:\/video)?\/(\d+)/i) || [])[1];

    if(vimeoId)
      return '<div class="videoDiv"><iframe src="https://player.vimeo.com/video/' + vimeoId + '" width="500" height="281.25" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe></div>';
    
    return '';
  }

  //display received message
  socket.on('message-received', function(data) {
    console.log('message received', data);
    var className = data.user.username === appState.currentUser.username ? 'alert-primary' : 'alert-secondary';
    
    var extraHTML = handleLinks(data.msg);
  
      $chat.append('<div class="alert ' + className + '" role="alert"><strong>'+data.user.username+': </strong>'+data.msg+'<div/>' + extraHTML);
      $chat.scrollTop($chat[0].scrollHeight);
  });

  socket.on('audio-received', function(data) {
    console.log(data);
    $chat.append(`<strong class="audioStrongTag"> ${data.user.username}:  </strong>`);
    $chat.append(playAudio(data.audio));
    // Auto scroll to latest messages
    $chat.scrollTop($chat[0].scrollHeight);
  })

  //display DM
  socket.on('dm', function(data) {
    console.log('dm received', data)
    var extraHTML = handleLinks(data.msg);
    $dmChat.append('<div class="alert alert-primary" role="alert"><strong>'+data.user.username+': </strong>'+data.msg+'<div/>'+extraHTML);
    $dmChat.scrollTop($dmChat[0].scrollHeight);
  });
  
  socket.on('update-room-list', (roomList) => {
    renderRoomList(roomList)
  })
  
  socket.on('update-users-list', (usersList) => {
    renderUsersList(usersList);
  })

  socket.on("try-join-private-room", function(room){
    socket.emit("verifyPw", room, prompt("Please enter password"));
  });

  socket.on('banned', function(data) {
    alert(`You are banned from ${data.roomName}!`);
    showHome();
    showUserRoom();
  });

  socket.on('kicked', function(data) {
    alert(`You are kicked from ${data.roomName}!`);
    showHome();
    showUserRoom();
  });

  $("#record").on('click', startRecording)

}

var recording = false;
var recordRTC = null;
var lock = false;

function startRecording() {
  var session = {
    audio: true,
    video: false
  };

  $("#record").text('Stop recording');

  if(lock)
    return true;

  if(recording) {
    lock = true;
    console.log('Stoping audio');
    recordRTC.stopRecording(function(audioURL) {
      var blob = recordRTC.getBlob();
      console.log('Sent blob', blob);
      socket.emit('audio-sent', blob);
      recordRTC = null; 
      recording = false;
      lock = false;
      $("#record").text('Record message');
    });  
    return;
  }

  navigator.mediaDevices.getUserMedia(session)
    .then(function(mediaStream) {
      recording = true;
      var options = {
        numberOfAudioChannels: 1,
        type: 'audio',
        samepleRate: 44100,
        recorderType: StereoAudioRecorder,
        mimeType: 'audio/wav'
      }

      recordRTC = RecordRTC(mediaStream, options);

      console.log('Start recording');
      recordRTC.startRecording();

    });
}

function playAudio(blob) {
  
  var newAudio;
  if(typeof blob === 'string')
    newAudio = new Audio('data:audio/wav;base64,' + blob);
  else {
    newAudio = document.createElement('audio');
    newAudio.src = URL.createObjectURL(blob);
  } 
    
  newAudio.controls = true;
  return newAudio;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize)
} else {
  initialize();
}
