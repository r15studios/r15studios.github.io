import {HandLandmarker, FilesetResolver} from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.20/vision_bundle.mjs';
import {INSTRUMENTS,meta,note,chord,drum,CHORDS,SCALE} from './synth.js';
const NAMES={ // instrumentos
es:{pad:'Sintetizador suave',piano:'Piano',guitar:'Guitarra',harp:'Arpa',violin:'Violín',cello:'Violonchelo',flute:'Flauta',organ:'Órgano',marimba:'Marimba',bells:'Campanas',trumpet:'Trompeta',lead:'Sinte lead',bass:'Bajo',drums:'Percusión'},
en:{pad:'Soft synth',piano:'Piano',guitar:'Guitar',harp:'Harp',violin:'Violin',cello:'Cello',flute:'Flute',organ:'Organ',marimba:'Marimba',bells:'Bells',trumpet:'Trumpet',lead:'Lead synth',bass:'Bass',drums:'Drums'},
fr:{pad:'Synthé doux',piano:'Piano',guitar:'Guitare',harp:'Harpe',violin:'Violon',cello:'Violoncelle',flute:'Flûte',organ:'Orgue',marimba:'Marimba',bells:'Cloches',trumpet:'Trompette',lead:'Synthé lead',bass:'Basse',drums:'Percussions'},
de:{pad:'Weicher Synth',piano:'Klavier',guitar:'Gitarre',harp:'Harfe',violin:'Geige',cello:'Cello',flute:'Flöte',organ:'Orgel',marimba:'Marimba',bells:'Glocken',trumpet:'Trompete',lead:'Lead-Synth',bass:'Bass',drums:'Schlagzeug'},
it:{pad:'Synth morbido',piano:'Pianoforte',guitar:'Chitarra',harp:'Arpa',violin:'Violino',cello:'Violoncello',flute:'Flauto',organ:'Organo',marimba:'Marimba',bells:'Campane',trumpet:'Tromba',lead:'Synth lead',bass:'Basso',drums:'Percussioni'},
pt:{pad:'Sintetizador suave',piano:'Piano',guitar:'Guitarra',harp:'Harpa',violin:'Violino',cello:'Violoncelo',flute:'Flauta',organ:'Órgão',marimba:'Marimba',bells:'Sinos',trumpet:'Trompete',lead:'Sintetizador lead',bass:'Baixo',drums:'Percussão'},
tr:{pad:'Yumuşak synth',piano:'Piyano',guitar:'Gitar',harp:'Arp',violin:'Keman',cello:'Çello',flute:'Flüt',organ:'Org',marimba:'Marimba',bells:'Çanlar',trumpet:'Trompet',lead:'Lead synth',bass:'Bas',drums:'Davul'}};
const T={
es:{intro:'Pon la mano delante de la cámara y toca con los dedos. Elige instrumento y modo arriba. El "?" muestra la chuleta.',start:'Empezar',loading:'Cargando…',credit:'Hecha por',nohand:'Enseña la mano',cam:'No se pudo abrir la cámara. Permite el acceso en el navegador.',silence:'silencio',modes:['Acordes','Notas','Binario 1-31'],chul:'Chuleta',close:'Cerrar',fi:['pulgar','índice','corazón','anular','meñique'],m0:'Cuenta los dedos levantados: cada número es un acorde.',m1:'Pulgar+índice+corazón forman el número de la nota (1-7, escala de Do mayor). Anular y meñique cambian la octava. Si los tres primeros están bajos, no suena nada.',m2:'Cada dedo vale un número: pulgar 1, índice 2, corazón 4, anular 8, meñique 16. Suma los levantados (1-31) y suena esa nota cromática desde Do4.',oct:'Octava',note:'Nota',fingers:n=>n+(n==1?' dedo':' dedos'),solf:true},
en:{intro:'Hold your hand in front of the camera and play with your fingers. Pick instrument and mode above. "?" shows the cheat sheet.',start:'Start',loading:'Loading…',credit:'Made by',nohand:'Show your hand',cam:'Could not open the camera. Allow access in the browser.',silence:'silence',modes:['Chords','Notes','Binary 1-31'],chul:'Cheat sheet',close:'Close',fi:['thumb','index','middle','ring','pinky'],m0:'Count the raised fingers: each number is a chord.',m1:'Thumb+index+middle make the note number (1-7, C major scale). Ring and pinky change the octave. If the first three are down, nothing plays.',m2:'Each finger has a value: thumb 1, index 2, middle 4, ring 8, pinky 16. Add the raised ones (1-31) and that chromatic note plays, starting at C4.',oct:'Octave',note:'Note',fingers:n=>n+(n==1?' finger':' fingers'),solf:false},
fr:{intro:'Place la main devant la caméra et joue avec les doigts. Choisis instrument et mode en haut. Le "?" montre l’aide-mémoire.',start:'Commencer',loading:'Chargement…',credit:'Créé par',nohand:'Montre ta main',cam:'Impossible d’ouvrir la caméra. Autorise l’accès dans le navigateur.',silence:'silence',modes:['Accords','Notes','Binaire 1-31'],chul:'Aide-mémoire',close:'Fermer',fi:['pouce','index','majeur','annulaire','auriculaire'],m0:'Compte les doigts levés : chaque nombre est un accord.',m1:'Pouce+index+majeur donnent le numéro de la note (1-7, gamme de Do majeur). Annulaire et auriculaire changent l’octave.',m2:'Chaque doigt vaut : pouce 1, index 2, majeur 4, annulaire 8, auriculaire 16. Additionne les doigts levés (1-31) : note chromatique depuis Do4.',oct:'Octave',note:'Note',fingers:n=>n+(n==1?' doigt':' doigts'),solf:true},
de:{intro:'Halte die Hand vor die Kamera und spiele mit den Fingern. Wähle oben Instrument und Modus. "?" zeigt den Spickzettel.',start:'Start',loading:'Lädt…',credit:'Gemacht von',nohand:'Zeig deine Hand',cam:'Kamera konnte nicht geöffnet werden. Zugriff im Browser erlauben.',silence:'Stille',modes:['Akkorde','Töne','Binär 1-31'],chul:'Spickzettel',close:'Schließen',fi:['Daumen','Zeige','Mittel','Ring','Klein'],m0:'Zähle die gestreckten Finger: jede Zahl ist ein Akkord.',m1:'Daumen+Zeige+Mittel bilden die Tonnummer (1-7, C-Dur). Ring- und kleiner Finger wechseln die Oktave.',m2:'Wert je Finger: Daumen 1, Zeige 2, Mittel 4, Ring 8, Klein 16. Summe der gestreckten (1-31) ergibt den chromatischen Ton ab C4.',oct:'Oktave',note:'Ton',fingers:n=>n+' Finger',solf:false},
it:{intro:'Metti la mano davanti alla fotocamera e suona con le dita. Scegli strumento e modalità in alto. Il "?" mostra il promemoria.',start:'Inizia',loading:'Caricamento…',credit:'Fatto da',nohand:'Mostra la mano',cam:'Impossibile aprire la fotocamera. Consenti l’accesso nel browser.',silence:'silenzio',modes:['Accordi','Note','Binario 1-31'],chul:'Promemoria',close:'Chiudi',fi:['pollice','indice','medio','anulare','mignolo'],m0:'Conta le dita alzate: ogni numero è un accordo.',m1:'Pollice+indice+medio formano il numero della nota (1-7, scala di Do maggiore). Anulare e mignolo cambiano l’ottava.',m2:'Valore: pollice 1, indice 2, medio 4, anulare 8, mignolo 16. Somma le dita alzate (1-31): nota cromatica da Do4.',oct:'Ottava',note:'Nota',fingers:n=>n+(n==1?' dito':' dita'),solf:true},
pt:{intro:'Põe a mão à frente da câmara e toca com os dedos. Escolhe instrumento e modo em cima. O "?" mostra a cábula.',start:'Começar',loading:'A carregar…',credit:'Feito por',nohand:'Mostra a mão',cam:'Não foi possível abrir a câmara. Permite o acesso no navegador.',silence:'silêncio',modes:['Acordes','Notas','Binário 1-31'],chul:'Cábula',close:'Fechar',fi:['polegar','indicador','médio','anelar','mindinho'],m0:'Conta os dedos levantados: cada número é um acorde.',m1:'Polegar+indicador+médio formam o número da nota (1-7, escala de Dó maior). Anelar e mindinho mudam a oitava.',m2:'Valor: polegar 1, indicador 2, médio 4, anelar 8, mindinho 16. Soma os levantados (1-31): nota cromática a partir de Dó4.',oct:'Oitava',note:'Nota',fingers:n=>n+(n==1?' dedo':' dedos'),solf:true},
tr:{intro:'Elini kameranın önüne tut ve parmaklarınla çal. Yukarıdan enstrüman ve mod seç. "?" kopya kâğıdını gösterir.',start:'Başla',loading:'Yükleniyor…',credit:'Yapan:',nohand:'Elini göster',cam:'Kamera açılamadı. Tarayıcıda erişime izin ver.',silence:'sessizlik',modes:['Akorlar','Notalar','İkili 1-31'],chul:'Kopya kâğıdı',close:'Kapat',fi:['başparmak','işaret','orta','yüzük','serçe'],m0:'Kalkık parmakları say: her sayı bir akor.',m1:'Başparmak+işaret+orta nota numarasını verir (1-7, Do majör). Yüzük ve serçe oktavı değiştirir.',m2:'Değerler: başparmak 1, işaret 2, orta 4, yüzük 8, serçe 16. Kalkık parmakların toplamı (1-31) Do4’ten başlayan kromatik notayı çalar.',oct:'Oktav',note:'Nota',fingers:n=>n+' parmak',solf:true}};
const CHN=['','C','G','Am','F','Em'];
const S12=['Do','Do#','Re','Re#','Mi','Fa','Fa#','Sol','Sol#','La','La#','Si'],L12=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const $=s=>document.querySelector(s);
let lang=localStorage.lang||(navigator.language||'es').slice(0,2);if(!T[lang])lang='es';
let inst=localStorage.inst||'pad',mode=+(localStorage.mode||0);if(!INSTRUMENTS.includes(inst))inst='pad';
const q=new URLSearchParams(location.search);if(q.get('inst')&&INSTRUMENTS.includes(q.get('inst')))inst=q.get('inst');if(q.get('mode'))mode=+q.get('mode');
const nm=(semi,oct)=>{let s=((semi%12)+12)%12,o=4+oct+Math.floor(semi/12);const n=T[lang].solf?S12[s]:(lang==='de'&&s===11?'H':L12[s]);return n+o};
// valor de dedos -> {tipo, ...}
function decode(bits){const v=bits.reduce((a,b,i)=>a+(b?1<<i:0),0);if(!v)return null;
 if(mode===0){const n=bits.filter(Boolean).length;return n?{key:'c'+n,n,label:CHN[n],ch:CHORDS[n],idx:n}:null}
 if(mode===1){const d=v&7;if(!d)return null;const o=(bits[3]?1:0)+(bits[4]?-1:0)*(bits[3]?0:1)+(bits[3]&&bits[4]?1:0)*0;
  const oct=bits[3]&&bits[4]?2:bits[3]?1:bits[4]?-1:0;return{key:'n'+d+'/'+oct,label:nm(SCALE[d-1],oct),f:261.63*Math.pow(2,(SCALE[d-1]+12*oct)/12),idx:d}}
 return{key:'b'+v,label:nm(v-1,0),f:261.63*Math.pow(2,(v-1)/12),idx:v}}
const dots=bits=>bits.map(b=>b?'●':'○').join('');
function sheet(){const t=T[lang];let h=`<h2>${t.chul}</h2><p>${t['m'+mode]}</p><p style="font-size:12px;opacity:.7">${t.fi.join(' · ')}</p>`;
 const row=(bits,lab,id)=>`<div class="r" id="${id}"><span class="dots">${dots(bits)}</span><b>${lab}</b></div>`;
 const B=v=>[0,1,2,3,4].map(i=>!!(v&(1<<i)));
 if(mode===0){h+='<div class="rows">'+[1,2,3,4,5].map(n=>row(B((1<<n)-1),CHN[n]+' ('+t.fingers(n)+')','s'+n)).join('')+'</div>'}
 else if(mode===1){h+='<div class="rows">'+[1,2,3,4,5,6,7].map(d=>row(B(d),nm(SCALE[d-1],0).replace(/\d/,'')+' = '+d,'sd'+d)).join('')+'</div><p><b>'+t.oct+'</b></p><div class="rows">'+[[0,'4'],[8,'5'],[16,'3'],[24,'6']].map(([v,o])=>row(B(v),t.oct+' '+o,'so'+o)).join('')+'</div>'}
 else{h+='<div class="rows">'+Array.from({length:31},(_,i)=>i+1).map(v=>row(B(v),v+' → '+nm(v-1,0),'sb'+v)).join('')+'</div>'}
 h+=`<button class="close" id="cl">${t.close}</button>`;$('#sheet').innerHTML=h;$('#cl').onclick=()=>$('#sheet').classList.remove('open')}
function applyLang(){const t=T[lang];document.documentElement.lang=lang;$('#lang').value=lang;localStorage.lang=lang;
 document.querySelectorAll('[data-i]').forEach(e=>e.textContent=t[e.dataset.i]);
 $('#inst').innerHTML=INSTRUMENTS.map(i=>`<option value="${i}">${NAMES[lang][i]}</option>`).join('');$('#inst').value=inst;
 $('#mode').innerHTML=t.modes.map((m,i)=>`<option value="${i}">${m}</option>`).join('');$('#mode').value=mode;
 $('#help').setAttribute('aria-label',t.chul);buildBar();sheet()}
function buildBar(){const n=mode===0?5:mode===1?7:0;const t=T[lang];
 $('#bar').innerHTML=mode===0?CHORDS.slice(1).map((c,i)=>`<div class="k" id="k${i+1}"><b>${CHN[i+1]}</b><small>${i+1}</small></div>`).join(''):mode===1?[1,2,3,4,5,6,7].map(d=>`<div class="k" id="k${d}"><b>${nm(SCALE[d-1],0).replace(/\d/,'')}</b><small>${d}</small></div>`).join(''):`<div style="flex:1;text-align:center;opacity:.7;padding:10px;font-size:13px">${t.m2.split('.')[0]}.</div>`}
$('#lang').onchange=e=>{lang=e.target.value;applyLang()};
$('#inst').onchange=e=>{inst=e.target.value;localStorage.inst=inst;release();cur=null};
$('#mode').onchange=e=>{mode=+e.target.value;localStorage.mode=mode;release();cur=null;lastKey='';applyLang()};
$('#help').onclick=()=>$('#sheet').classList.toggle('open');
// audio
let ac,master,voice=null,rep=null;
function initAudio(){ac=new (window.AudioContext||window.webkitAudioContext)();master=ac.createGain();master.gain.value=.5;const lp=ac.createBiquadFilter();lp.type='lowpass';lp.frequency.value=9000;master.connect(lp);lp.connect(ac.destination)}
function release(){if(voice){voice.off(ac.currentTime);voice=null}if(rep){clearInterval(rep);rep=null}}
function sound(c){release();if(!c)return;const t=ac.currentTime+.01;
 if(meta(inst).perc){drum(ac,master,c.idx,t);rep=setInterval(()=>drum(ac,master,c.idx,ac.currentTime+.01,.9),420);return}
 voice=c.ch?chord(ac,master,inst,c.ch,t):note(ac,master,inst,c.f,t)}
// dedos (pulgar, índice, corazón, anular, meñique)
const d=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function fingers(l){const w=l[0];const f=[[8,6],[12,10],[16,14],[20,18]].map(([t,p])=>d(l[t],w)>d(l[p],w)*1.12);
 const th=d(l[4],l[17])>d(l[3],l[17])*1.1&&d(l[4],l[5])>d(l[3],l[5])*.9&&d(l[4],l[17])>d(l[2],l[17])*.95;return [th].concat(f)}
let lm,stream,lastKey='',stable=0,lastT=-1,cur=null;
async function start(){
 $('#err').textContent='';$('#go').textContent=T[lang].loading;$('#go').disabled=true;
 try{initAudio();await ac.resume();
  stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:640},height:{ideal:480}},audio:false});
  const v=$('#v');v.srcObject=stream;await v.play();
  const fs=await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.20/wasm');
  const opts=g=>({baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',delegate:g},runningMode:'VIDEO',numHands:1,minHandDetectionConfidence:.5,minTrackingConfidence:.5});
  try{lm=await HandLandmarker.createFromOptions(fs,opts('GPU'))}catch(e){lm=await HandLandmarker.createFromOptions(fs,opts('CPU'))}
  $('#start').remove();loop();
 }catch(e){console.error(e);$('#err').textContent=(e&&e.name&&/NotAllowed|NotFound|Overconstrained/.test(e.name))?T[lang].cam:String(e.message||e);$('#go').textContent=T[lang].start;$('#go').disabled=false}}
function mark(c){document.querySelectorAll('.k').forEach(k=>k.classList.remove('on'));document.querySelectorAll('.r.on').forEach(k=>k.classList.remove('on'));
 if(!c)return;if(mode===0){$('#k'+c.n)?.classList.add('on');$('#s'+c.n)?.classList.add('on')}
 else if(mode===1){const m=c.key.match(/n(\d)\/(-?\d)/);const o=4+ +m[2];$('#k'+m[1])?.classList.add('on');$('#sd'+m[1])?.classList.add('on');$('#so'+o)?.classList.add('on')}
 else $('#sb'+c.key.slice(1))?.classList.add('on')}
function loop(){requestAnimationFrame(loop);const v=$('#v');if(v.readyState<2||v.currentTime===lastT)return;lastT=v.currentTime;
 const c=$('#c'),x=c.getContext('2d');if(c.width!==v.videoWidth){c.width=v.videoWidth;c.height=v.videoHeight}
 x.clearRect(0,0,c.width,c.height);const r=lm.detectForVideo(v,performance.now());let bits=null,k='none';
 if(r.landmarks&&r.landmarks[0]){const l=r.landmarks[0];bits=fingers(l);const dc=decode(bits);k=dc?dc.key:'none';
  x.strokeStyle='#ffb347';x.fillStyle='#fff';x.lineWidth=3;
  [[0,1,2,3,4],[0,5,6,7,8],[9,10,11,12],[13,14,15,16],[0,17,18,19,20],[5,9,13,17]].forEach(s=>{x.beginPath();s.forEach((i,j)=>j?x.lineTo(l[i].x*c.width,l[i].y*c.height):x.moveTo(l[i].x*c.width,l[i].y*c.height));x.stroke()});
  l.forEach(p=>{x.beginPath();x.arc(p.x*c.width,p.y*c.height,4,0,7);x.fill()})}
 $('#pat').textContent=bits?dots(bits):'';
 if(k===lastKey)stable++;else{stable=0;lastKey=k}
 if(stable===4&&k!==(cur&&cur.key||'none')||(stable===4&&cur===null&&k==='none')){cur=bits?decode(bits):null;mark(cur);sound(cur);
  $('#chord').textContent=cur?cur.label:'–';$('#fingers').textContent=!bits?T[lang].nohand:(cur?'':T[lang].silence)}}
$('#go').onclick=start;applyLang();
// CDN build requires an internet connection.
if(q.has('auto'))start();
