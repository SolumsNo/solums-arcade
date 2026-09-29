window.BonusFleet=(()=>{
 let queue=[],active=null,rockets=[],sparks=[],smoke=[],flashes=[];
 const colors=['#ff4466','#ff943d','#ffed55','#56ff97','#41eaff','#6294ff','#bd68ff','#ff68dc','#ffffff'];
 const DURATION=20,SAILING=19;
 const shipImage=new Image();shipImage.src=new URL('celebration-ship.png',document.currentScript.src).href;
 const ports=[[-100,2],[-84,4],[-67,5],[-50,6],[-34,6],[-17,6],[0,6],[18,5],[40,4],[59,3]];
 function reset(){queue=[];active=null;rockets=[];sparks=[];smoke=[];flashes=[];}
 function enqueue(name,hits,bonus){queue.push({name,hits,bonus,age:0,next:1.3,salute:1.4,hitFlash:0,volley:0});}
 function shipPosition(W,H,lag=0){if(!active)return null;const t=Math.max(0,active.age-lag);return {x:(-.16+t/SAILING*1.32)*W,y:H*.49+Math.sin(t*2)*2,s:Math.min(W,H)/790};}
 function launch(x,y,W,H,count=4){
  for(let i=0;i<count;i++){const color=colors[(active.volley+i*2)%colors.length];rockets.push({x,y,startX:x,from:y,to:H*(.09+Math.random()*.25),endX:Math.max(W*.06,Math.min(W*.94,x+(i-(count-1)/2)*W*.10+(Math.random()-.5)*W*.13)),duration:.65+Math.random()*.4,age:-i*.055,color,color2:colors[(active.volley+i*2+3)%colors.length]});}active.volley++;
 }
 function hitAt(x,y,W,H,lag=0,radius=0){
  const p=shipPosition(W,H,lag);if(!p)return false;
  const lx=(x-p.x)/p.s,ly=(y-p.y)/p.s,pad=radius/p.s;
  const hull=lx>=-140-pad&&lx<=127+pad&&ly>=-15-pad&&ly<=35+pad;
  const sails=[[-70,-160],[0,-185],[67,-160]].some(([mx,top])=>lx>=mx-36-pad&&lx<=mx+39+pad&&ly>=top+15-pad&&ly<=-18+pad);
  if(!hull&&!sails)return false;
  active.hitFlash=.35;
  flashes.push({x,y,life:.35,color:'#a9ffff'});
  launch(x,y,W,H,3);
  // The festive ship has no health or damage state and keeps sailing after every hit.
  return true;
 }
 function update(dt,W,H,boom){
  if(!active&&queue.length)active=queue.shift();if(!active)return;
  active.age+=dt;active.hitFlash=Math.max(0,active.hitFlash-dt);
  const p=shipPosition(W,H),inView=p.x>-90*p.s&&p.x<W+90*p.s;
  if(active.age>active.next&&active.age<17.9){active.next+=active.age>14?.23:.38;launch(p.x,p.y-18*p.s,W,H,active.age>14?6:4);}
  if(active.age>active.salute&&inView&&active.age<18){active.salute+=.8;boom('cannon');for(const [px,py] of ports){const x=p.x+px*p.s,y=p.y+py*p.s;flashes.push({x,y,life:.22,color:'#ffd075'});for(let j=0;j<3;j++)smoke.push({x:x+(Math.random()-.5)*8,y:y+j*3,life:2.3,size:5+Math.random()*7,gun:true});}}
  let exploded=false;
  for(const r of rockets){r.age+=dt;if(r.age<0)continue;const q=Math.min(1,r.age/r.duration);r.x=r.startX+(r.endX-r.startX)*q;r.y=r.from+(r.to-r.from)*q;
   if(q>=1&&!r.done){r.done=true;exploded=true;flashes.push({x:r.x,y:r.y,life:.22,color:r.color});const scale=Math.min(W,H)/720;
    for(let i=0;i<66;i++){const a=i*Math.PI*2/66,v=(i%3?70:125)+Math.random()*65,life=1.3+Math.random()*1.1;sparks.push({x:r.x,y:r.y,vx:Math.cos(a)*v*scale,vy:Math.sin(a)*v*scale,life,initial:life,color:i%3?r.color:r.color2,size:i%4?1.7:2.6});}
    for(let i=0;i<3;i++)smoke.push({x:r.x+(Math.random()-.5)*32,y:r.y+(Math.random()-.5)*20,life:2.2,size:8+Math.random()*12});
   }
  }
  if(exploded)boom('firework');rockets=rockets.filter(r=>!r.done);
  for(const p of sparks){p.life-=dt;p.vy+=dt*28;p.x+=p.vx*dt;p.y+=p.vy*dt;}sparks=sparks.filter(p=>p.life>0).slice(-2200);
  for(const p of smoke){p.life-=dt;p.x+=dt*13;p.y-=dt*8;p.size+=dt*11;}smoke=smoke.filter(p=>p.life>0).slice(-150);
  for(const f of flashes)f.life-=dt;flashes=flashes.filter(f=>f.life>0);
  if(active.age>DURATION){active=null;rockets=[];sparks=[];smoke=[];flashes=[];}
 }
 function draw(ctx,W,H){if(!active)return;const P=PirateArt,t=active.age,{x,y,s}=shipPosition(W,H);
  ctx.save();ctx.translate(x,y);ctx.scale(s,s);
  for(let i=0;i<3;i++)P.ellipse(ctx,-90-i*30,20+i*3,94+i*12,4,null,`rgba(162,216,225,${.26-i*.06})`,2);
  if(shipImage.complete&&shipImage.naturalWidth)ctx.drawImage(shipImage,-160,-190,320,240);
  if(active.hitFlash>0){ctx.save();ctx.globalAlpha=active.hitFlash*1.8;P.ellipse(ctx,0,-40,142,100,null,'#a9ffff',3);ctx.restore();}
  ctx.restore();
  for(const p of smoke){ctx.save();ctx.globalAlpha=Math.min(p.gun?.32:.16,p.life*(p.gun?.16:.075));const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.size);g.addColorStop(0,'#c6d7df');g.addColorStop(1,'#9cb3c000');ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill();ctx.restore();}
  ctx.save();ctx.globalCompositeOperation='lighter';for(const r of rockets){if(r.age<0)continue;P.line(ctx,[r.x,r.y,r.x-(r.endX-r.startX)*.045,r.y+27],r.color,2.5);P.ellipse(ctx,r.x,r.y,2.5,2.5,'#ffffff');}
  for(const f of flashes){P.glow(ctx,f.x,f.y,36,f.color,Math.min(.65,f.life*2));}
  for(const p of sparks){ctx.globalAlpha=Math.max(0,Math.min(1,p.life/.7));P.line(ctx,[p.x,p.y,p.x-p.vx*.045,p.y-p.vy*.045],p.color,p.size);}
  ctx.restore();
  ctx.save();ctx.globalAlpha=Math.min(1,t*2,(DURATION-t)*2);ctx.textAlign='center';ctx.shadowColor='#07151f';ctx.shadowBlur=12;ctx.fillStyle='#ffe6a5';ctx.font=`bold ${Math.max(17,Math.min(28,W*.029))}px Georgia`;ctx.fillText(`${active.hits} TREFF · +${active.bonus.toLocaleString('nb-NO')} POENG`,W*.5,H*.175);ctx.font='14px system-ui';ctx.fillStyle='#e4eadd';ctx.fillText(`${active.name} – treff festskuta: +200 poeng!`,W*.5,H*.175+25);ctx.restore();
 }
 return {reset,enqueue,update,draw,hitAt,depth:.64};
})();
