const assert=require('node:assert/strict'),C=require('./core.js');
let passed=0;function test(name,fn){fn();passed++;console.log('PASS '+name);}
test('Eight distinct modes and validated saved state',()=>{assert.equal(new Set(C.modes.map(m=>m.id)).size,8);assert(C.valid(C.fresh()));assert(!C.valid({...C.fresh(),hp:999}));});
test('Combat, one-time rewards, separate demo and repeated campaign',()=>{const s=C.fresh();for(let i=0;i<40;i++)C.damage(s,'squat',1);assert.equal(s.coins,25);assert.equal(C.damage(s,'squat',1),0);C.advance(s);C.damage(s,'treadmill',100,true);assert.equal(s.coins,75);assert.equal(s.stats.treadmill.damage,0);assert.equal(s.demo,1);C.advance(s);C.damage(s,'plank',100);assert.equal(s.coins,150);C.advance(s);assert.equal(s.level,0);assert.equal(s.hp,40);assert.equal(s.coins,150);assert(C.valid(s));});
test('Legacy migration preserves progress, counts and health ratio',()=>{const s=C.migrate({level:1,hp:6,coins:25,reps:8,demo:0});assert.equal(s.level,1);assert.equal(s.hp,35);assert.equal(s.stats.pushup.reps,8);assert.equal(s.coins,25);assert(C.valid(s));assert.equal(C.migrate({level:1,hp:-2}).level,0);});
function cycle(samples){const c=new C.Cycle();return samples.reduce((n,[z,t])=>n+Number(c.update(z,t)),0);}
test('Repetition needs rest-work-rest, debounce and reacquisition',()=>{assert.equal(cycle([['rest',0],['rest',200],['work',400],['work',600],['rest',800],['rest',1000]]),1);assert.equal(cycle([['work',0],['work',200],['rest',400],['rest',600]]),0);assert.equal(cycle([['rest',0],['rest',200],['work',250],['rest',300],['rest',500]]),0);assert.equal(cycle([['rest',0],['rest',200],['work',400],['work',600],[null,700],['rest',800],['rest',1000]]),0);assert.equal(cycle([['rest',0],['rest',200],['work',400],['work',600],['rest',2000],['rest',2200]]),0);});
test('Front camera ignores elbow angle, head-only nodding and lateral shifts',()=>{const base={head:.25,shoulder:.35,width:.3,x:.5};assert.equal(C.frontZone({...base,head:.34,shoulder:.44},base),'work');assert.equal(C.frontZone({...base,head:.4},base),'middle');assert.equal(C.frontZone({...base,x:.95},base),null);assert.equal(C.frontZone(null,base),null);});
function pose(){return Array.from({length:33},()=>({x:.5,y:.5,visibility:0}));}
function point(p,i,x,y){p[i]={x,y,visibility:1};}
function fixture(mode,a){const p=pose();
 if(mode==='pushup'){point(p,0,.5,.2+a);point(p,11,.35,.3+a);point(p,12,.65,.3+a);return p;}
 if(mode==='jack'||mode==='knees'){
  for(const [i,x,y]of [[11,.4,.3],[12,.6,.3],[23,.42,.55],[24,.58,.55],[25,.42,.8],[26,.58,.8],[27,.46,.95],[28,.54,.95],[15,.3,.65],[16,.7,.65]])point(p,i,x,y);
  if(mode==='jack'&&a){point(p,15,.3,.1);point(p,16,.7,.1);point(p,27,.2,.95);point(p,28,.8,.95);}
  if(mode==='knees'&&a)point(p,a==='left'?25:26,a==='left'?.42:.58,.53);
  return p;
 }
 if(mode==='plank'){for(const [i,x,y] of [[11,.2,.4],[13,.2,.6],[15,.3,.6],[23,.45,.4],[25,.65,.4],[27,.85,.4]])point(p,i,x,y);return p;}
 if(mode==='pushup-side'){point(p,11,.3,.3);point(p,23,.65,.3);point(p,13,.3,.55);point(p,15,.3+.2*Math.sin(a*Math.PI/180),.55-.2*Math.cos(a*Math.PI/180));return p;}
 if(mode==='squat'){point(p,11,.5,.2);point(p,23,.5,.4);point(p,25,.5,.6);point(p,27,.5+.2*Math.sin(a*Math.PI/180),.6-.2*Math.cos(a*Math.PI/180));}
 if(mode==='situp'){point(p,23,.5,.65);point(p,25,.7,.65);point(p,27,.8,.85);point(p,11,.5+.25*Math.cos(a*Math.PI/180),.65-.25*Math.sin(a*Math.PI/180));}
 if(mode==='curl'){point(p,11,.45,.25);point(p,23,.45,.65);point(p,13,.45,.5);point(p,15,.45+.2*Math.sin(a*Math.PI/180),.5-.2*Math.cos(a*Math.PI/180));}
 return p;
}
test('Front calibration and complete body movement counts once',()=>{const m=new C.Motion('pushup','front');m.calibrate();for(let t=0;t<=1600;t+=100)m.update(fixture('pushup',0),t,1000,1000);assert(m.base);let count=0;for(const [a,t]of [[0,1700],[0,1900],[.1,2100],[.1,2300],[0,2500],[0,2700]])count+=Number(m.update(fixture('pushup',a),t,1000,1000).rep);assert.equal(count,1);});
for(const [mode,rest,work]of [['squat',170,90],['situp',150,60],['curl',165,45],['jack',false,true]])test(mode+' synthetic full cycle',()=>{const m=new C.Motion(mode);let n=0;for(const [a,t]of [[rest,0],[rest,200],[work,400],[work,600],[rest,800],[rest,1000]])n+=Number(m.update(fixture(mode,a),t,1000,1000).rep);assert.equal(n,1);});
test('Alternating high knees rejects repeating same leg',()=>{const m=new C.Motion('knees');let n=0;for(const [a,t]of [['left',0],['left',200],[null,400],['left',800],['left',1000],['right',1200],['right',1400]])n+=Number(m.update(fixture('knees',a),t,1000,1000).rep);assert.equal(n,2);});
test('Side pushup still uses complete elbow cycle',()=>{const m=new C.Motion('pushup','side');let n=0;for(const [a,t]of [[170,0],[170,200],[85,400],[85,600],[170,800],[170,1000]])n+=Number(m.update(fixture('pushup-side',a),t,1000,1000).rep);assert.equal(n,1);});
test('Plank rejects a horizontal body with no arm support',()=>{const m=new C.Motion('plank'),p=fixture('plank');point(p,13,.3,.4);point(p,15,.4,.4);let damage=0;for(let t=0;t<=10000;t+=100)damage+=m.update(p,t,1000,1000).damage;assert.equal(damage,0);assert.equal(m.hold.streak,0);});
test('Plank earns time and damage only while horizontal and visible',()=>{const m=new C.Motion('plank');let damage=0;for(let t=0;t<=6000;t+=100)damage+=m.update(fixture('plank'),t,1000,1000).damage;assert(damage>=4);assert(m.hold.streak>4);const r=m.update(null,6100,1000,1000);assert.equal(r.damage,0);assert.equal(m.hold.streak,0);});
test('Plank ramps to 2 and 3 HP/s, frame stalls do not accrue time',()=>{const h=new C.Hold();let r;for(let t=0;t<=12000;t+=100)r=h.update(true,t);assert.equal(r.rate,2);for(let t=12100;t<=33000;t+=100)r=h.update(true,t);assert.equal(r.rate,3);const total=h.total;h.update(true,50000);assert.equal(h.total,total);assert.equal(h.streak,0);h.update(false,50100);assert.equal(h.streak,0);});
test('Treadmill scales with speed, zero speed does no damage, stalls excluded',()=>{const run=s=>{const r=new C.Run();let damage=0;for(let t=0;t<=6000;t+=100)damage+=r.update(t,s).damage;return {r,damage};};const a=run(6),b=run(12);assert.equal(a.damage,6);assert.equal(b.damage,12);assert.equal(run(0).damage,0);assert(Math.abs(a.r.km-.01)<1e-8);const before=a.r.seconds;a.r.update(60000,20);assert.equal(a.r.seconds,before);});
console.log(passed+' test groups passed. Synthetic pose tests are not physical camera tests.');
