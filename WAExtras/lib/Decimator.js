importScripts("./Ops.js");


var _range = 0.5;
var _skip  = 0.5;

var range = 1 << (linlin(_range,0,1,16,4) | 0) / 2;
var skip  = linlin(_skip,0,1,1,8) | 0;

var rmin = -range;
var rmax = range;


function setparams(a,b){
    _range = a;
    _skip  = b;
    range = 1 << (linlin(_range,0,1,16,4) | 0) / 2;
    skip  = linlin(_skip,0,1,1,8) | 0;
    rmin  = -range;
    rmax  = range;    
}

function process(inp){
    var i    = 0;
    var out  = new Float32Array(1024).fill(0);
    for(i; i < 1024; i+= skip){ 
        out[i] = linlin((linlin(inp[i],-1,1,rmin,rmax) | 0),rmin,rmax,-1,1);
    }
    return out;
}

onmessage = function(e){
    var d = e.data;
    var a = [_range,_skip];
    var b = [d.range,d.skip];
    if(ArrEq(a,b) === false){
        setparams(...b);
    }
    var out = process(d.inp);
    postMessage(out);
}