var ansuz = require("ansuz");

var Ship = module.exports = function (size, x, y, dir) {
    // a ship has a size, coordinates (x, y)
    // and a direction in which they are oriented

    return {
        s: size,
        x: x,
        y: y,
        d: dir, // 0 horizontal, 1 vertical
    };
};

Ship.HOR = 0;
Ship.VERT = 1;

Ship.coordinates = function (ship) {
    if (ship.d) { // vertical
        return ansuz.range(0, ship.s - 1).map(function (i) {
            return {x: ship.x, y: ship.y + i};
        });
    }
    // horizontal
    return ansuz.range(0, ship.s - 1).map(function (i) {
        return {x: ship.x + i, y: ship.y };
    });
};

Ship.isValid = function (grid, ship) { // a grid and a list of coordinates
    if (!ship) { return false; }
    var C = Ship.coordinates(ship);
    //console.log('coordinates', C);
    return !C.some(function (p) {
        return grid.get(p.x, p.y);
    });
};

Ship.deploy = function (grid, ship) {
        //console.log("deploying ship");
    var C = Ship.coordinates(ship);
    var last = C.length - 1;
    if (last === 0) {
        //console.log("buoy");
        return void grid.set(C[0].x, C[0].y, 'o');
    }
    C.forEach(function (c, i) {
        //console.log(c);

        if (ship.d) { // vertical
            if (i === 0) { return grid.set(c.x, c.y, 'A'); }
            if (i === last) { return grid.set(c.x, c.y, 'V'); }
            return grid.set(c.x, c.y, 'H');
        }
        if (i === 0) { return grid.set(c.x, c.y, '<'); }
        if (i === last) { return grid.set(c.x, c.y, '>'); }
        return grid.set(c.x, c.y, '=');
    });

    //C.forEach(function (c, i) { console.log(grid.get(c.x, c.y)); });

};

/*

    When a tile is revealed, it is either:

    * submarine
    * end piece of a ship
    * a middle piece of a ship
    * water

*/



// in the game of battleship, players have five types of ships

/*
 +++++  Carrier
 ++++   Battleship
 +++    Cruiser
 +++    Submarine
 ++     Destroyer

*/


Ship.types = {
    carrier: 5,
    battleship: 4,
    cruiser: 3,
    submarine: 3,
    destroyer: 2,
};

Ship.flag = 1;



// in a variation


/*
 ++++   Battleship
 +++    Cruiser
 +++
 ++     Destroyer
 ++
 ++
 +      Submarine
 +
 +
 +

*/


