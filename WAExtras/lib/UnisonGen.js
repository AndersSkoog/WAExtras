importScripts("./Ops.js");

var note     = 69;
var spread   = 0.5;
var outp     = new Float32Array(1024).fill(0);
var n        = 0;

function process(){
    var i   = 0;
    var f   = mtof(note);
    var s   = linlin(spread,0,1,0,10);
    for(i = 0; i < 1024; i++){
        n = n + 1;
        outp[i] = saw(f - s,n) + saw(f,n) + saw(f + s,n);
    }
}

onmessage = function(e){
    var d = e.data;
    if(note !== d.note){note = d.note}
    if(spread !== d.spread){spread = d.spread}
    process();
    postMessage(outp);
}