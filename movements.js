(function(root){'use strict';
// Image-space motion counters. They count visible cycles, not exercise technique.
const sideIds={left:[11,13,15,23,25,27,31],right:[12,14,16,24,26,28,32]};
const ok=(p,ids)=>ids.every(i=>p?.[i]&&Number.isFinite(p[i].x)&&Number.isFinite(p[i].y)&&(p[i].visibility??0)>=.55&&p[i].x>=0&&p[i].x<=1&&p[i].y>=0&&p[i].y<=1);
const distance=(a,b,w,h)=>Math.hypot((a.x-b.x)*w,(a.y-b.y)*h);
function angle(a,b,c,w,h){const ux=(a.x-b.x)*w,uy=(a.y-b.y)*h,vx=(c.x-b.x)*w,vy=(c.y-b.y)*h,n=Math.hypot(ux,uy)*Math.hypot(vx,vy);return n<1?NaN:Math.acos(Math.max(-1,Math.min(1,(ux*vx+uy*vy)/n)))*180/Math.PI;}
class Tracker{
 constructor(mode,easy=true){this.mode=mode;this.easy=easy;this.reset();}
 reset(){this.phase='seek';this.candidate='';this.since=0;this.last=null;this.lastRep=-Infinity;this.filtered=null;this.side=null;this.base=null;this.neutral=null;this.lost=null;this.previousHip=null;}
 gate(zone,t){if(this.candidate!==zone){this.candidate=zone;this.since=t;return false;}if(t-this.since<(this.easy?140:220))return false;if(this.phase==='seek'&&zone==='rest')this.phase='ready';else if(this.phase==='ready'&&zone==='work')this.phase='work';else if(this.phase==='work'&&zone==='rest'){this.phase='ready';if(t-this.lastRep>=700){this.lastRep=t;return true;}}return false;}
 update(p,t,w=640,h=480){
  const out={rep:false,damage:0,seconds:0,valid:false,label:'Pokaż część ciała opisaną powyżej',metric:'—'};
  const fail=(label=out.label)=>{if(this.lost===null)this.lost=t;if(t-this.lost>250){this.phase='seek';this.candidate='';this.filtered=null;this.neutral=null;this.previousHip=null;}out.label=label;return out;};
  if(!Number.isFinite(t)||w<=0||h<=0)return fail();
  const dt=this.last===null?0:t-this.last;if(dt<0||dt>600){this.phase='seek';this.candidate='';this.filtered=null;this.neutral=null;this.previousHip=null;}this.last=t;
  let value,rest,work,metric='',label='',zone=null;
  const front=['armraise','lateralraise','sideleg','sidebend'].includes(this.mode);
  if(front){
   const required=[11,12,23,24,...(['armraise','lateralraise'].includes(this.mode)?[15,16]:this.mode==='sideleg'?[27,28]:[])];
   if(!ok(p,required))return fail();
   const shoulder={x:(p[11].x+p[12].x)/2,y:(p[11].y+p[12].y)/2},hip={x:(p[23].x+p[24].x)/2,y:(p[23].y+p[24].y)/2},torso=distance(shoulder,hip,w,h),sw=Math.abs(p[11].x-p[12].x)*w;
   if(torso<30||sw<25||shoulder.y>=hip.y)return fail('Stań przodem i pokaż barki oraz biodra');
   if(this.mode==='armraise'){value=Math.min((p[11].y-p[15].y)*h/torso,(p[12].y-p[16].y)*h/torso);rest=-.4;work=this.easy?.15:.35;label='Obie ręce nad głowę i z powrotem w dół';metric='uniesienie rąk';}
   if(this.mode==='lateralraise'){const spread=Math.abs(p[15].x-p[16].x)*w/sw,down=Math.min((p[15].y-p[11].y)*h/torso,(p[16].y-p[12].y)*h/torso)>.45,level=Math.max(Math.abs(p[15].y-p[11].y),Math.abs(p[16].y-p[12].y))*h/torso<.4;value=down?0:level?spread:1.5;rest=1;work=this.easy?2.5:3;label='Ramiona na boki do poziomu barków, potem w dół';metric='rozstaw ramion';}
   if(this.mode==='sideleg'){const spread=Math.abs(p[27].x-p[28].x)*w/sw,lift=Math.abs(p[27].y-p[28].y)*h/torso;value=lift>(this.easy?.12:.2)?spread:Math.min(spread,1.2);rest=1.2;work=this.easy?1.65:2;label='Unieś nogę w bok i wróć ze stopami blisko siebie';metric='rozstaw nóg';}
   if(this.mode==='sidebend'){value=Math.atan2(Math.abs((shoulder.x-hip.x)*w),(hip.y-shoulder.y)*h)*180/Math.PI;rest=8;work=this.easy?20:30;label='Pochyl tułów w bok i wróć do pionu';metric='° od pionu';}
  }else{
   const required=this.mode==='bend'?[0,3]:this.mode==='boxing'?[0,1,2,3]:this.mode==='calf'?[0,3,5,6]:[0,3,4,5];
   const score=side=>Math.min(...required.map(j=>p?.[sideIds[side][j]]?.visibility??0));
   const side=this.side&&score(this.side)>=.55?this.side:score('left')>=score('right')?'left':'right';
   if(!ok(p,required.map(j=>sideIds[side][j])))return fail();
   if(this.side&&side!==this.side){this.phase='seek';this.candidate='';this.filtered=null;this.neutral=null;this.base=null;this.previousHip=null;}
   this.side=side;
   const [shoulder,elbow,wrist,hip,knee,ankle,toe]=sideIds[side].map(i=>p[i]),torso=distance(shoulder,hip,w,h);
   if(torso<35)return fail('Podejdź bliżej: bark i biodro muszą być wyraźnie widoczne');
   if(this.mode==='bend'){
    const tilt=Math.atan2(Math.abs((shoulder.x-hip.x)*w),(hip.y-shoulder.y)*h)*180/Math.PI;
    if(this.base&&(torso/this.base.length<.5||torso/this.base.length>1.7||this.previousHip&&distance(hip,this.previousHip,w,h)>this.base.length*.65)){this.reset();return fail('Zmieniono kadr. Stań prosto przez sekundę.');}
    this.previousHip={...hip};
    if(!this.base){
     if(tilt>22){this.neutral=null;return fail('Stań prosto bokiem przez sekundę — ustawiam pozycję startową');}
     if(!this.neutral||Math.abs(tilt-this.neutral.tilt)>5||Math.abs(torso/this.neutral.length-1)>.12)this.neutral={t,tilt,length:torso,vertical:(hip.y-shoulder.y)*h};
     out.label='Pozycja startowa: '+Math.min(100,Math.floor((t-this.neutral.t)/8))+'%';
     if(t-this.neutral.t>=800){this.base={...this.neutral};this.phase='seek';this.candidate='';this.filtered=0;out.label='Gotowe. Pochyl tułów i wróć.';}return out;
    }
    value=Math.max(0,tilt-this.base.tilt);rest=this.easy?10:14;work=this.easy?28:42;metric='° pochylenia';label='Pochyl tułów do przodu i wróć. Kolana mogą być lekko ugięte.';
   }
   if(this.mode==='calf'){
    const gap=(toe.y-ankle.y)*h/torso;
    if(!this.base){if(!this.neutral||Math.abs(gap-this.neutral.value)>.035)this.neutral={t,value:gap};if(t-this.neutral.t>=700)this.base={value:gap};out.label='Stań płasko przez sekundę, stopy widoczne';return out;}
    value=gap-this.base.value;rest=.025;work=this.easy?.08:.14;metric='uniesienie pięty';label='Wznieś piętę, palce zostają na podłodze, i opuść';
   }
   if(this.mode==='lunge'){if(Math.abs((ankle.x-hip.x)*w)<torso*.25)return fail('Ustaw nogi w wykroku, telefon z boku');value=180-angle(hip,knee,ankle,w,h);rest=30;work=this.easy?55:75;metric='° zgięcia kolana';label='Ugnij nogę w wykroku i wyprostuj';}
   if(this.mode==='boxing'){if(Math.abs((wrist.y-shoulder.y)*h)>torso*.75)return fail('Trzymaj ramię przed sobą na wysokości barku');value=angle(shoulder,elbow,wrist,w,h);rest=105;work=this.easy?145:160;metric='° wyprostu';label='Z gardy wyprostuj ramię i cofnij je';}
   if(this.mode==='bridge'){if(shoulder.y<hip.y-.08||knee.y>hip.y+.03)return fail('Połóż się bokiem do kamery, zegnij kolana');value=angle(shoulder,hip,knee,w,h);rest=135;work=this.easy?155:165;metric='° otwarcia bioder';label='Unieś biodra i opuść je';}
   if(this.mode==='legraise'){if(Math.abs((shoulder.y-hip.y)*h)>Math.abs((shoulder.x-hip.x)*w)*.65||angle(hip,knee,ankle,w,h)<145)return fail('Połóż się bokiem do kamery, nogi prawie proste');value=180-angle(shoulder,hip,knee,w,h);rest=25;work=this.easy?50:70;metric='° uniesienia nóg';label='Unieś nogi w wygodnym zakresie i opuść';}
   if(this.mode==='seatedkick'){if(shoulder.y>=hip.y-.06||Math.abs((hip.y-knee.y)*h)>torso*.5)return fail('Usiądź bokiem, biodro i kolano na podobnej wysokości');value=angle(hip,knee,ankle,w,h);rest=115;work=this.easy?145:160;metric='° wyprostu kolana';label='Wyprostuj nogę i ponownie opuść stopę';}
  }
  if(!Number.isFinite(value))return fail();
  this.lost=null;
  const alpha=this.filtered===null?1:1-Math.exp(-Math.max(1,dt)/100);
  this.filtered=this.filtered===null?value:this.filtered+(value-this.filtered)*alpha;
  zone=this.filtered<=rest?'rest':this.filtered>=work?'work':'middle';
  out.rep=this.gate(zone,t);out.valid=true;out.metric=this.filtered.toFixed(1)+' '+metric;
  out.label=this.phase==='seek'?'Wróć do pozycji początkowej':this.phase==='work'?'Wróć do początku — dokończ ruch':label;
  return out;
 }
}
const api={Tracker};root.HeroMovements=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
