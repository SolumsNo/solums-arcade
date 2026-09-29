/* Local 3D naval cannon: mesh geometry, perspective projection and directional lighting. */
window.NavalCannon=(()=>{
 const TAU=Math.PI*2, faces=[], details=[];
 const metal=[74,92,104], brass=[164,139,90], wood=[148,94,48], iron=[48,59,66];
 const add=(v,c)=>faces.push({v,c});
 function box(x,y,z,w,d,h,c){const v=[[x,y,z],[x+w,y,z],[x+w,y+d,z],[x,y+d,z],[x,y,z+h],[x+w,y,z+h],[x+w,y+d,z+h],[x,y+d,z+h]];for(const f of [[0,3,2,1],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7],[4,5,6,7]])add(f.map(i=>v[i]),c);}
 // Lathed cast-iron tube. Axis points away from the viewer along negative Y.
 function lathe(profile,c,barrel=true){const N=40;for(let j=0;j<profile.length-1;j++)for(let i=0;i<N;i++){
  const vertex=(k,t)=>{const [y,r]=profile[k];return [Math.cos(t)*r,y,Math.sin(t)*r+76];};
  faces.push({v:[vertex(j,i*TAU/N),vertex(j+1,i*TAU/N),vertex(j+1,(i+1)*TAU/N),vertex(j,(i+1)*TAU/N)],c,barrel});
 }}
 // Thick oak cheeks and the transverse rear bolster of a naval truck carriage.
 box(-48,-70,24,15,121,20,wood);box(33,-70,24,15,121,20,wood);
 box(-48,-55,44,15,79,18,[128,82,44]);box(33,-55,44,15,79,18,[128,82,44]);
 box(-48,-37,62,15,39,14,wood);box(33,-37,62,15,39,14,wood);
 box(-34,22,24,68,24,20,wood);box(-34,-61,24,68,20,14,wood);
 box(-39,-25,42,78,12,12,iron);
 // Four small solid truck wheels, with tyres and brass hubs, axis across the ship.
 function wheel(cx,cy){const N=32;for(let side=-1;side<=1;side+=2){const xx=cx+side*7;for(let i=0;i<N;i++){
  const a=i*TAU/N,b=(i+1)*TAU/N;
  const v=(x,t,r=23)=>[x,cy+Math.cos(t)*r,23+Math.sin(t)*r];
  add([[xx,cy,23],v(xx,a),v(xx,b)],[84,57,33]);
  add([v(cx-7,a),v(cx+7,a),v(cx+7,b),v(cx-7,b)],iron);
  add([v(xx,a,23.4),v(xx,b,23.4),v(xx,b,19),v(xx,a,19)],[81,88,83]);
  add([[xx+side,cy,23],v(xx+side,a,7),v(xx+side,b,7)],brass);
 }} }
 for(const x of [-58,58])for(const y of [-52,37])wheel(x,y);
 // Rounded closed breech, cascabel knob, long parallel bore and modest muzzle flare.
 lathe([[58,0],[59,6],[56,10],[48,11],[43,7],[38,7],[37,15],[30,24],[16,28],[-5,28],[-44,26],[-95,23],[-152,20],[-169,20],[-173,24],[-184,24],[-187,22]],metal);
 // Inner bore is only visible from appropriate oblique angles, never painted on the back.
 lathe([[-187,22],[-187,16],[-165,16],[-165,0]],[9,14,17]);
 for(const [y,r] of [[15,29],[-43,27],[-153,22]])lathe([[y+3,r-1],[y+2,r+1],[y-3,r+1],[y-4,r-1]],brass);
 // Trunnions and iron straps holding the barrel in its cradle.
 box(-39,-26,68,78,14,14,metal);
 for(const x of [-48,33]){box(x,-32,75,15,23,4,iron);box(x,13,26,15,6,33,iron);}
 for(const x of [-43,39])for(const y of [-49,39])box(x,y,44,4,4,4,brass);
 for(const x of [-25,23])box(x,46,32,4,2,4,brass);
 // Stable fine grain, plank joints and fastening studs on exposed wood.
 for(const x of [-48.2,48.2])for(let i=0;i<11;i++)details.push({v:[[x,-64,28+i*1.3],[x,46,29+i*1.3]],c:i%3?'#352619':'#b08b5c'});
 for(const y of [23,46])for(let i=0;i<8;i++)details.push({v:[[-30,y+.2,27+i*1.7],[30,y+.2,28+i*1.7]],c:i%3?'#4c301d':'#a8814e'});
 function transform(v,yaw,pitch,barrel,recoil=0){let [x,y,z]=v;if(barrel){const yy=y+20,zz=z-76;y=yy*Math.cos(pitch)+zz*Math.sin(pitch)-20+recoil*11;z=-yy*Math.sin(pitch)+zz*Math.cos(pitch)+76;}return [x*Math.cos(yaw)-y*Math.sin(yaw),x*Math.sin(yaw)+y*Math.cos(yaw),z];}
 function project(v){const [x,y,z]=v,d=640-y*.89-z*.45,k=640/d;return {x:x*k,y:(y*.45-z*.89)*k+57,d};}
 function pose(power,lateral){const yaw=lateral*.85,pitch=.015+power*.11;const p=project(transform([0,-187,76],yaw,pitch,true));return {...p,yaw,pitch};}
 function renderMesh(ctx,power,lateral,recoil){const p=pose(power,lateral),polygons=[];
 for(const f of faces){const v=f.v.map(v=>transform(v,p.yaw,p.pitch,f.barrel,recoil));const a=v[0],b=v[1],c=v[2],u=b.map((q,i)=>q-a[i]),w=c.map((q,i)=>q-a[i]);let n=[u[1]*w[2]-u[2]*w[1],u[2]*w[0]-u[0]*w[2],u[0]*w[1]-u[1]*w[0]];const length=Math.hypot(...n)||1;n=n.map(q=>q/length*(f.barrel?-1:1));const lighting=.65+.50*Math.max(0,n[0]*-.45+n[1]*.25+n[2]*.86);const spec=f.c===metal?Math.pow(Math.max(0,n[0]*-.23+n[1]*.55+n[2]*.80),16)*72:0;const color=f.c.map(q=>Math.min(255,Math.round(q*lighting+spec)));const screen=v.map(project);polygons.push({v:screen,d:screen.reduce((a,p)=>a+p.d,0)/screen.length,c:`rgb(${color})`});}
 polygons.sort((a,b)=>b.d-a.d);
 for(const f of polygons){ctx.beginPath();f.v.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle=f.c;ctx.fill();ctx.strokeStyle=f.c;ctx.lineWidth=.65;ctx.stroke();}
 // Grain on the visible rear bolster (kept beneath the breech).
 ctx.lineWidth=.7;for(const d of details){if(Math.abs(d.v[0][0])>40)continue;const a=project(transform(d.v[0],p.yaw,0,false)),b=project(transform(d.v[1],p.yaw,0,false));ctx.strokeStyle=d.c;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
 }
 const cache=[];
 function draw(ctx,power,lateral,recoil,slot=0){
   const key=[power.toFixed(3),lateral.toFixed(3),recoil.toFixed(2)].join(':');
   let c=cache[slot];if(!c){const canvas=document.createElement('canvas');canvas.width=960;canvas.height=640;c=cache[slot]={canvas,ctx:canvas.getContext('2d'),key:null};}
   if(c.key!==key){c.ctx.setTransform(2,0,0,2,480,400);c.ctx.clearRect(-240,-200,480,320);renderMesh(c.ctx,power,lateral,recoil);c.key=key;}
   ctx.drawImage(c.canvas,-240,-200,480,320);
 }
 return {pose,draw};
})();
