require("./TestCommon.js").prepareTest();

function isFloatEqual(one, two) {
    return (Math.abs(one - two) < 0.0000001);
}

exports['IntelligentShip'] = {
    setUp: function(done) {
        this.universe = new Universe();
        this.objManager = new ObjectManager(this.universe);

        var data = {"Mercury": {"orbit_center": "Sun",
                        "items": [0],
                        "orbit_speed": 0.0064,
                        "texture": "resources/mercury.png",
                        "orbit_b": 30,
                        "y": 1015,
                        "orbit_a": 30,
                        "prices": ["1", 1, 1, "1", "1"],
                        "x": 1130,
                        "type": 0,
                        "desc": ""},
                    "Sun": {"orbit_center": "",
                        "items": [],
                        "orbit_speed": 0.0,
                        "texture": "resources/sun.png",
                        "orbit_b": 0,
                        "y": 1021,
                        "orbit_a": 0,
                        "prices": ["1", 1, 1, "1", "1"],
                        "x": 1100,
                        "type": 1,
                        "desc": ""},
                    "Ship": {"orbit_center": "",
                        "items": [],
                        "orbit_speed": 0,
                        "waypoints": ["Earth", "Mars"],
                        "texture": "resources/ship2.png",
                        "orbit_b": 0,
                        "prices": [1, 1, 1, 1, 1],
                        "orbit_a": 0,
                        "y": 1014,
                        "x": 1009,
                        "type": 2,
                        "desc": ""}}
        this.objManager.parseObjects(data);
        this.ship = this.objManager.ships[0];
        done();
    },
    tearDown: function(done) {
        done();
    },
    moveBetweenPoints: function(test) {
        this.ship.setWaypoints(["1000 1000", "1014 1009"]);
        var firstPoint = false;
        var secondPoint = false;
        for (var i = 0; i < 1000; i++) {
            this.ship.doOrbitalMovement(0, 0, 0, 0);
            if (this.ship.mapX < 1003 && this.ship.mapY < 1003) {
                firstPoint = true;
            }
            if (this.ship.mapX > 1011 && this.ship.mapY > 1006) {
                secondPoint = true;
            }
        }
        test.ok(firstPoint);
        test.ok(secondPoint);
        test.done();
    },
    moveBetweenPlanets: function(test) {
        this.ship.setWaypoints(["Sun", "Mercury"]);
        var sun = this.objManager.getObjectByName("Sun");
        var mercury = this.objManager.getObjectByName("Mercury");
        var firstPoint = false;
        var secondPoint = false;
        for (var i = 0; i < 1000; i++) {
            this.ship.doOrbitalMovement(0, 0, 0, 0);
            if (Math.abs(this.ship.mapX - sun.mapX) < 3 && Math.abs(this.ship.mapY - sun.mapY) < 3) {
                firstPoint = true;
            }
            if (Math.abs(this.ship.mapX - mercury.mapX) < 3 && Math.abs(this.ship.mapY - mercury.mapY) < 3) {
                secondPoint = true;
            }
        }
        test.ok(firstPoint);
        test.ok(secondPoint);
        test.done();
    },
    moveBetweenPlanetsOffset: function(test) {
        this.ship.setWaypoints(["Sun+10 Sun+10", "Mercury+20 Mercury+20"]);
        var sun = this.objManager.getObjectByName("Sun");
        var mercury = this.objManager.getObjectByName("Mercury");
        var firstPoint = false;
        var secondPoint = false;
        for (var i = 0; i < 2000; i++) {
            this.ship.doOrbitalMovement(0, 0, 0, 0);
            if (Math.abs(this.ship.mapX - (sun.mapX + 10)) < 3 && Math.abs(this.ship.mapY - (sun.mapY + 10)) < 3) {
                firstPoint = true;
            }
            if (Math.abs(this.ship.mapX - (mercury.mapX + 20)) < 3 && Math.abs(this.ship.mapY - (mercury.mapY + 20)) < 3) {
                secondPoint = true;
            }
        }
        test.ok(firstPoint);
        test.ok(secondPoint);
        test.done();
    },
    moveBetweenPlanetsPlayerOffset: function(test) {
        this.ship.setWaypoints(["Sun+10 Sun+10", "Player+20 Player+20"]);
        var sun = this.objManager.getObjectByName("Sun");
        var player = this.objManager.getObjectByName("Player");
        var firstPoint = false;
        var secondPoint = false;
        for (var i = 0; i < 2000; i++) {
            this.ship.doOrbitalMovement(0, 0, 0, 0);
            if (Math.abs(this.ship.mapX - (sun.mapX + 10)) < 3 && Math.abs(this.ship.mapY - (sun.mapY + 10)) < 3) {
                firstPoint = true;
            }
            if (Math.abs(this.ship.mapX - (player.mapX + 20)) < 3 && Math.abs(this.ship.mapY - (player.mapY + 20)) < 3) {
                secondPoint = true;
            }
        }
        test.ok(firstPoint);
        test.ok(secondPoint);
        test.done();
    }
};
