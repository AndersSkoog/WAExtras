importScripts("./Ops.js");

var Buf        = new Float32Array(4097).fill(0);
var BufSize    = 4096;
var WriteIndex = BufSize >> 1;
var ReadIndex  = 0;
var DelTime    = 20;
var ModRate    = 2;
var ModDepth   = 20;
var Fb         = 0.1;
var Mix        = 0.5;
var Phase      = 0;
var PhaseIncr  = 0;
var PhaseStep  = 4;
var Wave       = Float32Array.from({length:512},(_,n)=> sin(2 * PI * (n/512)));

function setparams(del,rate,depth,fb,mix){
    if(DelTime !== del){
        DelTime = del;
        var ri  = WriteIndex - ((DelTime * sr * 0.001)|0);
        while (ri < 0) {
            ri += BufSize;
        }
        ReadIndex = ri;
    }
    if(ModRate !== rate){
        ModRate = rate;
        PhaseIncr = (512 * ModRate / sr) * PhaseStep;
    }
    if(ModDepth !== depth){
        ModDepth = depth;
    }
    if(Fb !== fb){
        Fb = fb;
    }
    if(Mix !== mix){
        Mix  = mix;
    }
}

function process(inp){
    var buf         = Buf;
    var size        = BufSize;
    var mask        = size - 1;
    var wave        = Wave;
    var phase       = Phase;
    var phaseIncr   = PhaseIncr;
    var writeIndex  = WriteIndex;
    var readIndex   = ReadIndex;
    var depth       = ModDepth;
    var fb          = Fb;
    var wet         = Mix;
    var dry         = 1 - wet;
    var i           = 0;
    var imax        = 1024;
    var j           = 0;
    var jmax        = PhaseStep;
    var x;
    var index;
    var mod;
    for (i = 0; i < imax; ) {
        mod = wave[phase|0] * depth;
        phase += phaseIncr;
        while (phase > 512) {
            phase -= 512;
        }
        for (j = 0; j < jmax; ++j, ++i) {
            index = (readIndex + size + mod) & mask;
            x = (buf[index] + buf[index + 1]) * 0.5;
            buf[writeIndex] = inp[i] - x * fb;
            inp[i] = (inp[i] * dry) + (x * wet);
            writeIndex = (writeIndex + 1) & mask;
            readIndex  = (readIndex  + 1) & mask;
        }
    }  
    Phase      = phase;
    WriteIndex = writeIndex;
    ReadIndex  = readIndex;
    return inp;
}

onmessage = function(e){
    var d = e.data;
    var a = [DelTime,ModRate,ModDepth,Fb,Mix];
    var b = [d.del,d.rate,100 * d.depth,d.fb,d.mix];
    if(ArrEq(a,b) === false){setparams(...b)}
    var outp = process(d.inp);
    postMessage(outp);
}
