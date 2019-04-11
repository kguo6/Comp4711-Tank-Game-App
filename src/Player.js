/* Player Tank Constants */
const MAX_HP = 3;
const TANK_HIT_BOX_SIZE = 25;
const TANK_HEIGHT = 35;
const TANK_WIDTH = 50;
const TANK_ROTATE_MAX = 2 * Math.PI;
const TANK_SPEED = 3;
const TANK_SHOT_SPEED = 9;
const TANK_SHOT_RANGE = 500;

/* Player Tank constructor */
function Player(id, name, externalId) {
  this.id = id;
  this.name = name;
  this.external_id = externalId;
  this.hp = MAX_HP;
  this.hitbox = TANK_HIT_BOX_SIZE;
  this.x = generateRandomInt(1000);
  this.y = generateRandomInt(600);
  this.speed = TANK_SPEED;
  this.rotate = generateRandomInt(TANK_ROTATE_MAX);
  this.height = TANK_HEIGHT;
  this.width = TANK_WIDTH;
  this.shot_speed = TANK_SHOT_SPEED;
  this.range = TANK_SHOT_RANGE;
  this.kills = 0;
}

/* Generates and returns new Player */
Player.createNewPlayer = function(id, name, externalId) {
  return new Player(id, name, externalId);
};

/**
 * Returns a random int value between 0 and max.
 * @param {*} max Given ceiling value
 */
function generateRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

module.exports = Player;
