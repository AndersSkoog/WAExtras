importScripts("./Ops.js");

var drive = 0.5;
var mix = 0.5;
var K   = (1 + 0.99) * drive / (0.99 - drive);
var out = new Float32Array(1024).fill(0);

function process(inp){
    var i = 0;
    for(i; i < 1024; i++){
        out[i] = blendAt([inp[i],inp[i] * K],mix);
    }
}

onmessage = function(e){
    var d = e.data;
    var a = [drive,mix];
    var b = [d.drive,d.mix];
    if(ArrEq(a,b) === false){
        drive = d.drive;
        mix   = d.mix;
        K     = (1 + 0.99) * drive / (0.99 - drive);
    }
    process(d.inp);
    postMessage(out);
}
