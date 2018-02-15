importScripts("./Ops.js");

var note     = 69;
var width    = 0.5;
var modrate  = 0.5;
var modlevel = 0.5;
var outp     = new Float32Array(1024).fill(0);
var n        = 0;

function process(){
    var f   = mtof(note);
    var c   = cyc(f);
    var w   = linlin(width,0,1,0,c);
    var mr  = linlin(modrate,0,1,0.1,10);
    var ma  = modlevel;
    var _n;
    var pw;
    var i    = 0;
    for(i; i < 1024; i++){
        n  = n + 1;
        _n = n % c;
        pw = blendAt([w,w * linlin(sin(omega(mr) * n),-1,1,0.1,1)],ma);
        outp[i] = _n < pw ? +1 : -1;
    }
}

onmessage = function(e){
    var d = e.data;
    if(d.note   !== note){note = d.note}
    if(d.width  !== width){width = d.width}
    if(d.modrate !== modrate){modrate = d.modrate}
    if(d.modlevel !== modlevel){modlevel = d.modlevel}
    process();
    postMessage(outp);
}















