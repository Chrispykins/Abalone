var colors = ['white', 'black', '#77C', '#8FC', '#A22', '#370'];
var playerColors = ['white', 'black'];
var blueArrow = "0, 100, 255";
var redArrow  = "255, 0, 0";


//ball class
function Ball(options) {
    
    options = options || {};
    
    this.space = options.space || null;

    this.player = options.player || 0;
    
    this.color  = playerColors[this.player];
    
    this.radius = 15;
    
    this.selected = false;
    
    this.highlighted = false;
    
    this.arrow = {
        direction: [0, 0],
        color: "0, 75, 255",
        progress: 0
    };
    
    this.moving = false;
    
    //animation parameters for movement
    this.animating = options.animating ||false;
    this.direction = options.direction || [0, 0];
    this.offset   = [0, 0];
    this.progress = options.progress || 0;
    
    ballCount[this.player]++;

    this.count = options.count || ballCount[this.player];
}

Ball.prototype.draw = function(dt) {
    
    var x, y, xy;

    //animate ball movement
    if (this.animating) {
        this.animate(dt);
    }
    
    xy = transformUVtoXY([this.space.uv[0] - this.offset[0], this.space.uv[1] - this.offset[1]]);
    
    x = xy[0] * canvas.scale;
    y = xy[1] * canvas.scale;


    var radius = this.space.renderRadius * 1.5 * canvas.scale * boardScale;
    
    //draw ball at x, y
    context.fillStyle = this.color;
    context.lineWidth = 1 * canvas.scale * boardScale;
    
    if (this.selected) {
        context.strokeStyle = 'orange';
        context.lineWidth   = 2 * canvas.scale * boardScale;
    }
    if (this.highlighted) radius *= 1.5;
    
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    context.closePath();
    
    //draw number
    /*
    context.fillStyle = playerColors[Number(!this.player)];
    context.font = '10px Arial';
    context.textAlign = 'center';
    
    context.fillText(this.count,x, y);
    */

    
    context.fillStyle = 'black';
    context.strokeStyle = 'black';
}

Ball.prototype.drawArrow = function(dt) {
    
    var direction = this.arrow.direction;
    var invalid = this.arrow.invalid;
    var arrowColor = this.arrow.color;
    
    var animationDuration = 0.25; //in seconds 
 
    if (!direction[0] && !direction[1]) return;
    
    if (this.arrow.progress < 1)  {
        this.arrow.progress+= (dt/1000) / animationDuration;
    }

    this.arrow.progress = Math.min(1, this.arrow.progress);
    
    var triangleScale = 10;
    
    if (direction[0]) direction[0] = direction[0] / Math.abs(direction[0]);
    if (direction[1]) direction[1] = direction[1] / Math.abs(direction[1]);
    
    var start = transformUVtoXY(this.space.uv);
    var end   = transformUVtoXY([this.space.uv[0] + direction[0], this.space.uv[1] + direction[1]]);
    var mid   = interp_2D(start, end, this.arrow.progress, smoothstep);
    
    //draw line
    var gradient = context.createLinearGradient(start[0] * canvas.scale, start[1] * canvas.scale, mid[0] * canvas.scale, mid[1] * canvas.scale);
    gradient.addColorStop(0.2, "rgba("+ arrowColor +", 0)");
    gradient.addColorStop(1, "rgba("+ arrowColor +", 1)");
    
    context.lineWidth = 5 * canvas.scale;
    context.strokeStyle = gradient;
    context.fillStyle = "rgba("+ arrowColor +", 1)";
    
    context.beginPath();
    context.moveTo(start[0] * canvas.scale, start[1] * canvas.scale);
    
    context.lineTo(mid[0] * canvas.scale, mid[1] * canvas.scale);
    context.stroke();
    context.closePath();
    
    //draw triangle
    context.lineWidth = 1 * canvas.scale;
    
    var diff = direction[0] - direction[1];
    var triangle;
    
    if (diff === 1 || diff === -2) {
        
        triangle = triangle_left;
    }
    else {
        triangle = triangle_right;
    }
    
    fillTri(mid, triangle, triangleScale)

    context.lineWidth   = 1 * boardScale * canvas.scale;
    context.strokeStyle = 'black';
    context.fillStyle   = 'black';
}

//
Ball.prototype.animate = function(dt) {
    
    var animationDuration = .3; //in seconds
    
    var targetSpace = getSpace(this.space.uv, this.direction);
        
    if (this.progress < 1) {
        
        this.progress+= (dt/1000) / animationDuration;

        if (this.progress >= 1) {
            
            if (this.space.layer < 0) {
                this.pushedOff();
            }
            else {
                 this.progress = 1;
                this.animating = false;
            }
            
        }
        else {
            
            this.offset = interp_2D(this.direction, [0, 0], this.progress, smoothstep);

            if (targetSpace && targetSpace.ball && !targetSpace.ball.animating && this.testCollision(targetSpace.ball)) {
                
                targetSpace.ball.animating = true;

                //play collision sound
                soundFX.bonk.play();
            }
        }
    }
}

Ball.prototype.onClick = function() {

    function createNewSelection(ball) {
                
        clearSelection();
    
        //no balls selected, select this ball
        selectedBalls = [ball];
        
        ball.selected = true;
        
        logCoords('selected ball: ', ball.space.uv[0], ball.space.uv[1])
    }
    
    if (selectedBalls.length === 1) {
        
        if (this.selected) {
            this.selected = false;
            selectedBalls = [];
            return;
        }

        var origin = selectedBalls[0].space;
        
        //distance between this and origin
        var distance;
        
        if (origin.inline(this.space.uv)) {
            
            if (origin.uv[0] == this.space.uv[0]) {
                
                distance = origin.uv[1] - this.space.uv[1];
            }
            else {
                distance = origin.uv[0] - this.space.uv[0];
            }
            
            distance = Math.abs(distance);
            
            //maximum selection is three balls long
            if (distance < maxSumito) {
                
                //progress from this ball to origin
                var progress = distance
                
                for (; progress > 0; progress--) {

                    uv = inter_2D(origin.uv, this.space.uv, progress/distance, lerp);
                    
                    var testSpace = board[ uv[0] ][ uv[1] ];
                    
                    if (testSpace.ball && testSpace.ball.player == currentPlayer) { 
                        selectedBalls[progress] = testSpace.ball;
                        testSpace.ball.selected = true;
                    }
                    else {
                        createNewSelection(this);
                    }
                }
                
                //line selection created
                return;
            }
        }
    }
    
    createNewSelection(this);
       
}

Ball.prototype.move = function(direction) {
    
    this.moving = false;
    
    var targetUV = [this.space.uv[0] + direction[0], this.space.uv[1] + direction[1]];
    var targetSpace = board[targetUV[0]] ? board[targetUV[0]][targetUV[1]] : null;
    
    this.initAnimation(direction);

    if (!targetSpace) {
        moveDeathSpace(targetUV);
        console.log('death space is at [' + deathSpace.uv[0] +', '+ deathSpace.uv[1] +']')
        this.executeMove(deathSpace);
        //this.destroy();
        return true;
    }
    
    if (!targetSpace.ball) {
        this.executeMove(targetSpace);
        return true;
    }
    
    if (targetSpace.ball.move(direction)) {
        this.executeMove(targetSpace);
        return true;
    }
    
    return false;
}

Ball.prototype.canMove = function(direction, force) {
    
    if (force > maxSumito) return false;
    

    var targetUV = [this.space.uv[0] + direction[0], this.space.uv[1] + direction[1]];
    var targetSpace = board[targetUV[0]] ? board[targetUV[0]][targetUV[1]] : null;
    
    if (!targetSpace) return false;
    
    //target space is empty
    if (!targetSpace.ball) return true;
    
    //target space belongs to this player
    if (targetSpace.ball.player == this.player) {
 
        if (selectedBalls.includes(targetSpace.ball)) {
            return targetSpace.ball.canMove(direction, force);
        }
        else return false;
    }
    
    //target space belongs to enemy player
    return targetSpace.ball.canPush(direction, force);

}

Ball.prototype.canPush = function(direction, force) {
    
    force--;
    
    if (!force) return false;
    
    var targetUV = [this.space.uv[0] + direction[0], this.space.uv[1] + direction[1]];
    var targetSpace = board[targetUV[0]] ? board[targetUV[0]][targetUV[1]] : null;
    
    if (!targetSpace) return true;

    //target space is empty
    if (!targetSpace.ball) return true;
    
    //target space belongs to this player
    if (targetSpace.ball.player == this.player) {
        
        return targetSpace.ball.canPush(direction, force);
    }
    
    //target space belongs to enemy player
    return false;
}

Ball.prototype.executeMove = function(space) {
    
    space.ball = this;
    this.space.ball = null; //new Ball({space: space, player: this.player, count: this.count, direction: this.direction, animating: this.animating, progress: this.progress});
    
    this.space = space;
    console.log('moved ' + playerColors[this.player] + " #"+ this.count)
}

Ball.prototype.initAnimation = function(direction) {
    
    console.log(playerColors[this.player] + ' #'+ this.count + ' starting animation in direction ' + direction)

    this.direction = [direction[0], direction[1]];
    this.offset = [direction[0], direction[1]];
    this.progress = 0;

}

//ending the movement animation when destination is reached
/*function endAnimation(ball) {
    
    console.log(ball.count + ' ending animation')
    
    targetSpace = getSpace(ball.space.uv, ball.direction);
    
    if (ball.pushedBy) {
        endAnimation(ball.pushedBy);
    }
    
    animatingBalls.splice(animatingBalls.indexOf(ball), 1);
    ball.pushedBy = null;
    ball.direction = [0, 0];
    ball.offset = [0, 0];
    ball.animating = false;
    ball.progress = 0;
}*/

Ball.prototype.testCollision = function(ball) {
    
    var uv = [this.space.uv[0] - this.offset[0], this.space.uv[1] - this.offset[1]];
    var target = [ball.space.uv[0] - ball.offset[0], ball.space.uv[1] - ball.offset[1]];
    
    if (distance(transformUVtoXY(uv), transformUVtoXY(target)) < this.radius * 2 * boardScale) {
        return true;
    }

    return false;
}

Ball.prototype.neighbor = function(direction) {
    
    var neighborUV = [this.space.uv[0] + direction[0], this.space.uv[1] + direction[1]];
    var neighborSpace = board[neighborUV[0]] ? board[neighborUV[0]][neighborUV[1]] : null;
    
    if (neighborSpace) return board[neighborUV[0]][neighborUV[1]].ball;
    
    return false;
}

Ball.prototype.highlight = function() {
    
    this.highlighted = true;
    highlightedBalls.push(this);
}

Ball.prototype.pushedOff = function() {
    
    scores[Number(!this.player)]++;
    
    if (scores[0] >= maxScore) {
        winner = 'Player 1';
        winningColor = playerColors[0];
    }
    else if (scores[0] >= maxScore) {
        winner = 'Player 2';
        winningColor = playerColors[1];
    }
    
    soundFX.bell.playCopy();

    this.destroy();
}

Ball.prototype.destroy = function() {
    
    ballCount[this.player]--;

    this.space.ball = null;
    
    if (selectedBalls.includes(this) ) {
        selectedBalls[selectedBalls.indexOf(this)] = null;
    }
    
    if (highlightedBalls.includes(this) ) {
        highlightedBalls[highlightedBalls.indexOf(this)] = null;
    }
}


