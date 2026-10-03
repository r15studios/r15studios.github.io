import {HandLandmarker, FilesetResolver} from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.20/vision_bundle.mjs';
import {INSTRUMENTS,meta,note,chord,drum,CHORDS,SCALE,makeBus} from './synth.js';
const NAMES={ // instrumentos
es:{pad:'Sintetizador suave',piano:'Piano',guitar:'Guitarra',harp:'Arpa',violin:'Violín',cello:'Violonchelo',flute:'Flauta',organ:'Órgano',marimba:'Marimba',bells:'Campanas',trumpet:'Trompeta',lead:'Sinte lead',bass:'Bajo',drums:'Percusión'},
en:{pad:'Soft synth',piano:'Piano',guitar:'Guitar',harp:'Harp',violin:'Violin',cello:'Cello',flute:'Flute',organ:'Organ',marimba:'Marimba',bells:'Bells',trumpet:'Trumpet',lead:'Lead synth',bass:'Bass',drums:'Drums'},
fr:{pad:'Synthé doux',piano:'Piano',guitar:'Guitare',harp:'Harpe',violin:'Violon',cello:'Violoncelle',flute:'Flûte',organ:'Orgue',marimba:'Marimba',bells:'Cloches',trumpet:'Trompette',lead:'Synthé lead',bass:'Basse',drums:'Percussions'},
de:{pad:'Weicher Synth',piano:'Klavier',guitar:'Gitarre',harp:'Harfe',violin:'Geige',cello:'Cello',flute:'Flöte',organ:'Orgel',marimba:'Marimba',bells:'Glocken',trumpet:'Trompete',lead:'Lead-Synth',bass:'Bass',drums:'Schlagzeug'},
it:{pad:'Synth morbido',piano:'Pianoforte',guitar:'Chitarra',harp:'Arpa',violin:'Violino',cello:'Violoncello',flute:'Flauto',organ:'Organo',marimba:'Marimba',bells:'Campane',trumpet:'Tromba',lead:'Synth lead',bass:'Basso',drums:'Percussioni'},
pt:{pad:'Sintetizador suave',piano:'Piano',guitar:'Guitarra',harp:'Harpa',violin:'Violino',cello:'Violoncelo',flute:'Flauta',organ:'Órgão',marimba:'Marimba',bells:'Sinos',trumpet:'Trompete',lead:'Sintetizador lead',bass:'Baixo',drums:'Percussão'},
tr:{pad:'Yumuşak synth',piano:'Piyano',guitar:'Gitar',harp:'Arp',violin:'Keman',cello:'Çello',flute:'Flüt',organ:'Org',marimba:'Marimba',bells:'Çanlar',trumpet:'Trompet',lead:'Lead synth',bass:'Bas',drums:'Davul'}};
const T={
es:{intro:'Pon la mano delante de la cámara y toca con los dedos. Elige instrumento y modo arriba. El "?" muestra la chuleta.',start:'Empezar',nocam:'Probar sonidos sin cámara',loading:'Cargando…',credit:'Hecha por',nohand:'Enseña la mano',cam:'No se pudo abrir la cámara. Permite el acceso en el navegador.',silence:'silencio',modes:['Acordes','Notas','Binario 1-31','Dedo = nota','Contar 2 manos','Nota + octava'],chul:'Chuleta',close:'Cerrar',fi:['pulgar','índice','corazón','anular','meñique'],m0:'Cuenta los dedos levantados: cada número es un acorde.',m1:'Pulgar+índice+corazón forman el número de la nota (1-7, escala de Do mayor). Anular y meñique cambian la octava. Si los tres primeros están bajos, no suena nada.',m2:'Cada dedo vale un número: pulgar 1, índice 2, corazón 4, anular 8, meñique 16. Suma los levantados (1-31) y suena esa nota cromática desde Do4.',m3:'Dos manos a la vez. Mano derecha: notas agudas (las 5 notas de la escala, de pulgar a meñique). Mano izquierda: las mismas notas una octava más grave. Cada dedo levantado suena; si bajas uno, solo se apaga el suyo.',m5:'Una mano toca la nota y la otra elige la octava. Mano derecha: cuántos dedos levantas (1 a 5) = las 5 notas de la escala. Mano izquierda: puño = octava grave, 1-2 dedos = media, 3-5 dedos = aguda. Sin mano izquierda suena la media. Sin combinaciones incómodas.',sc:['Pentatónica', 'Mayor', 'Pent. menor', 'Menor'],m4:'Cada mano toca UNA nota según cuántos dedos levantas, da igual cuáles (1 a 5 = las 5 notas de la escala). Derecha aguda, izquierda grave. Puño: silencio. Sin combinaciones incómodas.',hd:['Mano derecha (agudo)', 'Mano izquierda (grave)'],oct:'Octava',note:'Nota',fingers:n=>n+(n==1?' dedo':' dedos'),solf:true},
en:{intro:'Hold your hand in front of the camera and play with your fingers. Pick instrument and mode above. "?" shows the cheat sheet.',start:'Start',nocam:'Try sounds without camera',loading:'Loading…',credit:'Made by',nohand:'Show your hand',cam:'Could not open the camera. Allow access in the browser.',silence:'silence',modes:['Chords','Notes','Binary 1-31','Finger = note','Count 2 hands','Note + octave'],chul:'Cheat sheet',close:'Close',fi:['thumb','index','middle','ring','pinky'],m0:'Count the raised fingers: each number is a chord.',m1:'Thumb+index+middle make the note number (1-7, C major scale). Ring and pinky change the octave. If the first three are down, nothing plays.',m2:'Each finger has a value: thumb 1, index 2, middle 4, ring 8, pinky 16. Add the raised ones (1-31) and that chromatic note plays, starting at C4.',m3:'Two hands at once. Right hand: high notes (the 5 scale notes, thumb to pinky). Left hand: the same notes one octave lower. Every raised finger sounds; lower one and only its note stops.',m5:'One hand plays the note, the other picks the octave. Right hand: how many fingers you raise (1 to 5) = the 5 scale notes. Left hand: fist = low octave, 1-2 fingers = middle, 3-5 fingers = high. No left hand = middle. No awkward combinations.',sc:['Pentatonic', 'Major', 'Minor pent.', 'Minor'],m4:'Each hand plays ONE note depending on how many fingers you raise, whichever ones (1 to 5 = the 5 scale notes). Right high, left low. Fist: silence. No awkward combinations.',hd:['Right hand (high)', 'Left hand (low)'],oct:'Octave',note:'Note',fingers:n=>n+(n==1?' finger':' fingers'),solf:false},
fr:{intro:'Place la main devant la caméra et joue avec les doigts. Choisis instrument et mode en haut. Le "?" montre l’aide-mémoire.',start:'Commencer',nocam:'Essayer sans caméra',loading:'Chargement…',credit:'Créé par',nohand:'Montre ta main',cam:'Impossible d’ouvrir la caméra. Autorise l’accès dans le navigateur.',silence:'silence',modes:['Accords','Notes','Binaire 1-31','Doigt = note','Compter 2 mains','Note + octave'],chul:'Aide-mémoire',close:'Fermer',fi:['pouce','index','majeur','annulaire','auriculaire'],m0:'Compte les doigts levés : chaque nombre est un accord.',m1:'Pouce+index+majeur donnent le numéro de la note (1-7, gamme de Do majeur). Annulaire et auriculaire changent l’octave.',m2:'Chaque doigt vaut : pouce 1, index 2, majeur 4, annulaire 8, auriculaire 16. Additionne les doigts levés (1-31) : note chromatique depuis Do4.',m3:'Deux mains en même temps. Main droite : notes aiguës (les 5 notes de la gamme, du pouce à l’auriculaire). Main gauche : les mêmes notes une octave plus bas. Chaque doigt levé sonne.',m5:'Une main joue la note, l’autre choisit l’octave. Main droite : nombre de doigts levés (1 à 5) = les 5 notes de la gamme. Main gauche : poing = octave grave, 1-2 doigts = moyenne, 3-5 = aiguë. Sans main gauche : moyenne.',sc:['Pentatonique', 'Majeure', 'Pent. mineure', 'Mineure'],m4:'Chaque main joue UNE note selon le nombre de doigts levés, peu importe lesquels (1 à 5 = les 5 notes de la gamme). Droite aiguë, gauche grave. Poing : silence.',hd:['Main droite (aigu)', 'Main gauche (grave)'],oct:'Octave',note:'Note',fingers:n=>n+(n==1?' doigt':' doigts'),solf:true},
de:{intro:'Halte die Hand vor die Kamera und spiele mit den Fingern. Wähle oben Instrument und Modus. "?" zeigt den Spickzettel.',start:'Start',nocam:'Ohne Kamera testen',loading:'Lädt…',credit:'Gemacht von',nohand:'Zeig deine Hand',cam:'Kamera konnte nicht geöffnet werden. Zugriff im Browser erlauben.',silence:'Stille',modes:['Akkorde','Töne','Binär 1-31','Finger = Ton','Zählen 2 Hände','Ton + Oktave'],chul:'Spickzettel',close:'Schließen',fi:['Daumen','Zeige','Mittel','Ring','Klein'],m0:'Zähle die gestreckten Finger: jede Zahl ist ein Akkord.',m1:'Daumen+Zeige+Mittel bilden die Tonnummer (1-7, C-Dur). Ring- und kleiner Finger wechseln die Oktave.',m2:'Wert je Finger: Daumen 1, Zeige 2, Mittel 4, Ring 8, Klein 16. Summe der gestreckten (1-31) ergibt den chromatischen Ton ab C4.',m3:'Zwei Hände gleichzeitig. Rechte Hand: hohe Töne (die 5 Skalentöne, Daumen bis kleiner Finger). Linke Hand: dieselben Töne eine Oktave tiefer. Jeder gestreckte Finger klingt.',m5:'Eine Hand spielt den Ton, die andere wählt die Oktave. Rechte Hand: Zahl der gestreckten Finger (1 bis 5) = die 5 Skalentöne. Linke Hand: Faust = tiefe Oktave, 1-2 Finger = mittlere, 3-5 = hohe. Ohne linke Hand: mittlere.',sc:['Pentatonik', 'Dur', 'Moll-Pent.', 'Moll'],m4:'Jede Hand spielt EINEN Ton je nach Anzahl der gestreckten Finger, egal welche (1 bis 5 = die 5 Skalentöne). Rechts hoch, links tief. Faust: Stille.',hd:['Rechte Hand (hoch)', 'Linke Hand (tief)'],oct:'Oktave',note:'Ton',fingers:n=>n+' Finger',solf:false},
it:{intro:'Metti la mano davanti alla fotocamera e suona con le dita. Scegli strumento e modalità in alto. Il "?" mostra il promemoria.',start:'Inizia',nocam:'Prova senza fotocamera',loading:'Caricamento…',credit:'Fatto da',nohand:'Mostra la mano',cam:'Impossibile aprire la fotocamera. Consenti l’accesso nel browser.',silence:'silenzio',modes:['Accordi','Note','Binario 1-31','Dito = nota','Conta 2 mani','Nota + ottava'],chul:'Promemoria',close:'Chiudi',fi:['pollice','indice','medio','anulare','mignolo'],m0:'Conta le dita alzate: ogni numero è un accordo.',m1:'Pollice+indice+medio formano il numero della nota (1-7, scala di Do maggiore). Anulare e mignolo cambiano l’ottava.',m2:'Valore: pollice 1, indice 2, medio 4, anulare 8, mignolo 16. Somma le dita alzate (1-31): nota cromatica da Do4.',m3:'Due mani insieme. Mano destra: note acute (le 5 note della scala, da pollice a mignolo). Mano sinistra: le stesse note un’ottava sotto. Ogni dito alzato suona.',m5:'Una mano suona la nota, l’altra sceglie l’ottava. Mano destra: quante dita alzi (1-5) = le 5 note della scala. Mano sinistra: pugno = ottava grave, 1-2 dita = media, 3-5 = acuta. Senza mano sinistra: media.',sc:['Pentatonica', 'Maggiore', 'Pent. minore', 'Minore'],m4:'Ogni mano suona UNA nota in base a quante dita alzi, qualunque siano (1-5 = le 5 note della scala). Destra acuta, sinistra grave. Pugno: silenzio.',hd:['Mano destra (acuto)', 'Mano sinistra (grave)'],oct:'Ottava',note:'Nota',fingers:n=>n+(n==1?' dito':' dita'),solf:true},
pt:{intro:'Põe a mão à frente da câmara e toca com os dedos. Escolhe instrumento e modo em cima. O "?" mostra a cábula.',start:'Começar',nocam:'Experimentar sem câmara',loading:'A carregar…',credit:'Feito por',nohand:'Mostra a mão',cam:'Não foi possível abrir a câmara. Permite o acesso no navegador.',silence:'silêncio',modes:['Acordes','Notas','Binário 1-31','Dedo = nota','Contar 2 mãos','Nota + oitava'],chul:'Cábula',close:'Fechar',fi:['polegar','indicador','médio','anelar','mindinho'],m0:'Conta os dedos levantados: cada número é um acorde.',m1:'Polegar+indicador+médio formam o número da nota (1-7, escala de Dó maior). Anelar e mindinho mudam a oitava.',m2:'Valor: polegar 1, indicador 2, médio 4, anelar 8, mindinho 16. Soma os levantados (1-31): nota cromática a partir de Dó4.',m3:'Duas mãos ao mesmo tempo. Mão direita: notas agudas (as 5 notas da escala, do polegar ao mindinho). Mão esquerda: as mesmas notas uma oitava abaixo. Cada dedo levantado soa.',m5:'Uma mão toca a nota e a outra escolhe a oitava. Mão direita: quantos dedos levantas (1 a 5) = as 5 notas da escala. Mão esquerda: punho = oitava grave, 1-2 dedos = média, 3-5 = aguda. Sem mão esquerda: média.',sc:['Pentatónica', 'Maior', 'Pent. menor', 'Menor'],m4:'Cada mão toca UMA nota conforme quantos dedos levantas, quaisquer que sejam (1 a 5 = as 5 notas da escala). Direita aguda, esquerda grave. Punho: silêncio.',hd:['Mão direita (agudo)', 'Mão esquerda (grave)'],oct:'Oitava',note:'Nota',fingers:n=>n+(n==1?' dedo':' dedos'),solf:true},
tr:{intro:'Elini kameranın önüne tut ve parmaklarınla çal. Yukarıdan enstrüman ve mod seç. "?" kopya kâğıdını gösterir.',start:'Başla',nocam:'Kamerasız dene',loading:'Yükleniyor…',credit:'Yapan:',nohand:'Elini göster',cam:'Kamera açılamadı. Tarayıcıda erişime izin ver.',silence:'sessizlik',modes:['Akorlar','Notalar','İkili 1-31','Parmak = nota','Say 2 el','Nota + oktav'],chul:'Kopya kâğıdı',close:'Kapat',fi:['başparmak','işaret','orta','yüzük','serçe'],m0:'Kalkık parmakları say: her sayı bir akor.',m1:'Başparmak+işaret+orta nota numarasını verir (1-7, Do majör). Yüzük ve serçe oktavı değiştirir.',m2:'Değerler: başparmak 1, işaret 2, orta 4, yüzük 8, serçe 16. Kalkık parmakların toplamı (1-31) Do4’ten başlayan kromatik notayı çalar.',m3:'İki el aynı anda. Sağ el: tiz notalar (5 gam notası, başparmaktan serçeye). Sol el: aynı notalar bir oktav pes. Kalkık her parmak çalar.',m5:'Bir el notayı çalar, öteki oktavı seçer. Sağ el: kaldırdığın parmak sayısı (1-5) = gamın 5 notası. Sol el: yumruk = pes oktav, 1-2 parmak = orta, 3-5 = tiz. Sol el yoksa orta.',sc:['Pentatonik', 'Majör', 'Minör pent.', 'Minör'],m4:'Her el, hangi parmaklar olursa olsun, kaç parmak kaldırdığına göre TEK nota çalar (1-5 = 5 gam notası). Sağ tiz, sol pes. Yumruk: sessizlik.',hd:['Sağ el (tiz)', 'Sol el (pes)'],oct:'Oktav',note:'Nota',fingers:n=>n+' parmak',solf:true}};
const CHR=[0,7,9,5,4],CHM=['','','m','','m'];let TR=+(localStorage.tr||0);const K=()=>Math.pow(2,TR/12);
const S12=['Do','Do#','Re','Re#','Mi','Fa','Fa#','Sol','Sol#','La','La#','Si'],L12=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const $=s=>document.querySelector(s);
let lang=localStorage.lang||(navigator.language||'es').slice(0,2);if(!T[lang])lang='es';
let inst=localStorage.inst||'pad',mode=+(localStorage.mode||5);if(!INSTRUMENTS.includes(inst))inst='pad';
const q=new URLSearchParams(location.search);if(q.get('inst')&&INSTRUMENTS.includes(q.get('inst')))inst=q.get('inst');if(q.get('mode'))mode=+q.get('mode');
const nm=(semi,oct)=>{semi+=TR;let s=((semi%12)+12)%12,o=4+oct+Math.floor(semi/12);const n=T[lang].solf?S12[s]:(lang==='de'&&s===11?'H':L12[s]);return n+o};
// valor de dedos -> {tipo, ...}
function decode(bits){const v=bits.reduce((a,b,i)=>a+(b?1<<i:0),0);if(!v)return null;
 if(mode===0){const n=bits.filter(Boolean).length;return n?{key:'c'+n,n,label:chn(n),ch:CHORDS[n].map(f=>f*K()),idx:n}:null}
 if(mode===1){const d=v&7;if(!d)return null;const o=(bits[3]?1:0)+(bits[4]?-1:0)*(bits[3]?0:1)+(bits[3]&&bits[4]?1:0)*0;
  const oct=bits[3]&&bits[4]?2:bits[3]?1:bits[4]?-1:0;return{key:'n'+d+'/'+oct,label:nm(SCALE[d-1],oct),f:K()*261.63*Math.pow(2,(SCALE[d-1]+12*oct)/12),idx:d}}
 return{key:'b'+v,label:nm(v-1,0),f:K()*261.63*Math.pow(2,(v-1)/12),idx:v}}
const SCALES=[[0,2,4,7,9],[0,2,4,5,7],[0,3,5,7,10],[0,2,3,5,7]];let SC=+(localStorage.sc||0);let PEN=SCALES[SC];const OCT=[0,-1];
const hfreq=(h,i)=>K()*261.63*Math.pow(2,(PEN[i]+12*OCT[h])/12);
const chn=n=>nm(CHR[n-1],0).replace(/\d/,'')+CHM[n-1];
const dots=bits=>bits.map(b=>b?'●':'○').join('');
function sheet(){const t=T[lang];let h=`<h2>${t.chul}</h2><p>${t['m'+mode]}</p><p style="font-size:12px;opacity:.7">${t.fi.join(' · ')}</p>`;
 const row=(bits,lab,id)=>`<div class="r" id="${id}"><span class="dots">${dots(bits)}</span><b>${lab}</b></div>`;
 const B=v=>[0,1,2,3,4].map(i=>!!(v&(1<<i)));
 if(mode===0){h+='<div class="rows">'+[1,2,3,4,5].map(n=>row(B((1<<n)-1),chn(n)+' ('+t.fingers(n)+')','s'+n)).join('')+'</div>'}
 else if(mode===1){h+='<div class="rows">'+[1,2,3,4,5,6,7].map(d=>row(B(d),nm(SCALE[d-1],0).replace(/\d/,'')+' = '+d,'sd'+d)).join('')+'</div><p><b>'+t.oct+'</b></p><div class="rows">'+[[0,'4'],[8,'5'],[16,'3'],[24,'6']].map(([v,o])=>row(B(v),t.oct+' '+o,'so'+o)).join('')+'</div>'}
 else if(mode===5){h+='<p><b>'+t.hd[0]+'</b></p><div class="rows">'+[0,1,2,3,4].map(i=>row(B((1<<(i+1))-1),nm(PEN[i],0).replace(/\d/,'')+' ('+t.fingers(i+1)+')','s5n'+i)).join('')+'</div><p><b>'+t.hd[1].replace(/\s*\(.*\)/,'')+' · '+t.oct+'</b></p><div class="rows">'+[[0,0,'3'],[1,1,'4'],[2,3,'5']].map(([j,n,o])=>row(B((1<<n)-1),t.oct+' '+o,'s5o'+j)).join('')+'</div>'}
 else if(mode>=3){[0,1].forEach(hh=>{h+='<p><b>'+t.hd[hh]+'</b></p><div class="rows">'+[0,1,2,3,4].map(i=>row(mode===4?B((1<<(i+1))-1):B(1<<i),nm(PEN[i],OCT[hh])+(mode===4?' ('+t.fingers(i+1)+')':' · '+t.fi[i]),'sa'+(hh*5+i))).join('')+'</div>'})}
 else{h+='<div class="rows">'+Array.from({length:31},(_,i)=>i+1).map(v=>row(B(v),v+' → '+nm(v-1,0),'sb'+v)).join('')+'</div>'}
 h+=`<button class="close" id="cl">${t.close}</button>`;$('#sheet').innerHTML=h;$('#cl').onclick=()=>$('#sheet').classList.remove('open')}
function applyLang(){const t=T[lang];document.documentElement.lang=lang;$('#lang').value=lang;localStorage.lang=lang;
 document.querySelectorAll('[data-i]').forEach(e=>e.textContent=t[e.dataset.i]);
 $('#inst').innerHTML=INSTRUMENTS.map(i=>`<option value="${i}">${NAMES[lang][i]}</option>`).join('');$('#inst').value=inst;
 $('#mode').innerHTML=t.modes.map((m,i)=>`<option value="${i}">${m}</option>`).join('');$('#mode').value=mode;
 $('#help').setAttribute('aria-label',t.chul);ksel.innerHTML=Array.from({length:12},(_,i)=>`<option value="${i}">${(T[lang].solf?S12:L12)[i].replace('B','B')}</option>`).join('');ksel.value=TR;ssel.innerHTML=t.sc.map((x,i)=>`<option value="${i}">${x}</option>`).join('');ssel.value=SC;buildBar();sheet();hint.textContent=t['m'+mode]}
function buildBar(){const n=mode===0?5:mode===1?7:0;const t=T[lang];
 $('#bar').innerHTML=mode===0?CHORDS.slice(1).map((c,i)=>`<div class="k" id="k${i+1}"><b>${chn(i+1)}</b><small>${i+1}</small></div>`).join(''):mode===1?[1,2,3,4,5,6,7].map(d=>`<div class="k" id="k${d}"><b>${nm(SCALE[d-1],0).replace(/\d/,'')}</b><small>${d}</small></div>`).join(''):mode===5?PEN.map((x,i)=>`<div class="k kk" id="k5n${i}"><b>${nm(x,0).replace(/\d/,'')}</b></div>`).join('')+[3,4,5].map((o,j)=>`<div class="k kk" id="k5o${j}" style="opacity:.8"><b>${o}</b><small>oct</small></div>`).join(''):mode>=3?[1,0].map(hh=>PEN.map((x,i)=>`<div class="k kk" id="kw${hh*5+i}"><b>${nm(x,OCT[hh])}</b></div>`).join('')).join(''):`<div style="flex:1;text-align:center;opacity:.7;padding:10px;font-size:13px">${t.m2.split('.')[0]}.</div>`}
$('#lang').onchange=e=>{lang=e.target.value;$('#err').textContent='';applyLang()};
$('#inst').onchange=e=>{inst=e.target.value;localStorage.inst=inst;release();cur=null};
$('#mode').onchange=e=>{mode=+e.target.value;localStorage.mode=mode;release();fv=[];resetTracks();cur=null;lastKey='';applyLang()};
const ssel=document.createElement('select');ssel.id='scale';ssel.setAttribute('aria-label','Escala');ssel.style.cssText='flex:1 1 0';$('#ctl').insertBefore(ssel,$('#help'));
ssel.onchange=e=>{SC=+e.target.value;localStorage.sc=SC;PEN=SCALES[SC];release();resetTracks();cur=null;lastKey='';applyLang()};
const ksel=document.createElement('select');ksel.id='key';ksel.setAttribute('aria-label','Tonalidad');ksel.style.cssText='flex:0 0 64px';$('#ctl').insertBefore(ksel,$('#help'));
ksel.onchange=e=>{TR=+e.target.value;localStorage.tr=TR;release();resetTracks();cur=null;lastKey='';applyLang()};
const hint=document.createElement('div');hint.id='hint';$('#ctl').after(hint);
$('#chord').parentElement.setAttribute('aria-live','polite');$('#chord').parentElement.setAttribute('role','status');
$('#help').onclick=()=>$('#sheet').classList.toggle('open');
// audio
let ac,master,voice=null,rep=null;
function initAudio(){ac=new (window.AudioContext||window.webkitAudioContext)();master=ac.createGain();master.gain.value=.5;const lp=ac.createBiquadFilter();lp.type='lowpass';lp.frequency.value=9000;master.connect(lp);lp.connect(q.has('nobus')?ac.destination:makeBus(ac,ac.destination));unmuteIOS();
 try{navigator.wakeLock&&navigator.wakeLock.request('screen').catch(()=>{})}catch(e){}}
// iPhone: con el interruptor de silencio, Web Audio no suena; un <audio> silencioso en bucle lo evita
function unmuteIOS(){try{const n=4000,b=new DataView(new ArrayBuffer(44+n));const w=(o,s)=>[...s].forEach((c,i)=>b.setUint8(o+i,c.charCodeAt(0)));w(0,'RIFF');b.setUint32(4,36+n,true);w(8,'WAVEfmt ');b.setUint32(16,16,true);b.setUint16(20,1,true);b.setUint16(22,1,true);b.setUint32(24,8000,true);b.setUint32(28,8000,true);b.setUint16(32,1,true);b.setUint16(34,8,true);w(36,'data');b.setUint32(40,n,true);for(let i=0;i<n;i++)b.setUint8(44+i,128);
  const a=new Audio(URL.createObjectURL(new Blob([b.buffer],{type:'audio/wav'})));a.loop=true;a.setAttribute('playsinline','');a.play().catch(()=>{});window._sil=a}catch(e){}}
let fv=[];function release(){fv.forEach(v=>v&&v.off(ac.currentTime));fv=[];if(voice){voice.off(ac.currentTime);voice=null}if(rep){clearInterval(rep);rep=null}}
function fingerSound(want){const t=ac.currentTime+.01;
 for(let i=0;i<10;i++){const on=want&&want[i],h=Math.floor(i/5),f=i%5;
  if(on&&!fv[i]){fv[i]=meta(inst).perc?(drum(ac,master,i+1,t),{off(){}}):note(ac,master,inst,hfreq(h,f),t)}
  else if(!on&&fv[i]){fv[i].off(ac.currentTime);fv[i]=null}}}
function sound5(c){const t=ac.currentTime+.01;if(fv[0]){fv[0].off(ac.currentTime);fv[0]=null}if(!c)return;
 if(meta(inst).perc){drum(ac,master,c.i+1+5*(c.lv===2?1:0),t);return}
 fv[0]=note(ac,master,inst,K()*261.63*Math.pow(2,(PEN[c.i]+12*(c.lv-1))/12),t)}
function sound(c){if(mode===5){sound5(c);return}if(mode>=3){fingerSound(c&&c.want);return}release();if(!c)return;const t=ac.currentTime+.01;
 if(meta(inst).perc){drum(ac,master,c.idx,t);rep=setInterval(()=>drum(ac,master,c.idx,ac.currentTime+.01,.9),420);return}
 voice=c.ch?chord(ac,master,inst,c.ch,t):note(ac,master,inst,c.f,t)}
// dedos (pulgar, índice, corazón, anular, meñique)
const d=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function fingers(l,prev){const w=l[0];
 const f=[[8,6],[12,10],[16,14],[20,18]].map(([t,p],i)=>{const r=d(l[t],w)/Math.max(d(l[p],w),1e-6);return prev&&prev[i+1]?r>1.03:r>1.12});
 const rt=d(l[4],l[17])/Math.max(d(l[3],l[17]),1e-6),rb=d(l[4],l[5])/Math.max(d(l[3],l[5]),1e-6),rc=d(l[4],l[17])/Math.max(d(l[2],l[17]),1e-6);
 const th=prev&&prev[0]?(rt>1&&rc>.9):(rt>1.1&&rb>.9&&rc>.95);return [th].concat(f)}
let lm,stream,lastKey='',stable=0,lastT=-1,cur=null,pbOld=null,v5='',tapLvl=1;
const tr=[0,1].map(()=>({miss:0,bits:null,key:'-',stable:0,applied:'-',lastX:null}));
function resetTracks(){tr.forEach(t=>Object.assign(t,{miss:0,bits:null,key:'-',stable:0,applied:'-',lastX:null}));v5='';lastKey=''}
const st=document.createElement('style');st.textContent='#bar{gap:3px}.kk{padding:6px 0!important;min-width:0}.kk b{font-size:13px!important}.kk.on{transform:translateY(-3px)}';document.head.appendChild(st);
st.textContent+='#ctl{flex-wrap:wrap}#inst,#mode{flex:1 1 44%!important}#key{flex:0 0 64px!important}#hint{min-height:2.7em}select{font-size:16px!important;min-height:44px}#help{min-height:44px;min-width:44px}#hint{padding:0 12px 6px;font-size:12px;line-height:1.35;opacity:.8;z-index:3}#nocam{background:transparent;color:#ffb347;border:2px solid #ffb347;font-size:16px;padding:12px 20px}.k{touch-action:none;user-select:none;-webkit-user-select:none;cursor:pointer}';
async function start(){
 $('#err').textContent='';$('#go').textContent=T[lang].loading;$('#go').disabled=true;
 try{initAudio();await ac.resume();
  stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:640},height:{ideal:480}},audio:false});
  const v=$('#v');v.srcObject=stream;await v.play();
  const fs=await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.20/wasm');
  const opts=g=>({baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',delegate:g},runningMode:'VIDEO',numHands:2,minHandDetectionConfidence:.4,minHandPresenceConfidence:.4,minTrackingConfidence:.4});
  try{lm=await HandLandmarker.createFromOptions(fs,opts('GPU'))}catch(e){lm=await HandLandmarker.createFromOptions(fs,opts('CPU'))}
  $('#start').remove();loop();
 }catch(e){console.error(e);$('#err').textContent=(e&&e.name&&/NotAllowed|NotFound|Overconstrained/.test(e.name))?T[lang].cam:String(e.message||e);$('#go').textContent=T[lang].start;$('#go').disabled=false}}
function mark(c){document.querySelectorAll('.k').forEach(k=>k.classList.remove('on'));document.querySelectorAll('.r.on').forEach(k=>k.classList.remove('on'));
 if(!c)return;if(mode===5){$('#k5n'+c.i)?.classList.add('on');$('#s5n'+c.i)?.classList.add('on');$('#k5o'+c.lv)?.classList.add('on');$('#s5o'+c.lv)?.classList.add('on');return}if(mode>=3){c.want.forEach((b,i)=>{if(b){$('#kw'+i)?.classList.add('on');$('#sa'+i)?.classList.add('on')}});return}if(mode===0){$('#k'+c.n)?.classList.add('on');$('#s'+c.n)?.classList.add('on')}
 else if(mode===1){const m=c.key.match(/n(\d)\/(-?\d)/);const o=4+ +m[2];$('#k'+m[1])?.classList.add('on');$('#sd'+m[1])?.classList.add('on');$('#so'+o)?.classList.add('on')}
 else $('#sb'+c.key.slice(1))?.classList.add('on')}
function drawHand(x,c,l){x.strokeStyle='#ffb347';x.fillStyle='#fff';x.lineWidth=3;
  [[0,1,2,3,4],[0,5,6,7,8],[9,10,11,12],[13,14,15,16],[0,17,18,19,20],[5,9,13,17]].forEach(s=>{x.beginPath();s.forEach((i,j)=>j?x.lineTo(l[i].x*c.width,l[i].y*c.height):x.moveTo(l[i].x*c.width,l[i].y*c.height));x.stroke()});
  l.forEach(p=>{x.beginPath();x.arc(p.x*c.width,p.y*c.height,4,0,7);x.fill()})}
function assign(hl){const hs=hl.map(l=>({l,x:l[0].x})).sort((a,b)=>a.x-b.x);let R=null,L=null;
 if(hs.length>=2){R=hs[0];L=hs[hs.length-1]}
 else if(hs.length===1){const h=hs[0],dR=tr[0].lastX==null?9:Math.abs(h.x-tr[0].lastX),dL=tr[1].lastX==null?9:Math.abs(h.x-tr[1].lastX);
  if(dR===9&&dL===9){if(h.x<.5)R=h;else L=h}else if(dR<=dL)R=h;else L=h}
 return[R,L]}
function loop(){requestAnimationFrame(loop);const v=$('#v');if(v.readyState<2||v.currentTime===lastT)return;lastT=v.currentTime;
 const c=$('#c'),x=c.getContext('2d');if(c.width!==v.videoWidth){c.width=v.videoWidth;c.height=v.videoHeight}
 x.clearRect(0,0,c.width,c.height);const t0=performance.now();const r=lm.detectForVideo(v,t0);window._ms=(window._ms||0)*.9+(performance.now()-t0)*.1;const hl=r.landmarks||[];
 if(mode>=3){
  // mano derecha del usuario = x menor en la imagen sin espejo. Cada mano tiene su propio filtro, así que una mano que parpadea no tumba a la otra.
  const [R,L]=assign(hl);let changed=false;hl.forEach(l=>drawHand(x,c,l));
  [R,L].forEach((H,h)=>{const t=tr[h];
   if(H){t.miss=0;t.lastX=H.l[0].x;t.bits=fingers(H.l,t.bits)}else{t.miss++;if(t.miss>=4)t.bits=null;if(t.miss>=14)t.lastX=null}
   const n=t.bits?t.bits.filter(Boolean).length:0;
   let k='-';if(t.bits){if(mode===3)k=t.bits.some(Boolean)?t.bits.map(Number).join(''):'-';else if(mode===4)k=n?'c'+n:'-';else k=h===0?(n?'c'+n:'-'):(n===0?'o0':n<=2?'o1':'o2')}
   if(k===t.key)t.stable++;else{t.key=k;t.stable=0}
   if(t.stable>=(k==='-'?0:2)&&k!==t.applied){t.applied=k;changed=true}});
  $('#pat').textContent=[R,L].map((H,h)=>tr[h].bits?dots(tr[h].bits):'·····').join('  ');
  if(changed){let label='',idle=true;
   if(mode===5){const kr=tr[0].applied,kl=tr[1].applied,lv=kl==='o0'?0:kl==='o2'?2:1;
    if(kr!=='-'){const i=+kr.slice(1)-1;cur={i,lv};idle=false;label=nm(PEN[i],lv-1)}else cur=null;
    mark(cur);sound(cur)}
   else{const want=Array(10).fill(false);
    tr.forEach((t,h)=>{if(t.applied==='-')return;if(mode===4)want[h*5+(+t.applied.slice(1))-1]=true;else t.applied.split('').forEach((b,i)=>{if(b==='1')want[h*5+i]=true})});
    cur={want};mark(cur);sound(cur);
    const names=[];[1,0].forEach(h=>PEN.forEach((p,i)=>{if(want[h*5+i])names.push(nm(p,OCT[h]))}));label=names.join(' ');idle=!names.length}
   $('#chord').textContent=label;$('#chord').style.fontSize=label.split(' ').length>3?'min(14vw,80px)':'';
   $('#fingers').textContent=!R&&!L&&tr[0].miss>3&&tr[1].miss>3?T[lang].nohand:(idle?T[lang].silence:'')}
  return}
 $('#chord').style.fontSize='';let bits=null,k='none';
 if(hl[0]){const l=hl[0];bits=pbOld=fingers(l,pbOld);const dc=decode(bits);k=dc?dc.key:'none';drawHand(x,c,l)}else pbOld=null;
 $('#pat').textContent=bits?dots(bits):'';
 if(k===lastKey)stable++;else{stable=0;lastKey=k}
 if(stable===3&&k!==(cur&&cur.key||'none')||(stable===3&&cur===null&&k==='none')){cur=bits?decode(bits):null;mark(cur);sound(cur);
  $('#chord').textContent=cur?cur.label:'';$('#fingers').textContent=!bits?T[lang].nohand:(cur?'':T[lang].silence)}}
{const b=document.createElement('button');b.id='nocam';b.dataset.i='nocam';b.textContent=T[lang].nocam;$('#err').before(b);b.onclick=async()=>{initAudio();await ac.resume();$('#start').remove();$('#fingers').textContent=''}}
// teclas táctiles: tocar una tecla de la barra suena igual que el gesto (sirve sin cámara y para probar)
let tapWant=Array(10).fill(false);
function tapKey(el,down){if(!ac||!el)return;const m5=el.id.match(/^k5([no])(\d)$/);if(m5){if(m5[1]==='o'){if(down){tapLvl=+m5[2];document.querySelectorAll('[id^=k5o]').forEach(k=>k.classList.remove('on'));el.classList.add('on')}return}
  if(down){sound5({i:+m5[2],lv:tapLvl});el.classList.add('on')}else{sound5(null);el.classList.remove('on')}return}const m=el.id.match(/^k(w?)(\d+)$/);if(!m)return;const n=+m[2];
 if(m[1]){tapWant[n]=down;fingerSound(tapWant);el.classList.toggle('on',down);return}
 if(!down){release();el.classList.remove('on');return}
 const B=v=>[0,1,2,3,4].map(i=>!!(v&(1<<i)));const c=mode===0?decode(B((1<<n)-1)):mode===1?decode(B(n)):null;if(c){sound(c);el.classList.add('on')}}
$('#bar').addEventListener('pointerdown',e=>{const k=e.target.closest('.k');if(k){e.preventDefault();k.setPointerCapture&&k.setPointerCapture(e.pointerId);tapKey(k,true)}});
['pointerup','pointercancel','lostpointercapture'].forEach(ev=>$('#bar').addEventListener(ev,e=>{const k=e.target.closest('.k');if(k)tapKey(k,false)}));
$('#go').onclick=start;applyLang();$('#chord').textContent='';
// CDN build requires an internet connection.
if(q.has('auto'))start();
