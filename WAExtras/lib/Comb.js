importScripts("./Ops.js");

var size        = 0.5
var damp        = 0.5;
var fb          = 0;

var bufSize     = linlin(size,0,1,100,4096) | 0;
var buf         = new Float32Array(bufSize).fill(0);
var bufIndex    = 0;
var filt        = 0.5;
function setparams(size,fb,damp){
    fb = fb;
    damp = damp;
    size = size;
    var newsize = linlin(size,0,1,100,4096) | 0;
    if(bufSize !== newsize){
        var newbuf = new Float32Array(newsize);
        for(var i = 0; i < newsize; i++){
            newbuf[i] = bufSize < i ? buf[i] : 0;
        }
        bufSize = newsize;
        buf     = newbuf;
    }
}
function process(inp){
    var out       = new Float32Array(inp.length);
    var x;         
    var y;
    var _buf      = buf;
    var _bufSize  = bufSize;
    var _bufIndex = bufIndex;
    var _filt     = filt;
    var _fb       = fb;
    var _damp1    = damp;
    var _damp2    = 1 - _damp1;
    var i         = 0;
    var N         = 1024;
    for (i = 0; i < N; ++i) {
        x     = inp[i] * 0.015;
        y     = _buf[_bufIndex];
        _filt = (y * _damp2) + (_filt * _damp1);
        _buf[_bufIndex] = x  + (_filt * _fb);
        if (++bufIndex >= _bufSize) {
            _bufIndex = 0;
        }
        out[i] = y;
    }
    bufIndex = _bufIndex;
    filt     = _filt;
    return out;
}

onmessage = function(e){
    var a = [size,fb,damp];
    var b = [e.data.size,e.data.fb,e.data.damp];
    if(ArrEq(a,b) === false){
        setparams(e.data.size,e.data.fb,e.data.damp);
    }
    var ret = process(e.data.inp);
    postMessage(ret);
}

