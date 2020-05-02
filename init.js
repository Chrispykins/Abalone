//alias for global scope
var Abalone = {
    gameActive: true,
    started: false
};

var canvas = document.getElementById("canvas");
var context = canvas.getContext('2d');
canvas.imageSmoothingQuality = 'high';
context.textBaseline = 'middle';

var mousePressed = false;
var editMode = false;
var maxSumito = 3;
var maxScore = 6;
var winner = '';
var winningColor = '';

var music;

var saveData = [];

/////////////////////////////////
// Utilities
////////////////////////////////

var triangle_left  = [ [-Math.sqrt(3)/3, 0], [ Math.sqrt(3)/6, -0.5], [ Math.sqrt(3)/6, 0.5] ];
var triangle_right = [ [ Math.sqrt(3)/3, 0], [-Math.sqrt(3)/6, -0.5], [-Math.sqrt(3)/6, 0.5] ];

var u_vector = [25, 45];
var v_vector = [-25, 45];

function distance(a , b) {
    
    var dx = a[0] - b[0];
    var dy = a[1] - b[1];
    
    dx*= dx;
    dy*= dy;
    
    return Math.sqrt(dx + dy);
}

function logCoords(debugString, u, v) {
    
    console.log(debugString +': ['+ u +', '+ v +']');
}

function lerp(a, b, alpha) {
    
    return a + (b - a) * alpha;
}

function smoothstep(a, b, alpha) {
    
    alpha = Math.min(1, Math.max(0, alpha));
    
    var scale = alpha * alpha * (3 - 2 * alpha);
    
    return scale * (b - a) + a;
}

function interp_2D(a, b, alpha, func) {
    
    return [func(a[0], b[0], alpha), func(a[1], b[1], alpha)];
}

function transformUVtoXY(uv) {
    
    var u = uv[0] - boardSize;
    var v = uv[1] - boardSize;
    
    var x = ((u * u_vector[0]) + (v * v_vector[0])) * boardScale;
    var y = ((u * u_vector[1]) + (v * v_vector[1])) * boardScale;
    
    x+= gameDimensions[0]/2;
    y+= gameDimensions[1]/2;
    
    return [x, y];
}

function drawCircle(center, radius) {
    
    var scale = boardScale * canvas.scale;
    
    context.strokeStyle = 'black';
    
    context.beginPath();
    context.arc(center[0] * scale, center[1] * scale, radius * scale, 0, 2 * Math.PI);
    context.stroke();
    context.closePath();
    
}

function fillTri(xy, triangle, radius) {
    
    context.beginPath();
    context.moveTo((xy[0] + (triangle[0][0] * radius * boardScale)) * canvas.scale, (xy[1] + (triangle[0][1] * radius * boardScale)) * canvas.scale);
    
    context.lineTo((xy[0] + (triangle[1][0] * radius * boardScale)) * canvas.scale, (xy[1] + (triangle[1][1] * radius * boardScale)) * canvas.scale);
    context.lineTo((xy[0] + (triangle[2][0] * radius * boardScale)) * canvas.scale, (xy[1] + (triangle[2][1] * radius * boardScale)) * canvas.scale);
    context.lineTo((xy[0] + (triangle[0][0] * radius * boardScale)) * canvas.scale, (xy[1] + (triangle[0][1] * radius * boardScale)) * canvas.scale);
    context.fill();
    context.closePath();
}

///////////////////////////////
// Undo/Redo functions
///////////////////////////////

var undoManager = {
    
    history: [],
    current: 0,
    
    undo: function() {
        
        if (this.history[this.current - 1]) {
            this.current--;
            clearBoard();
            loadBoard(this.history[this.current]);
            cyclePlayers();
        }
    },
    
    redo: function() {
        
        if (this.history[this.current + 1]) {
            this.current++;
            clearBoard();
            loadBoard(this.history[this.current]);
            cyclePlayers();
        }
    },
    
    saveMove: function() {
        
        this.current++;
        this.history[this.current] = serializeBoard();
        this.history = this.history.slice(0, this.current + 1);
        cyclePlayers();
        
        console.log(this.current)
    }
}

/////////////////////////////////////////////////////////
// Loading Data
////////////////////////////////////////////////////////

function findSaveData() {
    
    saveData = [];
    
    for (var i = 0; i < 5; i++) {

        if (localStorage['abalone_'+ i]) {
            saveData[i] = JSON.parse(localStorage['abalone_'+ i]);
        }
    }
}

var fileType = '.wav'
if (new Audio().canPlayType("audio/mp3")) fileType= '.mp3';

var sounds = {};
var soundsComplete = false;

function loadAudio() {

    var soundsLoaded = 0;
    var totalSounds = arguments.length;
    
    for (var i = 0; i < totalSounds; i++) {
        
        let name = arguments[i];
        
        var newSound = new Audio(name + fileType);
        newSound.id = name;
        
        sounds[name] = {
            play: function() {},
            pause: function() {},
        }
        
        newSound.load();
        preload.appendChild(newSound);
        
        newSound.addEventListener('canplaythrough', function loaded() {
            
            sounds[name] = this;
            soundsLoaded++;

            if (soundsLoaded === totalSounds) initAudio();
            
            this.removeEventListener('canplaythrough', loaded);
        });
    }
}

loadAudio(
	'Main_Theme', 
	'Menu_Theme',
	'PageTurn_0',
	'PageTurn_1',
	'PageTurn_2',
	'PageTurn_3',
    'Bonk_0',
    'Bonk_1',
    'Bonk_2',
    'Bonk_3',
    'Slide_0',
    'Slide_1',
    'Slide_2',
    'Click',
    'Bell',
    'SweepIn',
    'SweepOut'
);

var images = {};
var imagesComplete = false;

function loadImages() {
    
    var imagesLoaded = 0;
    var totalImages = arguments.length;
    
    for (var i = 0; i < totalImages; i++) {
        
        var name = arguments[i];
        
        images[name] = document.createElement('img');

        images[name].src = name + '.png';

        images[name].addEventListener('load', function loaded() {

            imagesLoaded++;

            if (imagesLoaded === totalImages) imagesComplete = true;
            
            this.removeEventListener('load', loaded);
        });
    }

}

loadImages('classic', 'daisy', 'yinyang', 'title');

///////////////////////////////////////////////////////////////////////
// Audio
//////////////////////////////////////////////////////////////////////

HTMLAudioElement.prototype.fadeTo = function(volume, length) {
    
    if (this.interval) {
        this.clearInterval();
    }
    
    this.toVolume = volume;
    var fromVolume = this.volume;
    var fadeStart = Date.now();
    
    this.interval = setInterval(function() {
        
        var progress = (Date.now() - fadeStart) / length;
        
        if (progress < 1) {
        
            this.volume = smoothstep(fromVolume, volume, progress);
        }
        else {
            
            this.volume = volume;
            this.toVolume = undefined;            
            this.clearInterval();
        }
        
    }.bind(this), 10)

    this.clearInterval = function() { clearInterval(this.interval); this.interval = null;}
}


////////////////////////////////////////////////////////
// Input
///////////////////////////////////////////////////////

var mouse = [0, 0];

function mouseDown(event) {

    //start music at start of game
    if (music && !music.started) music.start();

    //start game if it hasn't already
    if (!Abalone.started) {

        Abalone.started = true;
        title.fadeDirection = -.25;
        return;
    }
    
    //update mouse position
    mouseMove(event);
    
    //did player click the menu button
    if (cornerButton.contains(mouse)) {
        cornerButton.onClick();
        return;
    }
    
    //is the player already in a menu?
    if (menu) {
        
        for (var item in menus[menu]) {
            
            if (menus[menu][item].contains(mouse)) {
                menus[menu][item].onClick();
                break;
            }
        }
    }
    else if (event.button == 2) {
        clearSelection();
    }

    //did player click to move in a particular direction?
    else if (selectedBalls[0] && selectedBalls[0].arrow) {

        mousePressed = true;
        var direction = selectedBalls[0].arrow.direction;

        if (isMoveValid(direction)) {
            moveBalls(direction);
            clearSelection();
        }
    }
    
    //did player click on space but not for moving?
    else if (hoveredSpace) {
        
        mousePressed = true;
        hoveredSpace.onClick();
    }
}

function mouseUp(event) {
    
    mouseMove(event);
    
    if (event.button == 2) {
        
    }
    else {
       
        mousePressed = false;
        if (highlightedBalls[0]) highlightedBalls[0].space.onMouseUp();
        if (hoveredSpace) hoveredSpace.onUnhover();
    }
}

function mouseMove(event) {
    
    var x = event.clientX || event.pageX;
    var y = event.clientY || event.pageY;
    
    var offset = canvas.getBoundingClientRect();
    
    mouse = [(x - offset.left) / canvas.scale, (y - offset.top) / canvas.scale];
    
    if (cornerButton) cornerButton.update();
    
    if (!menu) {
        
        for (var i = 0, l = spaces.length; i < l; i++) {
            spaces[i].update();
        }
        
        if (hoveredSpace && !hoveredSpace.hovered) {
            hoveredSpace.onHover();
        }
    }
    else {
        
        for (var item in menus[menu]) {
            menus[menu][item].update();
        }
    }
}

function keyDown(event) {
    
    //console.log(event.which)
    
    if (event.ctrlKey) {
        
        switch (event.which) {
            
            case 83:     //ctrl + s
                saveBoard();
                event.preventDefault();
                break;
       
           case 79:     //ctrl + o
                openSave();
                event.preventDefault();
                break;

            case 69:    //ctrl + e
                toggleEditMode();
                event.preventDefault();
                break;
                
            case 89:    //ctrl + y
                undoManager.redo();
                event.preventDefault();
                break;
                
            case 90:    //ctrl + z
                undoManager.undo();
                event.preventDefault();
                break;
                
            default:
                break;
       }
    }
}

/////////////////////////////////////////////////////////////////////////////////////////////////////

canvas.addEventListener('contextmenu', function(event) { event.preventDefault(); return false;} );

canvas.addEventListener('mousedown', mouseDown);
canvas.addEventListener('mouseup', mouseUp);
canvas.addEventListener('mousemove', mouseMove);

addEventListener('keydown', keyDown);

findSaveData();