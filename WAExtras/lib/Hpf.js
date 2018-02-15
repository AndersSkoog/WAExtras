importScripts("./Ops.js");

var outp   = new Float32Array(1024);
var cutoff = 0.5;
var res    = 0.1;
var coef   = Array.from({length:9});
var d0     = 0;
var d1     = 0;
var d2     = 0;
var d3     = 0;

function calc(){
    var omega      = PI2 * linlin(clamp(cutoff,0.05,0.99),0.05,0.99,100,5000) / sr;
    var g          = linlin(clamp(res,0.1,0.9),0.1,0.9,0.5,10.0);
    var k,p,q,a;
    var a0,a1,a2,a3,a4;
    k = (4.0 * g - 3.0 ) / (g + 1.0 );
    p = 1.0 - 0.25 * k;
    p *= p;
    a = tan(0.5 * omega ) / (1.0 + p );
    p = a + 1.0;
    q = a - 1.0;
    a0 = 1.0 / (p*p*p*p+k);
    a1 = 4.0 * (p*p*p*q-k);
    a2 = 6.0 * (p*p*q*q+k);
    a3 = 4.0 * (p*q*q*q-k);
    a4 = (q*q*q*q+k);
    p = a0 * ( k + 1.0 );
    coef[0] = p;
    coef[1] = -4.0 * p;
    coef[2] = 6.0 * p;
    coef[3] = -4.0 * p;
    coef[4] = p;
    coef[5] = -a1 * a0;
    coef[6] = -a2 * a0;
    coef[7] = -a3 * a0;
    coef[8] = -a4 * a0;
}

function process(inp){
    var i = 0;
    var x;
    var y;
    for(i; i < 1024; i++){
        x  = inp[i];
        y  = coef[0] * x + d0;
        d0 = coef[1] * x + coef[5] * y + d1;
        d1 = coef[2] * x + coef[6] * y + d2;
        d2 = coef[3] * x + coef[7] * y + d3;
        d3 = coef[4] * x + coef[8] * y;
        outp[i] = y;
    }
}

calc();

onmessage = function(e){
    if(ArrEq([cutoff,res],[e.data.cutoff,e.data.res]) === false){
        cutoff = e.data.cutoff;
        res    = e.data.res;
        calc();
    }
    process(e.data.inp);
    postMessage(outp);
}