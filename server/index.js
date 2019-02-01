const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path')
const {User, Room} = require('./shared')

const users = [];
const connections = [];
const rooms = [
  new Room('Simple room', 'admin')
]

io.on('connection', function (socket) {
  connections.push(socket);
  console.log('Connected: %s sockets connected', connections.length);

  function updateUsersList (room) {
    io.in(room.name)
      .emit('update-users-list', room)
  }

  function updateRoomList () {
    console.log(rooms);
    io.emit('update-room-list', rooms);
  }

  function joinRoom(room, onFinish) {
    if (!room) {
      return onFinish({message: `Could not find room`});
    }

    if (!room.canJoin(socket.user.username)) {
      return onFinish({message: `You are banned from that room`});
    }

    if (socket.room) {
      leaveRoom(socket.room);
    }
    console.log(socket.user);
    console.log('Joining room: '+room.name + ' ID: ' + socket.id);
    room.join(socket.user);
    socket.room = room;
    socket.join(socket.room.name);
    updateUsersList(room);
    onFinish(null, room);    
  }

  // Disconnect
  socket.on('disconnect', function(data){
    connections.splice(connections.indexOf(socket), 1);
    console.log('Disconnected: %s sockets connected', connections.length);
    
    const userIndex = users.findIndex(user => user === socket.user)
    
    if (userIndex !== -1) {
      users.splice(userIndex, 1);
      if (socket.room) {
        leaveRoom(socket.room)
      }
    }
    // updateUsersList(socket.room)
  })

  // New User
  socket.on('login', function(username, onFinish) {
    // find index of user with matching username
    const userIndex = users.findIndex(user => user.username === username)
    
    if (userIndex !== -1) {
      onFinish({message: 'That username is already taken'})
    }
    
    socket.user = new User(username)

    users.push(socket.user)
    onFinish(null, socket.user)

    updateRoomList()
  });

  // Send Message
  socket.on('message-sent', function(msg){
    console.log('message received from', socket.user, msg, socket.room)
    if(!socket.room)
      return;

    io.in(socket.room.name)
      .emit('message-received', {msg, user: socket.user});
  });

  socket.on('audio-sent', function(audio) {

    if(!socket.room)
      return;

    io.in(socket.room.name)
      .emit('audio-received', { audio: audio.toString('base64'), user: socket.user});
  });

  // Send direct message
  socket.on('dm-sent', function(recipient, msg){
    console.log('dm received from', socket.user, msg, socket.room)
    const to = Object.values(io.sockets.connected).find(sock => sock.user.username == recipient);
    console.log(to, socket.id);
    to.emit('dm', { user: socket.user, msg });
    socket.emit('dm', { user: socket.user, msg });
  });

  function leaveRoom (room) {
    if(!room)
      return false;

    room.leave(socket.user.username)
    socket.leave(room.name)
    socket.room = null
    updateUsersList(room)
  }

  socket.on('join-room', function (roomName, onFinish) {
    const room = rooms.find(room => room.name === roomName)
    joinRoom(room, onFinish);
  })

  socket.on('leave-room', function (onFinish) {
    leaveRoom(socket.room)
    onFinish(null)
  })

  socket.on('create-public-room', function (roomName, onFinish) {
    const room = new Room(roomName, socket.user);
    console.log('Room created');
    rooms.push(room);
    joinRoom(room, onFinish);
    console.log('Room joined');
    updateRoomList();
  });

  socket.on('create-private-room', function (roomName, password, onFinish) {
    const room = new Room(roomName, socket.user);
    room.password = password;
    console.log('Room created');
    rooms.push(room);
    joinRoom(room, onFinish);
    console.log('Room joined');
    updateRoomList();
  });

  socket.on('kick-user', function(userName) {
    console.log('Kicking', userName);
    

    const kickedSocket = Object.values(io.sockets.connected).find(sock => (sock.user && sock.user.username) == userName);
    socket.room.leave(userName);
    if(kickedSocket) {
      
      kickedSocket.leave(kickedSocket.room.name);
      kickedSocket.room = null;
      kickedSocket.emit('kicked', {roomName: socket.room.name });
    }
    
    updateUsersList(socket.room);
  });

  socket.on('ban-user', function(userName) {
    console.log('Banning', userName);
    socket.room.banUser(userName);

    const bannedSocket = Object.values(io.sockets.connected).find(sock => (sock.user && sock.user.username) == userName);
    console.log(socket.id + ' Im banning ', bannedSocket.id);
  
    bannedSocket.leave(bannedSocket.room.name);
    bannedSocket.room = null;
    bannedSocket.emit('banned', {roomName: socket.room.name });
    updateUsersList(socket.room);
  });

});

app.get('/', function(req, res){
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

app.get('/styles.css', function(req, res){
  res.sendFile(path.join(__dirname, '../client/styles.css'));
});

app.get('/client.js', function(req, res){
  res.sendFile(path.join(__dirname, '../client/client.js'));
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});