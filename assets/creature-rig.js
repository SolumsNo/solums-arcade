/* Local skeletal-style sprite rig. Only wings/tentacles move; body scale is constant. */
window.CreatureRig=(()=>{
 const TAU=Math.PI*2,caches=new WeakMap();
 const smooth=(a,b,v)=>{const q=Math.max(0,Math.min(1,(v-a)/(b-a)));return q*q*(3-2*q);};
 function rotate(u,v,x,y,angle,weight){const dx=u-x,dy=v-y,c=Math.cos(angle),s=Math.sin(angle);return {x:(dx*c-dy*s-dx)*weight,y:(dx*s+dy*c-dy)*weight};}
 function deform(type,u,v,phase){let x=u,y=v;
  if(type==='dragon'){
   // Shoulder hinges rotate wings in depth: foreshortening is restricted to wing membranes.
   const stroke=Math.sin(phase)+.17*Math.sin(phase*2),angle=stroke*.78;
   const left=smooth(0,.09,.47-.17*v-u)*(1-smooth(.50,.62,v));
   const right=smooth(0,.075,u-(.66+.13*Math.max(0,v-.4)))*(1-smooth(.67,.77,v));
   for(const [rootX,rootY,w] of [[.42,.43,left],[.66,.42,right]]){
    const dx=u-rootX,dy=v-rootY;
    x+=dx*(Math.cos(angle)-1)*w;
    y+=(Math.abs(dx)*Math.sin(angle)*.64+dy*(Math.cos(angle*.3)-1))*w;
   }
  }else if(type==='seaMonster'){
   // Independent shoulder curls, with a quieter follow-through in the lower tentacles.
   const bones=[
    [.235,.53,.19*Math.sin(phase), (1-smooth(.23,.31,u))*(1-smooth(.46,.58,v))],
    [.785,.64,-.18*Math.sin(phase+.85),smooth(.72,.80,u)*(1-smooth(.58,.69,v))],
    [.38,.72,.055*Math.sin(phase+1.7),(1-smooth(.31,.43,u))*smooth(.50,.65,v)],
    [.72,.73,-.06*Math.sin(phase+2.8),smooth(.68,.80,u)*smooth(.62,.74,v)],
    [.56,.76,.085*Math.sin(phase+3.7),smooth(.37,.49,u)*(1-smooth(.68,.78,u))*smooth(.72,.86,v)]
   ];
   for(const [rx,ry,a,w] of bones){const d=rotate(u,v,rx,ry,a,w);x+=d.x;y+=d.y;}
  }
  return {x,y};
 }
 function triangle(ctx,image,src,dst){
  const [a,b,c]=src,[p,q,r]=dst,det=a.x*(b.y-c.y)+b.x*(c.y-a.y)+c.x*(a.y-b.y);
  if(Math.abs(det)<1e-8)return;
  const solve=(pa,pb,pc)=>[(pa*(b.y-c.y)+pb*(c.y-a.y)+pc*(a.y-b.y))/det,(pa*(c.x-b.x)+pb*(a.x-c.x)+pc*(b.x-a.x))/det,(pa*(b.x*c.y-c.x*b.y)+pb*(c.x*a.y-a.x*c.y)+pc*(a.x*b.y-b.x*a.y))/det];
  const X=solve(p.x,q.x,r.x),Y=solve(p.y,q.y,r.y);
  // Subpixel overlap prevents hairline cracks between neighbouring triangles.
  const mx=(p.x+q.x+r.x)/3,my=(p.y+q.y+r.y)/3;
  ctx.save();ctx.beginPath();for(const [i,v] of dst.entries()){const dx=v.x-mx,dy=v.y-my,l=Math.hypot(dx,dy)||1;const x=v.x+dx/l*.38,y=v.y+dy/l*.38;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();ctx.clip();
  ctx.transform(X[0],Y[0],X[1],Y[1],X[2],Y[2]);ctx.drawImage(image,0,0);ctx.restore();
 }
 function frame(image,type,index,count){
  const width=type==='dragon'?384:320,height=Math.round(width*image.naturalHeight/image.naturalWidth),pad=70;
  const canvas=document.createElement('canvas');canvas.width=width+pad*2;canvas.height=height+pad*2;
  const ctx=canvas.getContext('2d'),nx=30,ny=22,phase=index/count*TAU,verts=[];
  for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){const u=i/nx,v=j/ny,d=deform(type,u,v,phase);verts.push({src:{x:u*image.naturalWidth,y:v*image.naturalHeight},dst:{x:d.x*width+pad,y:d.y*height+pad}});}
  for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i,b=a+1,c=a+nx+1,d=c+1;
   for(const ids of [[a,b,c],[b,d,c]])triangle(ctx,image,ids.map(i=>verts[i].src),ids.map(i=>verts[i].dst));
  }
  return {canvas,width,height,pad};
 }
 function draw(ctx,image,type,time,width,anchor){
  if(!image.complete||!image.naturalWidth)return;
  const count=type==='dragon'?40:48,period=type==='dragon'?1.65:4.8;
  const index=Math.floor(((time%period+period)%period)/period*count);
  let cache=caches.get(image);if(!cache){cache=new Map();caches.set(image,cache);}
  let f=cache.get(index);if(!f){f=frame(image,type,index,count);cache.set(index,f);}
  const scale=width/f.width;
  ctx.drawImage(f.canvas,-width/2-f.pad*scale,-f.height*scale*anchor-f.pad*scale,f.canvas.width*scale,f.canvas.height*scale);
 }
 return {draw,deform};
})();
