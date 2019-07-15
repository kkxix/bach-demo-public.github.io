
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

//check for existing path and tempo 
const urlParams = new URLSearchParams(window.location.search);
console.log(urlParams.toString());
if (urlParams.has('tempo') && urlParams.has('path')) {
    console.log('has params');
    handleExample(urlParams.get('path'), urlParams.get('tempo'));
    // call function 
    //future -- encode path 
} 

//Toggle dropdown 
function dropDown() {
    document.getElementById("myDropdown").classList.toggle("show");
}
function dropDownIns(i) {
    document.getElementById("selins"+i).classList.toggle("show");
    }
//Toggle practice mode 
var practiceBtn = document.getElementById("fourpart");
practiceBtn.addEventListener("click", function() {
    if(practice){
    practice = false; 
    var tempo = document.getElementById('tempo');
    setTempo(tempo.value); 
    } else {
    practice = true;
    var tempo = document.getElementById('tempo');
    setTempo(tempo.value); 
    }      
})
// function practiceMode() {
//   if (practice === false) {
//     practice = true;
//   } else {
//     practice = false;
//   }
// }

//TODO: optimize filterFunction so there doesn't need to be 2 
// Filter chorales by search 
function filterFunction() {
    var input, filter, ul, li, array;
    input = document.getElementById("myInput");
    filter = input.value.toUpperCase();
    div = document.getElementById("myDropdown");
    array = div.getElementsByTagName('a');
    for (var i = 0; i < array.length; i++) {
    txtValue = array[i].textContext || array[i].innerText;
    console.log(txtValue);
    if (txtValue.toUpperCase().indexOf(filter) > -1) {
        array[i].style.display = "";
    } else {
        array[i].style.display = "none";
    }
    }
}
//Filter instruments by search 
function filterFunctionIns(i) {
    var input, filter, ul, li, array;
    input = document.getElementById("myInputIns");
    filter = input.value.toUpperCase();
    div = document.getElementById("selins"+i);
    array = div.getElementsByTagName('a');
    for (var i = 0; i < array.length; i++) {
        txtValue = array[i].textContext || array[i].innerText;
        console.log(txtValue);  
        if (txtValue.toUpperCase().indexOf(filter) > -1) {
        array[i].style.display = "";
        } else {
        array[i].style.display = "none";
        }
    }
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
    document.location.href = "/index.html" + "?tempo=" + inTempo + "&path=" + inPath + "&practice=" + practice;
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
        var today = new Date();
        var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
        // console.log(time);
        var o = document.getElementById('position');
        o.value = 100 * currentSongTime / song.duration; //how much of range is filled 
        // document.getElementById('tmr').innerHTML = '' + Math.round(100 * currentSongTime / song.duration) + '%';
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
    // console.log(track.notes.length); 
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
    // console.log('currentSongTime: ' + currentSongTime);
    // console.log('audioContext.currentTime: ' + audioContext.currentSongTime);
    // console.log('song.duration: ' + song.duration); 
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
    // audioContext.resume();
    var o = document.getElementById('cntls');
    var h = document.getElementById('header');
    var fourpart = document.getElementById('fourpart');
    // var htmlWrng = '<h2 id="wrng">Refresh browser page to load another song.</h2>';
    // h.innerHTML += htmlWrng;
    var html = '<div id="soundcontrols"><button onclick="go(); markeer();" class="btn" id="play">Play</button> <button onclick="stop();" class="btn" id="pause">Pause</button></div>';
    html = html + '<div id="posAndTempo"><h3>Song Duration</h3>'; 
    html = html + '<div><input id="position" class="range-slider_range" type="range" min="0" max="100" value="0" step="1" /><span class="range-slider_value" id="tmr"></span></div>';
    
    if(urlParams.has('tempo')) {
    var oldTempo =  urlParams.get("tempo");
    // html = html + '<p>Tempo: <span id="tempo-display">' + oldTempo + '</span> bpm<p>';
    html = html + '<div class="range-slider"><h3>Tempo</h3>';
    html = html + '<input class="range-slider_range" id="tempo" type="range" min="50" max="200" onchange="setTempo(this.value)" value="' + oldTempo + '" />';
    html = html + '<span class="range-slider_value">'+oldTempo+'</span></div>';
    } else {
    // html = html + '<p>Tempo: <span id="tempo-display">120</span> bpm<p>';
    html = html + '<div class="range-slider"><h3>Tempo</h3>';
    html = html + '<input class="range-slider_range" id="tempo" type="range" min="50" max="200" onchange="setTempo(this.value)" value="120" />';
    html = html + '<span class="range-slider_value">120</span></div>';
    }      
    html = html += "</div>"
    
    html = html + '<div id="channels"><h3>Channels</h3>';

    //If in practice mode, limit to two volume controllers 
    // console.log("outside practice if statement" + practice);
    if((document.getElementById('fourpart').checked == true)) {
        practice = true; 
    } 
    if (practice) {
        document.getElementById('fourpart').checked = true;
        maxChannels = 4;
        practice = true; 
    }
    if (maxChannels === 4) {
    var v = Math.round(100 * song.tracks[0].volume);
    html = html + '<div id="inst-name">Soprano and Alto</div>';
    html = html + '<div class="range-slider">';
    html = html + '<div id="track" class="container">' + chooserIns(song.tracks[0].id, 0) + chooserIns(song.tracks[1].id, 1) + '<div id=channel' + 1 + '>';
    html = html + '<div><input class="range-slider_range" id="channel' + 0 + '" type="range" min="0" max="100" value="' + v + '" step="1" />';
    html = html + '<span class="range-slider_value">0</span></div></div></div>';

    // populateIns(song.tracks[0].id, 0);        
    // populateIns(song.tracks[1].id, 1);
    var v2 = Math.round(100 * song.tracks[2].volume);
    html = html + '<div id="inst-name">Tenor and Bass</div>';
    html = html + '<div class="range-slider">';
    html = html + '<div id="track" class="container">' + chooserIns(song.tracks[2].id, 2) + chooserIns(song.tracks[3].id, 3) + '<div id=channel' + 3 + '>';
    html = html + '<div><input class="range-slider_range" id="channel' + 2 + '" type="range" min="0" max="100" value="' + v2 + '" step="1" />';
    html = html + '<span class="range-slider_value">0</span></div></div></div>';
    // populateIns(song.tracks[2].id, 2);
    // populateIns(song.tracks[3].id, 3);
    } else {
    var fourPartArray = ['Soprano', 'Alto', 'Tenor', 'Bass'];
    for (var i = 0; i < song.tracks.length; i++) {
        var v = Math.round(100 * song.tracks[i].volume);
        html = html + '<div id="inst-name">' + fourPartArray[i] + '</div>';
        html = html + '<div class="range-slider">';
        html = html + '<div id="track" class="container">' + chooserIns(song.tracks[i].id, i); 
        html = html + '<div><input class="range-slider_range"id="channel' + i + '" type="range" min="0" max="100" value="' + v + '" step="1" />';
        html = html + '<span class="range-slider_value">0</span></div></div></div>';
    // populateIns(song.tracks[i].id, i);        
    //how to put instrument drop down and volume bar in same line? 
    //also Maybe add a label for each channel
    //also is there  a way to change button label to the current instrument selected? 
    }
    }
    html = html + '</div>';

    // html = html + '<h3>Drums</h3>';
    // for (var i = 0; i < song.beats.length; i++) {
    //   var v = 100 * song.beats[i].volume;
    //   html = html + '<p>' + chooserDrum(song.beats[i].id, i) + '<input id="drum' + i + '" type="range" min="0" max="100" value="' + v + '" step="1" /></p>';
    // }
    o.innerHTML = html;
    console.log('Loaded');

    var mxlUrl = inPath.substr(0, 9);
    mxlUrl += "chorales-musicxml";
    mxlUrl += inPath.substr(21);
    mxlUrl = mxlUrl.trim();
    mxlUrl = mxlUrl.substring(0, mxlUrl.length - 3)
    mxlUrl += "musicxml";
    a.setAttribute("title", mxlUrl);
    console.log(mxlUrl); 
    if(!practice) {
        readLocalFile(mxlUrl, audioContext) 
    }

    //make score svg invisible if in practicce mode
    // var musics = document.getElementsByClassName('music');
    // for (var i = 0; i < musics.length; i++) {
    //     musics[i].style.visibility = 'hidden';
    // }


    rangeSlider(); 

    var pos = document.getElementById('position');
    pos.oninput = function (e) {
    if (loadedsong) {
        player.cancelQueue(audioContext);
        var next = song.duration * pos.value / 100;
        songStart = songStart - (next - currentSongTime);
        currentSongTime = next;
        changeCurTime(next); 
    }
    };

    console.log('Tracks');
    for (var i = 0; i < song.tracks.length; i++) {
    setVolumeAction(i, song);
    }
    console.log('Drums');
    for (var i = 0; i < song.beats.length; i++) {
    setDrVolAction(i, song);
    }

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
    var sl = document.getElementById('selins' + i);
    // sl.onchange = function (e) {
    //   var nn = sl.value;
    //   var info = player.loader.instrumentInfo(nn);
    //   player.loader.startLoad(audioContext, info.url, info.variable);
    //   player.loader.waitLoad(function () {
    //     console.log('loaded');
    //     song.tracks[i].info = info;
    //     song.tracks[i].id = nn;
    //   });
    // };
}
function handleInstrument(i, track) {
    // var sl = document.getElementById('selins' + i);
    // var nn = sl.value;
    var info = player.loader.instrumentInfo(i);
    player.loader.startLoad(audioContext, info.url, info.variable);
    document.getElementById('instButton'+track).textContent = info.title; 
    player.loader.waitLoad(function () {
    console.log('loaded');
    loadedsong.tracks[track].info = info;
    loadedsong.tracks[track].id = i;
    });
}
function setDrVolAction(i, song) {
    var vlm = document.getElementById('drum' + i);
    vlm.oninput = function (e) {
    player.cancelQueue(audioContext);
    var v = vlm.value / 100;
    if (v < 0.000001) {
        v = 0.000001;
    }
    song.beats[i].volume = v;
    };
    var sl = document.getElementById('seldrm' + i);
    sl.onchange = function (e) {
    var nn = sl.value;
    var info = player.loader.drumInfo(nn);
    player.loader.startLoad(audioContext, info.url, info.variable);
    player.loader.waitLoad(function () {
        console.log('loaded');
        song.beats[i].info = info;
        song.beats[i].id = nn;
    });
    };
}
function chooserIns(n, track) {
    var html = '<button id="instButton'+track+'" onclick="dropDownIns('+track+')" class = "btn-instrument">Instruments ▼</button>'; 
    html = html + '<div id="selins' + track + '" class="dropdown-content">';
    // html = html + '<input type="text" placeholder="Search..." id="myInputIns" onkeyup="filterFunctionIns('+track+')">';    
    html = html + '</div>';
    
    // html = html + '</select>';
    return html;
}

function populateIns(n, track) {
    var dropMenuIns = document.getElementById("selins"+track);
    var instType = -1;
    var counter = 0;
    for (var i = 0; i < player.loader.instrumentKeys().length; i++) {
    var sel = '';
    if (i == n) {
        sel = ' selected';
    }
    if (instType != player.loader.instrumentInfo(i).p) {
        // html = html + '<option value="' + i + '"' + sel + '>' + counter + ': ' + player.loader.instrumentInfo(i).title + '</option>';
        if(player.loader.instrumentInfo(i).title){
        var option = document.createElement("a"),
            txt = document.createTextNode(counter + ': ' + player.loader.instrumentInfo(i).title);
        option.setAttribute("href", "#");
        option.appendChild(txt);
        option.setAttribute('value', i + sel);
        option.setAttribute('onclick', "handleInstrument(" + i + ", " + track + ")");
        dropMenuIns.insertBefore(option, dropMenuIns.lastChild);
        // '<option value="' + i + '"' + sel + '>' + counter + ': ' + player.loader.instrumentInfo(i).title + '</option>';
        counter++;
        }          
    }
    instType = player.loader.instrumentInfo(i).p;
    }
    // var search = '<input type="text" placeholder="Search..." id="myInputIns" onkeyup="filterFunctionIns(' + track +')">';
    var search = document.createElement("input");
    search.setAttribute('type', "text");
    search.setAttribute('placeholder', "Search...");
    search.setAttribute('id', "myInputIns");
    search.setAttribute('onkeyup', 'filterFunctionIns(' + track +')');
    dropMenuIns.insertBefore(search, dropMenuIns.firstChild); 
}
function chooserDrum(n, beat) {
    var html = '<select id="seldrm' + beat + '">';
    for (var i = 0; i < player.loader.drumKeys().length; i++) {
    var sel = '';
    if (i == n) {
        sel = ' selected';
    }
    html = html + '<option value="' + i + '"' + sel + '>' + i + ': ' + player.loader.drumInfo(i).title + '</option>';
    }
    html = html + '</select>';
    return html;
}
function handleFileSelect(event) {
    console.log(event);
    var file = event.target.files[0];
    console.log(file);
    var fileReader = new FileReader();
    fileReader.onload = function (progressEvent) {
    console.log(progressEvent);
    var arrayBuffer = progressEvent.target.result;
    console.log(arrayBuffer);
    midiFile = new MIDIFile(arrayBuffer);
    var song = midiFile.parseSong(80);
    startLoad(song);
    };
    fileReader.readAsArrayBuffer(file);
}
function loadNewChorale(path, tempo) {
    if(loadedsong) {
    inPath = path;
    setTempo(120);
    } else {
    handleExample(path, tempo); 
    }
}
function handleExample(path, tempo) {
    //remove welcome message
    var elem = document.getElementById("welcome-message");
    elem.parentNode.removeChild(elem); 
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
    
    //call xmlplay 
    // var mxlUrl = path.substr(0, 9);
    // mxlUrl += "chorales-musicxml";
    // mxlUrl += path.substr(21);
    // mxlUrl = mxlUrl.trim();
    // mxlUrl = mxlUrl.substring(0, mxlUrl.length - 3)
    // mxlUrl += "musicxml";
    // a.setAttribute("title", mxlUrl);
    // console.log(mxlUrl); 
    // readLocalFile(mxlUrl); 

    //set practice mode 
    if(urlParams.has('practice')){
    practice = urlParams.get('practice') == "true" ? true : false;
    console.log("practice: " + practice);
    }
    else {
    practice = false; 
    }
}