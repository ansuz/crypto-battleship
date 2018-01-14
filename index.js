var mancy = require("cryptomancy");
var ansuz = require("ansuz");
var Grid = require("./grid");

var source = mancy.source;
var format = mancy.format;
var prime = mancy.prime;

var sra = mancy.shamir3pass;

var bytes = source.bytes.secure;

var F = 9;
var X = 25;
var Y = 25;

var grid = Grid(X, Y);

var Fleet = function (N) {
    return ansuz.flatten(ansuz.range(4, N + 1).map(function (n) {
        return ansuz.range(0, N - n - 1).map(function () {
            return n;
        });
    }));
};

// for all the number 1 - 5
var fleet = Fleet(F);

fleet.forEach(function (size) {
    console.log("deploying a ship of size %s", size);
    Grid.deploy(grid, size);
});

grid.display();

//process.exit();

var SIZE = 1024;
var P = prime.sync(bytes, SIZE);

var genkeys = function () {
    console.log("generating keys");
    return sra.genkeys.sync(bytes, SIZE, P);
};

var Alice = genkeys();

//grid.display();

grid.map(function (c, x, y) {
    console.log("Alice encrypts %s at (%s, %s)", c, x, y);
    var plain = format.decodeUTF8(JSON.stringify({v: c, x:x, y: y}));
    return sra.encrypt(plain, Alice);
});

var Bob = genkeys();

grid.map(function (c, x, y) {
    console.log("Bob encrypts (%s, %s)", x, y);
    return sra.encrypt(c, Bob);
});

// Bob attacks one of Alice's cells
var attack = function (x, y) {
    return format.encodeUTF8(sra.decrypt(sra.decrypt(grid.get(x, y), Alice), Bob));
};

var guesses = ansuz.shuffle(ansuz.flatten(ansuz.carte(function (x, y) {
    return {x: x, y: y};
}, ansuz.range(0, X - 1), ansuz.range(0, Y - 1))));

var total = ansuz.sum(fleet);
var targets = total;

var proceed = function (f) {
    var current;
    var iv = setInterval(function () {
        if (!guesses.length || !targets) { return void clearInterval(iv); }
        current = guesses.pop();
        if (f(current, X * Y - guesses.length, guesses)) { return; }
    }, 50);
};

var find = function (x, y) {
    var l = guesses.length;
    var c;
    for (var i = 0; i < l; i++) {
        c = guesses[i];
        if (c.x === x && c.y === y) {
            guesses.splice(i, 1);
            return c;
        }
    }
};

var schedule = function (x, y) {
    var c = find(x, y);
    guesses.push(c);
};

var isUnknown = function (x, y) {
    var c = grid.get(x, y);
    return typeof(c) !== 'undefined' && typeof(c) !== 'string';
};

proceed(function attackThis (c, i, guesses, force) {
    if (!c && force) { throw new Error("wat"); }

    var x = c.x;
    var y = c.y;

    var result = JSON.parse(attack(x, y));

    var v = result.v;

    if (result.x !== x || result.y !== y) { throw new Error('Alice is cheating'); }
    //console.log("attacked (%s, %s) and found [%s]", x, y, v);

    grid.set(x, y, v);

    if (v) {

        if (!force) {
            // you stumbled here and found a ship
            switch (v) {
                case 'A':
                    if (isUnknown(x, y + 1)) {
                        schedule(x, y + 1);
                    }
                    break;
                case 'H':
                    if (y < Y - 1 && isUnknown(x, y + 1)) {
                        schedule(x, y + 1);
                    }
                    if (y > 0 && isUnknown(x, y - 1)) {
                        schedule(x, y - 1);
                    }
                    break;
                case 'V':
                    if (y > 0 && isUnknown(x, y - 1)) {
                        schedule(x, y - 1);
                    }
                    break;

                case '<':
                    if (x < X - 1 && isUnknown(x + 1, y)) {
                        schedule(x + 1, y);
                    }
                    break;
                case '=':
                    if (x > 0 && isUnknown(x - 1, y)) {
                        schedule(x - 1, y);
                    }
                    if (x < X - 1 && isUnknown(x + 1, y)) {
                        schedule(x + 1, y);
                    }
                    break;
                case '>':
                    if (x > 0 && isUnknown(x - 1, y)) {
                        schedule(x - 1, y);
                    }
                    break;

                case 'o': break;
                case undefined: break;
            }

        }

        targets--;

        if (!targets) {
            console.log("sunk all ships in %s shots", i + 1);
            grid.display();

            return true;
        }
    }

    console.log('%s / %s targets neutralized', total - targets, total);
    grid.display();
});

grid.display();

