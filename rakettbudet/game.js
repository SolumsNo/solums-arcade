'use strict';
(()=>{
const $=id=>document.getElementById(id),canvas=$('world'),ctx=canvas.getContext('2d'),ship=new Image();ship.src='assets/ship-real.png';const asteroid=new Image();asteroid.src='assets/asteroid-real.png';const nugget=new Image();nugget.src='assets/gold-real.png';const crystal=new Image();crystal.src='assets/crystal.png';const explosion=new Image();explosion.src='assets/explosion.png';
let W=innerWidth,H=$('game').clientHeight,dpr=1,phase='intro',last=0,time=0,stageTime=0,score=0,hp=3,lane=1,shipX=0,spawn=1,objects=[],particles=[],stars=[],invuln=0,boost=0,cooldown=0,shield=0,shake=0,audio=null,sound=false,toastTimer;
const difficulties={
 easy:{name:'Rolig',speed:105,interval:1.25,limit:12},
 normal:{name:'Vanlig',speed:135,interval:.95,limit:8},
 hard:{name:'Vanskelig',speed:175,interval:.67,limit:5},
 god:{name:'Nesten gud',speed:110,interval:1.1,limit:30}
};
let difficulty='normal',duration=120,steerLeft=false,steerRight=false,dragging=false;
let shots=[],blasts=[],firing=false,fireDelay=0,rocketDelay=0,ammo=0,escaped=0,destroyed=0,gold=0,crystalTimer=6,bonusAt=20,lastSpawnX=-1;
function recordKey(){return 'rakettbudet-survival-v1-'+($('difficulty').value||'normal')+'-'+($('duration').value||'120')}
function loadRecord(){try{best=Number(localStorage.getItem(recordKey()))||0}catch{best=0}$('best').textContent=best}
let best=0;loadRecord();$('difficulty').onchange=()=>{loadRecord();$('modeHelp').textContent=difficulties[$('difficulty').value].name+': Du taper når '+difficulties[$('difficulty').value].limit+' asteroider har sluppet forbi.'};$('duration').onchange=loadRecord;
function resize(){W=innerWidth;H=$('game').clientHeight;dpr=Math.min(devicePixelRatio||1,2);canvas.width=W*dpr;canvas.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);shipX=lx(lane);stars=Array.from({length:110},()=>({x:Math.random()*W,y:Math.random()*H,z:Math.random(),r:.4+Math.random()*1.2}));}window.addEventListener('resize',resize);resize();
function lx(i){return W/2+(i-1)*Math.min(W*.34,420)}function sy(){return H-190}function ss(){return Math.min(W*.22,118)}
// World coordinates keep the same flight timing; projection supplies camera depth.
function horizon(){return 28}
function project(x,y){const u=Math.max(0,(y+280)/(sy()+280)),scale=.38+.62*Math.pow(u,1.18);return {x:W/2+(x-W/2)*scale,y:horizon()+(sy()-horizon())*Math.pow(u,1.32),scale};}
function objectX(o){return lx(o.lane)+(o.offset||0)*Math.min(28,W*.065)+Math.sin(time*.65+(o.seed||0)*6.28)*(o.drift||0)}
function fade(o){const y=project(objectX(o),o.y).y,t=Math.max(0,Math.min(1,(y-horizon())/95));return t*t*(3-2*t)}
function burstWorld(x,y,color,n){const p=project(x,y);burst(p.x,p.y,color,n)}
// A shared mix bus keeps deep overlapping impacts controlled and makes mute immediate.
let mix=null,noiseBuffer=null,samples={},activeVoices=new Set();
function audioReady(){
 if(!sound)return false;
 try{
  if(!audio){
   audio=new(window.AudioContext||window.webkitAudioContext)();
   mix=audio.createGain();mix.gain.value=.72;
   const compressor=audio.createDynamicsCompressor();compressor.threshold.value=-17;compressor.knee.value=15;compressor.ratio.value=5;compressor.attack.value=.004;compressor.release.value=.24;
   mix.connect(compressor);compressor.connect(audio.destination);
   noiseBuffer=audio.createBuffer(1,audio.sampleRate*2,audio.sampleRate);const data=noiseBuffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;
   for(const [key,encoded] of Object.entries(window.RAKETT_AUDIO||{})){
    const bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));audio.decodeAudioData(bytes.buffer).then(buffer=>samples[key]=buffer).catch(()=>{});
   }
  }
  audio.resume().catch(()=>{});return true;
 }catch{return false}
}
function silence(){for(const source of activeVoices){try{source.stop()}catch{}}activeVoices.clear()}
function voice({frequency=100,end=frequency,length=.3,volume=.1,delay=0,type='sine',noise=false,cutoff=1600,cutoffEnd=cutoff,pan=0,attack=.004,sample,rate=1}={}){
 if(!audioReady())return;
 const at=audio.currentTime+delay,source=(noise||sample)?audio.createBufferSource():audio.createOscillator(),gain=audio.createGain(),filter=audio.createBiquadFilter(),position=audio.createStereoPanner();
 if(sample){source.buffer=sample;source.playbackRate.value=rate;length=sample.duration/rate}
 else if(noise)source.buffer=noiseBuffer;
 else{source.type=type;source.frequency.setValueAtTime(frequency,at);source.frequency.exponentialRampToValueAtTime(Math.max(20,end),at+length)}
 filter.type='lowpass';filter.frequency.setValueAtTime(cutoff,at);filter.frequency.exponentialRampToValueAtTime(cutoffEnd,at+length);filter.Q.value=.65;
 gain.gain.setValueAtTime(.0001,at);gain.gain.exponentialRampToValueAtTime(Math.max(.0002,volume),at+attack);
 if(sample){gain.gain.setValueAtTime(volume,at+Math.max(attack,length-.08));gain.gain.exponentialRampToValueAtTime(.0001,at+length)}
 else gain.gain.exponentialRampToValueAtTime(.0001,at+length);
 position.pan.value=Math.max(-.7,Math.min(.7,pan));source.connect(filter);filter.connect(gain);gain.connect(position);position.connect(mix);
 activeVoices.add(source);source.onended=()=>{activeVoices.delete(source);source.disconnect();filter.disconnect();gain.disconnect();position.disconnect()};source.start(at);source.stop(at+length+.015);
}
function tone(freq,length=.13,type='sine',volume=.04){voice({frequency:freq,end:freq*.7,length,type,volume})}
$('sound').onclick=()=>{sound=!sound;$('sound').textContent=sound?'Lyd på':'Lyd av';$('sound').setAttribute('aria-label',sound?'Slå av lyd':'Slå på lyd');if(!sound)silence();else{audioReady();rewardSound('gold')}};
function weaponSound(proton=false){
 if(!audioReady())return;const pan=(shipX/W-.5)*1.2;
 if(proton){
  if(samples.rocket)voice({sample:samples.rocket,volume:.56,cutoff:11000,pan});
  else voice({noise:true,length:.9,volume:.32,cutoff:600,cutoffEnd:3500,attack:.065,pan});
  voice({frequency:105,end:45,length:.32,volume:.24,pan});
  voice({frequency:58,end:105,length:.7,volume:.13,type:'triangle',attack:.08,pan});
 }else{
  if(samples.cannon)voice({sample:samples.cannon,volume:.6,cutoff:10000,rate:.95+Math.random()*.08,pan});
  else{voice({noise:true,length:.09,volume:.38,cutoff:3200,cutoffEnd:650,pan});voice({noise:true,length:.42,volume:.21,cutoff:430,cutoffEnd:95,pan})}
  voice({frequency:125,end:42,length:.37,volume:.42,pan});
  voice({frequency:185,end:75,length:.16,volume:.15,type:'triangle',pan});
 }
}
function explosionSound(size,proton,x){
 if(!audioReady())return;const weight=Math.max(.3,Math.min(1.7,size)),pan=(x/W-.5)*1.25;
 if(samples.explosion)voice({sample:samples.explosion,rate:1.65-weight*.55,volume:.28+weight*.22,cutoff:8500,pan});
 else voice({noise:true,length:.35+weight*.55,volume:.25+weight*.1,cutoff:1900,cutoffEnd:140,pan});
 voice({frequency:110-weight*22,end:42-weight*8,length:.3+weight*.62,volume:.16+weight*.22,pan});
 voice({frequency:160-weight*28,end:65,length:.22+weight*.3,volume:.08+weight*.09,type:'triangle',pan});
 if(proton)voice({noise:true,length:.35,volume:.10,cutoff:4200,cutoffEnd:500,delay:.03,pan});
}
function rewardSound(kind){
 const isCrystal=kind==='crystal',notes=isCrystal?[523.25,783.99,1046.5,1567.98]:[659.25,830.61,1318.51];
 notes.forEach((frequency,i)=>{
  const delay=i*(isCrystal?.075:.055),length=isCrystal?.95:.48;
  voice({frequency,length,volume:isCrystal?.13:.14,delay,cutoff:9500,pan:(i-1)*.12});
  // Slightly inharmonic overtones give the rewards a glass/metal chime instead of a beep.
  voice({frequency:frequency*(isCrystal?2.76:2.01),length:length*.55,volume:.033,delay,cutoff:11000});
  voice({frequency:frequency*4.08,length:.16,volume:.013,delay,cutoff:13000});
 });
 if(isCrystal)voice({frequency:261.63,length:.9,volume:.10,attack:.04,type:'triangle',cutoff:1200});
}
function toast(s){$('toast').textContent=s;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),2100)}
function burst(x,y,color,n=18){for(let i=0;i<n;i++){let a=Math.random()*Math.PI*2,v=30+Math.random()*170;particles.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:.5+Math.random()*.5,max:1,color,size:1+Math.random()*4})}}
function start(){
 difficulty=$('difficulty').value||'normal';duration=Number($('duration').value??120);clearSteering();silence();
 phase='playing';stageTime=0;score=0;hp=3;lane=1;shipX=lx(1);spawn=.6;objects=[];particles=[];shots=[];blasts=[];
 invuln=2;boost=0;cooldown=0;shield=0;ammo=0;escaped=0;destroyed=0;gold=0;fireDelay=0;rocketDelay=0;crystalTimer=6;bonusAt=20;lastSpawnX=-1;
 $('intro').hidden=true;$('shipLabel').hidden=true;$('introFooter').hidden=true;$('modal').hidden=true;
 for(let id of ['hud','controls','pause'])$(id).hidden=false;$('game').classList.add('playing');resize();
 document.activeElement?.blur();tone(330);toast('Hold SPACE for å skyte · krystaller gir raketter');hud();
}
$('start').onclick=start;
function move(d){if(phase!=='playing')return;lane=Math.max(0,Math.min(2,lane+d));tone(170,.06,'sine',.015)}
function turbo(){if(phase!=='playing'||cooldown>0)return;boost=2.1;cooldown=9;invuln=Math.max(invuln,2.1);toast('TURBO · SKJOLD AKTIVT');voice({noise:true,length:1.1,volume:.18,cutoff:500,cutoffEnd:1800,attack:.08});voice({frequency:65,end:110,length:.8,volume:.17,attack:.05})}
for(const [id,dir] of [['left',-1],['right',1]]){const b=$(id);b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);if(dir<0)steerLeft=true;else steerRight=true});const stop=()=>{if(dir<0)steerLeft=false;else steerRight=false};b.addEventListener('pointerup',stop);b.addEventListener('pointercancel',stop);b.onclick=e=>{if(e.detail===0)move(dir*.18)}}
$('boost').onclick=turbo;
$('fire').addEventListener('pointerdown',e=>{e.preventDefault();$('fire').setPointerCapture(e.pointerId);firing=true;shoot(false)});
for(const type of ['pointerup','pointercancel','lostpointercapture'])$('fire').addEventListener(type,()=>firing=false);
$('fire').onclick=e=>{if(e.detail===0)shoot(false)};
$('rocket').onclick=()=>shoot(true);
function modal(eyebrow,title,description){$('modal').hidden=false;$('modalEyebrow').textContent=eyebrow;$('modalTitle').textContent=title;$('modalText').textContent=description;$('choices').replaceChildren();}
function action(text,fn){const b=document.createElement('button');b.className='primary';b.textContent=text;b.onclick=fn;$('choices').append(b);return b}
function pause(){if(phase==='playing'){clearSteering();silence();phase='paused';modal('FLYGING SATT PÅ PAUSE','Pust i bakken.','Tid, asteroider og våpen er satt på pause.');action('FORTSETT FLYGING',()=>{phase='playing';$('modal').hidden=true;document.activeElement?.blur()}).focus();action('START PÅ NYTT',start);action('ENDRE VALG',showMenu)}else if(phase==='paused'){phase='playing';$('modal').hidden=true;document.activeElement?.blur();}}
$('pause').onclick=pause;
window.addEventListener('keydown',e=>{
 if(['SELECT','INPUT'].includes(e.target?.tagName)||(['BUTTON','A'].includes(e.target?.tagName)&&phase!=='playing'&&[' ','Enter'].includes(e.key)))return;
 const key=e.key.toLowerCase();if(['ArrowLeft','ArrowRight',' ','Escape'].includes(e.key))e.preventDefault();
 if(key==='arrowleft'||key==='a')steerLeft=true;if(key==='arrowright'||key==='d')steerRight=true;
 if(e.key===' '&&phase==='playing'){firing=true;shoot(false)}
 if(e.repeat)return;if(e.key===' '&&phase==='intro'){start();firing=true}
 if(key==='r'||key==='x')shoot(true);if(e.key==='Shift')turbo();if(key==='escape'||key==='p')pause();
});
window.addEventListener('keyup',e=>{const key=e.key.toLowerCase();if(key==='arrowleft'||key==='a')steerLeft=false;if(key==='arrowright'||key==='d')steerRight=false;if(e.key===' ')firing=false});
function clearSteering(){steerLeft=false;steerRight=false;dragging=false;firing=false}
window.addEventListener('blur',()=>{clearSteering();if(phase==='playing')pause()});
document.addEventListener('visibilitychange',()=>{if(document.hidden){clearSteering();if(phase==='playing')pause()}});
function steerPointer(e){if(phase!=='playing')return;lane=Math.max(0,Math.min(2,1+(e.clientX-W/2)/Math.min(W*.34,420)))}
canvas.addEventListener('pointerdown',e=>{dragging=true;canvas.setPointerCapture(e.pointerId);document.activeElement?.blur();steerPointer(e)});canvas.addEventListener('pointermove',e=>{if(dragging)steerPointer(e)});canvas.addEventListener('pointerup',()=>dragging=false);canvas.addEventListener('pointercancel',()=>dragging=false);
function hud(){
 $('score').textContent=score.toLocaleString('nb-NO');$('health').textContent='● '.repeat(hp)+'○ '.repeat(3-hp);
 $('destination').textContent='ASTEROIDEFORSVAR · '+difficulties[difficulty].name.toUpperCase();
 const seconds=Math.ceil(duration?Math.max(0,duration-stageTime):stageTime);
 $('distance').textContent=Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');
 $('progress').style.width=(duration?Math.min(100,stageTime/duration*100):100)+'%';
 $('escaped').textContent=escaped+' / '+difficulties[difficulty].limit;$('escaped').classList.toggle('danger',escaped>=difficulties[difficulty].limit-2);
 $('destroyed').textContent=destroyed;$('ammo').textContent=ammo;$('rocket').disabled=ammo===0||rocketDelay>0;
 $('boostState').textContent=cooldown>0?Math.ceil(cooldown)+'s':'KLAR';$('boost').style.opacity=cooldown>0?.55:1;
 $('power').textContent=[difficulty==='god'?'98 % SKROGBESKYTTELSE':'',shield?'EKSTRA SKJOLD':'',ammo?'PROTONRAKETTER KLARE':'FINN EN KRYSTALL → PROTONRAKETTER'].filter(Boolean).join(' · ');
}
function save(){best=Math.max(best,score);try{localStorage.setItem(recordKey(),String(best))}catch{}$('best').textContent=best}
function finish(won,reason='Skroget tålte ikke flere treff.'){
 clearSteering();phase='ended';save();hud();$('pause').hidden=true;
 modal(won?'SEKTOREN ER SIKRET':'FORSVARET BRØT SAMMEN',won?'Du holdt stand!':'Prøv en ny runde.',
 (won?'Du overlevde hele tidsintervallet. ':reason+' ')+`${destroyed} asteroider sprengt · ${gold} gull samlet · ${escaped} slapp forbi. Du fikk ${score} poeng. Rekord: ${best}.`);
 action('SPILL IGJEN',start).focus();action('ENDRE VALG',showMenu);action('TIL SOLUMS ARCADE',()=>location.href='../index.html');tone(won?880:140,.6);
}
function showMenu(){phase='intro';clearSteering();silence();$('modal').hidden=true;$('intro').hidden=false;$('shipLabel').hidden=false;$('introFooter').hidden=false;for(const id of ['hud','controls','pause'])$(id).hidden=true;$('game').classList.remove('playing');resize();loadRecord()}
// Each event has its own time, horizontal position, size and speed: no rows.
function row(forced){
 const config=difficulties[difficulty],pressure=1+Math.min(.3,stageTime/600);
 let position=Math.random()*2;for(let n=0;n<5&&Math.abs(position-lastSpawnX)<.22;n++)position=Math.random()*2;lastSpawnX=position;
 const type=forced||(Math.random()<.86?'rock':'coin');
 const r=type==='rock'?Math.min(35,W*.068)*(.64+Math.random()*.94):type==='crystal'?27:18+Math.random()*8;
 const speed=config.speed*pressure*(.82+Math.random()*.36);
 // Avoid overlapping near-simultaneous objects so bonuses remain readable.
 if(objects.some(o=>!o.hit&&o.y<-100&&Math.abs(lx(position)-objectX(o))<r+o.r+30))position=(position+1)%2;
 objects.push({type,lane:position,y:-280-Math.random()*75,r,rot:Math.random()*6.28,spin:(Math.random()-.5)*.7,speed,seed:Math.random(),hit:false,hp:type==='rock'?Math.max(1,Math.ceil(r/16)):1,flash:0});
}
function shoot(proton=false){
 if(phase!=='playing'||(proton?(ammo<=0||rocketDelay>0):fireDelay>0))return;
 if(proton){ammo--;rocketDelay=.42}else fireDelay=.34;
 const y=sy()-ss()*.34;
 shots.push({x:shipX,y,previousY:y,speed:proton?700:1020,proton,trail:0});
 const p=project(shipX,y);burst(p.x,p.y,proton?'#93efff':'#ffc06c',proton?8:3);
 blasts.push({x:p.x,y:p.y,life:.075,max:.075,r:proton?28:16,muzzle:true});
 weaponSound(proton);hud();
}
function explode(o,proton=false){
 const p=project(objectX(o),o.y),size=Math.max(.3,Math.min(1.7,o.r/34)),life=.3+size*.5;
 const radius=o.r*p.scale*(2.0+size*.7)*(proton?1.12:1);
 blasts.push({x:p.x,y:p.y,life,max:life,r:radius,rot:Math.random()*6.28,shock:proton,size});
 const sparks=Math.round(12+size*27);
 for(let n=0;n<sparks;n++){const a=Math.random()*6.28,v=(45+Math.random()*190)*size*p.scale,lifetime=.25+Math.random()*.65*size;
 particles.push({x:p.x,y:p.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:lifetime,max:lifetime,color:n%3?'#ffc273':'#fff0c1',size:.8+Math.random()*2.2})}
 for(let n=0;n<Math.ceil(3+size*8);n++){const a=Math.random()*6.28,v=(20+Math.random()*90)*size*p.scale,lifetime=.4+size*.65+Math.random()*.35;
 particles.push({x:p.x,y:p.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:lifetime,max:lifetime,color:'#8b8179',size:(3+Math.random()*10)*size*p.scale,smoke:true})}
 shake=Math.max(shake,.035+size*.085);explosionSound(size,proton,p.x);
}
function damageRock(o,proton){
 if(o.hit)return;o.hp-=proton?999:2;o.flash=.09;
 if(o.hp>0){burstWorld(objectX(o),o.y,'#ffd49a',8);return}
 o.hit=true;destroyed++;score+=Math.round(o.r)*2;explode(o,proton);
 if(destroyed>=bonusAt){bonusAt+=20;score+=250;shield=Math.min(2,shield+1);toast('20 ASTEROIDER · +250 POENG + SKJOLD')}
}
function collect(o){
 o.hit=true;
 if(o.type==='crystal'){ammo=Math.min(30,ammo+8);burstWorld(objectX(o),o.y,'#8af6ff',24);toast('KRYSTALL · +8 PROTONRAKETTER · TRYKK R');rewardSound('crystal')}
 else{const value=o.r>23?100:50;score+=value;gold+=value;burstWorld(objectX(o),o.y,'#ffcd75',14);rewardSound('gold');toast('GULLBONUS · +'+value+' POENG')}
}
function update(dt){
 if(phase==='paused'||phase==='ended')return;
 time+=dt;
 for(const s of stars){s.y+=dt*(phase==='playing'?25+s.z*70:4+s.z*10);if(s.y>H){s.y=0;s.x=Math.random()*W}}
 for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=Math.exp(-dt*(p.smoke?1.8:.5));p.vy*=Math.exp(-dt*(p.smoke?1.8:.5));p.life-=dt;if(p.smoke)p.size+=dt*12;if(p.life<=0)particles.splice(i,1)}
 for(const b of blasts)b.life-=dt;blasts=blasts.filter(b=>b.life>0);if(particles.length>650)particles.splice(0,particles.length-650);
 if(phase!=='playing')return;
 stageTime+=dt;invuln=Math.max(0,invuln-dt);boost=Math.max(0,boost-dt);cooldown=Math.max(0,cooldown-dt);shake=Math.max(0,shake-dt);
 fireDelay=Math.max(0,fireDelay-dt);rocketDelay=Math.max(0,rocketDelay-dt);
 lane=Math.max(0,Math.min(2,lane+((steerRight?1:0)-(steerLeft?1:0))*dt*(boost>0?840:560)/Math.min(W*.34,420)));
 const difference=lx(lane)-shipX;shipX+=Math.sign(difference)*Math.min(Math.abs(difference),dt*(boost>0?840:560));
 if(firing||dragging||$('autoFire').checked)shoot(false);
 spawn-=dt;if(spawn<=0){row();spawn=difficulties[difficulty].interval*(.6+Math.random()*.8)/(1+Math.min(.25,stageTime/600))}
 crystalTimer-=dt;if(crystalTimer<=0){row('crystal');crystalTimer=10+Math.random()*5}
 for(const o of objects){o.prevY=o.y;o.y+=o.speed*dt;o.rot+=dt*(o.spin||0);o.flash=Math.max(0,(o.flash||0)-dt)}
 // Swept relative-motion collision avoids missed hits at low frame rates.
 for(const bullet of shots){
  bullet.previousY=bullet.y;bullet.y-=bullet.speed*dt;
  const targets=objects.filter(o=>o.type==='rock'&&!o.hit&&Math.abs(objectX(o)-bullet.x)<o.r*.82+(bullet.proton?9:4)).sort((a,b)=>b.y-a.y);
  for(const o of targets){const before=bullet.previousY-o.prevY,after=bullet.y-o.y;if(before>=-o.r&&after<=o.r){bullet.hit=true;damageRock(o,bullet.proton);break}}
  if(bullet.proton){bullet.trail-=dt;if(bullet.trail<=0){bullet.trail=.025;const p=project(bullet.x,bullet.y);particles.push({x:p.x,y:p.y+12*p.scale,vx:(Math.random()-.5)*10,vy:25,life:.42,max:.42,color:'#8a969e',size:5*p.scale,smoke:true})}}
 }
 shots=shots.filter(b=>!b.hit&&b.y>-275);
 for(const o of objects){
  if(o.hit)continue;const dx=Math.abs(objectX(o)-shipX),dy=Math.abs(o.y-sy());
  if(o.type!=='rock'&&dy<42&&dx<ss()*.32+o.r){collect(o)}
  else if(o.type==='rock'&&dy<ss()*.28+o.r*.7&&dx<ss()*.23+o.r*.7){
   o.hit=true;explode(o);
   if(invuln<=0){if(difficulty==='god'&&Math.random()<.98){toast('Beskyttelsen tok støtet!')}else if(shield){shield--;toast('Skjoldet tok støtet!')}else{hp--;toast('SKROGSKADE · '+hp+' LIV IGJEN')}invuln=1.5;if(hp===0){finish(false);return}}
  }else if(o.y>sy()+90){o.hit=true;if(o.type==='rock'){escaped++;tone(110,.12);if(escaped>=difficulties[difficulty].limit){finish(false,'For mange asteroider slapp gjennom forsvaret.');return}toast('ASTEROIDE SLAPP FORBI · '+escaped+' / '+difficulties[difficulty].limit)}}
 }
 objects=objects.filter(o=>!o.hit);hud();
 if(duration&&stageTime>=duration){score+=500;finish(true)}
}
function glow(x,y,r,c){let g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,c);g.addColorStop(1,'transparent');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2)}
function drawShip(x,y,size,angle=0){ctx.save();ctx.translate(x,y);ctx.rotate(angle);glow(-size*.10,size*.41,size*.33,boost>0?'#76ecff99':'#69d9ff44');glow(size*.10,size*.41,size*.33,boost>0?'#76ecff99':'#69d9ff44');if(ship.complete&&ship.naturalWidth){ctx.shadowBlur=18;ctx.shadowColor='#010810';ctx.drawImage(ship,-size/2,-size/2,size,size);ctx.shadowBlur=0;}if((invuln>0&&phase==='playing')||shield){ctx.strokeStyle='#8bfbff';ctx.lineWidth=1.5;ctx.shadowBlur=14;ctx.shadowColor='#67eaff';ctx.globalAlpha=.5+Math.sin(time*7)*.15;ctx.beginPath();ctx.ellipse(0,0,size*.43,size*.58,0,0,Math.PI*2);ctx.stroke()}ctx.restore();}
function rock(o){const p=project(objectX(o),o.y),x=p.x,y=p.y,r=o.r*p.scale;ctx.save();ctx.globalAlpha=fade(o);ctx.translate(x,y);ctx.rotate(o.rot);ctx.shadowColor='#000';ctx.shadowBlur=12;if(asteroid.complete&&asteroid.naturalWidth)ctx.drawImage(asteroid,-r*1.22,-r*1.22,r*2.44,r*2.44);if(o.flash>0){ctx.globalCompositeOperation='screen';glow(0,0,r*1.2,'#ffb95c99')}ctx.restore();}
function coin(o){const p=project(objectX(o),o.y),r=o.r*p.scale;ctx.save();ctx.globalAlpha=fade(o);glow(p.x,p.y,r*1.8,'#ffd06020');ctx.translate(p.x,p.y);ctx.rotate(o.rot);const tumble=.91+Math.sin(time*.9+o.rot)*.09;ctx.scale(tumble,1);if(nugget.complete&&nugget.naturalWidth){ctx.shadowBlur=6;ctx.shadowColor='#ffbe3c44';ctx.drawImage(nugget,-r,-r,r*2,r*2)}ctx.restore();}
function drawCrystal(o){const p=project(objectX(o),o.y),r=o.r*p.scale;ctx.save();ctx.globalAlpha=fade(o);glow(p.x,p.y,r*2.2,'#58e9ff55');ctx.translate(p.x,p.y);ctx.rotate(Math.sin(time*1.5+o.seed)*.15);ctx.globalCompositeOperation='screen';if(crystal.complete&&crystal.naturalWidth)ctx.drawImage(crystal,-r*1.3,-r*1.3,r*2.6,r*2.6);ctx.restore()}
function drawShot(b){
 const p=project(b.x,b.y),tail=project(b.x,b.y+(b.proton?37:27)),r=p.scale;
 ctx.save();ctx.translate(p.x,p.y);ctx.rotate(Math.atan2(tail.x-p.x,-(tail.y-p.y)));
 // Local nose faces up; the projected flight vector defines its exact angle.
 ctx.rotate(Math.PI);
 if(b.proton){
  glow(0,15*r,24*r,'#ff963eaa');ctx.fillStyle='#ff9e39';ctx.beginPath();ctx.moveTo(-4*r,10*r);ctx.lineTo(0,(28+Math.random()*14)*r);ctx.lineTo(4*r,10*r);ctx.fill();
  ctx.fillStyle='#e8f5f6';ctx.fillRect(-3*r,-10*r,6*r,21*r);ctx.fillStyle='#677d88';ctx.fillRect(-3*r,-4*r,2*r,14*r);ctx.fillStyle='#81e8ff';ctx.beginPath();ctx.moveTo(-3*r,-10*r);ctx.lineTo(0,-17*r);ctx.lineTo(3*r,-10*r);ctx.fill();
 }else{ctx.shadowBlur=10;ctx.shadowColor='#ffb555';ctx.strokeStyle='#fff2c4';ctx.lineWidth=3.6*r;ctx.beginPath();ctx.moveTo(0,-6*r);ctx.lineTo(0,18*r);ctx.stroke()}
 ctx.restore();
}
function draw(){
 ctx.clearRect(0,0,W,H);ctx.save();if(shake>0&&phase==='playing')ctx.translate((Math.random()-.5)*6,(Math.random()-.5)*6);
 for(const s of stars){ctx.globalAlpha=.25+s.z*.6;ctx.fillStyle='#ccefff';ctx.fillRect(s.x,s.y,s.r,boost>0?14:s.r)}ctx.globalAlpha=1;
 if(phase!=='intro'){
  for(const o of objects.filter(o=>!o.hit).sort((a,b)=>a.y-b.y)){if(o.type==='rock')rock(o);else if(o.type==='crystal')drawCrystal(o);else coin(o)}
  for(const b of shots)drawShot(b);
  drawShip(shipX,sy()+Math.sin(time*2.4)*2,ss()*1.22,Math.atan2(W/2-shipX,sy()-horizon())*.50+(lx(lane)-shipX)*.00025);
 }else{const mobile=W<700;drawShip(mobile?W*.82:W*.72,mobile?H*.27:H*.57,mobile?W*.34:Math.min(370,W*.3),0)}
 for(const p of particles){
  ctx.globalAlpha=Math.max(0,p.life/(p.max||1))*(p.smoke?.16:1);ctx.fillStyle=p.color;
  if(p.smoke){ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill()}
  else{ctx.save();ctx.globalCompositeOperation='lighter';ctx.strokeStyle=p.color;ctx.lineWidth=Math.min(2,p.size);ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x-p.vx*.025,p.y-p.vy*.025);ctx.stroke();ctx.restore()}
 }
 ctx.globalAlpha=1;
 for(const b of blasts){
  ctx.save();ctx.translate(b.x,b.y);ctx.globalCompositeOperation='screen';const progress=1-b.life/b.max;ctx.globalAlpha=Math.max(0,(1-progress)*.95);
  const r=b.r*(.23+Math.pow(progress,.42)*.97);glow(0,0,r*.8,b.muzzle?'#ffdfaaff':'#ffba6688');
  if(b.shock&&progress<.65){ctx.strokeStyle='#addbff';ctx.lineWidth=1.5;ctx.globalAlpha=(1-progress/.65)*.5;ctx.beginPath();ctx.ellipse(0,0,r*(1+progress),r*(.45+progress*.4),0,0,Math.PI*2);ctx.stroke()}
  ctx.globalAlpha=Math.max(0,1-progress)*.95;
  if(!b.muzzle&&explosion.complete&&explosion.naturalWidth){ctx.rotate(b.rot);ctx.drawImage(explosion,-r,-r,r*2,r*2)}
  ctx.restore();
 }
 ctx.restore();
}
function frame(t){const dt=Math.min((t-last)/1000,.033);last=t;update(dt);draw();requestAnimationFrame(frame)}requestAnimationFrame(frame);
})();
