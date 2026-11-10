(function(root){
'use strict';
const modes=[
 {id:'pushup',name:'Pompki',icon:'💪',tag:'KAMERA • POWTÓRZENIA',desc:'Przód: obniżaj i unoś ciało. Bok: klasyczny pomiar łokcia.',hint:'Telefon nieruchomo przed Tobą. W kadrze głowa i oba barki. Przyjmij górną pozycję pompki i skalibruj obraz.',rate:'1 pełna pompka = 1 HP'},
 {id:'plank',name:'Deska',icon:'🛡️',tag:'KAMERA • WYTRZYMAŁOŚĆ',desc:'Utrzymaj pozycję. Dłuższa seria daje coraz mocniejszy atak.',hint:'Ustaw się bokiem. Pokaż bark, biodro, kolano i kostkę. Utrzymuj wyprostowaną linię ciała w podporze.',rate:'1 HP/s → po 10 s: 2 HP/s → po 30 s: 3 HP/s'},
 {id:'treadmill',name:'Bieżnia',icon:'🏃',tag:'PRĘDKOŚĆ • TIMER',desc:'Wpisz prędkość z ekranu bieżni. Szybszy bieg to mocniejszy atak.',hint:'Przed rozpoczęciem ustaw prędkość zgodną z ekranem bieżni. Telefon nie łączy się z bieżnią i nie mierzy jej pasa. Zmieniaj ustawienia po zatrzymaniu bieżni.',rate:'6 km/h = 1 HP/s · 12 km/h = 2 HP/s'},
 {id:'situp',name:'Brzuszki',icon:'🔥',tag:'KAMERA • POWTÓRZENIA',desc:'Unieś tułów i wróć do pozycji początkowej.',hint:'Telefon z boku, całe ciało w kadrze. Zegnij kolana. Zacznij z opuszczonym tułowiem, unieś go i wróć.',rate:'1 pełne powtórzenie = 1 HP'},
 {id:'curl',name:'Ciężarki',icon:'🏋️',tag:'KAMERA • POWTÓRZENIA',desc:'Uginanie ramion z hantlami, jedno wybrane ramię naraz.',hint:'Pokaż bark, łokieć, nadgarstek i biodro. Łokieć przy tułowiu. Opuść rękę, zegnij ją i opuść ponownie. Kamera widzi ruch, nie wagę hantla.',rate:'1 pełne ugięcie ramienia = 1 HP'},
 {id:'squat',name:'Przysiady',icon:'⚡',tag:'KAMERA • POWTÓRZENIA',desc:'Zejdź w dół i wyprostuj nogi, żeby trafić bossa.',hint:'Stań bokiem do telefonu. Pokaż całe ciało. Zacznij wyprostowany, wykonaj przysiad i wróć do góry.',rate:'1 pełny przysiad = 1 HP'},
 {id:'jack',name:'Pajacyki',icon:'⭐',tag:'KAMERA • POWTÓRZENIA',desc:'Ręce w górę, nogi szeroko — i wróć do początku.',hint:'Stań przodem. W kadrze całe ciało i ręce nad głową. Zacznij ze złączonymi nogami i opuszczonymi rękami.',rate:'1 pełny pajacyk = 1 HP'},
 {id:'knees',name:'Wysokie kolana',icon:'👟',tag:'KAMERA • POWTÓRZENIA',desc:'Unoś naprzemiennie kolana na wysokość bioder.',hint:'Stań przodem, pokaż całe ciało. Unoś na zmianę lewe i prawe kolano, opuszczając nogę po każdym ruchu.',rate:'1 uniesienie kolana = 1 HP · strony naprzemiennie'}
];
const bosses=[{name:'Goblin Bąbel',hp:40,skin:'#8bd779',dark:'#357f69'},{name:'Rycerz Galareta',hp:70,skin:'#ba9bff',dark:'#624cac'},{name:'Król Lava',hp:100,skin:'#ffac65',dark:'#b74853'}];
const stats=()=>Object.fromEntries(modes.map(m=>[m.id,{reps:0,seconds:0,damage:0}]));
function fresh(){return {version:3,level:0,hp:bosses[0].hp,coins:0,demo:0,stats:stats()};}
function valid(s){return s?.version===3&&Number.isInteger(s.level)&&s.level>=0&&s.level<3&&Number.isInteger(s.hp)&&s.hp>=0&&s.hp<=bosses[s.level].hp&&['coins','demo'].every(k=>Number.isSafeInteger(s[k])&&s[k]>=0)&&modes.every(m=>s.stats?.[m.id]&&['reps','seconds','damage'].every(k=>Number.isFinite(s.stats[m.id][k])&&s.stats[m.id][k]>=0));}
function migrate(old){const s=fresh();if(old&&Number.isInteger(old.level)&&old.level>=0&&old.level<3&&Number.isInteger(old.hp)&&old.hp>=0&&old.hp<=[8,12,16][old.level]&&['coins','reps','demo'].every(k=>Number.isSafeInteger(old[k])&&old[k]>=0)){s.level=old.level;s.hp=Math.round(old.hp/[8,12,16][old.level]*bosses[old.level].hp);s.coins=old.coins;s.demo=old.demo;s.stats.pushup.reps=old.reps;}return s;}
function damage(s,mode,amount=1,test=false){if(s.hp<=0||!Number.isFinite(amount)||amount<1||!s.stats[mode])return 0;const n=Math.min(s.hp,Math.floor(amount));s.hp-=n;if(test)s.demo++;else s.stats[mode].damage+=n;if(s.hp===0)s.coins+=25*(s.level+1);return n;}
function advance(s){if(s.hp!==0)return false;s.level=(s.level+1)%bosses.length;s.hp=bosses[s.level].hp;return true;}
function angle(a,b,c,w=1,h=1){const u=[(a.x-b.x)*w,(a.y-b.y)*h],v=[(c.x-b.x)*w,(c.y-b.y)*h],n=Math.hypot(...u)*Math.hypot(...v);return n<1e-9?NaN:Math.acos(Math.max(-1,Math.min(1,(u[0]*v[0]+u[1]*v[1])/n)))*180/Math.PI;}
class Cycle{
 constructor(){this.lastRep=-Infinity;this.reset();}
 reset(){this.phase='seek';this.candidate='';this.since=0;this.last=null;}
 update(zone,t){if(!['rest','work','middle'].includes(zone)){this.reset();return false;}if(this.last!==null&&t-this.last>600)this.reset();this.last=t;if(zone!==this.candidate){this.candidate=zone;this.since=t;return false;}if(t-this.since<180)return false;
 if(this.phase==='seek'&&zone==='rest')this.phase='ready';else if(this.phase==='ready'&&zone==='work')this.phase='work';else if(this.phase==='work'&&zone==='rest'){this.phase='ready';if(t-this.lastRep>=850){this.lastRep=t;return true;}}return false;}
}
class Hold{
 constructor(){this.reset();}
 reset(){this.last=null;this.streak=0;this.warmup=0;this.bank=0;this.total=0;}
 update(ok,t){if(!ok){this.last=null;this.streak=0;this.warmup=0;return {damage:0,seconds:0,rate:0};}let dt=this.last===null?0:(t-this.last)/1000;this.last=t;if(dt<0||dt>.6){this.streak=0;this.warmup=0;dt=0;}this.warmup+=dt;if(this.warmup<1)return {damage:0,seconds:0,rate:0};this.streak+=dt;this.total+=dt;const rate=this.streak>=30?3:this.streak>=10?2:1;this.bank+=dt*rate;const n=Math.floor(this.bank+1e-8);this.bank-=n;return {damage:n,seconds:dt,rate};}
}
class Run{
 constructor(){this.reset();}
 reset(){this.last=null;this.bank=0;this.seconds=0;this.km=0;}
 update(t,speed){let dt=this.last===null?0:(t-this.last)/1000;this.last=t;if(!Number.isFinite(speed)||speed<0||speed>20||dt<0||dt>.6)dt=0;this.seconds+=dt;this.km+=speed*dt/3600;this.bank+=speed/6*dt;const n=Math.floor(this.bank+1e-8);this.bank-=n;return {damage:n,seconds:dt,rate:speed/6};}
}
function visible(p,ids){return ids.every(i=>p?.[i]&&(p[i].visibility??0)>=.6&&p[i].x>=0&&p[i].x<=1&&p[i].y>=0&&p[i].y<=1);}
function frontSample(p,w,h){if(!visible(p,[0,11,12]))return null;const width=Math.abs(p[11].x-p[12].x)*w/h;if(width<.07)return null;return {head:p[0].y,shoulder:(p[11].y+p[12].y)/2,width,x:(p[11].x+p[12].x)/2};}
function frontZone(sample,base,threshold=.24){if(!sample||!base)return null;const scale=sample.width/base.width;if(scale<.65||scale>1.5||Math.abs(sample.x-base.x)>base.width*.7)return null;const shoulder=(sample.shoulder-base.shoulder)/base.width,head=(sample.head-base.head)/base.width;if(shoulder>=threshold&&head>=threshold*.65)return 'work';if(shoulder<=threshold*.35&&head<=threshold*.5&&shoulder>-.5&&head>-.5)return 'rest';return 'middle';}
class Motion{
 constructor(mode,view='front'){this.mode=mode;this.view=view;this.cycle=new Cycle();this.hold=new Hold();this.base=null;this.calibration=null;this.side=null;this.lastKnee=null;this.kneeCandidate=null;this.kneeTime=0;this.threshold=.24;this.lastTime=null;}
 reset(){this.cycle.reset();this.hold.reset();this.side=null;this.lastKnee=null;this.kneeCandidate=null;this.lastTime=null;}
 calibrate(){this.base=null;this.calibration=[];this.cycle.reset();}
 update(p,t,w=640,h=480){const result={rep:false,damage:0,seconds:0,label:'Pokaż wymaganą część ciała',metric:'—',valid:false};if(this.lastTime!==null&&t-this.lastTime>600){this.cycle.reset();this.hold.update(false,t);this.kneeCandidate=null;this.lastKnee=null;}this.lastTime=t;
 const fail=()=>{this.cycle.update(null,t);this.hold.update(false,t);this.kneeCandidate=null;return result;};
 const cycle=(zone,label,metric)=>{result.valid=zone!==null;result.metric=metric;result.rep=this.cycle.update(zone,t);result.label=zone===null?'Wróć do kadru i zacznij od pozycji startowej':this.cycle.phase==='seek'?'Przyjmij pozycję startową':this.cycle.phase==='work'?'Wróć do początku — dokończ ruch':label;return result;};
 if(this.mode==='pushup'&&this.view==='front'){
  const s=frontSample(p,w,h);if(!s){this.calibration=this.calibration?[]:null;return fail();}
  if(this.calibration){this.calibration.push({...s,t});const first=this.calibration[0];if(Math.abs(s.shoulder-first.shoulder)>s.width*.12||Math.abs(s.head-first.head)>s.width*.16||Math.abs(s.width/first.width-1)>.1){this.calibration=[{...s,t}];result.label='Utrzymaj nieruchomo górną pozycję';return result;}const elapsed=t-this.calibration[0].t;result.label='Kalibracja góry: '+Math.min(100,Math.floor(elapsed/15))+'%';if(elapsed>=1500&&this.calibration.length>=8){const a=this.calibration;this.base=Object.fromEntries(['head','shoulder','width','x'].map(k=>[k,a.reduce((n,v)=>n+v[k],0)/a.length]));this.calibration=null;result.label='Gotowe. Opuść całe ciało i wróć w górę.';}return result;}
  if(!this.base){result.label='Przyjmij górę pompki i kliknij „Kalibruj górę”';return fail();}
  const zone=frontZone(s,this.base,this.threshold);return cycle(zone,'Opuść barki i głowę, potem wróć w górę',Math.round((s.shoulder-this.base.shoulder)/this.base.width*100)+'% ruchu');
 }
 if(this.mode==='jack'||this.mode==='knees'){
  const ids=this.mode==='jack'?[11,12,15,16,23,24,27,28]:[11,12,23,24,25,26,27,28];if(!visible(p,ids))return fail();
  const sw=Math.abs(p[11].x-p[12].x)*w,torso=Math.abs((p[23].y+p[24].y-p[11].y-p[12].y)/2);if(sw<30||torso<.07)return fail();
  if(this.mode==='jack'){const spread=Math.abs(p[27].x-p[28].x)*w/sw,up=p[15].y<p[11].y-.04&&p[16].y<p[12].y-.04,down=p[15].y>p[11].y+.08&&p[16].y>p[12].y+.08;return cycle(up&&spread>1.55?'work':down&&spread<1.2?'rest':'middle','Ręce w górę i nogi szeroko, potem wróć',spread.toFixed(1)+'× rozstaw');}
  const liftL=(p[23].y-p[25].y)/torso,liftR=(p[24].y-p[26].y)/torso;const leg=liftL>-.1&&liftR<-.35?'left':liftR>-.1&&liftL<-.35?'right':null;result.valid=true;result.metric='naprzemiennie';if(leg!==this.kneeCandidate){this.kneeCandidate=leg;this.kneeTime=t;}if(leg&&t-this.kneeTime>=180&&this.lastKnee!==leg&&t-this.cycle.lastRep>=500){result.rep=true;this.lastKnee=leg;this.cycle.lastRep=t;}result.label='Unoś lewe i prawe kolano na zmianę';return result;
 }
 const sides={left:[11,13,15,23,25,27],right:[12,14,16,24,26,28]};let required=this.mode==='curl'?[0,1,2,3]:this.mode==='pushup'?[0,1,2,3]:this.mode==='plank'?[0,1,2,3,4,5]:[0,3,4,5];const score=side=>Math.min(...required.map(j=>p?.[sides[side][j]]?.visibility??0));const side=this.side&&score(this.side)>=.55?this.side:score('left')>=score('right')?'left':'right';if(side!==this.side){this.cycle.reset();this.hold.update(false,t);this.side=side;}const ids=sides[side];if(!visible(p,required.map(j=>ids[j])))return fail();const [shoulder,elbow,wrist,hip,knee,ankle]=ids.map(i=>p[i]);const torso=Math.hypot((shoulder.x-hip.x)*w,(shoulder.y-hip.y)*h);if(torso<30)return fail();
 if(this.mode==='plank'){
  const support=(elbow.y-shoulder.y)*h>torso*.12&&(wrist.y-shoulder.y)*h>torso*.12&&Math.abs((elbow.x-shoulder.x)*w)<torso*.6;
  const straight=support&&angle(shoulder,hip,ankle,w,h)>155&&angle(hip,knee,ankle,w,h)>150&&Math.abs((shoulder.y-ankle.y)*h)<Math.abs((shoulder.x-ankle.x)*w)*.65;
  const r=this.hold.update(straight,t);result.valid=straight;result.damage=r.damage;result.seconds=r.seconds;result.metric=this.hold.streak.toFixed(1)+' s · '+r.rate+' HP/s';result.label=straight?(r.rate?'Trzymaj! Dłuższa seria zwiększa moc.':'Pozycja znaleziona. Utrzymaj ją przez sekundę.'):'Seria przerwana. Ustaw ciało w jednej linii, bokiem.';return result;
 }
 let a,rest,work,label;
 if(this.mode==='pushup'){if(Math.abs((shoulder.y-hip.y)*h)>Math.abs((shoulder.x-hip.x)*w)*.85)return fail();a=angle(shoulder,elbow,wrist,w,h);rest=155;work=100;label='Opuść ciało, potem wyprostuj ramiona';}
 if(this.mode==='squat'){a=angle(hip,knee,ankle,w,h);rest=155;work=110;label='Wykonaj przysiad i wróć do wyprostu';}
 if(this.mode==='situp'){a=angle(shoulder,hip,knee,w,h);rest=120;work=80;label='Unieś tułów i wróć do początku';}
 if(this.mode==='curl'){if(Math.hypot((elbow.x-hip.x)*w,(elbow.y-hip.y)*h)>torso*.8)return fail();a=angle(shoulder,elbow,wrist,w,h);rest=145;work=65;label='Zegnij ramię, następnie opuść je';}
 if(!Number.isFinite(a))return fail();return cycle(a>=rest?'rest':a<=work?'work':'middle',label,Math.round(a)+'°');
 }
}
const api={modes,bosses,fresh,valid,migrate,damage,advance,angle,Cycle,Hold,Run,Motion,frontZone,frontSample};root.HeroCore=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
