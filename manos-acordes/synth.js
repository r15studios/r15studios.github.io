// Instrumentos sintetizados con Web Audio (sin muestras, sin licencias externas).
export const INSTRUMENTS=['pad','piano','guitar','harp','violin','cello','flute','organ','marimba','bells','trumpet','lead','bass','drums'];
const META={ // oct: desplazamiento de octava; sub: añade nota grave en acordes; solo: solo la fundamental en acordes; strum: rasgueo
 pad:{oct:0,sub:true},piano:{oct:0,sub:true},guitar:{oct:-1,sub:true,strum:.022},harp:{oct:0,sub:false,strum:.05},
 violin:{oct:0},cello:{oct:-1},flute:{oct:1},organ:{oct:0,sub:true},marimba:{oct:0,strum:.03},bells:{oct:1,strum:.06},
 trumpet:{oct:0,solo:true},lead:{oct:0},bass:{oct:-2,solo:true},drums:{perc:true}};
export const meta=id=>META[id];
const nbufs=new WeakMap();
function noise(ctx){let b=nbufs.get(ctx);if(!b){b=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate);const d=b.getChannelData(0);let s=12345;for(let i=0;i<d.length;i++){s=(s*1664525+1013904223)>>>0;d[i]=s/2147483648-1}nbufs.set(ctx,b)}return b}
function pluckBuf(ctx,f,damp,dur,bright){const sr=ctx.sampleRate,N=Math.max(2,Math.round(sr/f)),len=Math.floor(sr*dur),b=ctx.createBuffer(1,len,sr),d=b.getChannelData(0);
 const line=new Float32Array(N);let s=777+Math.round(f);for(let i=0;i<N;i++){s=(s*1664525+1013904223)>>>0;let v=s/2147483648-1;line[i]=v}
 // suavizado inicial (menos brillo)
 for(let k=0;k<bright;k++){let p=line[N-1];for(let i=0;i<N;i++){const c=line[i];line[i]=(c+p)/2;p=c}}
 let mx=0;for(let i=0;i<N;i++)mx=Math.max(mx,Math.abs(line[i]));
 let idx=0;for(let i=0;i<len;i++){const a=line[idx],b2=line[(idx+1)%N];d[i]=a/mx;line[idx]=(a+b2)/2*damp;idx=(idx+1)%N}return b}
function chain(ctx,dest,vol){const rel=ctx.createGain();rel.gain.value=1;const g=ctx.createGain();g.gain.value=vol;g.connect(rel);rel.connect(dest);return{g,rel}}
function offFn(ctx,rel,tc,srcs){return tt=>{rel.gain.setTargetAtTime(0,tt,tc);srcs.forEach(s=>{try{s.stop(tt+tc*8)}catch(e){}})}}
function osc(ctx,type,f,t,dst,gain=1,det=0){const o=ctx.createOscillator();o.type=type;o.frequency.value=f;o.detune.value=det;const g=ctx.createGain();g.gain.value=gain;o.connect(g);g.connect(dst);o.start(t);return{o,g}}
function vibrato(ctx,srcs,f,t,rate,depth,delay){const l=ctx.createOscillator();l.frequency.value=rate;const lg=ctx.createGain();lg.gain.setValueAtTime(0,t);lg.gain.linearRampToValueAtTime(f*depth,t+delay+.3);l.connect(lg);srcs.forEach(o=>lg.connect(o.frequency));l.start(t);return l}
function sustained(ctx,dest,f,t,v,o){const{g,rel}=chain(ctx,dest,0);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(o.gain*v,t+o.att);
 const lp=ctx.createBiquadFilter();lp.type='lowpass';lp.Q.value=o.q||.7;
 if(o.sweep){lp.frequency.setValueAtTime(o.sweep[0],t);lp.frequency.linearRampToValueAtTime(o.sweep[1],t+o.sweep[2])}else lp.frequency.value=o.cut;
 lp.connect(g);const srcs=[];(o.layers).forEach(([ty,m,det,gn])=>{const x=osc(ctx,ty,f*m,t,lp,gn,det);srcs.push(x.o)});
 if(o.vib)srcs.push(vibrato(ctx,srcs.slice(),f,t,o.vib[0],o.vib[1],o.vib[2]));
 if(o.breath){const n=ctx.createBufferSource();n.buffer=noise(ctx);n.loop=true;const bp=ctx.createBiquadFilter();bp.type='bandpass';bp.frequency.value=Math.min(f*2,6000);bp.Q.value=.8;const ng=ctx.createGain();ng.gain.value=o.breath;n.connect(bp);bp.connect(ng);ng.connect(g);n.start(t);srcs.push(n)}
 return{off:offFn(ctx,rel,o.rel,srcs)}}
const SUS={
 pad:{gain:.2,att:.02,cut:2200,rel:.06,layers:[['triangle',1,0,1],['sine',2.003,0,.25]],decay:true},
 violin:{gain:.2,att:.12,cut:3200,q:1.2,rel:.12,layers:[['sawtooth',1,-6,.6],['sawtooth',1,6,.6],['sine',2,0,.15]],vib:[5.6,.007,.25]},
 cello:{gain:.28,att:.18,cut:1500,q:1,rel:.18,layers:[['sawtooth',1,-5,.6],['sawtooth',1,5,.6],['triangle',.5,0,.3]],vib:[5,.006,.3]},
 flute:{gain:.34,att:.07,cut:5000,rel:.1,layers:[['sine',1,0,1],['triangle',2,0,.12],['sine',3,0,.04]],vib:[5,.005,.35],breath:.05},
 organ:{gain:.13,att:.012,cut:6000,rel:.05,layers:[['sine',1,0,1],['sine',2,0,.7],['sine',3,0,.4],['sine',4,0,.25],['sine',6,0,.15],['sine',.5,0,.5]]},
 trumpet:{gain:.22,att:.035,sweep:[700,3800,.09],q:1.5,rel:.07,layers:[['sawtooth',1,0,1],['sawtooth',1,4,.5]],vib:[5.5,.004,.3]},
 lead:{gain:.16,att:.01,cut:3200,q:2,rel:.08,layers:[['sawtooth',1,-8,.7],['sawtooth',1,8,.7],['square',.5,0,.4]]}};
function padVoice(ctx,dest,f,t,v){const r=sustained(ctx,dest,f,t,v,SUS.pad);return r}
function piano(ctx,dest,f,t,v){const{g,rel}=chain(ctx,dest,.3*v);const srcs=[];const B=.0004;
 for(let k=1;k<=9;k++){const fk=f*k*Math.sqrt(1+B*k*k);if(fk>9000)break;const pg=ctx.createGain();const amp=1/Math.pow(k,1.15);const tau=(2.6/Math.pow(k,.75))*Math.pow(261/f,.35);
  pg.gain.setValueAtTime(0,t);pg.gain.linearRampToValueAtTime(amp,t+.004);pg.gain.setTargetAtTime(0,t+.004,tau);
  const x=osc(ctx,'sine',fk,t,pg);pg.connect(g);srcs.push(x.o)}
 const n=ctx.createBufferSource();n.buffer=noise(ctx);const lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=2500;const ng=ctx.createGain();ng.gain.setValueAtTime(.25,t);ng.gain.setTargetAtTime(0,t,.012);n.connect(lp);lp.connect(ng);ng.connect(g);n.start(t,Math.random());srcs.push(n);
 return{off:offFn(ctx,rel,.35,srcs)}}
function plucked(ctx,dest,f,t,v,o){const{g,rel}=chain(ctx,dest,o.gain*v);const s=ctx.createBufferSource();s.buffer=pluckBuf(ctx,f,o.damp,o.dur,o.bright);const lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=o.cut;s.connect(lp);lp.connect(g);s.start(t);return{off:offFn(ctx,rel,o.rel,[s])}}
function partials(ctx,dest,f,t,v,ratios,gains,taus,vol,relTc){const{g,rel}=chain(ctx,dest,vol*v);const srcs=[];
 ratios.forEach((r,i)=>{if(f*r>12000)return;const pg=ctx.createGain();pg.gain.setValueAtTime(0,t);pg.gain.linearRampToValueAtTime(gains[i],t+.003);pg.gain.setTargetAtTime(0,t+.003,taus[i]);const x=osc(ctx,'sine',f*r,t,pg);pg.connect(g);srcs.push(x.o)});
 return{off:offFn(ctx,rel,relTc,srcs)}}
const PL={guitar:{gain:.7,damp:.996,dur:3,bright:2,cut:3800,rel:.35},harp:{gain:.75,damp:.998,dur:4,bright:1,cut:5500,rel:.5},bass:{gain:.9,damp:.997,dur:3,bright:4,cut:900,rel:.12}};
const TRIM={bass:1.57,bells:1,cello:1.8,drums:1.25,flute:.9,guitar:1.25,harp:1.6,lead:2.1,marimba:1,organ:1.25,pad:1.5,piano:.8,trumpet:2,violin:2.5};
function trimmed(ctx,dest,id){const g=ctx.createGain();g.gain.value=TRIM[id]||1;g.connect(dest);return g}
export function note(ctx,dest,id,f,t,v=1){dest=trimmed(ctx,dest,id);
 f=f*Math.pow(2,META[id].oct||0);
 if(id==='piano')return piano(ctx,dest,f,t,v);
 if(PL[id])return plucked(ctx,dest,f,t,v,PL[id]);
 if(id==='marimba')return partials(ctx,dest,f,t,v,[1,3.93,9.9],[1,.3,.1],[.45,.1,.03],.5,.15);
 if(id==='bells')return partials(ctx,dest,f,t,v,[1,2,2.76,5.4,8.93],[.5,.35,.45,.22,.12],[2.6,1.9,1.3,.8,.45],.38,.5);
 return sustained(ctx,dest,f,t,v,SUS[id]);}
// acorde: lista de frecuencias base (grave opcional) -> {off}
export function chord(ctx,dest,id,freqs,t,v=1){const m=META[id];let fs=freqs.slice();
 if(m.solo)fs=[freqs[0]];else if(m.sub)fs=fs.concat([freqs[0]/2]);
 const vs=fs.map((f,i)=>note(ctx,dest,id,f,t+(m.strum||0)*i,v*(fs.length>2?.8:1)));
 return{off:tt=>vs.forEach(x=>x.off(tt))}}
// percusión
export const DRUMS=['kick','snare','hat','tom','clap','kick2','rim','hatopen','tom2','tom3'];
export function drum(ctx,dest,idx,t,v=1){dest=trimmed(ctx,dest,'drums');const k=DRUMS[(idx-1)%DRUMS.length];const out=ctx.createGain();out.gain.value=v;out.connect(dest);
 const nz=(dur,type,fq,q,gn,tc)=>{const n=ctx.createBufferSource();n.buffer=noise(ctx);const fl=ctx.createBiquadFilter();fl.type=type;fl.frequency.value=fq;fl.Q.value=q;const g=ctx.createGain();g.gain.setValueAtTime(gn,t);g.gain.setTargetAtTime(0,t,tc);n.connect(fl);fl.connect(g);g.connect(out);n.start(t,Math.random());n.stop(t+dur)};
 const sw=(f0,f1,dur,gn,tc,type='sine')=>{const o=ctx.createOscillator();o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(f1,t+dur*.5);const g=ctx.createGain();g.gain.setValueAtTime(gn,t);g.gain.setTargetAtTime(0,t,tc);o.connect(g);g.connect(out);o.start(t);o.stop(t+dur)};
 if(k==='kick'){sw(160,45,.5,1,.11)}
 else if(k==='kick2'){sw(110,38,.7,1.1,.18)}
 else if(k==='snare'){nz(.4,'bandpass',1900,.7,.8,.07);sw(220,160,.2,.5,.05,'triangle')}
 else if(k==='rim'){nz(.1,'bandpass',3000,1.5,.6,.012);sw(520,380,.1,.6,.02,'square')}
 else if(k==='hat'){nz(.15,'highpass',7500,.5,.5,.03)}
 else if(k==='hatopen'){nz(.8,'highpass',6500,.5,.5,.2)}
 else if(k==='clap'){for(let i=0;i<3;i++){const tt=t+i*.011;const n=ctx.createBufferSource();n.buffer=noise(ctx);const fl=ctx.createBiquadFilter();fl.type='bandpass';fl.frequency.value=1300;fl.Q.value=1.2;const g=ctx.createGain();g.gain.setValueAtTime(.8,tt);g.gain.setTargetAtTime(0,tt,i<2?.006:.08);n.connect(fl);fl.connect(g);g.connect(out);n.start(tt,Math.random());n.stop(tt+.5)}}
 else if(k==='tom'){sw(260,150,.6,.9,.15)}
 else if(k==='tom2'){sw(190,110,.7,.9,.18)}
 else {sw(140,80,.8,.95,.22)}}
export const SCALE=[0,2,4,5,7,9,11,12,14,16];
export const CHORDS=[null,[261.63,329.63,392.0],[196.0,246.94,293.66],[220.0,261.63,329.63],[174.61,220.0,261.63],[164.81,246.94,329.63]];
export const noteFreq=(deg,oct)=>261.63*Math.pow(2,(SCALE[deg-1]+12*oct)/12);
