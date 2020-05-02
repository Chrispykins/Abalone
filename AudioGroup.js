//AudioGroup class
(function(global) {
	
	function AudioGroup() {

		this.clips= arguments;
		this.playStyle= 'random';
		this.index= 0;

		this.fadeStart= 0;
		this.volumeDelta= 0;

		this.temp= [];
	}

	AudioGroup.prototype.play= function () {

		var clip;

		if (this.playStyle== 'random') {
			clip = this.playRandom();
		}
		else if (this.playStyle== 'sequence') {
			clip = this.playSequence();
		}
		else {
			clip = this.clips[this.index].playCopy();
		}

		if (clip) this.addTemp(clip);
	}

	AudioGroup.prototype.playRandom= function () {

		var random= Math.floor(Math.random() * this.clips.length);
		var newNode= this.clips[random].playCopy();

		this.index= random;
		return newNode;
	}

	AudioGroup.prototype.playSequence= function() {

		var newNode= this.clips[this.index].playCopy();

		this.index++;
		this.index= this.index%this.clips.length;

		return newNode;
	}

	AudioGroup.prototype.stop= function() {
		
		for (var i= 0; i < this.temp.length; i++) {
			this.temp[i].pause();
		}

		this.temp= [];
	}

	AudioGroup.prototype.addTemp = function(node) {

		var that = this;
		
		node.addEventListener('ended', function end() {
			that.temp.splice(that.temp.indexOf(this), 1);
			this.removeEventListener('ended', end);
		});

		this.temp.push(node);
	}

	AudioGroup.prototype.setVolume = function(volume) {

		var i;

		for (i = 0, l = this.clips.length; i < l; i++) this.clips[i].volume = volume;
		for (i = 0, l = this.temp.length;  i < l; i++) this.temp[i].volume  = volume;
	}

	function fadeTo(element, volume, length, onEnd) {

		onEnd = onEnd || function() {}
	    
	    element.toVolume = volume;
	    var fromVolume = element.volume;
	    var fadeStart = Date.now();

	    if (element.interval) {
	        clearInterval(element.interval);
	        element.interval = null;
	    }
	    
	    element.interval = setInterval(function() {
	        
	        var progress = (Date.now() - fadeStart) / length;
	        
	        if (progress < 1) {
	        
	            element.volume = smoothstep(fromVolume, volume, progress);
	        }
	        else {
	            
	            element.volume = volume;
	            element.toVolume = undefined;
	            onEnd();
	            
	            clearInterval(element.interval);
	            element.interval = null;
	        }
	        
	    }, 10)
	}

	function fadeOut(element, length, endVolume) {

		endVolume = endVolume || 0;

		fadeTo(element, 0, length, function() {element.pause()});
	}

	function fadeIn(element, length, endVolume) {

		endVolume = endVolume || 1;

		fadeTo(element, endVolume, length);

		//element.play();
	}

	HTMLAudioElement.prototype.playCopy = function(onEnd) {

		onEnd = onEnd || function() {};

		ending = function() { onEnd(); newNode.remove(); };

		var newNode = this.cloneNode();

		newNode.volume = this.volume;

		newNode.addEventListener('ended', ending);

		this.parentNode.appendChild(newNode);

		newNode.play();

		return newNode;
	}

	HTMLAudioElement.prototype.setVolume = function(volume) {

		this.volume = volume;
	}

	global.AudioGroup= AudioGroup;
	global.fadeOut = fadeOut;
	global.fadeIn = fadeIn;

})(window);