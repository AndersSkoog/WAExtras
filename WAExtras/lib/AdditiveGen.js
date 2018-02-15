importScripts("./Ops.js");

var note  = 69;
var part1 = 0.5;
var part2 = 0;
var part3 = 0;
var outp  = new Float32Array(1024).fill(0);
var n     = 0;


function process(){
    var i = 0;
    var f = mtof(note);
    for(i = 0; i < 1024; i++){
        n = n + 1;
        outp[i] = sin(omega(f) * n) + harmonics(n,f,part1,part2,part3);
    }
}

onmessage = function(e){
    var d = e.data;
    if(d.note   !== note){note = d.note}
    if(d.part1  !== part1){part1 = d.part1}
    if(d.part2  !== part2){part2 = d.part2}
    if(d.part3  !== part3){part3 = d.part3}
    process();
    postMessage(outp);
}










