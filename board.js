var board = [];
var spaces = [];
var boardScale = 1;
var boardSize = 0;
var spaceCount = 0;

var deathSpace = new Space({uv: [-99, -99], layer: -1});

function buildBoard(size) {
    
    //global board variables
    board = [];
    spaces = [];
    boardSize = size;

    //zoom so board takes up whole screen
    resizeBoard();
    
    console.log('building board of size: ' + size)
    
    var layers = [];
    
    if (size < 1) {
    
        board = [[ new Space( {uv: [0, 0]} ) ]];
        boardSize = 0;
        return;
    }
    
    //create a board with (size * 2) + 1 rows
    for (var i = 0, l = (size*2) + 1; i < l; i++) {
        board.push([]);
    }
    
    //the center space
    board[size][size] = new Space({uv: [size, size], layer: size - 1});

    //start adding layers
    processLayer( [board[size][size]] );
    
    //function to call on all uninitialized spaces
    function createAdjacentSpaces(space) {
        
        var layerNumber = space.layer - 1;
        
        if (space.layer >= 0 && !layers[layerNumber]) {
            layers[layerNumber] = [];
        }
        
        var debugString = 'creating space at coordinates'
        
        var u = space.uv[0];
        var v = space.uv[1];
        
        logCoords('building layer '+ layerNumber +' around ', u, v)
        
        //upper left
        if (u && !board[u - 1][v]) {
            board[u - 1][v] = new Space( {uv: [u - 1, v], layer: layerNumber} );
            layers[layerNumber].push(board[u - 1][v]);
        }

        //upper right
        if (v && !board[u][v - 1]) {
            board[u][v - 1] = new Space( {uv: [u, v - 1], layer: layerNumber} );
            layers[layerNumber].push(board[u][v - 1]);
        }
        
        //right
        if ( (u < (size * 2) - 1) && v && !board[u + 1][v - 1]) {
            board[u + 1][v - 1] = new Space( {uv: [u + 1, v - 1], layer: layerNumber} );
            layers[layerNumber].push(board[u + 1][v - 1]);
        }
        
        //lower right
        if ( (u < (size * 2) - 1) && !board[u + 1][v]) {
            board[u + 1][v] = new Space( {uv: [u + 1, v], layer: layerNumber} );
            layers[layerNumber].push(board[u + 1][v]);
        }
        
        //lower left
        if ( (v < (size * 2) - 1) && !board[u][v + 1]) {
            board[u][v + 1] = new Space( {uv: [u, v + 1], layer: layerNumber} );
            layers[layerNumber].push(board[u][v + 1]);
        }
        
        //left
        if (u && (v < (size * 2) - 1) && !board[u - 1][v + 1]) {
            board[u - 1][v + 1] = new Space( {uv: [u - 1, v + 1], layer: layerNumber} );
            layers[layerNumber].push(board[u - 1][v + 1]);
        }

    }
    
    //recursively call createAdjacentSpaces()
    function processLayer(layer) {
    
        if (layer[0] && layer[0].layer) {
            
            var layerNumber = layer[0].layer;
        
            for (var i = 0, l = layer.length; i < l; i++) {
                    
                createAdjacentSpaces(layer[i]);
            }
            
            processLayer(layers[layerNumber - 1]);
        }
        
    }
}

function clearBoard() {
    
    for (var u = 0, maxU = board.length; u < maxU; u++) {
        
        for (var v = 0, maxV = board[u].length; v < maxV; v++) {
            
            if (board[u] && board[u][v] && board[u][v].ball) board[u][v].ball.destroy();
        }
    }
}



function resizeBoard() {
    
    if (canvas.width > canvas.height) {
        
        boardScale = gameDimensions[1] / (2 * (boardSize + 1) * u_vector[1]);
    }
    else {
        boardScale = gameDimensions[0] / (2 * (boardSize + 1) * u_vector[0]);
    }
}

function drawBoard(dt) {
    
    for (var i = 0, l = spaces.length; i < l; i++) {
        spaces[i].draw();
    }
    
    deathSpace.draw();
    
    for (i = 0; i < l; i++) {
        if (spaces[i].ball) spaces[i].ball.draw(dt);
        
    }
    
    if (deathSpace.ball) deathSpace.ball.draw(dt);
    
    for (i = 0; i < l; i++) {
        if (spaces[i].ball) {
            if (spaces[i].ball.arrow) spaces[i].ball.drawArrow(dt);
        }
    }
}

function serializeBoard() {
    
    var result = [];
    
    for (var u = 0, maxU = board.length; u < maxU; u++) {

        result.push([]);

        for (var v = 0, maxV = board[u].length; v < maxV; v++) {

            if (board[u][v] && board[u][v].ball) {

                result[u].push(board[u][v].ball.player);
            }
            else result[u].push(-1);
        }
    }
    
    return result;
}

function saveBoard(slot, name = prompt("Save Board As...")) {

    if (name) {

        var saveGame = {
            name: name,
            slot: slot,
            currentPlayer: currentPlayer,
            boardSize: boardSize
        };

        saveGame.board = serializeBoard();

        localStorage['abalone_'+ slot] = JSON.stringify(saveGame);
        
        return true;   
    }

    return false;
}

function openSave(slot) {

    console.log(slot)
        
    if (!saveData[slot]) {
        alert("No Save Data Found");
        return false;
    }

    var saveGame = JSON.parse(localStorage['abalone_'+ slot]);

    if (saveGame) {
        
        buildBoard(saveGame.boardSize);
        loadBoard(saveGame.board);
        currentPlayer = saveGame.currentPlayer;

        return true;
    }

    return false;
}

function loadBoard(boardArray) {

    for (var u = 0, maxU = boardArray.length; u < maxU; u++) {

        for (var v = 0, maxV = boardArray[u].length; v < maxV; v++) {

            if (boardArray[u][v] >= 0 && board[u]) {

                if (board[u][v]) {

                    board[u][v].ball = new Ball({player: boardArray[u][v], space: board[u][v]});
                }
            }
        }
    }
}

function exportPattern() {
    
    console.log(JSON.stringify(serializeBoard()));
}

function loadPattern(pattern) {
    
    for (var u = 0, maxU = pattern.length; u < maxU; u++) {
        
        if (pattern[u]) {
        
            for (var v = 0, maxV = pattern[u].length; v < maxV; v++) {
                
                if (pattern[u][v] !== -1 && pattern[u][v] !== null) board[u][v].ball = new Ball({space: board[u][v], player: pattern[u][v]});
            }
        }
    }

}

function moveDeathSpace(targetUV) {
    
    if (deathSpace.uv[0] > 0 || deathSpace.uv[1] > 0) {
        
        board[deathSpace.uv[0]][deathSpace.uv[1]] = null;
    }
    
    deathSpace.uv = [targetUV[0], targetUV[1]];
    board[targetUV[0]][targetUV[1]] = deathSpace;
    
    return deathSpace;
}

function getSpace(uv, offset) {
    
    offset = offset || [0, 0];
    
    if (board[uv[0] + offset[0]]) {
        return board[uv[0] + offset[0]][uv[1] + offset[1]];
    }
    
    return false;
}

var patterns = {
    
    classic: [[],
        [-1,-1,-1,-1,-1,1,1,-1,-1,-1],
        [-1,-1,-1,-1,1,1,-1,-1,-1,-1],
        [-1,-1,-1,1,1,1,-1,-1,-1,-1],
        [-1,-1,1,1,1,-1,-1,-1,-1,0],
        [-1,1,1,1,-1,-1,-1,0,0,0],
        [-1,1,-1,-1,-1,-1,0,0,0],
        [-1,-1,-1,-1,-1,0,0,0],
        [-1,-1,-1,-1,-1,0,0],
        [-1,-1,-1,-1,0,0]],
        
    daisy: [[],
        [-1,-1,-1,-1,-1,-1,1,1,-1,-1],
        [-1,-1,-1,-1,-1,1,1,1,-1,-1],
        [-1,-1,-1,-1,-1,1,1,-1,0,0],
        [-1,-1,-1,-1,-1,-1,-1,0,0,0],
        [-1,-1,0,0,-1,-1,-1,0,0,-1],
        [-1,0,0,0,-1,-1,-1,-1,-1],
        [-1,0,0,-1,1,1,-1,-1],
        [-1,-1,-1,1,1,1,-1],
        [-1,-1,-1,1,1,-1]],
        
    yinyang: [[],
        [-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [-1,-1,-1,-1,-1,1,1,1,-1,-1],
        [-1,-1,-1,-1,1,1,0,1,-1,-1],
        [-1,-1,-1,1,1,1,1,-1,0,-1],
        [-1,-1,1,1,-1,-1,-1,0,0,-1],
        [-1,-1,1,-1,0,0,0,0,-1],
        [-1,-1,-1,0,1,0,0,-1],
        [-1,-1,-1,0,0,0,-1],
        [-1,-1,-1,-1,-1,-1]]

}

