var lastTick = Date.now();
var dt  = 0;

var hoveredSpace = null;
var currentPlayer = 0;
var ballCount = [0, 0];
var scores = [0, 0];

var selectedBalls = [];
var highlightedBalls = [];

var title = {
    fadeDirection: 0,
    opacity: 1
}

var cornerButton = new MenuButton({
    
    xy: [150, 100],
    dimensions: [120, 70],
    
    text: 'Menu',
    fontSize: 40,

    opacity: 1,
    
    onClick: function() {

        console.log('cornerButton clicked!')

        if (!menu) {
            toggleMenu();
            this.text = 'Resume';
        }
        else if (menu == 1) {
            toggleMenu();
            this.text = 'Menu';
        }
        else {
            changeMenu(1);
            this.text = 'Resume';
        }

    }
});

var scoreBoards = [
    
    //scoreboard 1
    new ScoreBoard({
    
        xy: [200, gameDimensions[1]/2],
        color: playerColors[0]
    }),
    
    //scoreboard 2
    new ScoreBoard({
        
        xy: [gameDimensions[0] - 200, gameDimensions[1]/2],
        player: 1,
        color: playerColors[1]
    })
]

function toggleEditMode() {
    
    editMode = !editMode;
    
    if (editMode) {
        console.log('edit mode on')
        Space.prototype.onClick = editSpace;
    }
    else {
        console.log('edit mode off')
        Space.prototype.onClick = selectSpace;
    }
}
function clearSelection() {
    
    for (var i = 0, l = selectedBalls.length; i < l; i++) {
        
        if (selectedBalls[i]) {
            selectedBalls[i].arrow.direction = [0, 0];
            selectedBalls[i].selected = false;
        }
    }
    
    selectedBalls = [];
}

function clearHighlight() {
    
    for (var i = 0, l = highlightedBalls.length; i < l; i++) {
        
        if (highlightedBalls[i]) {
            highlightedBalls[i].highlighted = false;
        }
    }
    
    highlightedBalls = [];
}

function cyclePlayers() {
    
    currentPlayer = Number(!currentPlayer);

    console.log("-----------------------------------------\nPlayer "+ currentPlayer +"'s turn\n-----------------------------------------");
}

function changeBallColors(player, newColor) {
    
    playerColors[player] = newColor;
    
    for (var i = 0, l = spaces.length; i < l; i++) {
        
        if (spaces[i].ball && spaces[i].ball.player == player) {
            spaces[i].ball.color = newColor;
        }
    }
    
    colorSelectors[player].selection = newColor;
}

function inlineWithSelection(space) {
    
    if (!space) return;

    for (var i = 0, l = selectedBalls.length; i < l; i++) {
        
        if (selectedBalls[i].space.inline(space.uv)) return selectedBalls[i];
    }
    
    return false;
}

function isMoveValid(direction) {

    var valid = true;
    
    if (!direction[0] && !direction[1]) return false;
    
    if (selectedBalls[0]) {
        
        if (checkSumito(direction)) {
            
            for (var i = 0, length = selectedBalls.length; i < length; i++) {
                if (!selectedBalls[i].canMove(direction, length)) valid = false;
            }
        }
        else {
            
            for (i = 0, length = selectedBalls.length; i < length; i++) {
                if (selectedBalls[i].neighbor(direction))            valid = false;
                if (!getSpace(selectedBalls[i].space.uv, direction)) valid = false;
            }
        }
        
        return valid;
    }
    else return false;
}

//returns true if selected balls are in line with the direction
function checkSumito(direction) {
   
    var antiDirection = [-direction[0], -direction[1]];
    
    if (selectedBalls.length <= 1) {
        return false;
    }
    else if ( selectedBalls.includes(selectedBalls[0].neighbor(direction)) || selectedBalls.includes(selectedBalls[0].neighbor(antiDirection)) ) { 
        return true;
    }
}

//begins movement of balls in particular direction
function moveBalls(direction) {

    if (!selectedBalls[0]) return;

    //play move sound
    soundFX.slide.play();

    for (var i = 0, l = selectedBalls.length; i < l; i++) {
        
        if (selectedBalls[i]) {
        
            selectedBalls[i].animating = true;
            selectedBalls[i].moving = true;
            
        }
    }
    
    for (i = 0; i < l; i++) {
        
        if (selectedBalls[i] && selectedBalls[i].moving) selectedBalls[i].move(direction);
    }

    undoManager.saveMove();
}

function drawWinner() {
    
    var fontSize = Math.floor(200 * canvas.scale);
    var center = board[boardSize][boardSize].xy;
    
    context.fillStyle = winningColor;
    context.lineWidth = 3 * canvas.scale;
    
    context.font = fontSize +'px Abalone';
    context.textAlign = 'center';

    context.fillText(winner +' wins!', center[0] * canvas.scale, center[1] * canvas.scale);
    context.strokeText(winner +' wins!', center[0] * canvas.scale, center[1] * canvas.scale);
    
    context.fillStyle = 'black';
    context.lineWidth = 1 * canvas.scale;
}

function drawTitle(dt) {

    updateOpacity.call(title, dt);

    context.globalAlpha = title.opacity;

    context.drawImage(images.title, 0, 0, gameDimensions[0] * canvas.scale, gameDimensions[1] * canvas.scale);

    context.globalAlpha = 1;

}

function globalDraw() {
    
    var now = Date.now();
    dt = now - lastTick;

    if (Abalone.gameActive) {
    
        var scale = canvas.scale * boardScale;
        
        context.clearRect(0, 0, gameDimensions[0] * canvas.scale, gameDimensions[1] * canvas.scale);

        if (imagesComplete && soundsComplete) {

            drawBoard(dt);
        
            if (winner) {
                drawWinner();
            }
            
            scoreBoards[0].draw();
            scoreBoards[1].draw();
            
            drawMenu(dt);
            cornerButton.draw(dt);

            //if (music && music.started) music.update(dt);

            if (title.opacity) drawTitle(dt);
        }
    }

    lastTick = now;

    requestAnimationFrame(globalDraw, 0);
}

function main() {

    buildBoard(5);
    loadPattern(patterns.classic);
    undoManager.history = [serializeBoard()];

    globalDraw();
    
}

main();