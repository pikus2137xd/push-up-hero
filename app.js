const $=id=>document.getElementById(id),C=globalThis.HeroCore,key='push-up-hero-v2';
let state=C.fresh(),persist=true;
try{const saved=JSON.parse(localStorage.getItem(key));if(C.valid(saved))state=saved;}catch{persist=false;}
const counter=new C.Counter();let stream=null,model=null,running=false,starting=false,session=0,frame=0,lastVideo=-1,lastInference=0,chosen=null,smoothed=null;
function save(){try{localStorage.setItem(key,JSON.stringify(state));}catch{persist=false;}if(!persist)$('battle-status').textContent+=' Zapis lokalny niedostępny.';}
function render(){const b=C.bosses[state.level];$('boss-name').textContent=b.name;$('level').textContent=`ETAP ${state.level+1} / 3`;$('hp').textContent=`${state.hp} / ${b.hp} HP`;$('health-fill').style.width=`${state.hp/b.hp*100}%`;$('coins').textContent=state.coins;$('reps').textContent=state.reps;$('demo-reps').textContent=state.demo;$('boss').style.setProperty('--skin',b.skin);$('boss').style.setProperty('--dark',b.dark);$('boss').classList.toggle('defeated',state.hp===0);$('next').hidden=state.hp>0||state.level===2;$('demo').disabled=state.hp===0;$('battle-status').textContent=state.hp===0?(state.level===2?'🏆 Wszyscy bossowie pokonani! Świetna robota.':'✨ Zwycięstwo! Odbierz oddech i przejdź dalej.'):'Każda pełna pompka zadaje 1 punkt obrażeń.';}
function hit(demo=false){if(!C.strike(state,demo))return;render();save();$('boss').classList.remove('hit');$('impact').classList.remove('pop');void $('boss').offsetWidth;$('boss').classList.add('hit');$('impact').classList.add('pop');setTimeout(()=>$('boss').classList.remove('hit'),280);}
$('demo').onclick=()=>hit(true);$('next').onclick=()=>{C.next(state);counter.reset();render();save();};$('reset').onclick=()=>{if(confirm('Usunąć monety, liczniki i postęp walki?')){state=C.fresh();counter.reset();render();save();}};
for(const id of ['low','high'])$(id).oninput=()=>{counter[id]=Number($(id).value);$(id+'-value').textContent=$(id).value+'°';counter.reset();};$('side').onchange=()=>{chosen=null;smoothed=null;counter.reset();};
function status(text){$('camera-status').textContent=text;}
function stop(message='Kamera jest wyłączona.'){
 session++;running=false;starting=false;cancelAnimationFrame(frame);if(stream)stream.getTracks().forEach(t=>t.stop());stream=null;$('video').srcObject=null;$('start').disabled=false;$('stop').disabled=true;$('placeholder').hidden=false;$('overlay').getContext('2d').clearRect(0,0,$('overlay').width,$('overlay').height);counter.reset();chosen=null;smoothed=null;$('angle').textContent='—°';$('phase').textContent='Czekam na pozycję';status(message);
}
$('stop').onclick=()=>stop();document.addEventListener('visibilitychange',()=>{if(document.hidden&&(running||starting))stop('Kamera zatrzymana po ukryciu gry. Włącz ją ponownie.');});window.addEventListener('pagehide',()=>stop());
$('start').onclick=async()=>{
 if(starting||running)return;if(!window.isSecureContext||!navigator.mediaDevices?.getUserMedia){status('Kamera wymaga HTTPS lub localhost. Przeczytaj instrukcję.');return;}
 starting=true;$('start').disabled=true;$('stop').disabled=false;const token=++session;status('Zezwól na kamerę. Następnie pobiorę model ruchu…');
 try{
  const media=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:'user',width:{ideal:640},height:{ideal:480}}});
  if(token!==session){media.getTracks().forEach(t=>t.stop());return;}stream=media;$('video').srcObject=media;await $('video').play();
  if(!model){const vision=await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/vision_bundle.mjs');if(token!==session)return;const files=await vision.FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm');if(token!==session)return;const created=await vision.PoseLandmarker.createFromOptions(files,{baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',delegate:'CPU'},runningMode:'VIDEO',numPoses:1,minPoseDetectionConfidence:.6,minPosePresenceConfidence:.6,minTrackingConfidence:.6});if(token!==session){created.close();return;}model=created;}
  if(token!==session)return;running=true;starting=false;lastVideo=-1;lastInference=0;counter.reset();$('placeholder').hidden=true;status('Kamera działa. Przyjmij podpór bokiem do telefonu.');frame=requestAnimationFrame(tick);
 }catch(e){if(token!==session)return;const denied=e.name==='NotAllowedError';stop(denied?'Brak zgody na kamerę. Zmień uprawnienia strony w Safari/Edge i spróbuj ponownie.':'Nie udało się uruchomić kamery/modelu. Sprawdź internet, dostępność kamery i spróbuj ponownie.');console.error(e);}
};
function processPose(points,now){const canvas=$('overlay'),v=$('video');canvas.width=v.videoWidth;canvas.height=v.videoHeight;const ctx=canvas.getContext('2d');ctx.clearRect(0,0,canvas.width,canvas.height);
 const sides={left:[11,13,15,23],right:[12,14,16,24]};
 const score=side=>Math.min(...sides[side].map(i=>points?.[i]?.visibility??0));
 let side=$('side').value;if(side==='auto'){if(!chosen||score(chosen)<.55)side=score('left')>=score('right')?'left':'right';else side=chosen;}
 if(chosen!==side){counter.reset();smoothed=null;chosen=side;}
 const ids=sides[side],p=ids.map(i=>points?.[i]);
 // A horizontal shoulder-to-hip line rejects ordinary standing elbow curls.
 const visible=score(side)>=.6&&p.every(q=>q&&q.x>=0&&q.x<=1&&q.y>=0&&q.y<=1)&&Math.abs((p[3].y-p[0].y)*canvas.height)<Math.abs((p[3].x-p[0].x)*canvas.width)*.85;
 if(!visible){counter.update(NaN,now,false);smoothed=null;$('angle').textContent='—°';$('phase').textContent='Pokaż całe ciało w podporze, bokiem';return;}
 const a=C.angle(p[0],p[1],p[2],canvas.width,canvas.height);smoothed=smoothed===null?a:smoothed*.55+a*.45;
 ctx.lineWidth=5;ctx.strokeStyle='#c4ff71';ctx.beginPath();p.slice(0,3).forEach((q,i)=>i?ctx.lineTo(q.x*canvas.width,q.y*canvas.height):ctx.moveTo(q.x*canvas.width,q.y*canvas.height));ctx.stroke();for(const q of p){ctx.beginPath();ctx.arc(q.x*canvas.width,q.y*canvas.height,6,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();}
 if(counter.update(smoothed,now))hit(false);$('angle').textContent=Math.round(smoothed)+'°';$('phase').textContent=counter.phase==='seek'?'Wyprostuj ramiona — pozycja startowa':counter.phase==='up'?'Opuść ciało':'Teraz wróć do góry';
}
function tick(now){if(!running)return;try{const v=$('video');if(v.readyState>=2&&v.currentTime!==lastVideo&&now-lastInference>=85){lastVideo=v.currentTime;lastInference=now;const result=model.detectForVideo(v,now);processPose(result.landmarks?.[0],now);}frame=requestAnimationFrame(tick);}catch(e){console.error(e);stop('Analiza obrazu została przerwana. Włącz kamerę ponownie.');}}
render();if('serviceWorker' in navigator&&window.isSecureContext){navigator.serviceWorker.register('./sw.js').then(()=>navigator.serviceWorker.ready).then(()=>$('offline-status').textContent='Pliki gry gotowe do pracy offline. Kamera AI wymaga internetu.').catch(()=>$('offline-status').textContent='Tryb offline niedostępny. Uruchom grę przez HTTPS lub localhost.');}
