class Leaderboard {
  constructor() {
    this.players = [];
  }

  playerExists(playerID) {
    for (var i = 0; i < this.players.length; i++) {
      if (this.players[i].id == playerID) {
        return true;
      }
    }
    return false;
  }

  addPlayer(player) {
    this.players.push(player);
  }

  removePlayer(player) {
    for (var i = 0; i < this.players.length; i++) {
      if (this.players[i].id == player.id) {
        this.players.splice(i, 1);
        break;
      }
    }
  }

  updatePlayer(player) {
    for (var i = 0; i < this.players.length; i++) {
      if (this.players[i].id == player.id) {
        this.players[i] = player;
        break;
      }
    }
  }

  getPlayers() {
    return this.players;
  }

  sortPlayers() {
    this.players.sort(function(a, b) {
      return b.kills - a.kills;
    });
  }
}

module.exports = Leaderboard;
