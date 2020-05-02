var spaces = [];

//space class
function Space(options) {
    
    options = options || {};
    
    spaceCount++;
    
    this.spaceCount = spaceCount;
    
    spaces.push(this);
    
    logCoords('Creating new space at', options.uv[0], options.uv[1])
    
    this.ball = null;
    
    this.uv = options.uv || [0, 0];
    
    this.xy = options.xy || [0, 0];
    
    this.radius = 25 * boardScale;
    
    this.renderRadius = 10;
    
    //distance from space to edge of board
    this.layer = options.layer || 0;
    
    this.hovered = false;
    
}

Space.prototype.draw = function(dt) {
    
    this.xy = transformUVtoXY(this.uv);

    if (this.layer >=  0) { //space is inside board
        
        
        var x = this.xy[0] * canvas.scale;
        var y = this.xy[1] * canvas.scale;
        var radius = this.renderRadius * boardScale * canvas.scale;
        
        if (this.hovered) radius *= 1.5;
        
        //draw empty space
        context.fillStyle   = '#ccc';
        context.strokeStyle = '#ccc';
        
        if (this.layer < 0) context.fillStyle = 'red';
        
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
        context.stroke();
        context.closePath();
        
        context.fillStyle = 'black';
        context.strokeStyle = 'black';
    }
}

Space.prototype.update = function() {
    
    if (this.contains(mouse) && !this.hovered) {
        hoveredSpace = this;
    }
    else if (!this.contains(mouse) && this.hovered) {
        this.onUnhover();
    }
}

Space.prototype.onHover = function() {
    
    //this.renderRadius *= 1.5;
    this.hovered = true;
    hoveredSpace = this;
    
    //check arrow
    if (!mousePressed) {
        
        clearHighlight();
        
        if (this.ball && this.ball.player == currentPlayer) this.ball.highlight();
        
        var origin = inlineWithSelection(this);
        
        if (origin && origin !== this.ball) {
        
            var direction = [this.uv[0] - origin.space.uv[0],  this.uv[1] - origin.space.uv[1]];
            
            if (direction[0]) direction[0] /= Math.abs(direction[0]);
            if (direction[1]) direction[1] /= Math.abs(direction[1]);
            
            if (isMoveValid(direction)) {
                
                for (var i = 0, l = selectedBalls.length; i < l; i++) {
                    
                    if (selectedBalls[i].arrow.direction[0] != direction[0] || selectedBalls[i].arrow.direction[1] != direction[1]) {
                        
                        selectedBalls[i].arrow = {direction: [direction[0], direction[1]], color: blueArrow, progress: 0};
                    }
                }
                
            }
            else {
                
                //draw invalid arrow
                for (i = 0, l = selectedBalls.length; i < l; i++) {
                    
                    if (selectedBalls[i].arrow.direction[0] != direction[0] || selectedBalls[i].arrow.direction[1] != direction[1]) {
                        
                        selectedBalls[i].arrow = {direction: [direction[0], direction[1]], color: blueArrow, progress: 0};
                    
                        if (selectedBalls[i].neighbor(direction))            selectedBalls[i].arrow.color = redArrow;
                        if (!getSpace(selectedBalls[i].space.uv, direction)) selectedBalls[i].arrow.color = redArrow;
                    }

                }
 
            }
        }
        else {
            
            /*
            //clear arrow
            for (var i = 0, l = selectedBalls.length; i < l; i++) {
                selectedBalls[i].arrow.direction = [0, 0];
            }
            */
        }
    }
    
    //check player selection
    if (this.ball && this.ball.player == currentPlayer) {
        
        if (mousePressed) {
    
            //highlight current ball for selection
            /*if (highlightedBalls.length > maxSumito - 1) {
                clearHighlight();
                this.ball.highlight();
                return;
            }*/

            var origin = highlightedBalls[0].space;
            
            //distance between this and origin
            var distance;
            
            if (origin.inline(this.uv)) {
                
                if (origin.uv[0] == this.uv[0]) {
                    
                    distance = origin.uv[1] - this.uv[1];
                }
                else {
                    distance = origin.uv[0] - this.uv[0];
                }
                
                distance = Math.abs(distance);
                
                //maximum selection is three balls long
                if (distance < maxSumito) {
                    
                    clearHighlight();
                    
                    origin.ball.highlight();
                    
                    for (var progress = 1; progress <= distance; progress++) {
    
                        uv = interp_2D(origin.uv, this.uv, progress/distance, lerp);
                        
                        var testSpace = board[ uv[0] ][ uv[1] ];
                        
                        if (testSpace.ball && testSpace.ball.player == currentPlayer) { 
                            highlightedBalls[progress] = testSpace.ball;
                            testSpace.ball.highlighted = true;
                        }
                        else {
                            clearHighlight();
                            this.ball.highlight();
                            return;
                        }
                    }
                    
                    return;
                    
                } //else, this is further than max length or...
                
            } //else, this is not in line or...
            
        } // else, mouse is not pressed
        
        /*clearHighlight();
        this.ball.highlight();*/
        return;
    }
    
    
}

Space.prototype.onUnhover = function() {
    
    //this.renderRadius /= 1.5;
    this.hovered = false;

    if (!mousePressed) clearHighlight();
    
    hoveredSpace = null;
}

Space.prototype.onClick = selectSpace;

function selectSpace() {
    
    if (selectedBalls[0]) {
        
        if (!this.ball || this.ball.player != currentPlayer ) {
            
            //calculate move
            var origin = inlineWithSelection(hoveredSpace);
            
            if (origin && origin !== this.ball) {
                
                var direction = [this.uv[0] - origin.space.uv[0], this.uv[1] - origin.space.uv[1]];
                
                if (direction[0]) direction[0] /= Math.abs(direction[0]);
                if (direction[1]) direction[1] /= Math.abs(direction[1]);
                
                if (isMoveValid(direction)) {

                    moveBalls(direction);
                    
                    clearSelection();
                }
            }
        }
    }
}

function editSpace() {
    
    if (this.ball) {

        if (!this.ball.player) {
            
            this.ball.destroy();
            this.ball = new Ball({player: 1, space: this});
            
        }else this.ball.destroy();
    }
    else this.ball = new Ball({player: 0, space: this});
    
    undoManager.saveMove();
}

Space.prototype.onMouseUp = function() {
    
    clearSelection();
    
    if (highlightedBalls[0]) {
        
        for (var i = 0, l = highlightedBalls.length; i < l; i++) {
            highlightedBalls[i].selected = true;
            selectedBalls.push(highlightedBalls[i]);
        }
    }
    
    clearHighlight();
}

Space.prototype.contains = function(point) {
    
    if (distance(point, this.xy) < this.radius) {
        return true;
    }
    
    return false;
}

Space.prototype.inline = function(uv) {
    
    return (this.uv[0] == uv[0]) || (this.uv[1] == uv[1]) || (this.uv[0] + this.uv[1] == uv[0] + uv[1]);
}

Space.prototype.getRow = function() {
    
    return this.uv[0] + this.uv[1];
}