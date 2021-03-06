/**
* NOTE:
* Some of the features of the  Web Audio API currently only work on Chrome, hence the 'webkit' prefix!
*/

(function() {
    // Create audio (context) container
    var audioCtx = new (AudioContext || webkitAudioContext)();

    // Table of notes with correspending keyboard codes. Frequencies are in hertz.
    // The notes start from middle C
    var notesByKeyCode = {
        90: { noteName: 'c4', frequency: 261.6, keyName: 'z' },
        83: { noteName: 'C#', frequency: 277.18, keyName: 's' },
        88: { noteName: 'd4', frequency: 293.7, keyName: 'x' },
        68: { noteName: 'D#', frequency: 311.13, keyName: 'd' },
        67: { noteName: 'e4', frequency: 329.6, keyName: 'c' },
        86: { noteName: 'f4', frequency: 349.2, keyName: 'v' },
        71: { noteName: 'F#', frequency: 369.99, keyName: 'g' },
        66: { noteName: 'g4', frequency: 392, keyName: 'b' },
        72: { noteName: 'G#', frequency: 415.3, keyName: 'h' },
        78: { noteName: 'a4', frequency: 440, keyName: 'n' },
        74: { noteName: 'A#', frequency: 466.16, keyName: 'j' },
        77: { noteName: 'b4', frequency: 493.9, keyName: 'm' },
        188: { noteName: 'c5', frequency: 523.3, keyName: ',' },
        76: { noteName: 'C#', frequency: 554.37, keyName: 'l' },
        190: { noteName: 'd5', frequency: 587.3, keyName: '.' },
        186: { noteName: 'D#', frequency: 622.25, keyName: ';' },
        191: { noteName: 'e5', frequency: 659.3, keyName: '/' }
    };

    function Key(keyCode, noteName, keyName, frequency) {
        var keyHTML = document.createElement('div');
        var keySound = new Sound(frequency, 'triangle');
        
        /* Cheap way to map key on touch screens */
        keyHTML.setAttribute('data-key', keyCode);

        /* Style the key */
        keyHTML.className = 'key';
        keyHTML.innerHTML = noteName + '<br><span>' + keyName + '</span>';

        return {
            html: keyHTML,
            sound: keySound
        };
    }

    function Sound(frequency, type) {
        this.osc = audioCtx.createOscillator(); // Create oscillator node
        this.pressed = false; // flag to indicate if sound is playing

        /* Set default configuration for sound */
        if(typeof frequency !== 'undefined') {
            /* Set frequency. If it's not set, the default is used (440Hz) */
            this.osc.frequency.value = frequency;
        }

        /* Set waveform type. Default is actually 'sine' but triangle sounds better :) */
        this.osc.type = type || 'triangle';

        /* Start playing the sound. You won't hear it yet as the oscillator node needs to be
        piped to output (AKA your speakers). */
        this.osc.start(0);
    };

    Sound.prototype.play = function() {
        if(!this.pressed) {
            this.pressed = true;
            this.osc.connect(audioCtx.destination);
        }
    };

    Sound.prototype.stop = function() {
        this.pressed = false;
        this.osc.disconnect();
    };

    function createKeyboard(notes, containerId) {
        var sortedKeys = []; // Placeholder for keys to be sorted
        var waveFormSelector = document.getElementById('soundType');

        for(var keyCode in notes) {
            var note = notes[keyCode];

            /* Generate playable key */
            note.key = new Key(keyCode, note.noteName, note.keyName, note.frequency);

            /* Add new key to array to be sorted */
            sortedKeys.push(notes[keyCode]);
        }

        /* Sort keys by frequency so that they'll be added to the DOM in the correct order */
        sortedKeys = sortedKeys.sort(function(note1, note2) {
            if (note1.frequency < note2.frequency) return -1;
            if (note1.frequency > note2.frequency) return 1;

            return 0;
        });

        // Add those sorted keys to DOM
        for(var i = 0; i < sortedKeys.length; i++) {
            document.getElementById(containerId).appendChild(sortedKeys[i].key.html);
        }

        var playNote = function(event) {
            event.preventDefault();
          
            var keyCode = event.keyCode || event.target.getAttribute('data-key');

            if(typeof notesByKeyCode[keyCode] !== 'undefined') {
                // Pipe sound to output (AKA speakers)
                notesByKeyCode[keyCode].key.sound.play();

                // Highlight key playing
                notesByKeyCode[keyCode].key.html.className = 'key playing';
            }
        };

        var endNote = function(event) {
            var keyCode = event.keyCode || event.target.getAttribute('data-key');

            if(typeof notesByKeyCode[keyCode] !== 'undefined') {
                // Kill connection to output
                notesByKeyCode[keyCode].key.sound.stop();

                // Remove key highlight
                notesByKeyCode[keyCode].key.html.className = 'key';
            }
        };

        var setWaveform = function(event) {
            for(var keyCode in notes) {
                notes[keyCode].key.sound.osc.type = this.value;
            }

            // Unfocus selector so value is not accidentally updated again while playing keys
            this.blur();
        };

        // Check for changes in the waveform selector and update all oscillators with the selected type
        waveFormSelector.addEventListener('change', setWaveform);

        window.addEventListener('keydown', playNote);
        window.addEventListener('keyup', endNote);
        window.addEventListener('touchstart', playNote);
        window.addEventListener('touchend', endNote);
    }

    window.addEventListener('load', function() {
        createKeyboard(notesByKeyCode, 'keyboard');
    });
})();