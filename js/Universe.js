function Universe(stage) {
    var texture = PIXI.Texture.fromImage("resources/universe.png");
    PIXI.EventTarget
    PIXI.TilingSprite.call(this, texture, Main.WIDTH, Main.HEIGHT);

    // Create ship
    this.ship = new Ship();
    this.addChild(this.ship);

    this.panel = new Panel(this, this.ship);
    this.addChild(this.panel);

    this.interactive=true;
    this.hitArea = new PIXI.Rectangle(0, this.panel.height, Main.WIDTH, Main.HEIGHT - this.panel.height);

    this.objManager = new ObjectManager(this);
    this.objManager.onObjectsLoaded = this.objectsLoaded.bind(this);

    this.stopMove = false;
    this.orbitTimer = 0;
    this.statsTimer = 0;
    this.currentObject = null;

    radio("dialogStarted").subscribe(this.stopMovement.bind(this));
    radio("dialogFinished").subscribe(this.continueMovement.bind(this));

    this.reset();
}

Universe.constructor = Universe;
Universe.prototype = Object.create(PIXI.TilingSprite.prototype);

// Map is divided into 15x15 px squares
Universe.MAP_POINT_SIZE = 15;

Universe.prototype.stopMovement = function() {
    this.stopMove = true;
    if (this.xVel || this.yVel) {
        this.moving_x = ((this.tilePositionX + Main.WIDTH/2) / Universe.MAP_POINT_SIZE) >> 0;
        this.moving_y = ((this.tilePositionY + Main.HEIGHT/2) / Universe.MAP_POINT_SIZE) >> 0;
    }
}

Universe.prototype.continueMovement = function() {
    this.stopMove = false;
}

Universe.prototype.reset = function() {
    // Start somewhere in the middle of the map
    this.tilePosition.x = this.tilePositionX = 990 * Universe.MAP_POINT_SIZE;
    this.tilePosition.y = this.tilePositionY = 990 * Universe.MAP_POINT_SIZE;

    // Coordinates to which the ship is moving when user clicks
    this.moving_x = 0;
    this.moving_y = 0;

    // X and Y velocity (step) by which the ship moves
    this.xVel = 0;
    this.yVel = 0;
    this.currentObject = null;

    this.ship.reset();
    this.objManager.reset();
    var visitedObject = this.objManager.updateObjects();
    this.setCurrentObject(visitedObject);
    this.panel.updateCredit();
}

Universe.prototype.save = function() {
    localStorage.setItem("universe.moving_x", this.moving_x);
    localStorage.setItem("universe.moving_y", this.moving_y);
    localStorage.setItem("universe.xVel", this.xVel);
    localStorage.setItem("universe.yVel", this.yVel);
    localStorage.setItem("universe.running", true);
    localStorage.setItem("universe.x", this.tilePositionX);
    localStorage.setItem("universe.y", this.tilePositionY);

    this.ship.save();
    this.objManager.save();
}

Universe.prototype.load = function() {
    if (localStorage.getItem("universe.running") != "true") {
        if (this.onGameLoaded) this.onGameLoaded();
        return;
    }

    console.log("loading previosly saved game");

    this.moving_x = parseFloat(localStorage.getItem("universe.moving_x"));
    this.moving_y = parseFloat(localStorage.getItem("universe.moving_y"));
    this.xVel = parseFloat(localStorage.getItem("universe.xVel"));
    this.yVel = parseFloat(localStorage.getItem("universe.yVel"));
    this.tilePositionX = this.tilePosition.x = parseInt(localStorage.getItem("universe.x"));
    this.tilePositionY = this.tilePosition.y = parseInt(localStorage.getItem("universe.y"));

    this.ship.load();
    this.objManager.load();

    var visitedObject = this.objManager.updateObjects();
    this.setCurrentObject(visitedObject);
    this.panel.updateCredit();
    if (this.onGameLoaded) this.onGameLoaded();
}

Universe.prototype.loadMap = function() {
    this.objManager.loadObjects();
}

Universe.prototype.click = function(data) {
    if (this.stopMove) {
        return;
    }
    // We have to use point reflection with the screen center to get the proper
    // point, because we are moving with the background which has to move the
    // opposite direction than the point where the mouse is to simulate ship
    // movement.
    var x = Main.WIDTH - data.global.x;
    var y = Main.HEIGHT - data.global.y;

    // compute global point where we want to end up
    this.moving_x = ((this.tilePositionX + x) / Universe.MAP_POINT_SIZE) >> 0;
    this.moving_y = ((this.tilePositionY + y) / Universe.MAP_POINT_SIZE) >> 0;
    var visitedObject = this.objManager.updateObjects();

    var shipAngle = Math.atan2(y - Main.HEIGHT/2, x - Main.WIDTH/2);
    this.xVel = this.ship.speed * Math.cos(shipAngle);
    this.yVel = this.ship.speed * Math.sin(shipAngle);

    this.ship.setNewRotation(shipAngle);
}

Universe.prototype.setCurrentObject = function(object) {
    // This means object == this.currentObject
    if (object && object.shipObject) {
        return;
    }
    
    if (this.currentObject) {
        this.currentObject.shipObject = null;
        radio("objectLeft").broadcast(this.currentObject);
    }

    if (object) {
        object.shipObject = this;
        radio("objectTouched").broadcast(object);
    }

    this.currentObject = object;
}

Universe.prototype.update = function(dt) {
    this.orbitTimer += dt;
    if (this.orbitTimer > 25) {
        this.orbitTimer = 0;
        this.objManager.doOrbitalMovement();

        var visitedObject = this.objManager.updateStaggedObjects();
        if (visitedObject) {
            this.setCurrentObject(visitedObject);
        }
    }

    this.statsTimer += dt;
    if (this.statsTimer > 1000) {
        this.statsTimer = 0;
        this.ship.timeout();
        this.panel.update();
    }

    // Move the background if user clicked somewhere (so we have xVel and yVel)
    if (this.xVel != 0 || this.yVel !=0) {
        var center_x = ((this.tilePositionX + Main.WIDTH/2) / Universe.MAP_POINT_SIZE) >> 0;
        var center_y = ((this.tilePositionY + Main.HEIGHT/2) / Universe.MAP_POINT_SIZE) >> 0;
        var oldX = center_x;
        var oldY = center_y;
        var xVel = this.xVel;
        var yVel = this.yVel;

        if (center_x != this.moving_x) {
            if (this.xVel != 0) {
                this.tilePosition.x += xVel;
                this.tilePositionX += xVel;
                center_x = ((this.tilePositionX + Main.WIDTH/2) / Universe.MAP_POINT_SIZE) >> 0;
                if (this.moving_x == 0) {
                    this.xVel = 0;
                }
                else if (oldX > this.moving_x && center_x < this.moving_x || oldX < this.moving_x && center_x > this.moving_x) {
                    this.tilePosition.x = this.tilePositionX = (-this.moving_x - Main.WIDTH/2/Universe.MAP_POINT_SIZE) * Universe.MAP_POINT_SIZE;
                    this.xVel = 0;
                    this.moving_x = 0;
                }
            }
        }
        else {
            this.xVel = 0;
            this.moving_x = 0;
        }

        if (center_y != this.moving_y) {
            if (this.yVel != 0) {
                this.tilePosition.y += yVel;
                this.tilePositionY += yVel;
                center_y = ((this.tilePositionY + Main.HEIGHT/2) / Universe.MAP_POINT_SIZE) >> 0;
                if (this.moving_y == 0) {
                    this.yVel = 0;
                }
                else if (oldY > this.moving_y && center_y < this.moving_y || oldY < this.moving_y && center_y > this.moving_y) {
                    this.tilePosition.y = this.tilePositionY = (-this.moving_y - Main.HEIGHT/2/Universe.MAP_POINT_SIZE) * Universe.MAP_POINT_SIZE;
                    this.yVel = 0;
                    this.moving_y = 0;
                }
            }
        }
        else {
            this.yVel = 0;
            this.moving_y = 0;
        }

        this.objManager.moveObjects(xVel, yVel);

        if (oldX != center_x || oldY != center_y) {
            this.panel.update();
            var visitedObject = this.objManager.updateObjects();
            this.setCurrentObject(visitedObject);
            if (!visitedObject || visitedObject.type == MapObject.STAR) {
                this.ship.moved();
            }
        }

        if (this.xVel == 0 && this.yVel == 0) {
            this.ship.setTexture(this.ship.stayingTexture);
        }
    }

    this.ship.update();
};

Universe.prototype.objectsLoaded = function() {
    var visitedObject = this.objManager.updateObjects();
    this.setCurrentObject(visitedObject);
    this.load();
}

if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
        exports = module.exports = Universe;
    }
}
