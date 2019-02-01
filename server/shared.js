class User {
  constructor (username) {
    this.username = username
  }
}

class Room {
  constructor (name, adminUser) {
    this.name = name
    this.adminUser = adminUser
    this.password = null
    this.users = []
    this.bannedUsernames = []
  }

  leave(userToRemove) {
    const userIndex = this.users.findIndex(user => user.username === userToRemove)

    console.log('Removing from user list', userIndex);
    if (userIndex === -1){
      return;
    }

    this.users.splice(userIndex, 1);
    console.log(this.users);
  }

  banUser(userToBan) {
    this.bannedUsernames.push(userToBan);

    this.leave(userToBan);
  }

  canJoin(userName) {
    return !this.bannedUsernames.includes(userName);
  }

  join(user){
    this.users.push(user)
  }
}

module.exports = {User, Room}
