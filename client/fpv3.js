// var map = [
//     [0]
// ];

var map = Array.from(Array(40), _ => Array(80).fill(0));

//----------------------------------------------------------
//----------------------------------------------------------
// Player
var player = {
    x: 5,
    y: 5,
    direction: 0, // right 1 left -1
    rotation: 180, // the current angle of rotationation
    vertical: 0, // forward 1 backwards -1
    moveSpeed: 0.075, // step/update
    rotationSpeed: 5, // rotation each update (in degrees)
    horizontal: false // right 1 left -1
}

//----------------------------------------------------------

var move = function(timeDelta) {

    var move_abs = timeDelta / gameCycleDelay;
    var moveStep
    if (!player.horizontal) {
        moveStep = move_abs * player.vertical * player.moveSpeed;
        player.rotation += move_abs * player.direction * player.rotationSpeed * Math.PI / 180;
    } else
        moveStep = move_abs * player.direction * player.moveSpeed;

    while (player.rotation < 0) player.rotation += Math.PI * 2;
    while (player.rotation >= Math.PI * 2) player.rotation -= Math.PI * 2;

    var newX, newY;
    if (!player.horizontal) {
        newX = player.x + Math.cos(player.rotation) * moveStep;
        newY = player.y + Math.sin(player.rotation) * moveStep;
    } else {
        newX = player.x + Math.cos(player.rotation + 90 * Math.PI / 180) * moveStep;
        newY = player.y + Math.sin(player.rotation + 90 * Math.PI / 180) * moveStep;
    }

    var position = checkCollision(player.x, player.y, newX, newY, 0.35);
    player.x = position.x;
    player.y = position.y;
}

//----------------------------------------------------------

var checkCollision = function(fromX, fromY, toX, toY, radius) {

    var position = {
        x: fromX,
        y: fromY
    };

    if (toY < 0 || toY >= mapHeight || toX < 0 || toX >= mapWidth)
        return position;

    var blockX = toX >> 0;
    var blockY = toY >> 0;

    if (isBlocking(blockX, blockY)) {
        return position;
    }

    position.x = toX;
    position.y = toY;

    var top = isBlocking(blockX, blockY - 1);
    var bottom = isBlocking(blockX, blockY + 1);
    var left = isBlocking(blockX - 1, blockY);
    var right = isBlocking(blockX + 1, blockY);

    if (top != 0 && toY - blockY < radius) {
        toY = position.y = blockY + radius;
    }
    if (bottom != 0 && blockY + 1 - toY < radius) {
        toY = position.y = blockY + 1 - radius;
    }
    if (left != 0 && toX - blockX < radius) {
        toX = position.x = blockX + radius;
    }
    if (right != 0 && blockX + 1 - toX < radius) {
        toX = position.x = blockX + 1 - radius;
    }

    // is tile to the top-left a wall
    if (isBlocking(blockX - 1, blockY - 1) != 0 && !(top != 0 && left != 0)) {
        var dx = toX - blockX;
        var dy = toY - blockY;
        if (dx * dx + dy * dy < radius * radius) {
            if (dx * dx > dy * dy)
                toX = position.x = blockX + radius;
            else
                toY = position.y = blockY + radius;
        }
    }
    // is tile to the top-right a wall
    if (isBlocking(blockX + 1, blockY - 1) != 0 && !(top != 0 && right != 0)) {
        var dx = toX - (blockX + 1);
        var dy = toY - blockY;
        if (dx * dx + dy * dy < radius * radius) {
            if (dx * dx > dy * dy)
                toX = position.x = blockX + 1 - radius;
            else
                toY = position.y = blockY + radius;
        }
    }
    // is tile to the bottom-left a wall
    if (isBlocking(blockX - 1, blockY + 1) != 0 && !(bottom != 0 && bottom != 0)) {
        var dx = toX - blockX;
        var dy = toY - (blockY + 1);
        if (dx * dx + dy * dy < radius * radius) {
            if (dx * dx > dy * dy)
                toX = position.x = blockX + radius;
            else
                toY = position.y = blockY + 1 - radius;
        }
    }
    // is tile to the bottom-right a wall
    if (isBlocking(blockX + 1, blockY + 1) != 0 && !(bottom != 0 && right != 0)) {
        var dx = toX - (blockX + 1);
        var dy = toY - (blockY + 1);
        if (dx * dx + dy * dy < radius * radius) {
            if (dx * dx > dy * dy)
                toX = position.x = blockX + 1 - radius;
            else
                toY = position.y = blockY + 1 - radius;
        }
    }

    return position;
}

//----------------------------------------------------------

function isBlocking(x, y) {

    if (y < 0 || y >= mapHeight || x < 0 || x >= mapWidth)
        return true;
    if (map[y >> 0][x >> 0] != 0)
        return true;
    if (spritePosition[y >> 0][(x) >> 0] && spritePosition[y >> 0][x >> 0].block)
        return true;
    return false;
}

//----------------------------------------------------------

function drawRay(rayX, rayY) {
    var objects = $("objects");
    var objectCtx = objects.getContext("2d");

    objectCtx.strokeStyle = "rgba(100,100,100,0.3)";
    objectCtx.lineWidth = 0.5;
    objectCtx.beginPath();
    objectCtx.moveTo(player.x * mapScale, player.y * mapScale);
    objectCtx.lineTo(
        rayX * mapScale,
        rayY * mapScale
    );
    objectCtx.closePath();
    objectCtx.stroke();
}

//----------------------------------------------------------

var addKeys = function() {

    document.onkeydown = function(event) {
        event = event || window.event;

        switch (event.keyCode) {

            case 38: // up
                player.vertical = 1;
                break;
            case 40: // down
                player.vertical = -1;
                break;
            case 16: // horizontal
                player.horizontal = true;
                break;
            case 37: // left
                player.direction = -1;
                break;
            case 39: // right
                player.direction = 1;
                break;
        }
    }

    document.onkeyup = function(event) {
        event = event || window.event;

        switch (event.keyCode) {
            case 38:
            case 40:
                player.vertical = 0;
                break;
            case 16:
                player.horizontal = false;
                break;
            case 37:
            case 39:
                player.direction = 0;
                break;
        }
    }
}

//----------------------------------------------------------
//----------------------------------------------------------
// Map

var mapWidth = 0; // Number of map blocks in x-direction
var mapHeight = 0; // Number of map blocks in y-direction
var mapScale = 8; // How many pixels to draw a map block

//----------------------------------------------------------

var drawMap = function() {

    var container = $("map");
    var miniMap = $("minimap");
    var objects = $("objects");

    //canvas size
    miniMap.width = mapWidth * mapScale;
    miniMap.height = mapHeight * mapScale;
    objects.width = miniMap.width;
    objects.height = miniMap.height;

    var widthDim = (mapWidth * mapScale) + "px";
    var heightDim = (mapHeight * mapScale) + "px";
    miniMap.style.width = objects.style.width = container.style.width = widthDim;
    miniMap.style.height = objects.style.height = container.style.height = heightDim;

    var ctx = miniMap.getContext("2d");

    for (var y = 0; y < mapHeight; y++) {
        for (var x = 0; x < mapWidth; x++) {

            var wall = map[y][x];

            if (wall > 0) {

                ctx.fillStyle = "black";
                ctx.fillRect(
                    x * mapScale,
                    y * mapScale,
                    mapScale,
                    mapScale
                );
            }

            if (spritePosition[y][x]) {
                ctx.fillStyle = "rgb(100,100,100)";
                ctx.fillRect(
                    x * mapScale + mapScale * 0.25,
                    y * mapScale + mapScale * 0.25,
                    mapScale * 0.5, mapScale * 0.5
                );
            }
        }
    }
}

//----------------------------------------------------------

var updateMap = function() {
    var miniMap = $("minimap");
    var objects = $("objects");

    var objectCtx = objects.getContext("2d");
    objectCtx.clearRect(0, 0, miniMap.width, miniMap.height);

    objectCtx.fillStyle = "black";
    objectCtx.fillRect(
        player.x * mapScale - 2,
        player.y * mapScale - 2,
        4, 4
    );

    // enemy drawing
    for (var i = 0; i < enemies.length; i++) {
        var enemy = enemies[i];
        objectCtx.fillStyle = "black";
        objectCtx.fillRect(
            enemy.x * mapScale - 2,
            enemy.y * mapScale - 2,
            4, 4
        );
    }
}

//----------------------------------------------------------
//----------------------------------------------------------
// Enemies
var initEnemies = function() {

    addEnemies();
    var screen = $('screen');
    for (var i = 0; i < mapEnemies.length; i++) {
        var enemy = mapEnemies[i];
        var type = enemyTypes[enemy.type];
        var img = document.createElement('img');
        img.src = type.img;
        img.style.display = "none";
        img.style.position = "absolute";

        enemy.state = 0;
        enemy.rot = 0;
        enemy.dir = 0;
        enemy.speed = 0;
        enemy.moveSpeed = type.moveSpeed;
        enemy.rotSpeed = type.rotSpeed;
        enemy.numOfStates = type.numOfStates;
        enemy.prevStyle = {
            left: 0,
            top: 0,
            width: 0,
            height: 0,
            clip: '',
            display: 'none',
            zIndex: 0
        };
        enemy.img = img;
        enemies.push(enemy);
        screen.appendChild(img);
    }
}

//----------------------------------------------------------

var enemies = [];
var mapEnemies = [];

//----------------------------------------------------------

var enemyTypes = [{
    img: 'static/fpv3/rat.png',
    moveSpeed: 0.05,
    rotSpeed: 3,
    numOfStates: 9
}];

//----------------------------------------------------------

var addEnemies = function() {

    var enemy = {
        type: 0,
        x: 8.5,
        y: 27.5
    }
    mapEnemies.push(enemy);
}

//----------------------------------------------------------

var renderEnemies = function() {
    for (var i = 0; i < enemies.length; i++) {
        var enemy = enemies[i];
        var dx = enemy.x - player.x;
        var dy = enemy.y - player.y;
        var distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 10) {

            var angle = Math.atan2(dy, dx) - player.rotation;
            if (angle < -Math.PI) angle += Math.PI * 2;
            if (angle >= Math.PI) angle -= Math.PI * 2;
            if ((angle > -Math.PI) && (angle < Math.PI)) {

                var img = enemy.img;
                var size = viewDist / (Math.cos(angle) * distance);
                var x = Math.tan(angle) * viewDist;
                var prevStyle = enemy.prevStyle;

                if (size != prevStyle.height) {
                    img.style.height = size + 'px';
                    prevStyle.height = size;
                }
                // times the total number of states
                if ((size * enemy.numOfStates) != prevStyle.width) {
                    img.style.width = (size * enemy.numOfStates) + 'px';
                    prevStyle.width = (size * enemy.numOfStates);
                }
                if (((screenHeight - size) / 2) != prevStyle.top) {
                    img.style.top = ((screenHeight - size) / 2) + 'px';
                    prevStyle.top = ((screenHeight - size) / 2);
                }
                if ((screenWidth / 2 + x - size / 2 - size * enemy.state) != prevStyle.left) {
                    img.style.left = (screenWidth / 2 + x - size / 2 - size * enemy.state) + 'px';
                    prevStyle.left = (screenWidth / 2 + x - size / 2 - size * enemy.state);
                }
                if (("brightness(" + (100 - 15 * distance) + "%)") != prevStyle.filter) {
                    img.style.filter = ("brightness(" + (100 - 15 * distance) + "%)");
                    prevStyle.filter = ("brightness(" + (100 - 15 * distance) + "%)");
                }
                if (size >> 0 != prevStyle.zIndex) {
                    img.style.zIndex = size >> 0;
                    prevStyle.zIndex = size >> 0;
                }
                if ('block' != prevStyle.display) {
                    img.style.display = 'block';
                    prevStyle.display = 'block';
                }
                if (('rect(0, ' + (size * (enemy.state + 1)) + ', ' + size + ', ' + (size * (enemy.state)) + ')') != prevStyle.clip) {
                    img.style.clip = ('rect(0, ' + (size * (enemy.state + 1)) + ', ' + size + ', ' + (size * (enemy.state)) + ')');
                    prevStyle.clip = ('rect(0, ' + (size * (enemy.state + 1)) + ', ' + size + ', ' + (size * (enemy.state)) + ')');
                }
            }
            enemyAI(enemy);
        }
    }
}

//----------------------------------------------------------

var enemyAI = function(enemy) {

    var dx = player.x - enemy.x;
    var dy = player.y - enemy.y;
    var distance = Math.sqrt(dx * dx + dy * dy);
    if ((distance > 2) && (distance < 8)) {
        var angle = Math.atan2(dy, dx);
        enemy.rotDeg = angle * 180 / Math.PI;
        enemy.rot = angle;
        enemy.speed = 1;
        var walkCycleTime = 1000;
        var numWalkSprites = 7;
        enemy.state = Math.floor((new Date() % walkCycleTime) / (walkCycleTime / numWalkSprites)) + 1;
    } else {
        enemy.state = 0;
        enemy.speed = 0;
    }
    enemyMove(enemy);
}

//----------------------------------------------------------

var enemyMove = function(enemy) {

    var moveStep = enemy.speed * enemy.moveSpeed;
    var newX = enemy.x + Math.cos(enemy.rot) * moveStep;
    var newY = enemy.y + Math.sin(enemy.rot) * moveStep;

    // vars take player's collision checker
    var pos = checkCollision(enemy.x, enemy.y, newX, newY, 0.35);
    enemy.x = pos.x;
    enemy.y = pos.y;
}

//----------------------------------------------------------
//----------------------------------------------------------
// Renderer
function initScreen() {

    var screen = $("screen");

    screen.style.height = screenHeight + 'px';
    screen.style.width = screenWidth + 'px';

    for (var i = 0; i < screenWidth; i += stripWidth) {
        var strip = document.createElement("div");
        strip.style.position = "absolute";
        strip.style.left = i + "px";
        strip.style.width = stripWidth + "px";
        strip.style.overflow = "hidden";

        var img = new Image();
        img.src = ("static/fpv3/walls.png");
        img.style.position = "absolute";
        img.prevStyle = {
            height: 0,
            width: 0,
            top: 0,
            left: 0
        }
        strip.appendChild(img);
        strip.img = img;

        var fog = document.createElement("span");
        fog.style.position = "absolute";
        strip.appendChild(fog);
        strip.fog = fog;

        screenStrips.push(strip);
        screen.appendChild(strip);
    }
}
//----------------------------------------------------------

var screenWidth = 1024;
var screenHeight = 768;
var screenStrips = [];
var numoftex = 3;
var stripWidth = 2;
var fov = 80 * Math.PI / 180;
var numofrays = Math.ceil(screenWidth / stripWidth);
var viewDist = (screenWidth / 2) / Math.tan((fov / 2));

//----------------------------------------------------------

var updateBackground = function() {

    var ceiling = $("ceiling");
    // it's kinda random value, depends on image width
    ceiling.style.backgroundPosition = -200 * player.rotation + "px " + "100%";
}

//----------------------------------------------------------

var castRays = function() {
    var stripIdx = 0;

    for (var i = 0; i < numofrays; i++) {
        // where on the screen does ray go through
        var rayScreenPos = (-numofrays / 2 + i) * stripWidth;
        // the distance from the viewer to the point on the screen
        var rayViewDist = Math.sqrt(rayScreenPos * rayScreenPos + viewDist * viewDist);
        // the angle relative to the viewing direction a = sin(x) * c
        var rayAngle = Math.asin(rayScreenPos / rayViewDist);

        castRay(
            // add the players viewing direction
            player.rotation + rayAngle,
            stripIdx++
        );
    }
}

//----------------------------------------------------------

var castRay = function(rayAngle, stripIdx) {

    // if angle is between 0 and 360 deg
    rayAngle %= Math.PI * 2;
    if (rayAngle < 0) rayAngle += Math.PI * 2;

    // moving right/left/up/down determined by which quadrant the angle is in.
    var right = (rayAngle > Math.PI * 2 * 0.75 || rayAngle < Math.PI * 2 * 0.25);
    var up = (rayAngle < 0 || rayAngle > Math.PI);
    var wallType = 0;
    var angleSin = Math.sin(rayAngle);
    var angleCos = Math.cos(rayAngle);

    var distance = 0; // the distance to the block we hit
    var xHit = 0; // the x coord of where the ray hit the block
    var yHit = 0; // the y coord of where the ray hit the block

    var textureX; // the x-coord on the texture
    var wallX; // the x map coord of the block
    var wallY; // the y map coord of the block

    var shadow; // vertical walls shadowed

    // check vertical wall lines by moving across edge of the block 
    // we're standing in then moving in 1 map unit steps horizontally
    // move vertically is determined by the slope of the ray

    var slope = angleSin / angleCos; // the slope made by the ray
    var dXVer = right ? 1 : -1; // we move to the left or right
    var dYVer = dXVer * slope; // how much to move up or down

    // starting horizontal position, at one of the edges of the current map block
    var x = right ? Math.ceil(player.x) : (player.x) >> 0;
    // starting vertical position, add the horizontal step we made * slope.
    var y = player.y + (x - player.x) * slope;

    while (x >= 0 && x < mapWidth && y >= 0 && y < mapHeight) {
        wallX = (x + (right ? 0 : -1)) >> 0;
        wallY = (y) >> 0;

        if (spritePosition[wallY][wallX] && !spritePosition[wallY][wallX].visible) {
            spritePosition[wallY][wallX].visible = true;
        }

        if (map[wallY][wallX] > 0) {
            var distX = x - player.x;
            var distY = y - player.y;
            distance = distX * distX + distY * distY;

            wallType = map[wallY][wallX]; // type of wall
            textureX = y % 1; // where exactly on the wall
            if (!right) textureX = 1 - textureX; // texture should be reversed on left side

            xHit = x; // coordinates of the hit to draw the rays on minimap.
            yHit = y;
            shadow = true;
            break;
        }
        x += dXVer;
        y += dYVer;
    }

    // once we hit a map block, we check if there is found one in the vertical turn. 
    // we'll know that if distance !=0 -> we only register this hit if this distance is smaller.
    slope = angleCos / angleSin;
    var dYHor = up ? -1 : 1;
    var dXHor = dYHor * slope;
    y = up ? (player.y) >> 0 : Math.ceil(player.y);
    x = player.x + (y - player.y) * slope;

    while (x > 0 && x < mapWidth && y > 0 && y < mapHeight) {
        wallY = (y + (up ? -1 : 0)) >> 0;
        wallX = (x) >> 0;

        if (spritePosition[wallY][wallX] && !spritePosition[wallY][wallX].visible) {
            spritePosition[wallY][wallX].visible = true;
        }

        if (map[wallY][wallX] > 0) {
            var distX = x - player.x;
            var distY = y - player.y;
            var blockDist = distX * distX + distY * distY;
            if (!distance || blockDist < distance) {
                distance = blockDist;
                xHit = x;
                yHit = y;

                wallType = map[wallY][wallX];
                textureX = x % 1;
                if (up) textureX = 1 - textureX;
                shadow = false;
            }
            break;
        }
        x += dXHor;
        y += dYHor;
    }

    if (distance) {

        var strip = screenStrips[stripIdx];
        distance = Math.sqrt(distance);
        // fish eye
        // distorted_dist = correct_dist / cos(relative_angle_of_ray)
        distance = distance * Math.cos(player.rotation - rayAngle);
        // calc position, height and width of the wall strip
        var height = Math.round(viewDist / distance);
        // stretch the texture to a factor to make it fill the strip correctly
        var width = height * stripWidth;
        // since everything is centered on the x-axis, move it half 
        // way down the screen and then half the wall height back up.
        var top = Math.round((screenHeight - height) / 2);
        var texX = Math.round(textureX * width);
        var prevStyle = strip.img.prevStyle;

        if (texX > width - stripWidth)
            texX = width - stripWidth;
        texX += (shadow ? width : 0);

        strip.style.height = height + "px";
        strip.style.top = top + "px";
        strip.style.zIndex = height >> 0;

        if (prevStyle.height != (height * numoftex) >> 0) {
            strip.img.style.height = (height * numoftex) >> 0 + "px";
            prevStyle.height = (height * numoftex) >> 0;
        }
        if (prevStyle.width != (width * 2) >> 0) {
            strip.img.style.width = (width * 2) >> 0 + "px";
            prevStyle.width = (width * 2) >> 0;
        }
        if (prevStyle.top != -(height * (wallType - 1)) >> 0) {
            strip.img.style.top = -(height * (wallType - 1)) >> 0 + "px";
            prevStyle.top = -(height * (wallType - 1)) >> 0;
        }
        if (prevStyle.left != -texX) {
            strip.img.style.left = -texX + "px";
            prevStyle.left = -texX;
        }
        strip.fog.style.height = height >> 0 + "px";
        strip.fog.style.width = (width * 2) >> 0 + "px";
        strip.fog.style.background = "rgba(0,0,0," + distance / 10 + ")";
    }
    drawRay(xHit, yHit);
}

//----------------------------------------------------------
//----------------------------------------------------------
// Sprite
var initSprites = function() {

    addItems();
    for (var i = 0; i < map.length; i++) {
        spritePosition[i] = [];
    }

    var screen = $('screen');
    for (var i = 0; i < mapSprites.length; i++) {
        var sprite = mapSprites[i];
        var itemType = itemTypes[sprite.type];
        var img = document.createElement('img');
        img.src = itemType.img;
        img.style.display = "none";
        img.style.position = "absolute";
        img.style.overflow = "hidden";
        sprite.visible = false;
        sprite.block = itemType.block;
        sprite.img = img;
        spritePosition[sprite.y][sprite.x] = sprite;
        sprites.push(sprite);
        screen.appendChild(img);
    }
}

//----------------------------------------------------------

var sprites = [];
var mapSprites = [];
var spritePosition = [];
var itemTypes = [
    { img: 'static/fpv3/bush.png', block: false },
];

//----------------------------------------------------------

var addItems = function() {
    for (var y = 0; y < mapHeight; y++) {
        for (var x = 0; x < mapWidth; x++) {
            var wall = map[y][x];

            if (wall == 0)
                if (Math.random() * 100 < 2) {
                    var item = {
                        type: 0,
                        x: x,
                        y: y
                    }
                    mapSprites.push(item)
                }
        }
    }
}

//----------------------------------------------------------

var clearSprites = function() {
    for (var i = 0; i < sprites.length; i++) {
        var sprite = sprites[i];
        sprite.visible = false;
    }
}

//----------------------------------------------------------

var renderSprites = function() {
    for (var i = 0; i < sprites.length; i++) {

        var sprite = sprites[i];
        if (sprite.visible) {

            var img = sprite.img;
            img.style.display = "block";

            // translate position to viewer space
            var dx = sprite.x + 0.5 - player.x;
            var dy = sprite.y + 0.5 - player.y;
            var distance = Math.sqrt(dx * dx + dy * dy);
            var angle = Math.atan2(dy, dx) - player.rotation;
            var size = viewDist / (Math.cos(angle) * distance);

            // x-position on screen
            var x = Math.tan(angle) * viewDist;
            img.style.left = (screenWidth / 2 + x - size / 2) + "px";
            // y is constant
            img.style.top = ((screenHeight - size) / 2) + "px";
            img.style.width = size + "px";
            img.style.height = size + "px";

            // fog on sprite
            img.style.filter = "brightness(" + (100 - 15 * distance) + "%)";
            img.style.zIndex = (size) >> 0;
        } else {
            sprite.img.style.display = "none";
        }
    }
}

//----------------------------------------------------------
//----------------------------------------------------------
// Init
//----------------------------------------------------------

var $ = function(id) {
    return document.getElementById(id);
};

//----------------------------------------------------------

var lastGameCycleTime = 0;
var gameCycleDelay = 1000 / 30;

//----------------------------------------------------------

var gameCycle = function() {

    var now = new Date().getTime();
    var timeDelta = now - lastGameCycleTime;

    move(timeDelta);

    var cycleDelay = gameCycleDelay;
    if (timeDelta > cycleDelay) {
        cycleDelay = Math.max(1, cycleDelay - (timeDelta - cycleDelay))
    }
    lastGameCycleTime = now;
    setTimeout(gameCycle, cycleDelay);
}

//----------------------------------------------------------

var renderCycle = function() {

    updateMap();
    clearSprites();
    castRays();
    renderSprites();
    renderEnemies();
    updateBackground();

    setTimeout(renderCycle, gameCycleDelay);
}

//----------------------------------------------------------
//----------------------------------------------------------

export default class FPV3 {
    constructor(client) {
        this.client = client;
    }

    start() {
        // mapWidth = map[0].length;
        // mapHeight = map.length;
        mapWidth = 80;
        mapHeight = 40;

        // addKeys();
        initScreen();
        initSprites();
        initEnemies();
        drawMap();
        gameCycle();
        renderCycle();
    }

    update(level, players) {
        map = level.map.map
            .map((cell, index) => level.map.hasWall([index % 80, Math.floor(index / 80)]) ? 1 : 0)
            .reduce((rows, key, index) => (index % 80 == 0 ? rows.push([key]) : rows[rows.length - 1].push(key)) && rows, []);
    }
}