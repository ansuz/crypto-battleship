var ansuz = require("ansuz");
var Ship = require("./ships");

var Grid = module.exports = function (w, h) {
    var g = {
        w: w,
        h: h,
    };
    ansuz.range(0, w - 1).forEach(function (x) {
        g[x] = {};
    });

    var check = function (x, y) {
        if (x >= w || y >= h || x < 0 || y < 0) {
            console.log('out of bounds (%s, %s)', x, y);
            throw new Error('out of bounds');
        }
    };

    g.set = function (x, y, v) {
        check(x, y);
        g[x][y] = v;
        return v;
    };

    g.get = function (x, y) {
        check(x, y);
        return g[x][y];
    };

    g.each = function (f) {
        ansuz.range(0, h - 1).forEach(function (y) {
            ansuz.range(0, w - 1).forEach(function (x) {
                f(g.get(x, y), x, y);
            });
        });
    };

    g.map = function (f) {
        ansuz.range(0, h - 1).forEach(function (y) {
            ansuz.range(0, w - 1).forEach(function (x) {
                g.set(x, y, f(g.get(x, y), x, y));
            });
        });
    };

    g.some = function (f) {
        for (var y = 0; y < h; y++) {
            for (var x = 0; x < w; x++) {
                if (f(g.get(x, y), x, y)) { return true; }
            }
        }
        return false;
    };

    g.display = function () {
        var line = '  ';
        g.each(function (c, x) {
            if (x === 0) { console.log(line); line = '  '; }
            if (typeof(c) === 'undefined') { return (line += '~ '); }
            if (typeof(c) === 'string') { return (line += (c + ' ')); }
            line += '_ ';
        });
        console.log(line + '\n');
    };

    g.byNumber = function (n, m, f, h) {
        if (h) { n = n % h; }
        var x = n % m;
        var y = Math.floor(n / m);
        try {
        return f(g.get(x, y), x, y);
        } catch (e) {
            console.log(n, m, h);
            throw e;
        }
    };

    return g;
};

Grid.deploy = function (grid, size) {
    var w = Math.max((grid.w + 1)- size, 0);
    var h = Math.max((grid.h + 1)- size, 0);

    var choices = (w * grid.h) + (h * grid.w);
    if (!choices) { return null; }

    var choice = ansuz.die(choices -1 );
    var i = choices;

    var ship;

    var createShip = function (c, x, y) {
        if (c) { return null; /* cell is occupied */ }
        if (x < 0 || y < 0) { return null; }
        if (x + size - 1 > w) { return null; }
        if (y + size - 1 > h) { return null; }

        // vertical ship
        if (w === 1) { return Ship(size, x, y, 1); }

        // horizontal ship
        if (h === 1) { return Ship(size, x, y, 0); }

        // can be oriented either way
        return Ship(size, x, y, Number(choice < (choices / 2)));
    };

    while (i--) {
        ship = grid.byNumber(choice, w, createShip, choices / 2, w && h? Math.ceil(choices / 2): choices);
        if (Ship.isValid(grid, ship)) { return void Ship.deploy(grid, ship); }
        choice = (choice + 1) % choices;
    }
    throw new Error("failed to place a ship");
};

