console.log('start');
let audioContext = null;
let player = null;
let songStart = 0;
let input = null;
let currentSongTime = 0;
let nextStepTime = 0;
let nextPositionTime = 0;
let loadedsong = null;
let maxChannels = 0;
let practice = false;
let sentWhen = 0; 
let inPath = ""; 
let choraleDropped = false; 
let practiceAlert = "Sorry but practice mode is not available for chorales for more than four voices at this time.";
let baseURL = "https://kkxix.github.io/bach-demo-public.github.io/"


//check for existing path and tempo 
const urlParams = new URLSearchParams(window.location.search);
console.log(urlParams.toString());
if (urlParams.has('tempo') && urlParams.has('path')) {
    console.log('has params');
    handleExample(urlParams.get('path'), urlParams.get('tempo'));
} 

// TODO : don't think these fxns necessary anymore 
//Toggle dropdown 
function dropDown() {
    document.getElementById("myDropdown").classList.toggle("show");
}

//Toggle instrument selection dropdown
function dropDownIns(i) {
    document.getElementById("selins"+i).classList.toggle("show");
}

//Toggle practice mode 
let practiceBtn = document.getElementById("fourpart");
practiceBtn.addEventListener("click", function() {
    if(practice){
        practice = false; 
        if (urlParams.has('tempo')) {
            setTempo(urlParams.get('tempo')); 
        } else {
            setTempo(72); 
        }
    } else {
        if(loadedsong.tracks.length == 4) {
            if (urlParams.has('tempo')) {
                setTempo(urlParams.get('tempo'));
            } else {
                setTempo(72);
            }
        } else {
            alert(${practiceAlert});
        }
    }      
})

//TODO: optimize filterFunction so there doesn't need to be 2 
// Filter chorales by search 
function filterFunction() {
    const input, filter, ul, li, array;
    input = document.getElementById("myInput");
    filter = input.value.toUpperCase();
    div = document.getElementById("myDropdown");
    array = div.getElementsByTagName('a');
    for (let i = 0; i < array.length; i++) {
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
    const input, filter, ul, li, array;
    input = document.getElementById("myInputIns"+i);
    filter = input.value.toUpperCase();
    div = document.getElementById("selins"+i);
    array = div.getElementsByTagName('a');
    for (let i = 0; i < array.length; i++) {
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
    const stepDuration = 44 / 1000; //where does this number come from 
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
        const o = document.getElementById('position');
        o.value = 100 * currentSongTime / song.duration; //how much of range is filled 

        //time formatting: 
        const secs = Math.round(currentSongTime);
        const mins = Math.floor(secs / 60);
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
    for (let t = 0; t < song.tracks.length; t++) {
        let track = song.tracks[t];
        for (let i = 0; i < track.notes.length; i++) {
            if (track.notes[i].when >= start && track.notes[i].when < end) {
                let when = songStart + track.notes[i].when;
                let duration = track.notes[i].duration;
                if (duration > 3) {
                    duration = 3;
                }
                let instr = track.info.variable;
                let v = track.volume / 7;
                player.queueWaveTable(audioContext, input, window[instr], when, track.notes[i].pitch, duration, v, track.notes[i].slides);
            }
        }
    }
    for (let b = 0; b < song.beats.length; b++) {
        let beat = song.beats[b];
    for (let i = 0; i < beat.notes.length; i++) {
        if (beat.notes[i].when >= start && beat.notes[i].when < end) {
        let when = songStart + beat.notes[i].when;
        let duration = 1.5;
        let instr = beat.info.variable;
        let v = beat.volume / 2;
        player.queueWaveTable(audioContext, input, window[instr], when, beat.n, duration, v);
        }
    }
    }
}

function startLoad(song) {
    console.log(song);
    let AudioContextFunc = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioContextFunc();
    player = new WebAudioFontPlayer();
    reverberator = player.createReverberator(audioContext);
    reverberator.output.connect(audioContext.destination);
    input = reverberator.input;
    for (let i = 0; i < song.tracks.length; i++) {
        let nn = player.loader.findInstrument(song.tracks[i].program);
        let info = player.loader.instrumentInfo(nn);
        song.tracks[i].info = info;
        song.tracks[i].id = nn;
        player.loader.startLoad(audioContext, info.url, info.variable);
    }
    for (let i = 0; i < song.beats.length; i++) {
        let nn = player.loader.findDrum(song.beats[i].n);
        let info = player.loader.drumInfo(nn);
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
    let controls = document.getElementById('cntls');
    let fourpart = document.getElementById('fourpart');
    const range = "range-slider";

    if (fourpart.checked && song.tracks.length != 4) {       //if not exactly four voices, no practice mode available -- future feature
        alert(${practiceAlert})
        fourpart.checked = false;
        setTempo(72);
        // return; 
    }

    // Play, Pause, Title  
    let html = `
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
        let oldTempo =  urlParams.get("tempo");
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

    //If in practice mode, limit to two volume controllers 
    if((fourpart.checked == true)) {
        practice = true; 
    } 
    if (practice) {
        fourpart.checked = true;
        maxChannels = 4;
        if (maxChannels == song.tracks.length) {    
            let v = Math.round(100 * song.tracks[0].volume);
            let v2 = Math.round(100 * song.tracks[2].volume);

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
            alert(${practiceAlert});
            fourpart.checked = false;
            setTempo(72);
        }
    } else {        //if not practice mode 
        let fourPartArray = ['Soprano', 'Alto', 'Tenor', 'Bass'];
        for (let i = 0; i < song.tracks.length; i++) {
            let v = Math.round(100 * song.tracks[i].volume);

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
    let mxlUrl = inPath.substr(0, 9);
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

    //function located in Assets/JavaScript/slider-jquery.js
    rangeSlider(); 

    let pos = document.getElementById('position');
    pos.oninput = function (e) {
    if (loadedsong) {
        player.cancelQueue(audioContext);
        let next = song.duration * pos.value / 100;
        songStart = songStart - (next - currentSongTime);
        currentSongTime = next;

        //change music score note highlights 
        changeCurTime(next); 
    }
    };

    console.log('Tracks');
    for (let i = 0; i < song.tracks.length; i++) {
        setVolumeAction(i, song);
    }
    
    //Add ahref instrument links to dropdown
    for (let i = 0; i < song.tracks.length; i++) {
        populateIns(song.tracks[i].id, i);        
    }

    loadedsong = song;

}

function setVolumeAction(i, song) {
    let vlm = document.getElementById('channel' + i);
    vlm.oninput = function (e) {
    if (maxChannels === 4) {
        if (i === 0) {
        player.cancelQueue(audioContext);
        let v = vlm.value / 100;
        if (v < 0.000001) {
            v = 0.000001;
        }
        song.tracks[0].volume = v;
        song.tracks[1].volume = v;
        } else if (i === 2) {
        player.cancelQueue(audioContext);
        let v = vlm.value / 100;
        if (v < 0.000001) {
            v = 0.000001;
        }
        song.tracks[2].volume = v;
        song.tracks[3].volume = v;
        }
    } else {
        player.cancelQueue(audioContext);
        let v = vlm.value / 100;
        if (v < 0.000001) {
        v = 0.000001;
        }
        song.tracks[i].volume = v;
    }
    };
}

function handleInstrument(i, track) {
    let info = player.loader.instrumentInfo(i);
    player.loader.startLoad(audioContext, info.url, info.variable);
    document.getElementById('instButton'+track).textContent = info.title; 
    player.loader.waitLoad(function () {
        console.log('loaded');
        loadedsong.tracks[track].info = info;
        loadedsong.tracks[track].id = i;
    });
}

function chooserIns(n, track) {
    let html = `
    <div>
        <button id="instButton${track}" class="btn btn-instrument dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
            Instruments
        </button>
        <div id="selins${track}" class="dropdown-menu" aria-labelledby="instButton${track}"></div>
    </div>
    `.trim();

    return html;
}

function populateIns(n, track) {
    let dropMenuIns = document.getElementById("selins"+track);
    let instType = -1;
    let counter = 0;

    //create invisible element to make sure element 0 is at top 
    let invisible = document.createElement("a")
    invisible.style.display = "hidden";
    dropMenuIns.insertBefore(invisible, dropMenuIns.lastChild);

    for (let i = 0; i < player.loader.instrumentKeys().length; i++) {
        let sel = '';
        if (i == n) {
            sel = ' selected';
        }
        if (instType != player.loader.instrumentInfo(i).p) {
            if(player.loader.instrumentInfo(i).title){
                let option = document.createElement("a"),
                    txt = document.createTextNode(counter + ': ' + player.loader.instrumentInfo(i).title);
                option.appendChild(txt);
                option.setAttribute('value', i + sel);
                option.setAttribute('id', `ins${counter}`);
                option.setAttribute("class", "dropdown-item");
                option.setAttribute('onclick', "handleInstrument(" + i + ", " + track + ")");
                dropMenuIns.insertBefore(option, dropMenuIns.lastChild);
                counter++;
            }          
        }
        instType = player.loader.instrumentInfo(i).p;
    }

    let search = document.createElement("input");
    search.setAttribute('type', "text");
    search.setAttribute('placeholder', "Search...");
    search.setAttribute('id', "myInputIns"+track);
    search.setAttribute('onkeyup', 'filterFunctionIns(' + track +')');
    dropMenuIns.insertBefore(search, dropMenuIns.firstChild); 
}

function loadNewChorale(path, tempo) {
    if(loadedsong) {
        inPath = path;
        setTempo(72);
    } else {
        handleExample(path, tempo); 
    }
}

function handleExample(path, tempo) {

    //remove welcome message
    let elem = document.getElementById("welcome-message");
    if(elem) {
        elem.parentNode.removeChild(elem); 
    }

    //call function to check query for tempo and file path 
    inPath = path; 
    console.log(path);
    let xmlHttpRequest = new XMLHttpRequest();
    xmlHttpRequest.open("GET", path, true);
    xmlHttpRequest.responseType = "arraybuffer";
    xmlHttpRequest.onload = function (e) {
        let arrayBuffer = xmlHttpRequest.response;
        midiFile = new MIDIFile(arrayBuffer);
        let song = midiFile.parseSong(tempo);
        startLoad(song);
    };
    xmlHttpRequest.send(null);

    //set practice mode 
    if(urlParams.has('practice')){
        practice = urlParams.get('practice') == "true" ? true : false;
        console.log("practice: " + practice);
    }
    else {
        practice = false; 
    }
}