(function(root){'use strict';
const groups=[{id:'6-8',max:8,goals:[5,10,30,6,6,6,8,10,3,6]},{id:'9-12',max:12,goals:[8,15,45,10,10,10,12,14,5,10]},{id:'13-18',max:18,goals:[12,20,60,14,12,14,18,20,8,12]},{id:'adult',max:59},{id:'60+',max:99,goals:[8,15,45,10,10,10,12,14,5,10]}];
const ids=['pushup','plank','treadmill','situp','curl','squat','jack','knees','burpee','bend'];
function profile(age){if(!Number.isInteger(age)||age<6||age>99)return null;return groups.find(g=>age<=g.max);}
function goal(age,mode){const p=profile(age);if(!p||p.id==='adult')return null;return p.goals[ids.indexOf(mode)];}
function key(age,mode,food){return profile(age).id+':'+(food||'casual')+':'+mode;}
function ensure(s,age,mode,food){const maxHP=goal(age,mode);if(!maxHP)throw Error('Nieprawidłowy profil punktowy');s.profileBattles??={};const k=key(age,mode,food);let b=s.profileBattles[k];if(!b||b.maxHP!==maxHP||!Number.isInteger(b.hp)||b.hp<0||b.hp>maxHP||!Number.isFinite(b.bank)||b.bank<0||b.bank>=1||!Number.isSafeInteger(b.wins)||b.wins<0||typeof b.rewarded!=='boolean')b=s.profileBattles[k]={maxHP,hp:maxHP,bank:0,wins:0,rewarded:false};return b;}
function apply(s,age,mode,food,units,test=false){const b=ensure(s,age,mode,food);if(!Number.isFinite(units)||units<=0||!b.hp)return 0;b.bank+=units;const whole=Math.floor(b.bank+1e-8),n=Math.min(b.hp,whole);b.bank=Math.max(0,b.bank-whole);b.hp-=n;if(test)s.demo+=n;else s.stats[mode].damage+=n;if(!b.hp){b.bank=0;b.wins++;if(!b.rewarded){s.coins+=20;b.rewarded=true;}}return n;}
function reset(s,age,mode,food){const b=ensure(s,age,mode,food);b.hp=b.maxHP;b.bank=0;return b;}
const api={profile,goal,key,ensure,apply,reset};root.HeroProfiles=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
