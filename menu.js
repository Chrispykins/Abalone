var menu = 0;
var menus = [];
var loading = false;

var menuOpacity = 0;
var menuFadeDirection = 0;
var fadeDuration = 0.3;

////////////////////////////////////////////
// Menu item class
//////////////////////////////////////////
function MenuItem(options) {
    
    options = options || {};

    //xy is center of rectangle
    this.xy = options.xy || [gameDimensions[0]/2, gameDimensions[1]/2];
    this.dimensions = options.dimensions || [0, 0];
    
    this.image = options.image || null;
    this.imageOffset = options.imageOffset || [0, 0];
    this.imageDimensions = options.imageDimensions || [this.dimensions[0], this.dimensions[1]];
    
    this.text = options.text || '';
    this.textOffset = options.textOffset || [0, 0];
    this.fontSize = options.fontSize || 100;
    
    //fade animations
    this.opacity = options.opacity || 0;
    this.fadeDirection = 0;
    
}

MenuItem.prototype.update = function() {
    
    if (this.contains(mouse) && !this.hovered) {
        this.onHover();
    }
    else if (!this.contains(mouse) && this.hovered) {
        this.onUnhover();
    }
}



MenuItem.prototype.draw = function(dt) {

    updateOpacity.call(this, dt);

    context.globalAlpha = this.opacity;
    
    var x, y;
    
    if (this.image) {
        
        x = (this.xy[0] + this.imageOffset[0] - (this.imageDimensions[0]/2)) * canvas.scale;
        y = (this.xy[1] + this.imageOffset[1] - (this.imageDimensions[1]/2)) * canvas.scale;
        
        context.drawImage(this.image, x, y, this.imageDimensions[0] * canvas.scale, this.imageDimensions[1] * canvas.scale);
        
    }
    
    if (this.text) {
        
        x = (this.xy[0] + this.textOffset[0]) * canvas.scale;
        y = (this.xy[1] + this.textOffset[1]) * canvas.scale;

        context.font = Math.floor(this.fontSize * canvas.scale) + 'px Abalone';
        
        context.fillText(this.text, x, y);
    }

    context.globalAlpha = 1;
}

MenuItem.prototype.contains = function(point) {
    
    if (point[0] < this.xy[0] - this.dimensions[0]/2) return false;
    if (point[0] > this.xy[0] + this.dimensions[0]/2) return false;
    if (point[1] < this.xy[1] - this.dimensions[1]/2) return false;
    if (point[1] > this.xy[1] + this.dimensions[1]/2) return false;
    
    return true;
}

MenuItem.prototype.onHover = function() {};
MenuItem.prototype.onUnhover = function() {};

//////////////////////////////////////////////////////////
// Interactable menu item class
//////////////////////////////////////////////////////////
function MenuButton(options) {
    
    options = options || {};
    
    MenuItem.call(this, options);

    //on click
    var clickEvent = options.onClick || this.onClick || function() {};
    
    this.onClick = function() {
        clickEvent.call(this);
        if (!(this instanceof Slider)) soundFX.click.play();
    };

    //on hover
    var hover = options.onHover || function() {};

    this.onHover = function() {
        if (this._onHover()) hover.call(this);
    }

    //on unhover
    var unhover = options.onUnhover || function() {};

    this.onUnhover = function() {
        if (this._onUnhover()) unhover.call(this);
    }
    
    this.hovered = false;
}

MenuButton.prototype = Object.create(MenuItem.prototype);

MenuButton.prototype._onHover = function() {
    
    if (!this.hovered && this.opacity === 1) {
        this.hovered = true;
        
        this.fontSize *= 1.25;
        this.imageDimensions[0] *= 1.25;
        this.imageDimensions[1] *= 1.25;

        return true;
    }
    return false;
}

MenuButton.prototype._onUnhover = function() {
    

    if (this.hovered) {
        this.hovered = false;

        //call customizable function
        this.onUnhover();
        
        this.fontSize /= 1.25;
        this.imageDimensions[0] /= 1.25;
        this.imageDimensions[1] /= 1.25;

        return true;
    }
    return false;
}

///////////////////////////////
// Number select
///////////////////////////////

function NumberSelect(options) {
    
    options = options || {};
    
    this.default = options.default || 1;
    this.min = options.min || 1;
    this.max = options.max || 10;
    this.value = this.default;
    
    this.onValueChanged = options.onValueChanged || function() {};
    
    this.xy = options.xy || [0, 0];
    this.width = options.width || 100;
    this.arrowSize = options.arrowSize || 25;
    this.fontSize = options.fontSize || 50;
    
    this.opacity = 0;
    this.fadeDirection = 0;
    
    this.leftArrow = new MenuButton({
        
        xy: [this.xy[0] - this.width, this.xy[1]],
        dimensions: [this.arrowSize * 2, this.arrowSize * 2],
        imageDimensions: [this.arrowSize, this.arrowSize],
        
        onClick: function() {
            
            this.owner.changeValue(-1);
        }
    });
    
    this.leftArrow.owner = this;

    this.rightArrow = new MenuButton({
        
        xy: [this.xy[0] + this.width, this.xy[1]],
        dimensions: [this.arrowSize * 2, this.arrowSize * 2],
        imageDimensions: [this.arrowSize, this.arrowSize],
        
        onClick: function() {
            this.owner.changeValue(1);
        }
        
    });
    
    this.rightArrow.owner = this;

}

NumberSelect.prototype.update = function() {
    
    this.leftArrow.update();
    this.rightArrow.update();
}

NumberSelect.prototype.draw = function(dt) {
    
    updateOpacity.call(this, dt);
    
    context.globalAlpha = this.opacity;
    
    fillTri(this.leftArrow.xy, triangle_left, this.leftArrow.imageDimensions[0]);
    fillTri(this.rightArrow.xy, triangle_right, this.rightArrow.imageDimensions[0]);
    
    this.leftArrow.opacity = this.opacity;
    this.rightArrow.opacity = this.opacity;
    
    var fontSize = Math.floor(this.fontSize * canvas.scale);
    context.font = fontSize +'px Times';
    
    context.fillText(this.value, this.xy[0] * canvas.scale, this.xy[1] * canvas.scale);
    
    context.globalAlpha = 1;
}

NumberSelect.prototype.contains = function(point) {
    
    return this.leftArrow.contains(point) || this.rightArrow.contains(point);
}

NumberSelect.prototype.onClick = function() {
    
    if (this.leftArrow.hovered) this.leftArrow.onClick();
    if (this.rightArrow.hovered) this.rightArrow.onClick();
}

NumberSelect.prototype.changeValue = function(delta) {
    
    this.value += delta;
    
    this.value = Math.max(this.min, Math.min(this.max, this.value));
    
    this.onValueChanged(this.value);
}

////////////////////////////////////////////////////////////////////////
// Color Select
///////////////////////////////////////////////////////////////////////

function ColorSelect(options) {
    
    options = options || {};
    
    this.xy = options.xy || [0, 0];
    
    this.buttonWidth = options.buttonWidth || 50;
    this.buttonHeight = options.buttonHeight || 75;
    this.buttonSpacing = options.buttonSpacing || 75;
    
    this.buttons = [];
    
    this.player = options.player || 0;
    this.selection = colors[this.player];
    
    this.opacity = 0;
    this.fadeDirection = 0;
    
    for (var i = 0, l = colors.length; i < l; i++) {
        
        this.buttons[i] = new MenuButton({
            
            xy: [this.xy[0] + (i - (l - 1)/2) * this.buttonSpacing, this.xy[1]],
            dimensions: [this.buttonWidth, this.buttonHeight],
            
            onClick: function() {
                
                changeBallColors(this.player, this.color);
                
            }
        });
        
        this.buttons[i].player = this.player;
        this.buttons[i].color = colors[i];
    }
}

ColorSelect.prototype.draw = function(dt) {
    
    updateOpacity.call(this, dt);
    
    context.globalAlpha = this.opacity;
    
    context.lineWidth = 8 * canvas.scale;
    
    for (var i = 0, l = this.buttons.length; i < l; i++) {
        
        var button = this.buttons[i];
        
        button.opacity = this.opacity;
        
        context.fillStyle = button.color;
        
        if (button.color == this.selection) context.strokeStyle = 'orange';
        
        context.beginPath();
        context.rect((button.xy[0] - button.imageDimensions[0]/2) * canvas.scale, (button.xy[1] - button.imageDimensions[1]/2) * canvas.scale, button.imageDimensions[0] * canvas.scale, button.imageDimensions[1] * canvas.scale);
        context.fill();
        context.stroke();
        context.closePath();
        
        if (button.color == this.selection) context.strokeStyle = 'black';
    }
    
    context.globalAlpha = 1;
    context.fillStyle = 'black';
}

ColorSelect.prototype.update = function() {

    for (var i = 0, l = this.buttons.length; i < l; i++) {
        
        this.buttons[i].update();
    }
}

ColorSelect.prototype.contains = function(point) {
    
    var result = false;
    
    for (var i = 0, l = this.buttons.length; i < l; i++) {
        
        if (this.buttons[i].contains(point)) return true;
    }
    
    return false;
}

ColorSelect.prototype.onClick = function() {
    
    for (var i = 0, l = this.buttons.length; i < l; i++) {
        
        if (this.buttons[i].hovered) this.buttons[i].onClick();
    }
}

////////////////////////////////////////////////////////////////////////////////
//Slider
////////////////////////////////////////////////////////////////////////////////

function Slider(options) {

    options = options || {};

    options.onHover   = function() { this.dimensions[1] *= 1.25; this.faderWidth *= 1.25 };
    options.onUnhover = function() { this.dimensions[1] /= 1.25; this.faderWidth /= 1.25 };

    //inherit from MenuButton
    MenuButton.call(this, options);

    this.progress = options.progress || 0.5;

    this.faderWidth = 35;

    this.trackHeight = 30;

    this.onChange = options.onChange || function(progress) {};

    this.onRelease = options.onRelease || function() {};
}

Slider.prototype = Object.create(MenuButton.prototype);

Slider.prototype.onClick = function() {

    var parent = this;

    //event listener for dragging mouse
    function trackMovement() {

        //width of slider accounting for fader width
        var width = parent.dimensions[0] - parent.faderWidth;

        //horizontal position relative to element
        var x = mouse[0] - parent.xy[0] + width/2;

        var progress = x / width;

        progress = Math.min(1, Math.max(0, progress));

        parent.onChange(progress);

        parent.progress = progress;
    }

    //event listener for releasing mouse
    function release() {

        trackMovement.call(this);

        removeEventListener('mouseup', release);
        removeEventListener('mousemove', trackMovement);

        parent.onRelease();
    }

    //update position of fader
    trackMovement.call(this);

    //attach event listeners for movement and release
    addEventListener('mousemove', trackMovement);
    addEventListener('mouseup', release);
}

Slider.prototype.draw = function(dt) {

    updateOpacity.call(this, dt);

    context.globalAlpha = this.opacity;

    var left   = this.xy[0] - this.dimensions[0]/2;
    var top    = this.xy[1] - this.dimensions[1]/2;

    var faderLeft = left + this.progress * (this.dimensions[0] - this.faderWidth);
    var trackTop = this.xy[1] - this.trackHeight/2;

    //draw track
    context.lineWidth = 3 * canvas.scale;
    context.fillStyle = "#888";
    context.fillRect(left * canvas.scale, trackTop * canvas.scale, this.dimensions[0] * canvas.scale, this.trackHeight * canvas.scale);
    context.strokeRect(left * canvas.scale, trackTop * canvas.scale, this.dimensions[0] * canvas.scale, this.trackHeight * canvas.scale);

    //draw fader
    context.lineWidth = 6 * canvas.scale;
    context.fillStyle = "#ddd";
    context.fillRect(faderLeft * canvas.scale, top * canvas.scale, this.faderWidth * canvas.scale, this.dimensions[1] * canvas.scale);
    context.strokeRect(faderLeft * canvas.scale, top * canvas.scale, this.faderWidth * canvas.scale, this.dimensions[1] * canvas.scale);

    context.globalAlpha = 1;
    context.fillStyle = "black";
    context.lineWidth = 1 * canvas.scale;
}


/////////////////////////////////////////////////////////////////////////////////
//  Define Game Menus...
/////////////////////////////////////////////////////////////////////////////////

//main menu
menus[1] = {
    
    NewGameButton: new MenuButton({
        xy: [gameDimensions[0]/2, gameDimensions[1]/5],
        dimensions: [500, 200],
        
        text: 'New Game',
        
        onClick: function() {
            changeMenu(4);
            cornerButton.text = 'Back';
            
            this.onUnhover();
        }
    }),
    
    SaveGameButton: new MenuButton({
        xy: [gameDimensions[0]/2, 2 * gameDimensions[1]/5],
        dimensions: [500, 200],
        
        text: 'Save Game',
        
        onClick: function() {
            loading = false;
            changeMenu(2);
            menus[2].title.text = 'Save Game:';
            cornerButton.text = 'Back';
            this.onUnhover();
        }
    }),
    
    LoadGameButton: new MenuButton({
        xy: [gameDimensions[0]/2, 3 * gameDimensions[1]/5],
        dimensions: [500, 200],
        
        text: 'Load Game',
        
        onClick: function() {
            loading = true;
            changeMenu(2);
            menus[2].title.text = 'Load Game:'
            cornerButton.text = 'Back';
            this.onUnhover();
        }
    }),
    
    SettingsButton: new MenuButton({
        
        xy: [gameDimensions[0]/2, 4 * gameDimensions[1]/5],
        dimensions: [500, 200],
        
        text: 'Settings',
        
        onClick: function() {
            
            changeMenu(3);
            cornerButton.text = 'Back';
            this.onUnhover();
        }
    }),
};


// Save/Load game menu
menus[2] = {

    title: new MenuItem({
        xy: [gameDimensions[0]/2, gameDimensions[1]/6],

        text: "Save Game:",
        fontSize: 125

    })
};

function loadSaveMenu() {
    
    findSaveData();

    for (let i = 0; i < 5; i++) {
            
        menus[2]['savegame_'+ i] = new MenuButton({
            xy: [gameDimensions[0]/2, (i + 3) * gameDimensions[1]/10],
            dimensions: [gameDimensions[0]/4, gameDimensions[1]/10],
            
            text: saveData[i] ? saveData[i].name : '<Empty>',
            fontSize: 60,
            
            onClick: function() {
                
                if (loading) {
                    
                    if (openSave(i)) {
                        loading = false;
                        toggleMenu();
                        this.onUnhover();
                    }

                    return;
                }
                
                if (this.text != '<Empty>') {
                    
                    if (!confirm("Overwrite this save?")) return;
                }

                var text = prompt('Save Game As...');

                if (saveBoard(i, text)) {
                    this.text = text;
                }
                else this.text = '<Empty>';
            }

        });

    }
}

loadSaveMenu();

//settings redirector menu
menus[3] = {

    title: new MenuItem({

        xy: [gameDimensions[0]/2, gameDimensions[1]/6],
        text: 'Settings:',
        fontSize: 125
    }),

    gameplaySettings: new MenuButton({

        xy: [gameDimensions[0]/2, 2 * gameDimensions[1]/5],
        dimensions: [500, 200],

        text: 'Gameplay',
        fontSize: 90,

        onClick: function() {

            changeMenu(5);
            this.onUnhover();
        }
    }),

    audioSettings: new MenuButton({

        xy: [gameDimensions[0]/2, 3 * gameDimensions[1]/5],
        dimensions: [500, 200],

        text: 'Audio',
        fontSize: 90,

        onClick: function() {

            changeMenu(6);
            this.onUnhover();
        }
    })
}

//New Game Menu - Patterns
menus[4] = {
    
    title: new MenuItem({
        
        xy: [gameDimensions[0]/2, gameDimensions[1]/6],
        fontSize: 125,
        text: 'New Game:'
    }),
    
    classic: new MenuButton({
        
        xy: [gameDimensions[0]/4, gameDimensions[1]/2],
        dimensions: [400, 400],
        text: "Classic",
        textOffset: [0, 300],
        image: images.classic,
        
        onClick: function() {
            
            clearBoard();
            loadPattern(patterns.classic);
            
            currentPlayer = 0;
            scores = [0, 0];
            
            toggleMenu();
            
            this.onUnhover();
            
        }
    }),
    
    daisy: new MenuButton({
        
        xy: [2 * gameDimensions[0]/4, gameDimensions[1]/2],
        dimensions: [400, 400],
        text: "Daisy",
        textOffset: [0, 300],
        image: images.daisy,
        
        onClick: function() {
            
            clearBoard();
            loadPattern(patterns.daisy);
            
            currentPlayer = 0;
            scores = [0, 0];
            
            toggleMenu();
            
            this.onUnhover();
            
        }
    }),
    
    yinyang: new MenuButton({
        
        xy: [3 * gameDimensions[0]/4, gameDimensions[1]/2],
        dimensions: [400, 400],
        text: "Yin-Yang",
        textOffset: [0, 300],
        image: images.yinyang,
        
        onClick: function() {
            
            clearBoard();
            loadPattern(patterns.yinyang);
            
            currentPlayer = 0;
            scores = [0, 0];
            
            toggleMenu();
            
            this.onUnhover();
            
        }
    }),
};

//game settings menu
menus[5] = {
    
    title: new MenuItem({
        
        xy: [gameDimensions[0]/2, gameDimensions[1]/6],
        text: 'Gameplay:',
        fontSize: 125
    }),
    
    player0ColorText: new MenuItem({
        
        xy: [700, (gameDimensions[1] * 2)/6],
        text: "Player 1:",
        fontSize: 60
    }),
    
    colorSelect_0: new ColorSelect({
        
        xy: [1300, (gameDimensions[1] * 2)/6],
    }),
    
    player1ColorText: new MenuItem({
        
        xy: [700, (gameDimensions[1] * 3)/6],
        text: "Player 2:",
        fontSize: 60

    }),
    
    colorSelect_1: new ColorSelect({
        
        xy: [1300, (gameDimensions[1] * 3)/6],
        player: 1
    }),
    
    scoreText: new MenuItem({
        
        xy: [700, (gameDimensions[1] * 4)/6],
        text: 'Winning Score:',
        fontSize: 60

    }),
    
    maxScore: new NumberSelect({
        
        xy: [1300, (gameDimensions[1] * 4)/6],
        default: 6,
        min: 3,
        max: 12,
        
        onValueChanged: function(value) {
            
            maxScore = value;
        }
        
    }),
    
    sumitoText: new MenuItem({
        
        xy: [700, (gameDimensions[1] * 5)/6],
        text: 'Sumito Length:',
        fontSize: 60

    }),
    
    maxSumito: new NumberSelect({
        
        xy: [1300, (gameDimensions[1] * 5)/6],
        default: 3,
        min: 2,
        max: 5,
        
        onValueChanged: function(value) {
            
            maxSumito = value;
        }
        
    }),
}

var colorSelectors = [menus[5].colorSelect_0, menus[5].colorSelect_1];

//audio menu
menus[6] = {

    title: new MenuItem({
        
        xy: [gameDimensions[0]/2, gameDimensions[1]/6],
        text: 'Audio:',
        fontSize: 125
    }),

    musicLabel: new MenuItem({
        
        xy: [700, (gameDimensions[1] * 2)/5],
        text: "Music:",
        fontSize: 60

    }),

    soundFXLabel: new MenuItem({
        
        xy: [700, (gameDimensions[1] * 3)/5],
        text: "Sounds:",
        fontSize: 60

    }),

    musicSlider: new Slider({

        xy: [1300, (gameDimensions[1] * 2)/5],
        dimensions: [400, 80],
        progress: musicVolume,

        onChange: function(progress) {
            music.setVolume(Math.max(0.001, progress));
        }
    }),

    soundFXSlider: new Slider({

        xy: [1300, (gameDimensions[1] * 3)/5],
        dimensions: [400, 80],

        progress: soundFXVolume,

        onChange: function(progress) {
            soundFX.setVolume(progress);
        },

        onRelease: function() {
            soundFX.bonk.play();
        }
    })
}


function changeMenu(screen) {

    if (menu && screen) {

        soundFX.pageTurn.play();

        //switch to different menu
        fadeMenuItems(-2);

        onFadeComplete = function(object) {
            
            if (object) {

                menu = screen;
                fadeMenuItems(2);

                onFadeComplete = defaultFadeComplete;
            }
        }
    }
}

function toggleMenu() {

    if (menuFadeDirection < 0 || !menu)  {

        //toggle menu on
        menu = 1;
        cornerButton.text = "Resume";

        menuFadeDirection = 1;
        fadeMenuItems(1);

        music.switchTo('menu');
        music.sweepOut.playCopy();

        onFadeComplete = function () { 
            onFadeComplete = defaultFadeComplete;
        };
    }
    else if (menuFadeDirection > 0 || menu) {

        //toggle menu off
        menuFadeDirection = -1;
        fadeMenuItems(-1);

        music.switchTo('main');
        music.sweepIn.playCopy();

        cornerButton.text = "Menu";

        onFadeComplete = function () { 
            menu = 0;
            onFadeComplete = defaultFadeComplete;
        };
    }

 
}

function defaultFadeComplete() {
    menuFadeDirection = 0;
}

onFadeComplete = defaultFadeComplete;


function fadeMenuItems(direction) {

    for (var item in menus[menu]) {
        menus[menu][item].fadeDirection = direction;
    }
}


function drawMenu(dt) {
    
    if (menu) {
        
        menuOpacity += menuFadeDirection * (dt/1000) / fadeDuration;
        
        if (menuOpacity < 0 || menuOpacity > 1) {
            menuOpacity = Math.min(1, Math.max(0, menuOpacity));
            menuFadeDirection = 0;
            onFadeComplete();
        }

        drawBackground();
     
        for (var item in menus[menu]) {
            if (menus[menu] && menus[menu][item]) { 
                menus[menu][item].draw(dt);
            }
        }
        
        context.globalAlpha = 1;
    }
 
}

function drawBackground() {
    
    context.fillStyle = 'white';
    context.globalAlpha = menuOpacity * 0.95;
    
    context.fillRect(0, 0, gameDimensions[0] * canvas.scale, gameDimensions[1] * canvas.scale);
    
    context.fillStyle = 'black';
}

//generic opacity update function that can be bound to any menu item
function updateOpacity(dt) {
    
    this.opacity += this.fadeDirection * (dt/1000) / fadeDuration;

    if (this.opacity < 0 || this.opacity > 1) {
        this.opacity = Math.min(1, Math.max(0, this.opacity));
        this.fadeDirection = 0;
        onFadeComplete(this);
    }
}

//////////////////////////////////////////////////////////////
// Scoreboards
//////////////////////////////////////////////////////////////

function ScoreBoard(options) {
    
    options = options || {};
    
    this.xy = options.xy || [0, 0];
    this.player = options.player || 0;
    
    this.dimensions = [150, 150];
    this.radius = 20
    
    
}

ScoreBoard.prototype.draw = function() {
    
    context.lineWidth = 5 * canvas.scale;
    
    var fontSize;
    
    var outer = {
        left:   this.xy[0] - this.dimensions[0]/2,
        right:  this.xy[0] + this.dimensions[0]/2,
        top:    this.xy[1] - this.dimensions[1]/2,
        bottom: this.xy[1] + this.dimensions[1]/2
    }
    
    var inner = {
        left:   outer.left + this.radius,
        right:  outer.right - this.radius,
        top:    outer.top + this.radius,
        bottom: outer.bottom - this.radius
    }
    
    context.beginPath();
    
    //draw sides
    context.moveTo(outer.left * canvas.scale, inner.bottom * canvas.scale);
    context.lineTo(outer.left * canvas.scale, inner.top * canvas.scale);
    
    context.arc(inner.left * canvas.scale, inner.top * canvas.scale, this.radius * canvas.scale, Math.PI, 1.5 * Math.PI);

    context.moveTo(inner.left * canvas.scale, outer.top * canvas.scale);
    context.lineTo(inner.right * canvas.scale, outer.top * canvas.scale);
    
    context.arc(inner.right * canvas.scale, inner.top * canvas.scale, this.radius * canvas.scale, 1.5 * Math.PI, 0);

    context.moveTo(outer.right * canvas.scale, inner.top * canvas.scale);
    context.lineTo(outer.right * canvas.scale, inner.bottom * canvas.scale);
    
    context.arc(inner.right * canvas.scale, inner.bottom * canvas.scale, this.radius * canvas.scale, 0, 0.5 * Math.PI);

    context.moveTo(inner.right * canvas.scale, outer.bottom * canvas.scale);
    context.lineTo(inner.left * canvas.scale, outer.bottom * canvas.scale);

    context.arc(inner.left * canvas.scale, inner.bottom * canvas.scale, this.radius * canvas.scale, 0.5 * Math.PI, Math.PI);
    
    context.stroke();
    context.closePath();

    //open up top and bottom
    context.fillStyle = 'white';
    
    context.fillRect((this.xy[0] - 54) * canvas.scale, (outer.top - 10) * canvas.scale, 108 * canvas.scale, 20 * canvas.scale);
    context.fillRect((this.xy[0] - 25) * canvas.scale, (outer.bottom - 10) * canvas.scale, 50 * canvas.scale, 20 * canvas.scale);
    
    //draw labels
    context.fillStyle = 'black';
    
    fontSize = 33 * canvas.scale;
    context.font = fontSize +'px Abalone';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    
    context.fillText('Player '+ (this.player + 1), this.xy[0] * canvas.scale, outer.top * canvas.scale);
    
    //draw circle
    context.fillStyle = playerColors[this.player];
    context.lineWidth = 3 * canvas.scale;
    
    context.beginPath();
    context.arc(this.xy[0] * canvas.scale, outer.bottom * canvas.scale, 20 * canvas.scale, 0, 2 * Math.PI);
    context.fill();
    context.stroke();
    context.closePath();
    
    //draw score
    context.fillStyle = 'black';
    fontSize = 45 * canvas.scale;
    context.font = fontSize +'px Times'
    context.fillText(scores[this.player] +' / '+ maxScore, this.xy[0] * canvas.scale, this.xy[1] * canvas.scale);


};


