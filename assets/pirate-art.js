/* Hand-drawn, animated silhouettes. Geometry remains inside the existing
   target radius; decorative wings, wisps and spray do not change collision. */
(() => {
'use strict';
const TAU=Math.PI*2,hash=n=>{const x=Math.sin(n*91.37+17.1)*43758.545;return x-Math.floor(x);};
function ellipse(c,x,y,rx,ry,fill,stroke,lw=1){c.beginPath();c.ellipse(x,y,Math.max(.01,rx),Math.max(.01,ry),0,0,TAU);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=lw;c.stroke();}}
function line(c,pts,color,width=1){c.beginPath();c.moveTo(pts[0],pts[1]);for(let i=2;i<pts.length;i+=2)c.lineTo(pts[i],pts[i+1]);c.strokeStyle=color;c.lineWidth=width;c.stroke();}
function gradient(c,x1,y1,x2,y2,stops){const g=c.createLinearGradient(x1,y1,x2,y2);stops.forEach(([a,b])=>g.addColorStop(a,b));return g;}
function glow(c,x,y,r,color,alpha=.4){c.save();c.globalAlpha=alpha;const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'rgba(0,0,0,0)');ellipse(c,x,y,r,r,g);c.restore();}
function path(c,fn,fill,stroke,lw=1){c.beginPath();fn(c);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=lw;c.stroke();}}
function skull(c,x,y,s,color='#d3c8a0',eyes='#090e11'){
 c.save();c.translate(x,y);c.scale(s,s);
 path(c,c=>{c.moveTo(-19,5);c.bezierCurveTo(-37,-38,37,-38,19,5);c.lineTo(15,17);c.lineTo(-15,17);c.closePath();},gradient(c,-20,-25,24,20,[[0,'#faf0c7'],[.45,color],[1,'#5a6357']]),'#101a1b',1.5);
 ellipse(c,-11,-6,8,7,eyes);ellipse(c,11,-6,8,7,eyes);
 path(c,c=>{c.moveTo(0,-1);c.lineTo(-5,7);c.lineTo(5,7);c.closePath();},'#152325');
 for(let i=-12;i<=12;i+=6)line(c,[i,9,i,17],'#3d4941',2);
 c.restore();
}
function rivet(c,x,y,r=2.5){ellipse(c,x+1,y+1,r+1,r+1,'#070d10');ellipse(c,x,y,r,r,gradient(c,x-r,y-r,x+r,y+r,[[0,'#c2d0c9'],[.4,'#737b6d'],[1,'#252d2b']]));line(c,[x-r*.4,y,x+r*.4,y],'#25302b',.8);}
function waterline(c,y,t,color='#a7e1d8'){
 c.save();c.globalAlpha=.36;for(let k=0;k<3;k++){c.beginPath();c.ellipse(0,y+k*3,68+k*13+Math.sin(t*2+k)*4,6+k*2,0,0,TAU);c.strokeStyle=color;c.lineWidth=1.2;c.stroke();}c.restore();
}
function bullseye(c,type,t){const gold=type==='gold',accent=gold?'#f9c961':type==='time'?'#8aecfa':type==='ammo'?'#b5efa0':'#caece2';
 waterline(c,119,t);ellipse(c,0,118,69,9,'#142d31','#71988d',1.3);
 path(c,c=>{c.moveTo(-58,111);c.lineTo(55,111);c.lineTo(42,125);c.lineTo(-45,125);c.closePath();},'#392c21','#0a1419',3);
 line(c,[-29,110,-26,123,0,110,2,124,29,111,27,121],'#8c7660',1.3);
 line(c,[0,65,0,116],'#111513',12);line(c,[-2,68,-2,113],'#91795a',3);
 glow(c,0,0,125,accent,.12+.04*Math.sin(t*2));
 ellipse(c,4,7,99,99,'#061317');
 const rim=gradient(c,-90,-95,90,80,[[0,gold?'#fff0ae':'#bfd0c8'],[.2,gold?'#aa792f':'#596d6a'],[.52,'#172624'],[.82,gold?'#c28a38':'#6f8580'],[1,'#142020']]);
 ellipse(c,0,0,97,97,rim,'#071216',3);
 ellipse(c,0,0,86,86,gradient(c,-40,-70,50,80,[[0,'#6b5440'],[.6,'#322e28'],[1,'#131e1f']]),'#060e10',3);
 c.save();ellipse(c,0,0,84,84,null);c.clip();
 for(let i=0;i<21;i++){const x=-100+i*10;line(c,[x,-100,x+Math.sin(i)*5,100],i%3?'#171c19':'#89735a',i%3?1.2:2);}
 for(let i=0;i<70;i++){const x=(hash(i)-.5)*170,y=(hash(i+99)-.5)*170;line(c,[x,y,x+2+hash(i+3)*13,y+hash(i+6)*3],'rgba(197,197,157,.13)',.9);}
 c.restore();
 for(const [rr,thick] of [[76,8],[51,6],[27,4]]){ellipse(c,0,0,rr,rr,null,'#081517',thick+3);ellipse(c,0,-1,rr,rr,null,gold?'#c89943':'#b9c5aa',thick);ellipse(c,0,0,rr-4,rr-4,null,'#ffffff30',1);}
 ellipse(c,0,0,15,15,'#751a1b','#ef7550',2);glow(c,0,0,21,gold?'#ffcc45':'#e96337',.20);
 for(let i=0;i<12;i++){const a=i*TAU/12;rivet(c,Math.cos(a)*90,Math.sin(a)*90,3);}
 for(let i=0;i<6;i++){const a=i*1.61+.8,x=Math.cos(a),y=Math.sin(a);line(c,[x*30,y*30,x*59+3,y*59,x*81,y*81],'#071013',1.7);}
 // Tiny bones and skull decorate the outer ring; the scoring circles stay clear.
 skull(c,0,-67,.34,'#c1baa0');
 if(type==='time'||type==='ammo'){ellipse(c,58,-67,23,23,'#0c2129',accent,2);c.font='bold 22px Georgia';c.textAlign='center';c.textBaseline='middle';c.fillStyle=accent;c.fillText(type==='time'?'+5':'+2',58,-67);}
 if(gold){c.save();c.strokeStyle='#ffdda0';c.globalAlpha=.7;c.lineWidth=2;for(let i=0;i<4;i++){const a=t*.35+i*TAU/4;const x=Math.cos(a)*106,y=Math.sin(a)*106;line(c,[x-4,y,x+4,y],'#ffe5b0',1);line(c,[x,y-4,x,y+4],'#ffe5b0',1);}c.restore();}
}
function barrel(c,t){waterline(c,87,t);glow(c,0,-78,65,'#ff9f42',.15);
 const body=gradient(c,-60,0,60,0,[[0,'#1b1612'],[.24,'#855432'],[.44,'#a67845'],[.65,'#4f3424'],[1,'#151b18']]);
 path(c,c=>{c.moveTo(-43,-78);c.bezierCurveTo(-67,-20,-66,43,-44,79);c.quadraticCurveTo(0,95,44,79);c.bezierCurveTo(64,34,65,-26,43,-78);c.closePath();},body,'#081316',4);
 for(let j=-3;j<=3;j++){const x=j*14;path(c,c=>{c.moveTo(x*.75,-75);c.quadraticCurveTo(x*1.6,0,x*.85,82);},null,'#20190f',2);for(let k=0;k<3;k++)path(c,c=>{c.moveTo(x+k*2,-68+k*15);c.bezierCurveTo(x+7,0,x-4,27,x+k*2,69-k*11);},null,'rgba(239,194,118,.15)',.8);}
 ellipse(c,0,-76,44,12,'#4a3422','#bb8d55',2);
 for(const y of [-47,47]){const g=gradient(c,0,y-8,0,y+9,[[0,'#8c9c93'],[.2,'#485951'],[.65,'#182a29'],[1,'#879185']]);c.fillStyle=g;c.fillRect(-58,y-8,116,16);for(let i=-2;i<=2;i++)rivet(c,i*23,y,2.3);}
 skull(c,0,0,.85,'#e4ce97');line(c,[-23,27,24,-22,-22,-24,26,26],'#b6a57a',3);skull(c,0,0,.65,'#e4ce97');
 path(c,c=>{c.moveTo(8,-80);c.bezierCurveTo(24,-110,46,-82,36,-112);},null,'#bba279',4);
 const fy=-112+Math.sin(t*9)*2;glow(c,36,fy,25,'#ff9f2e',.8);ellipse(c,36,fy,3,5,'#fff4a3');
 for(let i=0;i<5;i++){const q=(t*1.3+i*.21)%1;ellipse(c,36+Math.sin(i*4)*q*22,fy-q*27,1.7*(1-q),1.7*(1-q),'#ffcf74');}
}
function monster(c,t){waterline(c,73,t);glow(c,0,0,123,'#46c8b5',.12);
 // Tapered articulated tentacles with double-lit ridges and paired suckers.
 for(let i=0;i<8;i++){const side=i<4?-1:1,j=i%4,rootX=side*(12+j*9),rootY=24+j*8;
 const endX=side*(45+j*19),endY=-22+Math.sin(t*1.8+i)*20+j*15;
 const p=(v)=>{const u=1-v;return {x:u*u*rootX+2*u*v*(side*(100+j*4))+v*v*endX,y:u*u*rootY+2*u*v*(105-j*10)+v*v*endY};};
 for(let k=0;k<20;k++){const a=p(k/20),b=p((k+1)/20);line(c,[a.x,a.y,b.x,b.y],'#071d22',17*(1-k/24));line(c,[a.x-2,a.y-2,b.x-2,b.y-2],i%2?'#48776b':'#356859',12*(1-k/24));line(c,[a.x-4,a.y-3,b.x-4,b.y-3],'#8eb09a',1.4*(1-k/24));}
 for(let k=2;k<17;k+=2){const a=p(k/20);ellipse(c,a.x+2,a.y+2,3.1*(1-k/24),4.3*(1-k/24),'#aec2a1','#203f36',1);}
 }
 const skin=gradient(c,-55,-78,62,61,[[0,'#a4bda4'],[.2,'#567b68'],[.48,'#2a544e'],[1,'#071d23']]);
 path(c,c=>{c.moveTo(-62,4);c.bezierCurveTo(-79,-74,-28,-97,0,-87);c.bezierCurveTo(33,-99,84,-65,62,9);c.quadraticCurveTo(47,47,0,53);c.quadraticCurveTo(-49,45,-62,4);},skin,'#061b20',3);
 c.save();ellipse(c,0,-25,58,55,null);c.clip();for(let i=0;i<110;i++){const x=(hash(i)-.5)*120,y=-80+hash(i+160)*110;ellipse(c,x,y,1+hash(i+30)*3,1.5,'rgba(177,201,162,.20)','rgba(8,31,27,.3)',.5);}c.restore();
 // Brow horns and the central bony carapace.
 for(const side of [-1,1]){path(c,c=>{c.moveTo(side*38,-58);c.quadraticCurveTo(side*76,-96,side*58,-112);c.quadraticCurveTo(side*42,-76,side*19,-63);},'#779384','#1c3938',2);
 path(c,c=>{c.moveTo(side*8,-43);c.quadraticCurveTo(side*35,-60,side*57,-34);c.quadraticCurveTo(side*31,-39,side*8,-31);},'#153b3c','#779781',1.2);
 glow(c,side*29,-30,26,'#e4d96a',.45);ellipse(c,side*29,-29,13,7,'#c1da84','#102d2f',2);ellipse(c,side*29,-29,2,7,'#071c23');ellipse(c,side*25,-32,2,2,'#ffffff');}
 path(c,c=>{c.moveTo(-36,0);c.quadraticCurveTo(0,-10,36,0);c.quadraticCurveTo(26,42,0,41);c.quadraticCurveTo(-26,41,-36,0);},'#051015','#608876',2);
 for(let i=0;i<9;i++){const x=-29+i*7;path(c,c=>{c.moveTo(x,1);c.lineTo(x+3,14+Math.sin(i)*4);c.lineTo(x+6,1);},'#d8d5a7','#5d7a63',.6);if(i<7)path(c,c=>{c.moveTo(x+6,30);c.lineTo(x+9,20);c.lineTo(x+12,32);},'#aaa982');}
 for(let i=0;i<5;i++)path(c,c=>{c.moveTo(-8+i*4,-79);c.quadraticCurveTo(-17+i*9,-52,-6+i*3,-13);},null,'#9bb59966',1.2);
}
function dragon(c,t){const flap=Math.sin(t*3.8)*19;
 glow(c,0,-7,125,'#bb5832',.09);
 for(const side of [-1,1]){c.save();c.scale(side,1);
 const wing=gradient(c,22,-48,111,36,[[0,'#915142'],[.32,'#643333'],[.72,'#291f2a'],[1,'#081923']]);
 path(c,c=>{c.moveTo(12,-29);c.quadraticCurveTo(58,-80-flap,119,-57-flap);c.lineTo(102,-10);c.quadraticCurveTo(94,-35,79,-8);c.quadraticCurveTo(67,-32,57,8);c.quadraticCurveTo(38,-12,19,35);c.closePath();},wing,'#b68365',2);
 for(const [x,y] of [[119,-57-flap],[102,-10],[79,-8],[57,8],[19,35]])path(c,c=>{c.moveTo(18,-29);c.quadraticCurveTo(50,-39,x,y);},null,'#c1906a',1.5);
 for(let i=0;i<10;i++)path(c,c=>{c.moveTo(29+i*5,-36-i*1.7);c.lineTo(42+i*5,-20+Math.sin(i)*5);},null,'#1c111b66',.9);
 path(c,c=>{c.moveTo(83,-22);c.lineTo(87,-34);c.lineTo(91,-19);c.closePath();},'#10222b');c.restore();}
 path(c,c=>{c.moveTo(-8,29);c.bezierCurveTo(-33,81,40,113,68,80);c.bezierCurveTo(30,97,17,60,13,33);},gradient(c,0,22,35,95,[[0,'#715d49'],[1,'#17303b']]),'#111d24',2);
 ellipse(c,0,5,25,56,gradient(c,-25,0,25,0,[[0,'#99a899'],[.24,'#5b766c'],[.6,'#29494b'],[1,'#0b2531']]),'#0b1e26',2);
 for(let j=0;j<10;j++){const y=-32+j*8;path(c,c=>{c.moveTo(-14,y);c.quadraticCurveTo(0,y+10,14,y);},null,'#b1b89b',1.1);}
 for(const side of [-1,1]){line(c,[side*16,19,side*41,44,side*28,57],'#728c7b',7);for(let i=0;i<3;i++)line(c,[side*(25+i*5),54,side*(21+i*7),64],'#d0c7a0',2);}
 path(c,c=>{c.moveTo(-24,-40);c.lineTo(-29,-65);c.lineTo(-18,-77);c.lineTo(0,-83);c.lineTo(19,-77);c.lineTo(29,-65);c.lineTo(24,-39);c.lineTo(11,-24);c.lineTo(-11,-24);c.closePath();},gradient(c,-25,-75,30,-30,[[0,'#b1bca3'],[.3,'#526e66'],[1,'#112b35']]),'#081b25',2);
 for(const side of [-1,1]){path(c,c=>{c.moveTo(side*19,-69);c.quadraticCurveTo(side*43,-101,side*36,-110);c.quadraticCurveTo(side*22,-86,side*8,-78);},'#acaf91','#243c3e',1.5);glow(c,side*13,-56,17,'#ff7428',.8);ellipse(c,side*13,-56,7,4,'#ffd379');line(c,[side*10,-57,side*16,-55],'#311710',1.2);}
 path(c,c=>{c.moveTo(-12,-39);c.lineTo(0,-31);c.lineTo(12,-39);},null,'#051621',5);
 for(let i=-2;i<=2;i++)path(c,c=>{c.moveTo(i*4,-40);c.lineTo(i*4+2,-34);c.lineTo(i*4+4,-40);},'#dcd6b2');
 if(Math.sin(t*1.9)>.38){const pulse=(Math.sin(t*1.9)-.38)/.62;glow(c,0,-14,55,'#ee5f1c',pulse*.45);path(c,c=>{c.moveTo(-7,-31);c.bezierCurveTo(-24,4,20,-5,-9,40);c.quadraticCurveTo(30,15,7,-31);},gradient(c,0,-31,0,40,[[0,'#fff2b8'],[.3,'#ef9b35'],[1,'#c12c1600']]),null);}
}
function wraith(c,t){const sway=Math.sin(t*1.8)*8;
 glow(c,0,-7,137,'#78ebc1',.20+.05*Math.sin(t*2));
 for(let i=0;i<5;i++){c.save();c.globalAlpha=.16;path(c,c=>{c.moveTo(-48+i*23,7);c.bezierCurveTo(-82+i*23,60,-31+i*18+sway,75,-60+i*29+sway,116);},null,'#9ceac9',4+i%3);c.restore();}
 const coat=gradient(c,-57,-30,64,70,[[0,'#497e73'],[.3,'#1b4545'],[.6,'#102b33'],[1,'#041722']]);
 path(c,c=>{c.moveTo(-30,-31);c.lineTo(-57,-14);c.lineTo(-68,43);c.lineTo(-37,23);c.lineTo(-53,88);c.lineTo(-29,67);c.lineTo(-15,95+sway);c.lineTo(2,71);c.lineTo(28,96-sway);c.lineTo(32,62);c.lineTo(58,78);c.lineTo(36,22);c.lineTo(66,35);c.lineTo(55,-17);c.lineTo(27,-32);c.closePath();},coat,'#6fa399',1.5);
 for(let i=0;i<8;i++){const x=-30+i*9;path(c,c=>{c.moveTo(x*.6,-15);c.quadraticCurveTo(x*.8+Math.sin(t+i)*4,30,x*1.2,67+Math.sin(i*8)*14);},null,i%2?'#4d807466':'#020f1977',2);}
 line(c,[-27,-21,24,55],'#948665',6);line(c,[-23,-20,29,55],'#c4b98d',1);rivet(c,5,28,4);
 skull(c,0,-48,1.03,'#b6d7b8','#06272c');
 for(const side of [-1,1]){glow(c,side*11,-54,19,'#aaffcb',.8);ellipse(c,side*11,-54,3.5,3.5,'#daffe4');}
 path(c,c=>{c.moveTo(-61,-72);c.quadraticCurveTo(-32,-81,-22,-102);c.quadraticCurveTo(0,-116,24,-101);c.quadraticCurveTo(35,-83,61,-75);c.lineTo(39,-56);c.quadraticCurveTo(0,-70,-39,-54);c.closePath();},gradient(c,0,-104,0,-57,[[0,'#547369'],[.45,'#182c31'],[1,'#071823']]),'#9ba995',2);
 line(c,[-49,-72,-24,-76,0,-73,30,-79,51,-76],'#b7a474',2);skull(c,0,-89,.32,'#d5c89f');
 // Rusted cutlass with a pale, sharp edge.
 path(c,c=>{c.moveTo(53,21);c.quadraticCurveTo(90,-12,77,-63);c.quadraticCurveTo(76,-21,45,16);c.closePath();},gradient(c,40,-50,82,20,[[0,'#b5d8d3'],[.5,'#597c7c'],[1,'#243d42']]),'#c3e5db',1);
 line(c,[43,15,58,28],'#a7874e',5);line(c,[49,22,42,37],'#584836',6);ellipse(c,42,33,7,9,'#bed0ae');
}
function friend(c,t){waterline(c,95,t,'#b4d3b6');
 line(c,[-19,27,-22,79],'#20323a',19);line(c,[19,27,22,79],'#162731',19);ellipse(c,-24,80,18,8,'#111c23','#75837a',1);ellipse(c,25,80,18,8,'#111c23','#75837a',1);
 path(c,c=>{c.moveTo(-27,-28);c.lineTo(-44,-7);c.lineTo(-39,54);c.lineTo(-10,65);c.lineTo(0,31);c.lineTo(12,65);c.lineTo(42,53);c.lineTo(43,-8);c.lineTo(25,-29);c.closePath();},gradient(c,-45,-20,45,60,[[0,'#69928a'],[.34,'#345b5b'],[1,'#0e2734']]),'#0b2029',2);
 line(c,[-22,-24,21,52],'#856842',8);line(c,[-21,-24,23,52],'#c2aa79',1.3);
 for(let i=0;i<5;i++)rivet(c,6,-12+i*12,2);
 ellipse(c,0,-48,23,30,gradient(c,-20,-70,24,-22,[[0,'#d1af80'],[.4,'#a07b57'],[1,'#4c4538']]),'#213335',2);
 path(c,c=>{c.moveTo(-19,-33);c.quadraticCurveTo(0,5,19,-33);c.quadraticCurveTo(1,-18,-19,-33);},'#777b6a');
 line(c,[-15,-49,-6,-50],'#19262a',3);line(c,[7,-49,16,-50],'#19262a',3);line(c,[2,-46,-1,-36,5,-36],'#654d38',1.5);
 path(c,c=>{c.moveTo(-47,-58);c.lineTo(-29,-75);c.quadraticCurveTo(0,-96,29,-75);c.lineTo(49,-59);c.lineTo(24,-54);c.lineTo(-25,-53);c.closePath();},'#233b42','#a4b2a0',2);line(c,[-38,-61,0,-67,37,-62],'#c6ab71',2);
 line(c,[-40,-4,-46,18],'#73c68e',13);line(c,[-40,-8,-45,13],'#b7efb8',2); // Friendly armband remains unmistakable.
 line(c,[38,-2,60,27],'#3c5555',12);ellipse(c,62,28,6,7,'#bd986b');
 const lx=66+Math.sin(t*2)*3,ly=48;glow(c,lx,ly,62,'#f4cb69',.40);ellipse(c,lx,ly-18,7,8,null,'#d1ac67',2);
 c.fillStyle='#17282d';c.fillRect(lx-12,ly-14,24,33);c.fillStyle=gradient(c,lx-8,ly-9,lx+8,ly+17,[[0,'#fff6b5'],[.5,'#e7b453'],[1,'#ba692c']]);c.fillRect(lx-8,ly-9,16,23);for(const xx of [-8,0,8])line(c,[lx+xx,ly-12,lx+xx,ly+17],'#78673f',2);line(c,[lx-12,ly+17,lx+12,ly+17],'#c8a16d',3);
 c.fillStyle='#c8f8d3';c.font='bold 12px system-ui';c.textAlign='center';c.fillText('MANNSKAP',0,108);
}
const spriteBase=new URL('.',document.currentScript.src),sprites={};
for(const [type,name] of [['dragon','dragon'],['seaMonster','kraken'],['wraith','wraith'],['friend','crew']]){const image=new Image();sprites[type]=image;image.src=new URL(name+'.png',spriteBase).href;}
function creatureSprite(c,type,t){const im=sprites[type];if(!im||!im.complete||!im.naturalWidth)return false;
 c.save();
 if(type==='seaMonster'){
  waterline(c,92,t);glow(c,0,5,131,'#66b99a',.13);
  CreatureRig.draw(c,im,type,t,248,.53);
 }else if(type==='dragon'){
  CreatureRig.draw(c,im,type,t,306,.57);
 }else if(type==='friend'){
  const w=151,h=w*im.height/im.width;waterline(c,113,t,'#b7ebc5');glow(c,-42,-42,54,'#ffcb6b',.20);c.drawImage(im,-w/2,-h*.49,w,h);
  c.fillStyle='#bdf4c8';c.font='bold 12px system-ui';c.textAlign='center';c.fillText('MANNSKAP',0,130);
 }else{
  const w=160,h=w*im.height/im.width;glow(c,0,-10,134,'#77dbb2',.17+.025*Math.sin(t*2));
  c.globalAlpha=.93+.04*Math.sin(t*1.8);c.translate(Math.sin(t*1.4)*2,Math.sin(t*1.7)*3);c.drawImage(im,-w/2,-h*.53,w,h);
 }
 c.restore();return true;
}
function target(c,r,type,t){c.save();c.scale(r/100,r/100);c.lineCap='round';c.lineJoin='round';
 if(creatureSprite(c,type,t)){c.restore();return;}
 if(type==='seaMonster')monster(c,t);else if(type==='dragon')dragon(c,t);else if(type==='wraith')wraith(c,t);else if(type==='friend')friend(c,t);else if(type==='barrel')barrel(c,t);else bullseye(c,type,t);c.restore();}
window.PirateArt={target,skull,rivet,glow,ellipse,line,gradient,path,hash};
})();
