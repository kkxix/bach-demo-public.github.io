console.log('start');
var audioContext = null;
var player = null;
var songStart = 0;
var input = null;
var currentSongTime = 0;
var nextStepTime = 0;
var nextPositionTime = 0;
var loadedsong = null;
var maxChannels = 0;
var practice = false;
var sentWhen = 0; 
var inPath = ""; 
var choraleDropped = false; 

var practiceAlert = "\
Sorry but practice mode is not available for chorales \
for more than four voices at this time. Please select a non-highlighted, \
fourpart chorale in order to use practice mode.";

var baseURL = "https://kkxix.github.io/bach-demo-public.github.io/"


//check for existing path and tempo 
var urlParams = new URLSearchParams(window.location.search);
console.log(urlParams.toString());
if (urlParams.has('tempo') && urlParams.has('path')) {
    console.log('has params');
    handleExample(urlParams.get('path'), urlParams.get('tempo'));
} 

//Toggle practice mode 
$(`#fourpart`).on('click', function (event) {
    if(a11yClick(event) === true) {
        if (practice) {
            practice = false;
            if(loadedsong) {
                if (urlParams.has('tempo')) {
                    setTempo(urlParams.get('tempo'));
                } else {
                    setTempo(72);
                }
            }            
        } else {
            practice = true; 
            if(loadedsong) {
                if (loadedsong.tracks.length == 4) {
                    if (urlParams.has('tempo')) {
                        setTempo(urlParams.get('tempo'));
                    } else {
                        setTempo(72);
                    }
                } else {
                    practice = false;
                    alert(`${practiceAlert}`);
                    $('#fourpart').button("toggle");
                }
            }            
        } 
    }
})


function loadNewChorale(path, tempo) {
    if (loadedsong) {
        inPath = path;
        setTempo(72);
    } else {
        handleExample(path, tempo);
    }
}

function handleExample(path, tempo) {

    //remove welcome message
    var elem = document.getElementById("welcome-message");
    if (elem) {
        elem.parentNode.removeChild(elem);
    }

    //call function to check query for tempo and file path 
    inPath = path;
    console.log(path);
    var xmlHttpRequest = new XMLHttpRequest();
    xmlHttpRequest.open("GET", path, true);
    xmlHttpRequest.responseType = "arraybuffer";
    xmlHttpRequest.onload = function (e) {
        var arrayBuffer = xmlHttpRequest.response;
        midiFile = new MIDIFile(arrayBuffer);
        var song = midiFile.parseSong(tempo);
        startLoad(song);
    };
    xmlHttpRequest.send(null);

    //set practice mode 
    if (urlParams.has('practice')) {
        practice = urlParams.get('practice') == "true" ? true : false;
        console.log("practice: " + practice);
    }
    // else {
    //     practice = false;
    // }
}

function stop() {
    audioContext.suspend(); 
}

function go() {
    document.getElementById('tmr').innerHTML = 'starting...';
    try {
    startPlay(loadedsong);
    document.getElementById('tmr').innerHTML = 'playing...';
    } catch (expt) {
    document.getElementById('tmr').innerHTML = 'error ' + expt;
    }
}

function setTempo(inTempo) {
    stop(); 
    document.location.href = `${baseURL}?tempo=${inTempo}&path=${inPath}&practice=${practice}`;
}
function reload() {
    document.location.href = inPath; 
}

function startPlay(song) {
    if(audioContext.state == 'suspended') {
    audioContext.resume(); 
    } else {
    currentSongTime = 0;
    songStart = audioContext.currentTime; //global 
    nextStepTime = audioContext.currentTime; //global 
    var stepDuration = 44 / 1000; //where does this number come from 
    tick(song, stepDuration);
    }
}

function tick(song, stepDuration) {
    if (audioContext.currentTime > nextStepTime - stepDuration) {
    sendNotes(song, songStart, currentSongTime, currentSongTime + stepDuration, audioContext, input, player);
    currentSongTime += stepDuration;
    nextStepTime += stepDuration;
    if (currentSongTime > song.duration) { //loop back to beginning 
        currentSongTime -= song.duration;
        sendNotes(song, songStart, 0, currentSongTime, audioContext, input, player);
        songStart = songStart + song.duration;
        console.log('Audio ended');
    }
    }
    if (nextPositionTime < audioContext.currentTime) {
        var o = document.getElementById('position');
        o.value = 100 * currentSongTime / song.duration; //how much of range is filled 

        //time formatting: 
        var secs = Math.round(currentSongTime);
        var mins = Math.floor(secs / 60);
        secs = secs % 60; 
        if(secs < 10 ) {
            timeStamp = mins + ':0' + secs;
        } else {
            timeStamp = mins + ':' + secs;
        }
        document.getElementById('tmr').innerHTML = '' + timeStamp; 
        nextPositionTime = audioContext.currentTime;
    }
    window.requestAnimationFrame(function (t) {
        tick(song, stepDuration);
    });    
}

function sendNotes(song, songStart, start, end, audioContext, input, player) {
    for (var t = 0; t < song.tracks.length; t++) {
        var track = song.tracks[t];
        for (var i = 0; i < track.notes.length; i++) {
            if (track.notes[i].when >= start && track.notes[i].when < end) {
                var when = songStart + track.notes[i].when;
                var duration = track.notes[i].duration;
                if (duration > 3) {
                    duration = 3;
                }
                var instr = track.info.variable;
                var v = track.volume / 7;
                player.queueWaveTable(audioContext, input, window[instr], when, track.notes[i].pitch, duration, v, track.notes[i].slides);
            }
        }
    }
    for (var b = 0; b < song.beats.length; b++) {
        var beat = song.beats[b];
    for (var i = 0; i < beat.notes.length; i++) {
        if (beat.notes[i].when >= start && beat.notes[i].when < end) {
        var when = songStart + beat.notes[i].when;
        var duration = 1.5;
        var instr = beat.info.variable;
        var v = beat.volume / 2;
        player.queueWaveTable(audioContext, input, window[instr], when, beat.n, duration, v);
        }
    }
    }
}

function startLoad(song) {
    console.log(song);
    var AudioContextFunc = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioContextFunc();
    player = new WebAudioFontPlayer();
    reverberator = player.createReverberator(audioContext);
    reverberator.output.connect(audioContext.destination);
    input = reverberator.input;
    for (var i = 0; i < song.tracks.length; i++) {
        var nn = player.loader.findInstrument(song.tracks[i].program);
        var info = player.loader.instrumentInfo(nn);
        song.tracks[i].info = info;
        song.tracks[i].id = nn;
        player.loader.startLoad(audioContext, info.url, info.variable);
    }
    for (var i = 0; i < song.beats.length; i++) {
        var nn = player.loader.findDrum(song.beats[i].n);
        var info = player.loader.drumInfo(nn);
        song.beats[i].info = info;
        song.beats[i].id = nn;
        player.loader.startLoad(audioContext, info.url, info.variable);
    }
    player.loader.waitLoad(function () {
        console.log('buildControls');
        buildControls(song);
    });
}

function buildControls(song) {
    var controls = document.getElementById('cntls');
    var fourpart = document.getElementById('fourpart');
    var range = "range-slider";

    if (practice && song.tracks.length != 4) {       //if not exactly four voices, no practice mode available -- future feature
        alert(`${practiceAlert}`)
        // fourpart.checked = false;
        $('#fourpart').button("toggle");
        setTempo(72);
        // return; 
    }

    // Play, Pause, Title  
    var html = `
        <h3><strong>${inPath.substring(22, inPath.length - 4)}</strong></h3>
        <div id="soundcontrols">
            <button onclick="go(); markeer();" class="btn" id="play">Play</button> 
            <button onclick="stop();" class="btn" id="pause">Pause</button>
        </div>`;

    //Start div for song duration and tempo ranges 
    html = html + `
        <div id="posAndTempo">
            <h3>Chorale Duration</h3>
            <div>
                <input id="position" class="range-slider_range" type="range" min="0" max="100" value="0" step="1" />
                <span class="range-slider_value" id="tmr">
                </span>
            </div>`.trim();    
    if(urlParams.has('tempo')) {
        var oldTempo =  urlParams.get("tempo");
        html = html + `
            <div class="${range}">
                <h3>Tempo</h3>
                <input class="${range}_range" id="tempo" type="range" min="50" max="200" onchange="setTempo(this.value)" value="${oldTempo}" />
                <span class="${range}_value">${oldTempo}</span>
            </div>`.trim();
    } else {
        html = html + `
            <div class="${range}r">
                <h3>Tempo</h3>
                <input class="${range}_range" id="tempo" type="range" min="50" max="200" onchange="setTempo(this.value)" value="72" />
                <span class="${range}_value">72</span>
            </div>`.trim();
    }      
    html = html += `
        </div>`.trim(); //end #posAndTempo div
    
    //Start div for each channel (SATB)
    html = html + `<div id="channels"><h3>Channels</h3>`;

    if (practice) {
        $('#fourpart').button("toggle")
        maxChannels = 4;
        if (maxChannels == song.tracks.length) {    
            var v = Math.round(100 * song.tracks[0].volume);
            var v2 = Math.round(100 * song.tracks[2].volume);

            //Add HTML for track instrument and volume controls 
            html = html + `
            <div id="inst-name">Soprano and Alto</div>
            <div class="${range}">
                <div id="track" class="container"> 
                    <div class="container">
                        ${chooserIns(song.tracks[0].id, 0)}
                        ${chooserIns(song.tracks[1].id, 1)}
                    </div>
                    <div id=channel1>
                        <input class="${range}_range" id="channel0" type="range" min="0" max="100" value="${v}" step="1" />
                        <span class="${range}_value">0</span>
                    </div>
                </div>
            </div>
            <div id="inst-name">Tenor and Bass</div>
            <div class="${range}">
                <div id="track" class="container">
                    <div class="container">
                        ${chooserIns(song.tracks[2].id, 2)}
                        ${chooserIns(song.tracks[3].id, 3)}
                    </div>
                    <div id=channel3>
                        <input class="${range}_range" id="channel2" type="range" min="0" max="100" value="${v2}" step="1" />
                        <span class="${range}_value">0</span>
                    </div>
                </div>
            </div>`.trim();     
        } else {
            alert(`${practiceAlert}`);
            practice = false; 
            setTempo(72);
        }
    } else {        //if not practice mode 
        var fourPartArray = ['Soprano', 'Alto', 'Tenor', 'Bass'];
        for (var i = 0; i < song.tracks.length; i++) {
            var v = Math.round(100 * song.tracks[i].volume);

            //Add HTML for track instrument and volume controls 
            html = html + `
            <div id="inst-name">${fourPartArray[i]}</div>
            <div class="${range}">
                <div id="track" class="container">
                    ${chooserIns(song.tracks[i].id, i)}
                    <div>
                        <input class="${range}_range"id="channel${i}" type="range" min="0" max="100" value="${v}" step="1" />
                        <span class="${range}_value">0</span>
                    </div>
                </div>
            </div>`.trim();
        }
    }

    html = html + '</div>'; //end #channels div

    controls.innerHTML = html;
    console.log('Loaded');

    //create url for corresponding .musicxml chorale 
    var mxlUrl = inPath.substr(0, 9);
    mxlUrl += "chorales-musicxml";
    mxlUrl += inPath.substr(21);
    mxlUrl = mxlUrl.trim();
    mxlUrl = mxlUrl.substring(0, mxlUrl.length - 3)
    mxlUrl += "musicxml";
    console.log(mxlUrl); 
    // a.setAttribute("title", mxlUrl);
    if(!practice) {
        readLocalFile(mxlUrl, audioContext) 
    }

    //function located in Assets/JavaScript/slider-jquery.js
    rangeSlider(); 

    var pos = document.getElementById('position');
    pos.oninput = function (e) {
    if (loadedsong) {
        player.cancelQueue(audioContext);
        var next = song.duration * pos.value / 100;
        songStart = songStart - (next - currentSongTime);
        currentSongTime = next;

        //change music score note highlights 
        changeCurTime(next); 
    }
    };

    console.log('Tracks');
    for (var i = 0; i < song.tracks.length; i++) {
        setVolumeAction(i, song);
    }
    
    //Add ahref instrument links to dropdown
    for (var i = 0; i < song.tracks.length; i++) {
        populateIns(song.tracks[i].id, i);        
    }

    loadedsong = song;

}

function setVolumeAction(i, song) {
    var vlm = document.getElementById('channel' + i);
    vlm.oninput = function (e) {
    if (maxChannels === 4) {
        if (i === 0) {
        player.cancelQueue(audioContext);
        var v = vlm.value / 100;
        if (v < 0.000001) {
            v = 0.000001;
        }
        song.tracks[0].volume = v;
        song.tracks[1].volume = v;
        } else if (i === 2) {
        player.cancelQueue(audioContext);
        var v = vlm.value / 100;
        if (v < 0.000001) {
            v = 0.000001;
        }
        song.tracks[2].volume = v;
        song.tracks[3].volume = v;
        }
    } else {
        player.cancelQueue(audioContext);
        var v = vlm.value / 100;
        if (v < 0.000001) {
        v = 0.000001;
        }
        song.tracks[i].volume = v;
    }
    };
}

function chooserIns(n, track) {
    var html = `
    <div class="btn-group">
        <div class="dropdown">
            <button class="btn btn-secondary dropdown-toggle" type="button" id="instButton${track}" data-toggle="dropdown"
                aria-haspopup="true" aria-expanded="false">
                Chorales
            </button>
            <div class="dropdown-menu" aria-labelledby="instButton${track}" id="selins${track}">
                <form class="px-4 py-2">
                    <input type="search" class="form-control" id="myInputIns${track}" placeholder="Search..." autofocus="autofocus" onkeyup="filterFunctionIns(${track})">
                </form>
                <div id="menuItems${track}"></div>
                <div id="empty${track}" class="dropdown-header">No instruments found</div>
            </div>
        </div>
    </div>`.trim();

    return html;
}

function populateIns(n, track) {

    let contents = []
    let values = player.loader.instrumentKeys(); 
    let ins = null;
    var instType = -1;
    var counter = 0;

    for (let i = 0; i < values.length; i++) {
        // if (i == n ) {
        //     sel = ' selected';
        // }
        ins = player.loader.instrumentInfo(i);
        if(instType != ins.p){
            if(ins.title) {
                contents.push(`<input type="button" id="${i}" class="dropdown-item" type="button" value="${counter}: ${ins.title}"
                onclick = "return handleInstrument(${i}, ${track});" onkeypress = "return keyhandler(event, ${i}, ${track});"/>`) 
                counter++;
            }
        }
        instType = ins.p
    }
    $(`#menuItems${track}`).append(contents.join(""))

    //Hide the row that shows no items were found
    $(`empty${track}`).hide()
}

function keyhandler(event, i, track) {
    if (a11yClick(event) === true) {
        handleInstrument(i, track); 
    }
}

function handleInstrument(i, track) {
    var info = player.loader.instrumentInfo(i);
    player.loader.startLoad(audioContext, info.url, info.variable);
    $(`#instButton${track}`).text(info.title);
    $(`#instButton${track}`).dropdown('toggle');
    player.loader.waitLoad(function () {
        console.log('loaded');
        loadedsong.tracks[track].info = info;
        loadedsong.tracks[track].id = i;
    });
}

//Filter instruments by search 
function filterFunctionIns(track) {
    let hidden = 0;
    let input = document.getElementById("myInputIns" + track);
    let word = input.value.toLowerCase();
    div = document.getElementById("menuItems" + track);
    items = div.getElementsByClassName('dropdown-item');
    for (var i = 0; i < items.length; i++) {
        if (items[i].value.toLowerCase().indexOf(word) > -1) {
            $(items[i]).show()
        }
        else {
            $(items[i]).hide()
            hidden++
        }
    }
    if (hidden === length) {
        $(`#empty${track}`).show()
    }
    else {
        $(`#empty${track}`).hide()
    }
}