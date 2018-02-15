var cos    =  Math.cos;
var sin    =  Math.sin;
var pow    =  Math.pow;
var exp    =  Math.exp;
var hypot  =  Math.hypot;
var atan2  =  Math.atan2;
var tan    =  Math.tan;
var tanh   =  Math.tanh
var round  =  Math.round;
var abs    =  Math.abs;
var atan   =  Math.atan;
var sqrt   =  Math.sqrt;
var floor  =  Math.floor;
var log    =  Math.log;
const sr   =  44100;
const PI   =  Math.PI;
const E    =  Math.E;
const PI2  =  2 * Math.PI;

function clamp(x,min,max){return Math.max(min,Math.min(x,max));}

function clampAt(x,index){return x[clamp(index,0,x.length - 1)];}

function diff(a,b){return abs(a - b);}

function sinc(x){return sin(PI * x) / (PI * x)}

function zeta(s){return 1 + ( ((s + 3) / (s - 1)) * (1 / (pow(2, s + 1))))};

function omega(fhz){return PI2 * fhz / sr}

function harm1(n){return (pow((-1),n + 1) / n);}

function harm2(n){return pow(-1,n) / (2 * n) + 1}

function partsum(n){
    var r = 1;
    for(i = 1; i < n; i++){r+= 1 / i;}
    return r; 
}
function norm(x,min,max){return (abs(x) - min)/(max - min) * 1;}

function linlin(x,inmin,inmax,outmin,outmax){return (x - inmin)/(inmax - inmin) * (outmax - outmin) + outmin;}

function linexp(x,inmin,inmax,outmin,outmax){return pow( outmax / outmin, (x - inmin)/(inmax - inmin) ) * outmin;}

function lincurve(x,inmin,inmax,outmin,outmax,slope){
    if (abs(slope) < 0.001) {
        return x;
    }
    else {
        var grow = exp(slope);
        var a = (outmax - outmin) / (1.0 - grow);
        var b = outmin + a;
        var scaled = (x - inmin) / (inmax - inmin);
        return b - (a * pow(grow, scaled));
    }
}
function blendAt(x,index){
    var i  = floor(index);
    var x0 = clampAt(x,i);
    var x1 = clampAt(x,i + 1);
    return x0 + abs(index - i) * (x1 - x0);    
}
function db(x){return clamp(x,0.001,1) * (Math.LOG10E * 20);}

function ftom(fhz){return round(log(abs(fhz) * 1 / 440) * Math.LOG2E * 12 + 69);}

function mtof(midi){return 440 * pow(2,((clamp(midi,0,127) | 0 ) - 69) * 1/12 ) ; }

function cyc(fhz){return PI2 * fhz / (sr / fhz);}

function step(fhz){return PI2 / cyc(fhz,sr)}

function wt(n,fhz){return cos(step(fhz,sr) * n)}

function period(ms){return round((sr/1000) * ms)} 

function metre(bpm){return floor(44.1 * (60000 / bpm) / 4);}

function chebychev(x,coef,order){
    var x2  = 1.0;
    var x1  = x;
    var xn;
    var out = coef[0] * x1;
    var n   = 2;
    for(n;n <= order;n++){
        xn  = 2.0 * x * x1 - x2;
        out += coef[n-1] * xn;
        x2 = x1;
        x1 = xn;
    }
    return out;
}

function randint(_min,_max){
    var min = Math.ceil(_min);
    var max = Math.floor(_max);
    return Math.floor(Math.random() * (max - min + 1)) + min;       
}

function fac(x){
    if (x < 0) {
        return 1;
    }
    else {
        return [1,1,2,6,24,120,720,5040,40320,362880,3628800,39916800,479001600][x | 0];
    }
}

function bitdepth(x,range){
    var r = 1 << clamp(range,4,16) | 0; 
    var rmin   = -r;
    var rmax   = r;
    return linlin((linlin(x,-1,1,rmin,rmax) | 0),rmin,rmax,-1,1);
}

function bitrev(n){
    var x, i, j, k, n2;
    x = new Int16Array(n);
    n2 = n >> 1;
    i = j = 0;
    for (;;) {
        x[i] = j;
        if (++i >= n) {
            break;
        }
        k = n2;
        while (k <= j) {
            j -= k;
            k >>= 1;
        }
        j += k;
    }
    return x;
}

function clump(x,groupSize){
    var list, sublist, i, imax;
    list = [];
    sublist = [];
    for (i = 0, imax = x.length; i < imax; ++i) {
      sublist.push(x[i]);
      if (sublist.length >= groupSize) {
        list.push(sublist);
        sublist = [];
      }
    }
    if (sublist.length > 0) {
      list.push(sublist);
    }
    return list;
}

function flat(x){
    let f = function(t,l) {
        let i, imax;
        for (i = 0, imax = t.length; i < imax; ++i) {
          if (Array.isArray(t[i])) {
            l = f(t[i], l);
          } else {
            l.push(t[i]);
          }
        }
        return l;
    };
    return f(x,[]);
}

function invert(x){
    let l = x.length;
    let y = x;
    for(let i = 0; i < l; i++){
        y[i] = x[i] * -1;
    }
    return y;
}

function rotate(x,n){
    n = n === void 0 ? 1 : n|0;
    var a = new Array(x.length);
    var size = a.length;
    n %= size;
    if (n < 0) { n = size + n; }
    for (var i = 0, j = n; i < size; ++i) {
      a[j] = x[i];
      if (++j >= size) { j = 0; }
    }
    return Float32Array.from(a);    
}

function resamp0(x,newSize){
    var factor = (x.length - 1) / (newSize - 1);
    var a = new Array(newSize);
    for (var i = 0; i < newSize; ++i) {
      a[i] = x[Math.round(i * factor)];
    }
    return Float32Array.from(a);    
}

function resamp1(x,newSize){
    let factor = (x.length - 1) / (newSize - 1);
    let a = new Array(newSize);
    for (let i = 0; i < newSize; ++i) {
      a[i] = blendAt(x,i * factor);
    }
    return a;  
}

function mirror1(x){
    var size = x.length * 2 - 1;
    if (size < 2) {
      return Float32Array.from(Array.from(x).slice(0));
    }
    var i, j, imax, a = new Float32Array(size);
    for (i = 0, imax = x.length; i < imax; ++i) {
      a[i] = x[i];
    }
    for (j = imax - 2, imax = size; i < imax; ++i, --j) {
      a[i] = x[j];
    }
    return a;
}

function mirror2(x){
    var size = x.length * 2 - 1;
    if (size < 2) {return x;}
    var y = new Float32Array(size);
    var i = 0;
    var imax = x.length;
    var j = imax - 2;
    for (i; i < imax; ++i) {y[i] = x[i];}
    imax = size;
    for (j; i < imax; ++i, --j) {
      y[i] = x[j];
    }
    return y;
}

function mirror3(x){
    var size      = x.length * 2 - 2;
    if (size < 2) {return x;}
    var y = new Float32Array(size);
    var i         = 0;
    var imax      = x.length;
    var j         = imax - 2;
    for (i; i < imax; ++i) {y[i] = x[i];}
    for (j; i < imax; ++i, --j) {y[i] = x[j];}
    return y;
}

function mirror4(x){
    var size = x.length * 2;
    if (size < 2){return x;}
    var i = 0;
    var imax = size;
    var j = imax - 1;
    var y = new Float32Array(size);
    for (i; i < imax; ++i) {y[i] = x[i];}
    for (j; i < imax; ++i, --j) {
      y[i] = x[j];
    }
    return y;
}

function range(s,e){return new Array.from({length:abs(s - e)},(_,n)=> s + n);}

function nearest(target,array){return array.reduce((prev,cur)=> diff(cur,target) < diff(prev,target) ? cur : prev );}

function wrap(x,lo,hi){
    if (lo > hi) {return warp(x,hi,lo);}
    var range = hi - lo;
    var _x = x;
    if (_x  >= hi) {_x -= range;if (_x < hi) { return _x;}}
    else if(_x < lo){range = hi - lo;_x += range;if(_x >= lo){return _x;}}
    else {return _x;}
    if(hi == lo){ return lo;}
    return floor(_x - range * ((_x - lo) / range));  
}

function pitch(note,tune){
    var nf   = mtof(note);
    var freq;
    if(tune !== 0.5){
        var tr  = abs(nf - mtof(note + 1));
        if(tune < 0.5){freq = nf - linlin(tune,0,0.5,tr,0)}
        if(tune > 0.5){freq = nf + linlin(tune,0.5,1,0,tr)}
    }
    else {
        freq = nf;
    } 
    return freq;
}

function transp(fhz,intrv){return fhz * pow(2,linlin(intrv,0,1,0,(11 | 0)  / 12));}

function harmonics(n,bf,p1 = 0.5,p2 = 0,p3 = 0){
    var f1 = bf + bf / 2;
    var f2 = bf + bf / 4;
    var f3 = bf + bf / 8;
    return [
        p1 * cos(omega(f1) * n),
        p2 * cos(omega(f2) * n),
        p3 * cos(omega(f3) * n)
    ].reduce((p,v)=> p + v);
}

function hann(n,N) {
    return 0.5 * (1 - cos((PI2 * n ) / (N-1)));
}

function hamming(n,N){
    return 0.54 - 0.46 * cos((PI2 * n ) / (N-1));
}

function tukery(n,N,a){
    if ( n < (a * (N-1))/2 ) {
        return 0.5 * ( 1 + cos(PI * (((2*n)/(a*(N-1))) - 1)) );
    } else if ( (N-1)*(1-(a/2)) < n ) {
        return 0.5 * ( 1 + cos(PI * (((2*n)/(a*(N-1))) - (2/a) + 1)) );
    } else {
        return 1;
    }
}

function cosine(n,N){
    return sin((PI * n) / (N - 1)); 
}

function lanczos(n, N) {
    return sinc(((2*n) / (N-1)) - 1);
}

function triangular(n, N) {
    return (2/(N+1)) * (((N+1)/2) - abs(n - ((N-1)/2)));
}

function barlett(n, N) {
    return (2/(N-1)) * (((N-1)/2) - abs(n - ((N-1)/2)));
}

function gaussian(n, N, a) {
    return pow(E, -0.5 * pow((n - (N-1) / 2) / (a * (N-1) / 2), 2));
}

function bartlettHann(n, N) {
    return 0.62 - 0.48 * abs((n / (N-1)) - 0.5) - 0.38 * cos((PI2*n) / (N-1));
}

function blackmann(n, N, a) {
    var a0 = (1 - a) / 2, a1 = 0.5, a2 = a / 2;
    return a0 - a1 * cos((PI2*n) / (N-1)) + a2 * cos((4*PI*n) / (N-1));
}

function conv(values, fn, w0) {
    var result = 0;
    for (var i = 0, imax = values.length; i < imax; i++) {
        result += values[i] * fn(w0 * i);
    }
    return result;
}

function analyse(samples,windowfunc = undefined){
    var n = 1 << Math.ceil(Math.log(samples.length) * Math.LOG2E);
    var length  = n;
    var buffer  = new Float32Array(n);
    var real    = new Float32Array(n);
    var imag    = new Float32Array(n);
    var mag     = new Float32Array(n>>1);
    var bitrev  = bitrev(n);
    var _k = Math.floor(Math.log(n) / Math.LN2);
    var sintable = new Float32Array((1<<_k)-1).map((_,i)=> sin(PI2 * (i / n)));
    var costable = new Float32Array((1<<_k)-1).map((_,i)=> cos(PI2 * (i / n)));
    var minDecibels =  -30;
    var maxDecibels = -100;
    var i, j, k, k2, h, d, c, s, ik, dx, dy;
    if(windowfunc !== undefined){for(i = 0; i < n; ++i){buffer[i] = samples[i] * windowfunc(i,n)}}
    else {buffer.set(samples);}
    for (i = 0; i < n; ++i) {
        real[i] = buffer[bitrev[i]];
        imag[i] = 0.0;
    }
    for (k = 1; k < n; k = k2) {
        h = 0; 
        k2 = k + k; 
        d = n / k2;
        for (j = 0; j < k; j++) {
            c = costable[h];
            s = sintable[h];
            for (i = j; i < n; i += k2) {
                ik = i + k;
                dx = s * imag[ik] + c * real[ik];
                dy = c * imag[ik] - s * real[ik];
                real[ik] = real[i] - dx; 
                real[i] += dx;
                imag[ik] = imag[i] - dy; 
                imag[i] += dy;
            }
            h += d;
        }
    }
    var _mag = mag;
    var rval, ival;
    for (i = 0; i < n; ++i) {
        rval = real[i];
        ival = imag[i];
        _mag[i] = sqrt(rval * rval + ival * ival);
    }
    return {real:real,imag:imag,mag:mag,buffer:buffer};
}

var sinusoid = function(a,b,frq){
  var w = (PI2 * frq / sr);
  var A = a;
  var B = -b;
  return A * cos(w) + B * sin(w);  
};

function getfreq(a,b){
  var d  = abs((1 / sr) - abs(a - b));
  return ((sr * d) / PI2);
}

function saw(f,n){
    var c = cyc(f);
    var x = n % c / c;
    return +2.0 * (x - round(x));
}

function ArrEq(a,b){
    return a.every((v,i)=> v === b[i]);
}

















































