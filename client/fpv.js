const CIRCLE = Math.PI * 2;
const MOBILE = /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent)

class Controls {
    constructor() {
        this.states = {
            'left': false,
            'right': false,
            'forward': false,
            'backward': false
        };
    }
}

class Bitmap {
    constructor(src, width, height) {
        this.image = new Image();
        this.image.src = src;
        this.width = width;
        this.height = height;
    }
}

class Player {
    constructor(x, y, direction) {
        this.x = x;
        this.y = y;
        this.direction = direction;
        this.weapon = new Bitmap('static/fpv/hand-holding-phone.png', 319, 320);
        this.paces = 0;
    }
    rotate(angle) {
        this.direction = (this.direction + angle + CIRCLE) % (CIRCLE);
    }
    walk(distance, map) {
        var dx = Math.cos(this.direction) * distance;
        var dy = Math.sin(this.direction) * distance;
        if (map.get(this.x + dx, this.y) <= 0) this.x += dx;
        if (map.get(this.x, this.y + dy) <= 0) this.y += dy;
        this.paces += distance;
    }
    update(controls, map, seconds) {
        if (controls.left) this.rotate(-Math.PI * seconds);
        if (controls.right) this.rotate(Math.PI * seconds);
        if (controls.forward) this.walk(1 * seconds, map);
        if (controls.backward) this.walk(-1 * seconds, map);
    };
}

class Map {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.wallGrid = new Uint8Array(width * height);
        this.skybox = new Bitmap('static/fpv/deathvalley_panorama.jpg', 2000, 750);
        this.wallTexture = new Bitmap('static/fpv/wall_texture.jpg', 1024, 1024);
        this.light = 0;
    }
    get(x, y) {
        x = Math.floor(x);
        y = Math.floor(y);
        if (x < 0 || x > this.width - 1 || y < 0 || y > this.height - 1)
            return -1;
        return this.wallGrid[y * this.width + x];
    }
    load(newMap) {
        this.wallGrid = newMap;
    }
    cast(point, angle, range) {
        var self = this;
        var sin = Math.sin(angle);
        var cos = Math.cos(angle);
        var noWall = {
            length2: Infinity
        };

        return ray({
            x: point.x,
            y: point.y,
            height: 0,
            distance: 0
        });

        function ray(origin) {
            var stepX = step(sin, cos, origin.x, origin.y);
            var stepY = step(cos, sin, origin.y, origin.x, true);
            var nextStep = stepX.length2 < stepY.length2 ?
                inspect(stepX, 1, 0, origin.distance, stepX.y) :
                inspect(stepY, 0, 1, origin.distance, stepY.x);

            if (nextStep.distance > range)
                return [origin];
            return [origin].concat(ray(nextStep));
        }

        function step(rise, run, x, y, inverted) {
            if (run === 0)
                return noWall;
            var dx = run > 0 ? Math.floor(x + 1) - x : Math.ceil(x - 1) - x;
            var dy = dx * (rise / run);
            return {
                x: inverted ? y + dy : x + dx,
                y: inverted ? x + dx : y + dy,
                length2: dx * dx + dy * dy
            };
        }

        function inspect(step, shiftX, shiftY, distance, offset) {
            var dx = cos < 0 ? shiftX : 0;
            var dy = sin < 0 ? shiftY : 0;
            step.height = self.get(step.x - dx, step.y - dy);
            step.distance = distance + Math.sqrt(step.length2);
            if (shiftX)
                step.shading = cos < 0 ? 2 : 0;
            else
                step.shading = sin < 0 ? 2 : 1;
            step.offset = offset - Math.floor(offset);
            return step;
        }
    }

    update(seconds) {
        if (this.light > 0)
            this.light = Math.max(this.light - 10 * seconds, 0);
        else if (Math.random() * 5 < seconds)
            this.light = 2;
    }
}

class Camera {
    constructor(canvas, resolution, focalLength) {
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width = window.innerWidth * 0.5;
        this.height = canvas.height = window.innerHeight * 0.5;
        this.resolution = resolution;
        this.spacing = this.width / resolution;
        this.focalLength = focalLength || 0.8;
        this.range = MOBILE ? 8 : 14;
        this.lightRange = 5;
        this.scale = (this.width + this.height) / 1200;
    }
    render(player, map) {
        this.drawSky(player.direction, map.skybox, map.light);
        this.drawColumns(player, map);
        this.drawWeapon(player.weapon, player.paces);
    }
    drawSky(direction, sky, ambient) {
        var width = sky.width * (this.height / sky.height) * 2;
        var left = (direction / CIRCLE) * -width;

        this.ctx.save();
        this.ctx.drawImage(sky.image, left, 0, width, this.height);
        if (left < width - this.width) {
            this.ctx.drawImage(sky.image, left + width, 0, width, this.height);
        }
        if (ambient > 0) {
            this.ctx.fillStyle = '#ffffff';
            this.ctx.globalAlpha = ambient * 0.1;
            this.ctx.fillRect(0, this.height * 0.5, this.width, this.height * 0.5);
        }
        this.ctx.restore();
    }
    drawColumns(player, map) {
        this.ctx.save();
        for (var column = 0; column < this.resolution; column++) {
            var x = column / this.resolution - 0.5;
            var angle = Math.atan2(x, this.focalLength);
            var ray = map.cast(player, player.direction + angle, this.range);
            this.drawColumn(column, ray, angle, map);
        }
        this.ctx.restore();
    }
    drawWeapon(weapon, paces) {
        var bobX = Math.cos(paces * 2) * this.scale * 6;
        var bobY = Math.sin(paces * 4) * this.scale * 6;
        var left = this.width * 0.6 + bobX;
        var top = this.height * 0.5 + bobY;
        this.ctx.drawImage(weapon.image, left, top, weapon.width * this.scale, weapon.height * this.scale);
    }
    drawColumn(column, ray, angle, map) {
        var ctx = this.ctx;
        var texture = map.wallTexture;
        var left = Math.floor(column * this.spacing);
        var width = Math.ceil(this.spacing);
        var hit = -1;

        while (++hit < ray.length && ray[hit].height <= 0)
        ;

        for (var s = ray.length - 1; s >= 0; s--) {
            var step = ray[s];
            // var rainDrops = Math.pow(Math.random(), 3) * s;
            // var rain = (rainDrops > 0) && this.project(0.1, angle, step.distance);
            if (s === hit) {
                var textureX = Math.floor(texture.width * step.offset);
                var wall = this.project(step.height, angle, step.distance);

                ctx.globalAlpha = 1;
                ctx.drawImage(texture.image, textureX, 0, 1, texture.height, left, wall.top, width, wall.height);

                ctx.fillStyle = '#000000';
                ctx.globalAlpha = Math.max((step.distance + step.shading) / this.lightRange - map.light, 0);
                ctx.fillRect(left, wall.top, width, wall.height);
            }

            // ctx.fillStyle = '#ffffff';
            // ctx.globalAlpha = 0.15;
            // while (--rainDrops > 0) ctx.fillRect(left, Math.random() * rain.top, 1, rain.height);
        }
    }
    project(height, angle, distance) {
        var z = distance * Math.cos(angle);
        var wallHeight = this.height * height / z;
        var bottom = this.height / 2 * (1 + 1 / z);
        return {
            top: bottom - wallHeight,
            height: wallHeight
        };
    }
}

class GameLoop {
    constructor() {
        this.frame = this.frame.bind(this);
        this.lastTime = 0;
        this.callback = function() {};
    }
    start(callback) {
        this.callback = callback;
        requestAnimationFrame(this.frame);
    }

    frame(time) {
        var seconds = (time - this.lastTime) / 1000;
        this.lastTime = time;
        if (seconds < 0.2) this.callback(seconds);
        requestAnimationFrame(this.frame);
    }
}

let controls = new Controls();

export default class FPV {
    constructor(client, canvasId) {
        this.client = client;
        this.canvas = document.getElementById(canvasId);
        this.camera = new Camera(this.canvas, MOBILE ? 160 : 320, 0.8);
        this.map = new Map(80, 40);
        this.lastLevelName = '';
        this.reset();
        this.loop = new GameLoop();
        this.loop.start(seconds => {
            this.map.update(seconds);
            // this.player.update(controls.states, this.map, seconds);
            this.player.paces += 3 * seconds;
            this.camera.render(this.player, this.map);
        });
    }

    update(level, players) {
        if (this.lastLevelName !== level.name) {
            this.lastLevelName = level.name;
            this.reset();
        }
        this.map.load(level.map.map.map((cell, index) => level.map.hasWall([index % 80, Math.floor(index / 80)]) ? 1 : 0));
        var currentPlayerId = this.client.credentials.playerId;
        var currentPlayer = players[currentPlayerId];

        controls.states.backward = false;
        controls.states.forward = false;
        controls.states.left = false;
        controls.states.right = false;

        this.player.direction = this.getFpvDir(currentPlayer.dir);
        this.player.x = currentPlayer.pos[0];
        this.player.y = currentPlayer.pos[1];

        // if (this.player.x === -1 || this.player.y === -1) {
        //     this.player.x = currentPlayer.pos[0];
        //     this.player.y = currentPlayer.pos[1];
        //     this.lastPos = currentPlayer.pos.slice();
        // } else {
        //     if (currentPlayer.pos[0] !== this.lastPos[0] || currentPlayer.pos[1] !== this.lastPos[1]) {
        //         controls.states.forward = true;
        //         this.lastPos = currentPlayer.pos.slice();
        //     }
        // }
    }

    getFpvDir(playerDir) {
        switch (playerDir) {
            case 0:
                return CIRCLE * 3 / 4;
            case 1:
                return 0;
            case 2:
                return CIRCLE / 4;
            case 3:
                return CIRCLE / 2;
        }
    }

    reset() {
        this.lastPos = [-1, -1];
        this.lastDir = -1;
        this.player = new Player(-1, -1, -1);
    }
}