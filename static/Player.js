/* Player Tank Constants */
const MAX_HP = 3;
const TANK_HIT_BOX_SIZE = 20;
const TANK_HEIGHT = 35;
const TANK_WIDTH = 40;
const TANK_ROTATE = 0;
const TANK_SPEED = 3;
const TANK_SHOT_SPEED = 9;
const TANK_SHOT_RANGE = 500;

/* Player Tank constructor */
function Player(id, name) {
    this.id = id;
    this.name = id; // Connect with login username later
    this.hp = MAX_HP;
    this.hitbox = TANK_HIT_BOX_SIZE;
    this.x = 300;
    this.y = 300;
    this.speed = TANK_SPEED;
    this.rotate = TANK_ROTATE;
    this.height = TANK_HEIGHT;
    this.width = TANK_WIDTH;
    this.shot_speed = TANK_SHOT_SPEED;
    this.range = TANK_SHOT_RANGE;
}

/* Generates a new Player */
Player.createNewPlayer = function(id, name) {
    return new Player(id, name);
}

module.exports = Player;