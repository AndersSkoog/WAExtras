importScripts("./Ops.js");

var bits       = Math.ceil(log(sr * 1.5) * Math.LOG2E);
var BufSize    = 1 << bits;
var BufMask    = BufSize - 1;
var WriteBuf   = new Float32Array(BufSize);
var ReadBuf    = new Float32Array(BufSize);
var Del        = null;
var Fb         = null;
var Mix        = null;
var Prev       = 0;
var ReadIndex  = 0;
var WriteIndex = 0;

function setparams(del,fb,mix){
    if (Del !== del){
        Del = del;
        var offset = (del * 0.001 * sr)|0;
        if (offset > BufMask) {
            offset = BufMask;
        }
        WriteIndex = (ReadIndex + offset) & BufMask;
    }
    if (Fb !== fb) {Fb = fb;}
    if (Mix !== mix) {Mix = mix;}
    ReadBuf = WriteBuf;
}

function process(inp){
    var readbuf    = ReadBuf;
    var writebuf   = WriteBuf;
    var readIndex  = ReadIndex;
    var writeIndex = WriteIndex;
    var mask       = BufMask;
    var fb         = Fb;
    var wet        = Mix;
    var dry        = 1 - wet;
    var prev       = Prev;
    var i          = 0;
    var imax       = 1024;
    var x;
    for (i; i < imax; ++i){
        x = readbuf[readIndex];
        writebuf[writeIndex] = inp[i] - x * fb;
        inp[i] = prev = ((inp[i] * dry) + (x * wet) + prev) * 0.5;
        readIndex  += 1;
        writeIndex = (writeIndex + 1) & mask;
    }
    ReadIndex  = readIndex & BufMask;
    WriteIndex = writeIndex;
    Prev       = prev;
    return inp;
}

setparams(300,0.1,0.5);

onmessage = function(e){
    var d = e.data;
    var a = [Del,Fb,Mix];
    var b = [d.del,d.fb,d.mix];
    if(ArrEq(a,b) === false){setparams(d.del,d.fb,d.mix)}
    var outp = process(d.inp);
    postMessage(outp);
}
