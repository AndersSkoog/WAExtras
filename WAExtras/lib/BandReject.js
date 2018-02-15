importScripts("./Ops.js");

var outp   = new Float32Array(1024);
var freq   = 0.5;
var Q      = 0.1;
var cb0     = 0;
var cb1     = 0;
var cb2     = 0;
var ca1     = 0;
var ca2     = 0;
var x2     = 0;
var x1     = 0;
var y2     = 0;
var y1     = 0;
var y      = 0;

function calc(){
    var f     = linlin(freq,0,1,50,8000);
    var q     = linlin(Q,0,1,1,10);
    var bw = f / q;
    var l  = tan(PI * bw / sr);
    var t  = 2 * cos(PI2 * f / sr);
    var b0 = 1 / (1 + l);
    var b1 = -t * b0;
    cb0 = b0;
    cb1 = b1;
    cb2 = b0;
    ca1 = b1;
    ca2 = (1 - l) * b0;
}

function process(inp){
    var i = 0;
    var x;
    for (i;i < 1024; ++i){
        x   = inp[i]; 
        y   = cb0 * x + cb1 * x1 + cb2 * x2 - ca1 * y1 - ca2 * y2;
        x2  = x1;
        x1  = x;
        y2  = y1;
        y1  = y;
        outp[i] = y;
    }
}

calc();

onmessage = function(e){
    if(ArrEq([freq,Q],[e.data.freq,e.data.Q]) === false){
        freq = e.data.freq;
        Q    = e.data.Q;
        calc();
    }
    process(e.data.inp);
    postMessage(outp);
}
