
function wavdecode(bytes){
    var check   = 
    String.fromCharCode(bytes[0],  bytes[1], bytes[2],  bytes[3])  === "RIFF" &&
    String.fromCharCode(bytes[8],  bytes[9], bytes[10], bytes[11]) === "WAVE" &&
    String.fromCharCode(bytes[12], bytes[13],bytes[14], bytes[15]) === "fmt " &&
    [8,16,24,32].includes(bytes[34] + (bytes[35]<<8));
    if(check){
        var channels        = bytes[22] + (bytes[23]<<8);
        var samplerate      = Math.abs(bytes[24] + (bytes[25]<<8) + (bytes[26]<<16) + (bytes[27]<<24));
        var bits_per_sample = bytes[34] + (bytes[35]<<8);
        var duration        = ((bytes[40] + (bytes[41]<<8) + (bytes[42]<<16) + (bytes[43]<<24) / channels) >> 1) / samplerate; 
        var mix             = new Float32Array((duration * samplerate)|0);
        var k               = 1 / ((1 << (bits_per_sample - 1)) - 1);
        var l               = mix.length;
        var data;
        switch (bits_per_sample) {
                case 8:
                    data = new Int8Array(bytes.buffer,44);
                    break;
                case 16:
                    data = new Int16Array(bytes.buffer,44);
                    break;
                case 32:
                    data = new Int32Array(bytes.buffer,44);
                    break;
                case 24:
                    var tmp  = new Uint8Array(bytes.buffer,44);
                    var _l   = tmp.length;
                    var _j   = 0;
                    var b0,b1,b2,bb,_x;
                    data = new Int32Array(_l / 3);
                    for (var _i = 0; _i < _l;) {
                        b0 = tmp[_i++];
                        b1 = tmp[_i++];
                        b2 = tmp[_i++];
                        bb = b0 + (b1 << 8) + (b2 << 16);
                        _x = (bb & 0x800000) ? bb - 16777216 : bb;
                        data[_j++] = _x;
                    }
                    break;
                default:
                    break;
        }
        if (channels === 2) {
                var L = new Float32Array(l);
                var R = new Float32Array(l);
                var j = 0;
                var x;
                for (var i = 0; i < l; ++i) {
                    x = data[j++] * k;
                    L[i] = x;
                    x += data[j++] * k;
                    R[i] = x;
                    mix[i] = x * 0.5;
                }
                return {samples:mix,L:L,R:R,channels:2,resolution:bits_per_sample,samplerate:samplerate,duration:duration};
        }
        else {
            for (var i = 0; i < l; ++i) {
                mix[i] = data[i] * k;
            }
            return {samples:mix,channels:1,resolution:bits_per_sample,samplerate:samplerate,duration:duration};
        }
    }
    else {throw Error("only accept 8 | 16 | 24 | 32 bit .wav encoded data") }
}

function loadWav(url,cb){
    fetch(url)
    .then((reader)=> reader.arrayBuffer() )
    .then((buffer)=> new Int8Array(buffer) )
    .then((bytes)=> wavdecode(bytes))
    .then((data)=> {cb(data)});
}

function lerp(r,s,e){return s + (e - s) * r;}

function clamp(x,min,max){return Math.max(min,Math.min(x,max));}


function Lpf(ctx){
    var inp;
    var msg           = {cutoff:0.5,res:0.1};
    var dispatchblock = new Float32Array(1024).fill(0);
    var procThread    = new Worker("../lib/Lpf.js");
    var scriptnode    = ctx.createScriptProcessor(1024,1,1);
    scriptnode.onaudioprocess = function(e){
        msg.inp = e.inputBuffer.getChannelData(0);
        e.outputBuffer.copyToChannel(dispatchblock,0,0);
        procThread.postMessage(msg);
    }
    procThread.onmessage = function(e){
        dispatchblock = e.data;
    }
    this.outlet    = ctx.createGain();
    this.setCutoff = function(val){msg.cutoff = clamp(val,0,1)};
    this.setRes    = function(val){msg.res    = clamp(val,0,1)};
    this.connect   = function(inp){
        inp.connect(scriptnode);
        scriptnode.connect(this.outlet);
        return this.outlet;
    }
    this.disconnect = function(){scriptnode.disconnect()}
}

function Hpf(ctx){
    var inp;
    var msg           = {cutoff:0.5,res:0.1};
    var dispatchblock = new Float32Array(1024).fill(0);
    var procThread    = new Worker("../lib/Hpf.js");
    var scriptnode    = ctx.createScriptProcessor(1024,1,1);
    scriptnode.onaudioprocess = function(e){
        msg.inp = e.inputBuffer.getChannelData(0);
        e.outputBuffer.copyToChannel(dispatchblock,0,0);
        procThread.postMessage(msg);
    }
    procThread.onmessage = function(e){
        dispatchblock = e.data;
    }
    this.outlet    = ctx.createGain();
    this.setCutoff = function(val){msg.cutoff = clamp(val,0,1)};
    this.setRes    = function(val){msg.res    = clamp(val,0,1)};
    this.connect   = function(inp){
        inp.connect(scriptnode);
        scriptnode.connect(this.outlet);
        return this.outlet;
    }
    this.disconnect = function(){scriptnode.disconnect()}
}

function Bpf(ctx){
    var inp;
    var msg           = {freq:0.5,Q:0.1};
    var dispatchblock = new Float32Array(1024).fill(0);
    var procThread    = new Worker("../lib/Bpf.js");
    var scriptnode    = ctx.createScriptProcessor(1024,1,1);
    scriptnode.onaudioprocess = function(e){
        msg.inp = e.inputBuffer.getChannelData(0);
        e.outputBuffer.copyToChannel(dispatchblock,0,0);
        procThread.postMessage(msg);
    }
    procThread.onmessage = function(e){
        dispatchblock = e.data;
    }
    this.setFreq = function(val){msg.freq = clamp(val,0,1)};
    this.setQ    = function(val){msg.Q    = clamp(val,0,1)};
    this.outlet  = ctx.createGain();
    this.connect   = function(inp){
        inp.connect(scriptnode);
        scriptnode.connect(this.outlet);
        return this.outlet;
    }
    this.disconnect = function(){scriptnode.disconnect()}
}

function BandReject(ctx){
    var inp;
    var msg           = {freq:0.5,Q:0.1};
    var dispatchblock = new Float32Array(1024).fill(0);
    var procThread    = new Worker("../lib/BandReject.js");
    var scriptnode    = ctx.createScriptProcessor(1024,1,1);
    scriptnode.onaudioprocess = function(e){
        msg.inp = e.inputBuffer.getChannelData(0);
        e.outputBuffer.copyToChannel(dispatchblock,0,0);
        procThread.postMessage(msg);
    }
    procThread.onmessage = function(e){
        dispatchblock = e.data;
    }
    this.setFreq = function(val){msg.freq = clamp(val,0,1)};
    this.setQ    = function(val){msg.Q    = clamp(val,0,1)};
    this.outlet  = ctx.createGain();
    this.connect   = function(inp){
        inp.connect(scriptnode);
        scriptnode.connect(this.outlet);
        return this.outlet;
    }
    this.disconnect = function(){scriptnode.disconnect()}
}

function Delay(ctx){
    var inp;
    var msg           = {del:300,fb:0.1,mix:0.5};
    var dispatchblock = new Float32Array(1024).fill(0);
    var procThread    = new Worker("../lib/Delay.js");
    var scriptnode    = ctx.createScriptProcessor(1024,1,1);
    scriptnode.onaudioprocess = function(e){
        msg.inp = e.inputBuffer.getChannelData(0);
        e.outputBuffer.copyToChannel(dispatchblock,0,0);
        procThread.postMessage(msg);
    }
    procThread.onmessage = function(e){
        dispatchblock = e.data;
    }
    this.setDel    = function(val){msg.del    = 10 + (val * 990) | 0};
    this.setFb     = function(val){msg.fb     = clamp(val,0,0.9)};
    this.setMix    = function(val){msg.mix    = clamp(val,0,1)}
    this.outlet  = ctx.createGain();
    this.connect   = function(inp){
        inp.connect(scriptnode);
        scriptnode.connect(this.outlet);
        return this.outlet;
    }
    this.disconnect = function(){scriptnode.disconnect()}

}

function Comb(ctx){
    var inp;
    var msg           = {size:0.5,fb:0.5,mix:0.5};
    var dispatchblock = new Float32Array(1024).fill(0);
    var procThread    = new Worker("../lib/Comb.js");
    var scriptnode    = ctx.createScriptProcessor(1024,1,1);
    scriptnode.onaudioprocess = function(e){
        msg.inp = e.inputBuffer.getChannelData(0);
        e.outputBuffer.copyToChannel(dispatchblock,0,0);
        procThread.postMessage(msg);
    }
    procThread.onmessage = function(e){
        dispatchblock = e.data;
        //console.log(e.data);
    }
    this.setSize   = function(val){msg.size    = clamp(val,0,1)}
    this.setFb     = function(val){msg.fb      = clamp(val,0,5)}
    this.setDamp   = function(val){msg.damp    = clamp(val,0,20)}
    this.outlet  = ctx.createGain();
    this.connect   = function(inp){
        inp.connect(scriptnode);
        scriptnode.connect(this.outlet);
        return this.outlet;
    }
    this.disconnect = function(){scriptnode.disconnect()}
}

function Chorus(ctx){
    var inp;
    var msg           = {del:20,rate:2,depth:0.5,fb:0.1,mix:0.5};
    var dispatchblock = new Float32Array(1024).fill(0);
    var procThread    = new Worker("../lib/Chorus.js");
    var scriptnode    = ctx.createScriptProcessor(1024,1,1);
    procThread.onmessage = function(e){
        dispatchblock = e.data;
    }
    scriptnode.onaudioprocess = function(e){
        msg.inp = e.inputBuffer.getChannelData(0);
        e.outputBuffer.copyToChannel(dispatchblock,0,0);
        procThread.postMessage(msg);
    }
    this.setRate   = function(val){msg.rate    = 20 * val}
    this.setFb     = function(val){msg.fb      = clamp(val,0,0.9)}
    this.setDepth  = function(val){msg.depth   = clamp(val,0,1)}
    this.setDel    = function(val){msg.del     = 1 + 70 * val | 0}
    this.setMix    = function(val){msg.mix     = clamp(val,0,1)}
    this.outlet  = ctx.createGain();
    this.connect   = function(inp){
        inp.connect(scriptnode);
        scriptnode.connect(this.outlet);
        return this.outlet;
    }
    this.disconnect = function(){scriptnode.disconnect()}

}

function Overdrive(ctx){
    var msg           = {drive:0.5,mix:0.5};
    var dispatchblock = new Float32Array(1024).fill(0);
    var procThread    = new Worker("../lib/Overdrive.js");
    var scriptnode    = ctx.createScriptProcessor(1024,1,1);
    procThread.onmessage = function(e){
        dispatchblock = e.data;
    }
    scriptnode.onaudioprocess = function(e){
        msg.inp = e.inputBuffer.getChannelData(0);
        e.outputBuffer.copyToChannel(dispatchblock,0,0);
        procThread.postMessage(msg);
    }
    this.setDrive   = function(val){msg.drive    = clamp(val,0,1)}
    this.setMix     = function(val){msg.mix      = clamp(val,0,1)}
    this.outlet    = ctx.createGain();
    this.connect   = function(inp){
        inp.connect(scriptnode);
        scriptnode.connect(this.outlet);
        return this.outlet;
    }
    this.disconnect = function(){scriptnode.disconnect()}

}

function Ringmod(ctx){
    var inp;
    var msg           = {tone:0.5,fine:0,mix:0.5};
    var dispatchblock = new Float32Array(1024).fill(0);
    var procThread    = new Worker("../lib/Ringmod.js");
    var scriptnode    = ctx.createScriptProcessor(1024,1,1);
    procThread.onmessage = function(e){
        dispatchblock = e.data;
    }
    scriptnode.onaudioprocess = function(e){
        msg.inp = e.inputBuffer.getChannelData(0);
        e.outputBuffer.copyToChannel(dispatchblock,0,0);
        procThread.postMessage(msg);
    }
    this.setTone   = function(val){msg.tone      = clamp(val,0,1)}
    this.setFine   = function(val){msg.fine      = clamp(val,0,1)}
    this.setMix    = function(val){msg.mix       = clamp(val,0,1)}
    this.outlet    = ctx.createGain();
    this.connect   = function(inp){
        inp.connect(scriptnode);
        scriptnode.connect(this.outlet);
        return this.outlet;
    }
    this.disconnect = function(){scriptnode.disconnect()}

}

function Decimator(ctx){
    var inp;
    var msg           = {range:0.5,skip:0.5};
    var dispatchblock = new Float32Array(1024).fill(0);
    var procThread    = new Worker("../lib/Decimator.js");
    var scriptnode    = ctx.createScriptProcessor(1024,1,1);
    procThread.onmessage = function(e){
        dispatchblock = e.data;
    }
    scriptnode.onaudioprocess = function(e){
        msg.inp = e.inputBuffer.getChannelData(0);
        e.outputBuffer.copyToChannel(dispatchblock,0,0);
        procThread.postMessage(msg);
    }
    this.setRange  = function(val){msg.range      = clamp(val,0,1)}
    this.setSkip   = function(val){msg.skip       = clamp(val,0,1)}
    this.outlet    = ctx.createGain();
    this.connect   = function(inp){
        inp.connect(scriptnode);
        scriptnode.connect(this.outlet);
        return this.outlet;
    }
    this.disconnect = function(){scriptnode.disconnect()}

}

function FmGen(ctx){
    var msg           = {note:69,modharm:0.5,modlevel:0.5};
    var dispatchblock = new Float32Array(1024).fill(0);
    var procThread    = new Worker("../lib/FmGen.js");
    var scriptnode    = ctx.createScriptProcessor(1024,0,1);
    procThread.onmessage = function(e){
        dispatchblock = e.data;
    }
    scriptnode.onaudioprocess = function(e){
        e.outputBuffer.copyToChannel(dispatchblock,0,0);
        procThread.postMessage(msg);
    }
    this.setModharm  = function(val){msg.modharm      = clamp(val,0,1)}
    this.setModlevel = function(val){msg.modlevel     = clamp(val,0,1)}
    this.setNote   = function(val){msg.note         = clamp(val,36,119) | 0}
    this.outlet    = ctx.createGain();
    this.disconnect = function(){scriptnode.disconnect()}
    scriptnode.connect(this.outlet);
    procThread.postMessage(msg);
}

function AdditiveGen(ctx){
    var msg           = {note:69,part1:0.5,part2:0,part3:0,part4:0};
    var dispatchblock = new Float32Array(1024).fill(0);
    var procThread    = new Worker("../lib/AdditiveGen.js");
    var scriptnode    = ctx.createScriptProcessor(1024,0,1);
    procThread.onmessage = function(e){
        dispatchblock = e.data;
    }
    scriptnode.onaudioprocess = function(e){
        e.outputBuffer.copyToChannel(dispatchblock,0,0);
        procThread.postMessage(msg);
    }
    this.setPart1 = function(val){msg.part1        = clamp(val,0,1)}
    this.setPart2 = function(val){msg.part2        = clamp(val,0,1)}
    this.setPart3 = function(val){msg.part3        = clamp(val,0,1)}
    this.setNote  = function(val){msg.note         = clamp(val,36,119) | 0}
    this.outlet    = ctx.createGain();
    this.disconnect = function(){scriptnode.disconnect()}
    scriptnode.connect(this.outlet);
    procThread.postMessage(msg);
}

function UnisonGen(ctx){
    var msg           = {note:69,spread:0.5};
    var dispatchblock = new Float32Array(1024).fill(0);
    var procThread    = new Worker("../lib/UnisonGen.js");
    var scriptnode    = ctx.createScriptProcessor(1024,0,1);
    procThread.onmessage = function(e){
        dispatchblock = e.data;
    }
    scriptnode.onaudioprocess = function(e){
        e.outputBuffer.copyToChannel(dispatchblock,0,0);
        procThread.postMessage(msg);
    }
    this.setSpread = function(val){msg.spread       = clamp(val,0,1)}
    this.setNote   = function(val){msg.note         = clamp(val,36,119) | 0}
    this.outlet    = ctx.createGain();
    this.disconnect = function(){scriptnode.disconnect()}
    scriptnode.connect(this.outlet);
    procThread.postMessage(msg);
}

function PwmGen(ctx){
    var msg           = {note:69,tune:0.5,width:0.5,modrate:0.1,modlevel:0.5};
    var dispatchblock = new Float32Array(1024).fill(0);
    var procThread    = new Worker("../lib/PwmGen.js");
    var scriptnode    = ctx.createScriptProcessor(1024,0,1);
    procThread.onmessage = function(e){
        dispatchblock = e.data;
    }
    scriptnode.onaudioprocess = function(e){
        e.outputBuffer.copyToChannel(dispatchblock,0,0);
        procThread.postMessage(msg);
    }
    this.setWidth    = function(val){msg.width      = clamp(val,0,1)}
    this.setModrate  = function(val){msg.modrate    = clamp(val,0,1)}
    this.setModlevel = function(val){msg.modlevel   = clamp(val,0,1)}
    this.setNote     = function(val){msg.note       = clamp(val,36,119) | 0}
    this.outlet    = ctx.createGain();
    this.disconnect = function(){scriptnode.disconnect()}
    scriptnode.connect(this.outlet);
    procThread.postMessage(msg);
}































