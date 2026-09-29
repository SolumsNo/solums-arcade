/* Animated water is rendered from the saved local seascape, with perspective
   waves, two-dimensional advection, and changing specular light. Canvas fallback
   covers machines without WebGL and local-file texture security restrictions. */
(() => {
'use strict';
const im=new Image();im.src=new URL('sea.webp',document.currentScript.src).href;
let surface,gl,program,uniforms,failed=false,textureReady=false,contextLost=false;
const vertex=`attribute vec2 a_position;varying vec2 uv;void main(){uv=vec2((a_position.x+1.0)*0.5,(1.0-a_position.y)*0.5);gl_Position=vec4(a_position,0.0,1.0);}`;
const fragment=`precision mediump float;
varying vec2 uv;uniform sampler2D scene;uniform float time;
float wave(vec2 p,float t){return sin(p.x*13.0+p.y*20.0-t*1.4)*.48+sin(p.x*27.0-p.y*13.0+t*.97)*.28+sin(p.x*43.0+p.y*31.0-t*1.88)*.15+sin(p.x*79.0-p.y*45.0+t*2.2)*.09;}
void main(){
 vec2 p=uv;float horizon=.345;float d=clamp((p.y-horizon)/(.80-horizon),0.0,1.0);
 float srcY=p.y<horizon?(p.y<.22?p.y:.22+(p.y-.22)*(.548-.22)/(horizon-.22)):.548+(p.y-horizon)*.452/(1.0-horizon);
 vec2 tex=vec2(p.x,srcY);
 if(p.y>horizon){
  float fade=smoothstep(0.0,.07,d);vec2 world=vec2((p.x-.5)*(2.0-d),log(1.0+d*18.0)*1.8);
  float z=wave(world,time);float z2=wave(world+vec2(.015,0.0),time);float z3=wave(world+vec2(0.0,.025),time);
  tex.x+=(z*.012+sin(world.y*7.0-time)*.004)*d*fade;
  tex.y+=(z*.009+sin(world.x*6.0+world.y*5.0-time*.8)*.003)*d*fade;
  vec3 color=texture2D(scene,clamp(tex,vec2(.001),vec2(.999))).rgb;
  vec3 normal=normalize(vec3((z-z2)*8.0,(z-z3)*6.0,1.0));
  float spec=pow(max(dot(normal,normalize(vec3(-.33,-.45,1.0))),0.0),34.0);
  float moon=exp(-pow((p.x-.255)/(.065+d*.21),2.0));
  color*=1.0+z*.13*fade;
  color+=vec3(.32,.51,.61)*spec*(.04+moon*.17)*fade;
  float crest=smoothstep(.50,.79,z)*(.4+.6*sin(world.x*67.0+world.y*39.0+time*.8));
  color=mix(color,vec3(.49,.66,.71),max(0.0,crest)*.10*d*fade);
  gl_FragColor=vec4(color,1.0);
 }else{gl_FragColor=texture2D(scene,tex);}
}`;
function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error('Water shader compilation failed');return s;}
function setup(){if(failed||gl||!im.complete||!im.naturalWidth)return;try{
 surface=document.createElement('canvas');gl=surface.getContext('webgl',{alpha:false,antialias:false,depth:false,stencil:false,preserveDrawingBuffer:true});if(!gl)throw Error('No WebGL');
 surface.addEventListener('webglcontextlost',e=>{e.preventDefault();contextLost=true;});
 surface.addEventListener('webglcontextrestored',()=>{contextLost=false;gl=null;textureReady=false;setup();});
 program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Water shader link failed');gl.useProgram(program);
 const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const loc=gl.getAttribLocation(program,'a_position');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
 const tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,im);uniforms={time:gl.getUniformLocation(program,'time')};textureReady=true;
 }catch(e){failed=true;gl=null;textureReady=false;}}
function fallback(c,w,h,t){const split=.548*im.height,hy=h*.345;
 c.drawImage(im,0,0,im.width,im.height*.22,0,0,w,h*.22);c.drawImage(im,0,im.height*.22,im.width,split-im.height*.22,0,h*.22,w,hy-h*.22);c.drawImage(im,0,split,im.width,im.height-split,0,hy,w,h-hy);
 const band=Math.max(2,h/250);for(let y=hy+1;y<h*.81;y+=band){const d=(y-hy)/(h-hy),u=(y-hy)/(h-hy),shift=Math.sin(y*.033-t*1.4)*d*22,sy=split+u*(im.height-split)+Math.sin(y*.017+t)*d*12,sh=band*(im.height-split)/(h-hy);
 c.drawImage(im,0,Math.min(im.height-sh,Math.max(split,sy)),im.width,sh,-12+shift,y,w+24,band+1);}}
function draw(c,w,h,t,flash){if(!im.complete||!im.naturalWidth)return false;setup();
 if(gl&&textureReady&&!contextLost){const scale=Math.min(1.25,1800/w),cw=Math.round(w*scale),ch=Math.round(h*scale);if(surface.width!==cw||surface.height!==ch){surface.width=cw;surface.height=ch;gl.viewport(0,0,cw,ch);}gl.uniform1f(uniforms.time,t);gl.drawArrays(gl.TRIANGLES,0,6);c.drawImage(surface,0,0,w,h);}else fallback(c,w,h,t);
 c.save();
 // Rolling foam follows different wave fronts at different perspective depths.
 for(let row=0;row<15;row++){const phase=(row/15+t*.018)%1,d=phase*phase,y=h*(.35+d*.46),alpha=Math.sin(phase*Math.PI)*.21;
 c.strokeStyle=`rgba(163,213,224,${alpha})`;c.lineWidth=.5+d*1.7;
 for(let j=0;j<7;j++){const x=((j*.161+row*.073+t*.008)%1.2-.1)*w,len=w*(.009+d*.025);c.beginPath();for(let k=0;k<=10;k++){const xx=x+k*len/10,yy=y+Math.sin(xx/w*36-t*1.8+row)*h*.005*d+Math.sin(k*.8+row)*d*1.4;if(k===0)c.moveTo(xx,yy);else c.lineTo(xx,yy);}c.stroke();}}
 // Slow banks of sea fog, with moving breaks in the veil.
 for(let i=0;i<3;i++){const x=((i*.43+t*.005)%1.5-.25)*w,y=h*(.342+Math.sin(t*.22+i)*.009),r=w*.25;const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'rgba(151,186,194,.08)');g.addColorStop(1,'rgba(130,167,182,0)');c.fillStyle=g;c.beginPath();c.ellipse(x,y,r,h*.055,0,0,Math.PI*2);c.fill();}
 // Rain uses deterministic positions so it never flickers from random redraws.
 c.strokeStyle='rgba(159,205,225,.16)';c.lineWidth=.7;for(let i=0;i<65;i++){const x=((i*.6180339)%1)*w,y=((i*.381966+t*.60)%1)*h;c.beginPath();c.moveTo(x,y);c.lineTo(x-4,y+13);c.stroke();}
 if(flash>.03){c.fillStyle=`rgba(194,222,248,${flash*.18})`;c.fillRect(0,0,w,h);c.save();c.globalAlpha=flash*.7;c.strokeStyle='#daefff';c.lineWidth=1.5;c.shadowColor='#9de4ff';c.shadowBlur=10;c.beginPath();c.moveTo(w*.78,0);c.lineTo(w*.76,h*.065);c.lineTo(w*.779,h*.061);c.lineTo(w*.74,h*.15);c.lineTo(w*.756,h*.147);c.lineTo(w*.724,h*.23);c.stroke();c.restore();}
 c.restore();return true;
}
window.PirateSea={draw,drawFallback:fallback,get backend(){return gl&&textureReady&&!contextLost?"WebGL":"Canvas";}};
})();
