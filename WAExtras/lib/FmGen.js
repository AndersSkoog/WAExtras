importScripts("./Ops.js");

var note     = 69;
var modharm  = 0.5;
var modlevel = 0.5;
var outp     = new Float32Array(1024).fill(0);
var n        = 0;


function process(){
    var cf   = mtof(note);
    var mf   = cf * modharm;
    var i    = 0;
    for(i; i < 1024; i++){
        n = n + 1;
        var mod = blendAt([0,sin(omega(mf) * n)],modlevel);
        outp[i] = sin(omega(cf - mod) * n);
    }
}

onmessage = function(e){
    var d = e.data;
    if(d.note !== note){note = d.note}
    if(d.modharm !== modharm){modharm = d.modharm}
    if(d.modlevel !== modlevel){modlevel = d.modlevel}
    process();
    postMessage(outp);
}
