var musicVolume = 1;
var soundFXVolume = .75;

function initAudio() {

    music = {

    	main_0: sounds.Main_Theme.cloneNode(),
    	main_1: sounds.Main_Theme.cloneNode(),
    	menu_0: sounds.Menu_Theme.cloneNode(),
    	menu_1: sounds.Menu_Theme.cloneNode(),
        sweepIn: sounds.SweepIn,
        sweepOut: sounds.SweepOut,

    	started: false,

    	currentLoop: 0,
    	currentTime: 0,
    	length: 288000,

        lastUpdate: Date.now()
    }

    music.switchTo = function(theme) {

    	var currentlyPlaying = theme == 'main' ? [this.menu_0, this.menu_1] : [this.main_0, this.main_1];
    	var willPlay = [ this[theme +'_0'], this[theme +'_1'] ];

    	currentlyPlaying[0].fadeTo(0, 750);
        currentlyPlaying[1].fadeTo(0, 750);
    	willPlay[0].fadeTo(musicVolume, 750);
        willPlay[1].fadeTo(musicVolume, 750);


    }

    music.start = function() {

    	console.log('music started')

    	this.started = true;

    	this.main_0.volume = 0;
    	this.menu_0.volume = 0;

    	this.main_1.volume = musicVolume;
    	this.menu_1.volume = 0;

        this.sweepIn.volume = musicVolume;
        this.sweepOut.volume = musicVolume;

    	this.main_0.fadeTo(musicVolume, 1500);

    	this.main_0.play();
    	this.menu_0.play();

        this.lastUpdate = Date.now();
        this.update();
    }

    music.update = function() {

        var now = Date.now();
        var dt = now - this.lastUpdate;

    	this.currentTime+= dt;

    	if (this.currentTime > this.length - dt/2) {

    		this.currentLoop = ~this.currentLoop & 1;

    		this.currentTime= 0;

    		this['main_'+ this.currentLoop].play();
    		this['menu_'+ this.currentLoop].play();
     	}

        this.lastUpdate = now;

        setTimeout(function() {music.update()}, 0);
    }

    music.setVolume = function(volume) {

        for (var track in music) {

            if (music[track].setVolume && music[track].volume) music[track].setVolume(volume);
        }

        musicVolume = volume;
    }

    preload.appendChild(music.main_0);
    preload.appendChild(music.main_1);
    preload.appendChild(music.menu_0);
    preload.appendChild(music.menu_1);

    //sound effects
    soundFX = {
        click:    sounds.Click,
        bell:     sounds.Bell,
        pageTurn: new AudioGroup(sounds.PageTurn_0, sounds.PageTurn_1, sounds.PageTurn_2, sounds.PageTurn_3),
        bonk:     new AudioGroup(sounds.Bonk_0, sounds.Bonk_1, sounds.Bonk_2, sounds.Bonk_3),
        slide:    new AudioGroup(sounds.Slide_0, sounds.Slide_1, sounds.Slide_2)
    }

    soundFX.setVolume = function(volume) {

        for (var sound in this) {
            if (this[sound].setVolume) this[sound].setVolume(volume);
        }

        soundFXVolume = volume;
    }

    soundsComplete = true;

}