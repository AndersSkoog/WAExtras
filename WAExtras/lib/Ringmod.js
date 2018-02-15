importScripts("Ops.js");

var tone = 0.5;
var fine = 0.5;
var mix  = 0.5;
var n    = 0;

var note = linlin(tone,0,1,36,119) | 0;
var mf   = transp(mtof(note),fine);
var out  = new Float32Array(1024);


function setparams(_tone,_fine,_mix){
    tone = _tone;
    fine = _fine;
    mix  = _mix;
    note = linlin(tone,0,1,36,119) | 0;
    mf   = transp(mtof(note),fine);
}

function process(inp){
    var i  = 0;
    var dry;
    var wet;
    for(i; i < 1024; i++){
        n      = n + 1;
        dry    = inp[i];
        wet    = sin(omega(mf) * n) * inp[i];
        out[i] = blendAt([dry,wet],mix);
    }
}

onmessage = function(e){
    var d = e.data;
    var a = [tone,fine,mix];
    var b = [d.tone,d.fine,d.mix];
    if(ArrEq(a,b) === false){setparams(...b);}
    process(d.inp);
    postMessage(out);
}
