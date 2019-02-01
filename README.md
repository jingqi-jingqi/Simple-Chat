# Simple Chat #

### Basic information ###
* One existing room with admin privileges:  
Room name: Simple room
Admin username: admin
### Basic navigation ###
Username of admin will enable user priveleges to ban and kick users in Simple room.  
Log in to the chatroom by typing in an arbitrary username, you can then join the pre-existing  
Simple room or create a room with password or without password. You will become the admin  
of that newly created room and thus allowed to kick and ban other users joining the room.  
Username dropdown in the direct messaging section only offers usernames in the same chatroom  
as you are.  
### Creative portion ###
Two additional features and a minor improvement in usability are added to the chatroom app:  

* Sending Youtube or Vimeo video links in chatrooms or direct messages will automatically  
append a preview of the linked video for users to play and/or go directly to the video  
on Youtube or Vimeo.

* Clicking record message button will allow users to record a voice message to send to other users.  
* Auto scrolling to the latest messages when there's too many in view improves usability.

### Code ###
Node.JS and Socket.IO are used for the multi-room chat server.  
The voice message feature uses the RecordRTC library,  
Bootstrap 4 is used for CSS.

### Author Info ###
Code by Jingqi Fan  