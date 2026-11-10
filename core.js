(function(root){
 'use strict';
 const bosses=[{name:'Goblin Bąbel',hp:8,skin:'#8bd779',dark:'#357f69'},{name:'Rycerz Galareta',hp:12,skin:'#ba9bff',dark:'#624cac'},{name:'Król Lava',hp:16,skin:'#ffac65',dark:'#b74853'}];
 function fresh(){return {level:0,hp:8,coins:0,reps:0,demo:0};}
 function valid(s){return s&&Number.isInteger(s.level)&&s.level>=0&&s.level<3&&Number.isInteger(s.hp)&&s.hp>=0&&s.hp<=bosses[s.level].hp&&['coins','reps','demo'].every(k=>Number.isSafeInteger(s[k])&&s[k]>=0);}
 function strike(s,demo=false){if(s.hp<=0)return false;s.hp--;s[demo?'demo':'reps']++;if(s.hp===0)s.coins+=25*(s.level+1);return true;}
 function next(s){if(s.hp!==0||s.level===2)return false;s.level++;s.hp=bosses[s.level].hp;return true;}
 class Counter{
  constructor(){this.reset();this.low=100;this.high=155;}
  reset(){this.phase='seek';this.candidate='';this.since=0;this.last=0;this.lastRep=-Infinity;}
  update(angle,time,visible=true){
   if(!visible||!Number.isFinite(angle)){this.reset();return false;}
   if(this.last&&time-this.last>650)this.reset();this.last=time;
   const zone=angle>=this.high?'up':angle<=this.low?'down':'middle';
   if(zone!==this.candidate){this.candidate=zone;this.since=time;return false;}
   if(time-this.since<160)return false;
   if(this.phase==='seek'&&zone==='up')this.phase='up';
   else if(this.phase==='up'&&zone==='down')this.phase='down';
   else if(this.phase==='down'&&zone==='up'){this.phase='up';if(time-this.lastRep>=800){this.lastRep=time;return true;}}
   return false;
  }
 }
 function angle(a,b,c,width=1,height=1){const u=[(a.x-b.x)*width,(a.y-b.y)*height],v=[(c.x-b.x)*width,(c.y-b.y)*height];const norm=Math.hypot(...u)*Math.hypot(...v);return norm<1e-9?NaN:Math.acos(Math.max(-1,Math.min(1,(u[0]*v[0]+u[1]*v[1])/norm)))*180/Math.PI;}
 const api={bosses,fresh,valid,strike,next,Counter,angle};root.HeroCore=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
