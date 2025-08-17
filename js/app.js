// v4.7 — Curved VR-like warp + forehead occlusion + all requested features
const COLORS=[
  {name:'Chocolate Mocha',val:'#7A5037'},
  {name:'Deep Black',val:'#0D0D0D'},
  {name:'Scarlet Red',val:'#C1121F'},
  {name:'Cream Yellow',val:'#F5E6A1'},
  {name:'Orange (Default)',val:'#FF7A00', preset:true},
  {name:'Pink',val:'#FF8ABF'},
  {name:'Champagne Beige',val:'#E6D5B8'},
  {name:'Moss Green',val:'#6B8E23'},
  {name:'Burgundy',val:'#800020'},
  {name:'Pure White',val:'#FFFFFF'}
];
const STYLES=['月兔','Clean Fit','斜紋','賽車','運動','山形','芭蕾少女','Y2K'];

let curColor=COLORS[4].val, curStyle=STYLES[0];
let txt='Happy Mid-Autumn Festival', txtSize=30, txtWeight=700, txtRepeat=1, txtGap=22;
let curve=0.35, shine=0.65, shadow=0.5;
let beauty=true, showBunnyNose=true;

const video = document.getElementById('video');
const overlay = document.getElementById('overlay');
const ctx = overlay.getContext('2d');
const tapmask = document.getElementById('tapmask');
const err = document.getElementById('err');
const shareRow = document.getElementById('shareRow');

// Build UI
document.querySelectorAll('.tab').forEach(t=>t.onclick=()=>{
  document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('show'));
  t.classList.add('active');
  document.getElementById(t.dataset.panel).classList.add('show');
});
// swatches
const sw = document.getElementById('swatches');
COLORS.forEach(c=>{
  const d=document.createElement('div'); d.className='swatch'; d.style.background=c.val; d.title=c.name;
  if(c.preset){ d.style.outline='2px solid var(--accent)'; }
  d.onclick=()=>{ curColor=c.val; document.querySelectorAll('.swatch').forEach(x=>x.style.outline='none'); d.style.outline='2px solid var(--accent)'; makeBandTexture(); };
  sw.appendChild(d);
});
// styles
const sg=document.getElementById('styleGrid');
STYLES.forEach((name,i)=>{
  const card=document.createElement('div'); card.className='style-card'+(i===0?' active':''); 
  const thumb=document.createElement('canvas'); thumb.className='style-thumb'; thumb.width=280; thumb.height=100;
  drawStyleThumb(thumb.getContext('2d'), name, curColor, shine);
  const label=document.createElement('div'); label.textContent=name;
  card.appendChild(thumb); card.appendChild(label);
  card.onclick=()=>{ document.querySelectorAll('.style-card').forEach(x=>x.classList.remove('active')); card.classList.add('active'); curStyle=name; makeBandTexture(); };
  sg.appendChild(card);
});

['txt','txtSize','txtWeight','txtRepeat','txtGap','curve','shine','shadow','beauty','bunnyNose'].forEach(id=>{
  const el=document.getElementById(id);
  if(!el) return;
  el.oninput = e=>{
    if(id==='txt') txt=e.target.value;
    if(id==='txtSize') txtSize=+e.target.value;
    if(id==='txtWeight') txtWeight=+e.target.value;
    if(id==='txtRepeat') txtRepeat=+e.target.value;
    if(id==='txtGap') txtGap=+e.target.value;
    if(id==='curve') curve=+e.target.value;
    if(id==='shine') shine=+e.target.value;
    if(id==='shadow') shadow=+e.target.value;
    if(id==='beauty') beauty=el.checked;
    if(id==='bunnyNose') showBunnyNose=el.checked;
    makeBandTexture();
  };
});

// Offscreen band canvas with texture, pattern, text
const band2d=document.createElement('canvas'); band2d.width=1000; band2d.height=160; const bctx=band2d.getContext('2d');
function roundedRect(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();}
function drawTexture(g,w,h,color){
  g.save();
  g.fillStyle='#fff'; g.fillRect(0,0,w,h);
  // subtle weave and noise
  g.globalAlpha=.1; g.fillStyle=color;
  for(let x=-w;x<w*2;x+=16){ g.beginPath(); g.moveTo(x,0); g.lineTo(x+28,0); g.lineTo(x,h); g.lineTo(x-28,h); g.closePath(); g.fill(); }
  g.globalAlpha=.09; for(let i=0;i<Math.floor(w*h/1700);i++){ g.fillRect(Math.random()*w,Math.random()*h,1,1); }
  g.restore();
}
function drawGloss(g,w,h,intensity){
  const lg=g.createLinearGradient(0,0,0,h);
  lg.addColorStop(0,`rgba(255,255,255,${0.35*intensity})`);
  lg.addColorStop(0.45,`rgba(255,255,255,${0.06*intensity})`);
  lg.addColorStop(0.55,`rgba(0,0,0,${0.10*intensity})`);
  lg.addColorStop(1,`rgba(0,0,0,${0.25*intensity})`);
  g.fillStyle=lg; g.fillRect(0,0,w,h);
}
function drawPattern(g,w,h,style,color){
  g.save(); g.fillStyle=color; g.strokeStyle=color;
  switch(style){
    case '月兔':
      g.globalAlpha=.9; g.beginPath(); g.arc(h*.9,h*.5,h*.36,0,Math.PI*2); g.fill();
      g.globalAlpha=.55; g.beginPath(); g.arc(h*1.28,h*.45,h*.22,0,Math.PI*2); g.fill(); g.globalAlpha=1; break;
    case 'Clean Fit':
      g.fillRect(0,h*.38,w,h*.24); break;
    case '斜紋':
      for(let x=-w;x<w*2;x+=24){ g.globalAlpha=(x/24%2===0)?.35:.15;
        g.beginPath(); g.moveTo(x,0); g.lineTo(x+40,0); g.lineTo(x,h); g.lineTo(x-40,h); g.closePath(); g.fill(); } g.globalAlpha=1; break;
    case '賽車':
      g.lineWidth=6; g.beginPath(); g.moveTo(w*.3,h*.2); g.lineTo(w*.5,h*.8); g.lineTo(w*.7,h*.2); g.stroke(); break;
    case '運動':
      g.fillRect(0,h*.25,w,4); g.fillRect(0,h*.75-4,w,4); break;
    case '山形':
      g.beginPath(); for(let x=0;x<=w;x+=28){ g.moveTo(x,h*.75); g.lineTo(x+14,h*.3); g.lineTo(x+28,h*.75);} g.closePath(); g.fill(); break;
    case '芭蕾少女':
      g.globalAlpha=.9; for(let x=32;x<w;x+=92){ g.beginPath(); g.ellipse(x-14,h*.5,10,16,0,0,Math.PI*2); g.ellipse(x+14,h*.5,10,16,0,0,Math.PI*2); g.fill(); g.fillRect(x-6,h*.5-6,12,12);} g.globalAlpha=1; break;
    case 'Y2K':
      for(let x=20;x<w;x+=70){ g.globalAlpha=.9; g.beginPath(); g.arc(x,h*.5,10,0,Math.PI*2); g.fill(); g.globalAlpha=.25; g.beginPath(); g.arc(x,h*.5,24,0,Math.PI*2); g.fill(); } g.globalAlpha=1; break;
  }
  g.restore();
}
function drawBandText(g,w,h){
  g.save();
  g.fillStyle='#111'; g.font=`${txtWeight} ${txtSize}px "Inter","Noto Sans TC",system-ui,sans-serif`;
  const tw=g.measureText(txt).width; const total=tw*txtRepeat + txtGap*(txtRepeat-1);
  let x=(w-total)/2; const y=h*.7;
  for(let i=0;i<txtRepeat;i++){ g.fillText(txt,x,y); x+=tw+txtGap; }
  g.restore();
}
function makeBandTexture(){
  const w=band2d.width,h=band2d.height;
  bctx.clearRect(0,0,w,h);
  roundedRect(bctx,0,0,w,h,12); bctx.clip();
  drawTexture(bctx,w,h,curColor);
  drawPattern(bctx,w,h,curStyle,curColor);
  drawGloss(bctx,w,h,shine);
  // stitches
  bctx.save(); bctx.strokeStyle='rgba(0,0,0,.14)'; bctx.setLineDash([5,5]); bctx.lineWidth=1.2; bctx.strokeRect(6.5,6.5,w-13,h-13); bctx.restore();
  drawBandText(bctx,w,h);
  // light vignette edges
  const vg=bctx.createLinearGradient(0,0,w,0);
  vg.addColorStop(0,'rgba(0,0,0,.15)'); vg.addColorStop(0.5,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,.15)');
  bctx.fillStyle=vg; bctx.fillRect(0,0,w,h);
  // update thumbs
  document.querySelectorAll('.style-thumb').forEach((c,i)=>{
    const g=c.getContext('2d'); drawStyleThumb(g, STYLES[i], curColor, shine);
  });
}
makeBandTexture();
function drawStyleThumb(g, style, color, shineAmt){
  const w=g.canvas.width, h=g.canvas.height;
  g.clearRect(0,0,w,h); roundedRect(g,0,0,w,h,10); g.clip(); g.fillStyle='#fff'; g.fillRect(0,0,w,h);
  drawTexture(g,w,h,color); drawPattern(g,w,h,style,color);
  drawGloss(g,w,h,shineAmt);
}

// Camera + FaceMesh
document.getElementById('btnStart').onclick=startCamera;
window.addEventListener('load',()=>{ setTimeout(startCamera, 200); });

let fm, animId;
async function startCamera(){
  err.textContent='';
  try{
    video.setAttribute('playsinline','true'); video.muted=true;
    const stream = await navigator.mediaDevices.getUserMedia({ video:{ facingMode:'user', width:{ideal:720}, height:{ideal:1280} }, audio:false });
    video.srcObject = stream; await video.play();
    overlay.width = video.videoWidth || overlay.clientWidth;
    overlay.height = video.videoHeight || overlay.clientHeight;
    tapmask.classList.add('hidden');
    bootFaceMesh();
  }catch(e){
    err.textContent='相機開啟失敗：'+(e.message||e);
    tapmask.classList.remove('hidden');
  }
}
function bootFaceMesh(){
  fm = new FaceMesh({locateFile:(file)=>`https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/${file}`});
  fm.setOptions({maxNumFaces:1,refineLandmarks:true,minDetectionConfidence:0.5,minTrackingConfidence:0.5});
  fm.onResults(onResults);
  loop();
}
async function loop(){ if(!video.srcObject) return; try{ await fm.send({image: video}); }catch(e){} animId = requestAnimationFrame(loop); }

// Bubble FX
const bubbles=[];
function spawnBunny(){ bubbles.push({x: overlay.width/2 + (Math.random()*140-70), y: overlay.height-30, a:1, vy: 0.9+Math.random()*0.7}); }
function drawBubbles(){ ctx.save(); ctx.font='28px serif'; for(let i=bubbles.length-1;i>=0;i--){const b=bubbles[i]; ctx.globalAlpha=b.a; ctx.fillText('🐰', b.x, b.y); b.y -= b.vy; b.a -= 0.004; if(b.a<=0) bubbles.splice(i,1);} ctx.restore(); ctx.globalAlpha=1; }
function mouthOpen(lm){ const top=lm[13], bottom=lm[14], left=lm[33], right=lm[263]; const mouth=Math.hypot(top.x-bottom.x, top.y-bottom.y); const faceW=Math.hypot(left.x-right.x, left.y-right.y); return (mouth/faceW) > 0.08; }

// Forehead occlusion path using subset of face-oval landmarks (upper arc)
function drawForeheadMask(lm, W, H, draw){
  const indices = [338,297,332,284,251,389,356,454,323,361,288,397,365,379];
  ctx.save();
  ctx.beginPath();
  indices.forEach((id, i)=>{
    const p = lm[id]; const x=p.x*W, y=p.y*H;
    if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  });
  ctx.lineTo(W,0); ctx.lineTo(0,0); ctx.closePath();
  if(draw==='clip') ctx.clip();
  if(draw==='fill'){ ctx.fillStyle='rgba(0,0,0,.08)'; ctx.fill(); }
  ctx.restore();
}

// Bunny nose
function drawBunnyNose(lm, W, H, angle){
  const nose = lm[1]; const x = nose.x*W, y = nose.y*H;
  const left = lm[33], right = lm[263];
  const faceW = Math.hypot((right.x-left.x)*W,(right.y-left.y)*H);
  const r = Math.max(6, faceW*0.035);
  ctx.save(); ctx.translate(x,y); ctx.rotate(angle);
  ctx.fillStyle = '#ffb6c1'; ctx.beginPath(); ctx.arc(0,0,r,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.beginPath(); ctx.arc(-r*0.35,-r*0.25,r*0.35,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = Math.max(1.5, r*0.12);
  const wy = r*0.35, L = r*2.2;
  for(let i=-1;i<=1;i++){ const off=i*wy;
    ctx.beginPath(); ctx.moveTo(-r*0.8, off); ctx.lineTo(-r*0.8-L, off- i*r*0.3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(r*0.8, off); ctx.lineTo(r*0.8+L, off- i*r*0.3); ctx.stroke();
  }
  ctx.restore();
}

function onResults(res){
  ctx.clearRect(0,0,overlay.width,overlay.height);
  const W=overlay.width, H=overlay.height;
  if(beauty){ ctx.save(); ctx.globalAlpha = 0.12; ctx.filter='blur(2px) saturate(1.06) contrast(1.03)'; ctx.drawImage(video,0,0,W,H); ctx.restore(); }
  if(!res.multiFaceLandmarks || !res.multiFaceLandmarks.length){ drawBubbles(); return; }
  const lm=res.multiFaceLandmarks[0];

  // Face geometry
  const p33=lm[33], p263=lm[263], p10=lm[10];
  const x33=p33.x*W, y33=p33.y*H, x263=p263.x*W, y263=p263.y*H, x10=p10.x*W, y10=p10.y*H;
  const cx=(x33+x263)/2, width=Math.hypot(x263-x33,y263-y33)*1.5, baseH=Math.max(24, width*0.22), angle=Math.atan2(y263-y33,x263-x33), y=y10 - baseH*1.15;

  // Soft shadow under band
  ctx.save();
  ctx.translate(cx,y);
  ctx.rotate(angle);
  ctx.globalAlpha = 0.25*shadow;
  const grad = ctx.createLinearGradient(0, -baseH/2, 0, baseH/2);
  grad.addColorStop(0,'rgba(0,0,0,0.25)'); grad.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=grad;
  ctx.fillRect(-width/2, -baseH/2, width, baseH);
  ctx.restore();

  // Curved slice warp (VR-like)
  const slices = 22;
  for(let i=0;i<slices;i++){
    const t0=i/slices, t1=(i+1)/slices;
    const sx = t0*band2d.width, sw = (t1-t0)*band2d.width;
    const k = (i - slices/2) / (slices/2);
    const localH = baseH * (1 - curve*Math.pow(k,2)); // bulge middle
    const arcLift = Math.sin(k*Math.PI/2) * baseH*0.12*curve; // slight arc
    ctx.save();
    ctx.translate(cx, y + arcLift);
    ctx.rotate(angle);
    ctx.drawImage(band2d, sx, 0, sw, band2d.height, -width/2 + t0*width, -localH/2, (t1-t0)*width, localH);
    ctx.restore();
  }

  // Forehead occlusion (hide top edge slightly)
  drawForeheadMask(lm, W, H, 'clip');
  // top fade
  ctx.save();
  ctx.translate(cx,y - baseH*0.02);
  ctx.rotate(angle);
  const topFade = ctx.createLinearGradient(0,-baseH/2,0,baseH/2);
  topFade.addColorStop(0,'rgba(0,0,0,.25)'); topFade.addColorStop(0.4,'rgba(0,0,0,0)');
  ctx.fillStyle=topFade;
  ctx.fillRect(-width/2,-baseH/2,width,baseH*0.6);
  ctx.restore();

  // Bunny nose
  if(showBunnyNose) drawBunnyNose(lm, W, H, angle);

  // Mouth open => spawn bunny bubble
  if(mouthOpen(lm) && Math.random()<0.3){ spawnBunny(); }
  drawBubbles();
}

// Capture & Share (1080x1920)
document.getElementById('btnShot').onclick=()=>{
  const snap=document.createElement('canvas'); snap.width=1080; snap.height=1920;
  const sctx=snap.getContext('2d');
  // compute cover crop from video
  const vW=video.videoWidth, vH=video.videoHeight; const v=vW/vH, c=snap.width/snap.height;
  let sx, sy, sw, sh;
  if(v>c){ sh=vH; sw=sh*c; sx=(vW-sw)/2; sy=0; } else { sw=vW; sh=sw/c; sx=0; sy=(vH-sh)/2; }
  // base frame + beauty
  if(beauty) sctx.filter='blur(2px) saturate(1.06) contrast(1.03)';
  sctx.drawImage(video, sx, sy, sw, sh, 0, 0, snap.width, snap.height);
  sctx.filter='none';
  // draw overlay from current canvas scaled
  sctx.drawImage(overlay, 0, 0, overlay.width, overlay.height, 0, 0, snap.width, snap.height);
  snap.toBlob(async (blob)=>{
    shareRow.classList.add('show');
    document.getElementById('btnSave').onclick=()=>{ const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='headband-ar.png'; a.click(); URL.revokeObjectURL(a.href); };
    document.getElementById('btnShare').onclick=async()=>{
      const file=new File([blob],'headband-ar.png',{type:'image/png'});
      if(navigator.canShare && navigator.canShare({files:[file]})){
        try{ await navigator.share({files:[file], title:'Weave Headband AR', text:'我的運動頭帶設計'});}catch(e){}
      }else{
        const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='headband-ar.png'; a.click(); URL.revokeObjectURL(a.href);
        alert('此裝置不支援分享，已改為下載。');
      }
    };
  },'image/png');
};
