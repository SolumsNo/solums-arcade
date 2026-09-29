/* Solums Arcade: material rendering. Static surfaces are cached, animated water
   uses a bounded number of strips. Every material has a working offline fallback. */
(() => {
 'use strict';
 const base=new URL('.',document.currentScript.src);
 const images={};const surfaces=new Map();
 for(const name of ['grass','wood','sea']){const im=new Image();images[name]=im;im.onload=()=>surfaces.clear();im.src=new URL(name+'.webp',base).href;}
 const ready=im=>im.complete&&im.naturalWidth>0;
 const noise=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
 function cover(c,im,w,h){const q=Math.max(w/im.width,h/im.height),sw=w/q,sh=h/q;c.drawImage(im,(im.width-sw)/2,(im.height-sh)/2,sw,sh,0,0,w,h);}
 function cached(name,w,h,paint){const d=Math.min(devicePixelRatio||1,2),key=name+':'+w+':'+h+':'+d;
  let layer=surfaces.get(key);if(!layer){layer=document.createElement('canvas');layer.width=Math.ceil(w*d);layer.height=Math.ceil(h*d);const c=layer.getContext('2d');c.scale(d,d);paint(c,w,h);if(surfaces.size>5)surfaces.clear();surfaces.set(key,layer);}return layer;
 }
 function ground(ctx,w,h){const layer=cached('grass',w,h,(c,w,h)=>{
  c.fillStyle='#3a6330';c.fillRect(0,0,w,h);
  if(ready(images.grass)){cover(c,images.grass,w,h);c.fillStyle='rgba(17,40,18,.17)';c.fillRect(0,0,w,h);}
  else{for(let i=0;i<19000;i++){const x=noise(i)*w,y=noise(i+20001)*h;c.strokeStyle=['#6d8239','#4f7435','#345125','#769249'][i%4];c.beginPath();c.moveTo(x,y);c.lineTo(x+noise(i+6)*4-2,y-3-noise(i+10)*6);c.stroke();}}
  // Broad pools of daylight give depth without obscuring player boundaries.
  const sun=c.createRadialGradient(w*.24,h*.16,0,w*.24,h*.16,w*.8);sun.addColorStop(0,'rgba(255,234,159,.13)');sun.addColorStop(.6,'rgba(255,230,150,0)');sun.addColorStop(1,'rgba(2,19,10,.19)');c.fillStyle=sun;c.fillRect(0,0,w,h);
  const edge=c.createRadialGradient(w/2,h/2,Math.min(w,h)*.25,w/2,h/2,Math.max(w,h)*.65);edge.addColorStop(0,'rgba(0,0,0,0)');edge.addColorStop(1,'rgba(2,15,7,.34)');c.fillStyle=edge;c.fillRect(0,0,w,h);
 });ctx.drawImage(layer,0,0,w,h);}
 function table(ctx,w,h){const layer=cached('table',w,h,(c,w,h)=>{
  const g=c.createLinearGradient(0,0,w,h);g.addColorStop(0,'#164c5d');g.addColorStop(.42,'#206b7b');g.addColorStop(1,'#103c4b');c.fillStyle=g;c.fillRect(0,0,w,h);
  // Fine matte enamel grain, baked once, never regenerated every frame.
  for(let i=0;i<Math.min(42000,w*h/15);i++){c.fillStyle=i%2?'rgba(198,236,236,.075)':'rgba(0,21,30,.13)';c.fillRect(noise(i)*w,noise(i+45000)*h,1,1);}
  const light=c.createRadialGradient(w*.35,h*.12,0,w*.35,h*.12,w*.8);light.addColorStop(0,'rgba(194,250,236,.16)');light.addColorStop(.8,'rgba(0,0,0,0)');light.addColorStop(1,'rgba(0,0,0,.2)');c.fillStyle=light;c.fillRect(0,0,w,h);
  c.strokeStyle='#061c25';c.lineWidth=12;c.strokeRect(0,0,w,h);c.strokeStyle='rgba(231,244,225,.85)';c.lineWidth=3;c.strokeRect(9,9,w-18,h-18);
  c.strokeStyle='rgba(217,239,226,.55)';c.lineWidth=1.5;c.beginPath();c.moveTo(10,h/2);c.lineTo(w-10,h/2);c.stroke();
  // A narrow mesh net preserves the original center boundary and ball visibility.
  const shadow=c.createLinearGradient(w/2-4,0,w/2+24,0);shadow.addColorStop(0,'rgba(0,10,15,.32)');shadow.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=shadow;c.fillRect(w/2-4,10,28,h-20);
  c.fillStyle='rgba(5,24,30,.62)';c.fillRect(w/2-5,10,10,h-20);c.strokeStyle='rgba(226,236,217,.45)';c.lineWidth=.7;
  for(let y=14;y<h-10;y+=5){c.beginPath();c.moveTo(w/2-5,y);c.lineTo(w/2+5,y);c.stroke();}
  c.strokeStyle='rgba(237,244,225,.8)';c.lineWidth=2;c.beginPath();c.moveTo(w/2-5,10);c.lineTo(w/2-5,h-10);c.moveTo(w/2+5,10);c.lineTo(w/2+5,h-10);c.stroke();
  c.font='600 12px system-ui';c.letterSpacing='3px';c.textAlign='center';c.fillStyle='rgba(217,240,232,.22)';c.fillText('SOLUMS  •  TABLE TENNIS',w*.25,h-24);
 });ctx.drawImage(layer,0,0,w,h);}
 function deck(ctx,w,h,y){ctx.save();ctx.beginPath();ctx.rect(0,y,w,h-y);ctx.clip();
  if(ready(images.wood)){ctx.drawImage(images.wood,0,0,images.wood.width,images.wood.height,0,y,w,h-y);ctx.fillStyle='rgba(8,20,25,.43)';ctx.fillRect(0,y,w,h-y);}
  const sheen=ctx.createLinearGradient(w*.25,y,w*.9,h);sheen.addColorStop(0,'rgba(81,141,151,.03)');sheen.addColorStop(.65,'rgba(164,207,210,.19)');sheen.addColorStop(1,'rgba(12,13,14,.35)');ctx.fillStyle=sheen;ctx.fillRect(0,y,w,h-y);
  // Fine longitudinal grain and small iron nails in the receding planks.
  ctx.lineWidth=.7;for(let i=0;i<130;i++){const x=noise(i+400)*w;ctx.strokeStyle=i%3?'rgba(14,9,5,.16)':'rgba(211,186,138,.12)';ctx.beginPath();ctx.moveTo(w*.5+(x-w*.5)*.68,y);ctx.bezierCurveTo(x+7,y+(h-y)*.35,x-5,y+(h-y)*.7,x,h);ctx.stroke();}
  for(let i=1;i<13;i++){const x=i*w/13;for(let j=1;j<4;j++){const yy=y+(h-y)*j/4,xx=w*.5+(x-w*.5)*(.68+.32*j/4);ctx.fillStyle='#100f0d';ctx.beginPath();ctx.ellipse(xx+6,yy,1.8,1.1,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='rgba(210,206,170,.35)';ctx.fillRect(xx+5,yy-1,2,.7);}}
  ctx.restore();}
 function sea(ctx,w,h,t,flash){const im=images.sea;if(!ready(im))return false;
  ctx.drawImage(im,0,0,w,h);
  const top=h*.552,waterEnd=h*.80,band=Math.max(2,h/240),sx=im.width/w,sy=im.height/h;
  // Perspective-dependent displacement of the actual water detail. Leave the
  // coastline intact; the moving central channel widens toward the foreground.
  for(let y=top;y<waterEnd;y+=band){const depth=(y-top)/(waterEnd-top),inset=w*(.25-.20*depth),shift=Math.sin(y*.049-t*1.25)*(1+depth*4)+Math.sin(y*.11+t*.8)*depth*2;
   const sourceY=Math.min(im.height-1,y*sy),sourceH=Math.min(im.height-sourceY,band*sy+1);
   ctx.drawImage(im,inset*sx,sourceY,(w-2*inset)*sx,sourceH,inset+shift,y,w-2*inset,band+1);
  }
  ctx.save();ctx.beginPath();ctx.moveTo(w*.28,top);ctx.lineTo(w*.76,top);ctx.lineTo(w*.96,waterEnd);ctx.lineTo(w*.05,waterEnd);ctx.closePath();ctx.clip();
  // Broken crests and moon glints vary in scale with distance, never uniform lines.
  for(let i=0;i<100;i++){const d=noise(i+90),y=top+Math.pow(d,1.55)*(waterEnd-top),x=noise(i+210)*w,len=(3+d*d*29),phase=t*(.65+d*.3)+i*2.3,alpha=(.025+.065*d)*(.5+.5*Math.sin(phase));
   ctx.strokeStyle=`rgba(170,224,231,${alpha})`;ctx.lineWidth=.5+d;ctx.beginPath();ctx.moveTo(x+Math.sin(phase)*4,y);ctx.quadraticCurveTo(x+len*.5,y-1-d*2,x+len,y+Math.sin(phase)*d);ctx.stroke();
  }
  ctx.restore();
  // Airborne sea mist, placed above the horizon rather than whitening the targets.
  const fog=ctx.createLinearGradient(0,h*.40,0,h*.58);fog.addColorStop(0,'rgba(157,192,202,0)');fog.addColorStop(.48,'rgba(132,180,192,.07)');fog.addColorStop(1,'rgba(132,180,192,0)');ctx.fillStyle=fog;ctx.fillRect(0,h*.40,w,h*.18);
  if(flash>0){ctx.fillStyle=`rgba(204,229,239,${flash*.13})`;ctx.fillRect(0,0,w,h);}
  return true;
 }
 window.ArcadeArt={ground,table,deck,sea};
})();
