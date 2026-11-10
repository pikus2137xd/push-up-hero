(function(root){'use strict';
const C=root.HeroCore||(typeof require!=='undefined'?require('./core.js'):null),foods=root.HeroFoods||(typeof require!=='undefined'?require('./foods.js'):null);
const weight=70;
// MET classes from the 2024 Adult Compendium; repetition cadence is a game assumption.
const rates={pushup:{met:7.5,cadence:20,code:'02020'},plank:{met:2.8,cadence:60,code:'02024',timed:true},treadmill:{met:4.8,cadence:60,code:'17358',timed:true},situp:{met:2.8,cadence:20,code:'02024'},curl:{met:3.5,cadence:20,code:'02054'},squat:{met:3,cadence:20,code:'02056'},jack:{met:7.5,cadence:40,code:'02020'},knees:{met:4.8,cadence:50,code:'12025'},burpee:{met:7.5,cadence:10,code:'02020'},bend:{met:2.3,cadence:15,code:'02101'}};
const food=id=>foods.find(f=>f.id===id),mode=id=>C.modes.find(m=>m.id===id);
function kcalPerMinute(met){return met*3.5*weight/200;}
function plan(foodId,modeId){const f=food(foodId),m=mode(modeId),r=rates[modeId];if(!f||!m||!r)throw new Error('Nieznane jedzenie lub ćwiczenie');const unitKcal=kcalPerMinute(r.met)/r.cadence;return {food:f,mode:m,unitKcal,maxHP:Math.ceil(f.kcal/unitKcal),minutes:f.kcal/kcalPerMinute(r.met),timed:!!r.timed,met:r.met,cadence:r.cadence,weight,boss:C.foodBosses[f.group]};}
function key(foodId,modeId){plan(foodId,modeId);return foodId+':'+modeId;}
function ensure(s,foodId,modeId){const p=plan(foodId,modeId),k=key(foodId,modeId);let b=s.foodBattles[k];if(!b||b.maxHP!==p.maxHP){b={maxHP:p.maxHP,hp:p.maxHP,bank:0,wins:0,rewarded:false};s.foodBattles[k]=b;}return b;}
function apply(s,foodId,modeId,units){const b=ensure(s,foodId,modeId);if(b.hp<=0||!Number.isFinite(units)||units<=0)return 0;b.bank+=units;const whole=Math.floor(b.bank+1e-8),n=Math.min(b.hp,whole);b.bank=Math.max(0,b.bank-whole);b.hp-=n;s.stats[modeId].damage+=n;if(b.hp===0){b.bank=0;b.wins++;if(!b.rewarded){s.coins+=20;b.rewarded=true;}}return n;}
function reset(s,foodId,modeId){const b=ensure(s,foodId,modeId);b.hp=b.maxHP;b.bank=0;return b;}
function progress(s,foodId,modeId){const p=plan(foodId,modeId),b=ensure(s,foodId,modeId);return Math.min(p.food.kcal,(b.maxHP-b.hp+b.bank)*p.unitKcal);}
function runMET(speed){if(!Number.isFinite(speed)||speed<=0)return 0;const points=[[0,0],[3,2.8],[4,3.0],[4.8,3.8],[6,4.8],[6.8,6.5],[8.2,8.5],[10,9.3],[12,11.8],[16,14.8],[20,19.8]];speed=Math.min(20,speed);for(let i=1;i<points.length;i++){if(speed<=points[i][0]){const [x,y]=points[i-1],[nx,ny]=points[i];return y+(ny-y)*(speed-x)/(nx-x);}}return 19.8;}
function formatTime(seconds){const mins=Math.ceil(seconds/60);return mins>=60?Math.floor(mins/60)+' h '+(mins%60)+' min':mins+' min';}
const api={foods,rates,weight,food,plan,key,ensure,apply,reset,progress,runMET,kcalPerMinute,formatTime};root.HeroEnergy=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
