(function(root){'use strict';
const C=root.HeroCore||(typeof require!=='undefined'?require('./core.js'):null),P=root.HeroProfiles||(typeof require!=='undefined'?require('./profiles.js'):null);
const factors=[1,1.25,1.6,2];
const names=[['Mchowy Korsarz','Szmaragdowy Cień','Król Leśnej Korony'],['Bazaltowy Strażnik','Kryształowy Kolos','Władca Gór'],['Neonowy Ryś','Chromowy Piorun','Cesarz Prędkości'],['Skorpion Klejnotów','Sfinks Zmierzchu','Władca Wydm'],['Miedziany Dron','Stalowy Cyklop','Imperator Pola'],['Granitowy Niedźwiedź','Obsydianowy Olbrzym','Monarcha Szczytów'],['Chmurowy Żmij','Burzowy Drakon','Smoczy Regent'],['Portowy Mechanik','Admirał Sprężyn','Król Podniebnego Portu'],['Wirujący Meteor','Tytan Przyciągania','Władca Gwiezdnego Wiru'],['Cierniowy Duszek','Dębowy Strażnik','Królowa Zielonego Labiryntu'],['Żywiczny Zwiadowca','Złoty Paladyn','Bursztynowy Regent'],['Mglisty Pilot','Obłoczny Kolos','Król Chmur'],['Koralowy Żuraw','Purpurowy Feniks','Królowa Latającej Wyspy'],['Srebrny Nietoperz','Nocny Mag','Cesarz Księżyca'],['Iskierka Poranka','Ognisty Strażnik','Władca Świtu'],['Szept Wiatru','Skrzydlaty Tytan','Władca Huraganu'],['Boksujący Automat','Pancerny Pięściarz','Mistrz Rękawic'],['Rzeczny Troll','Żelazny Mostnik','Architekt Tysiąca Mostów'],['Pyłowy Wędrowiec','Orbitujący Gigant','Król Komety'],['Drewniany Rycerz','Krzesłowy Baron','Cesarz Sali Tronowej']];
const palettes=[['#8fe0b0','#41756a'],['#c0b6ff','#61549c'],['#ffe18f','#9f6844']];
function group(age){const p=P.profile(age);if(!p)throw Error('Wybierz wiek');return p.id;}
function baseHP(age,id){return group(age)==='adult'?C.modes.find(m=>m.id===id).boss.hp:P.goal(age,id);}
function maxHP(age,id,stage=0){return Math.ceil(baseHP(age,id)*factors[stage]);}
function boss(id,stage=0){const i=C.modes.findIndex(m=>m.id===id),m=C.modes[i];if(!m||!Number.isInteger(stage)||stage<0||stage>3)throw Error('Nieznany etap');if(!stage)return m.boss;const [skin,dark]=palettes[stage-1];return {...m.boss,name:names[i][stage-1],skin,dark,kind:['baron','frost','crunch'][stage-1],emblem:['♜','❄','♛'][stage-1],reward:m.boss.reward+stage*10,chapter:'Rozdział '+(stage+1)+': '+m.name,story:names[i][stage-1]+' strzeże kolejnej bramy. '+m.desc+' Ten przeciwnik ma więcej HP niż poprzedni. Postęp zachowa się po przerwie.',ending:stage===3?'Wszystkie cztery bramy otwarte! Ukończono przygodę: '+m.name+'. Możesz wrócić do wybranego bossa.':'Brama otwarta! Przed Tobą kolejny strażnik i dalszy rozdział przygody.'};}
function record(s,age,id){const key=group(age)+':'+id;s.campaigns??={};let c=s.campaigns[key];if(!c||!Number.isInteger(c.stage)||c.stage<0||c.stage>3||!c.battles||Array.isArray(c.battles))c=s.campaigns[key]={stage:0,battles:{}};return c;}
function stage(s,age,id){return record(s,age,id).stage;}
function ensure(s,age,id,level=stage(s,age,id)){
 if(!level)return group(age)==='adult'?s.battles[id]:P.ensure(s,age,id,null);
 const c=record(s,age,id),max=maxHP(age,id,level);let b=c.battles[level];
 if(!b||b.maxHP!==max||!Number.isInteger(b.hp)||b.hp<0||b.hp>max||!Number.isFinite(b.bank)||b.bank<0||b.bank>=1||!Number.isSafeInteger(b.wins)||b.wins<0||typeof b.rewarded!=='boolean')b=c.battles[level]={maxHP:max,hp:max,bank:0,wins:0,rewarded:false};return b;
}
function unlocked(s,age,id){let n=0;while(n<3&&ensure(s,age,id,n).rewarded)n++;return n;}
function select(s,age,id,level){if(!Number.isInteger(level)||level<0||level>unlocked(s,age,id))return false;record(s,age,id).stage=level;ensure(s,age,id);return true;}
function next(s,age,id){const level=stage(s,age,id);return ensure(s,age,id).hp===0&&level<3?select(s,age,id,level+1):false;}
function apply(s,age,id,units,test=false){const level=stage(s,age,id);if(!level)return group(age)==='adult'?C.damage(s,id,units,test):P.apply(s,age,id,null,units,test);const b=ensure(s,age,id);if(!Number.isFinite(units)||units<=0||!b.hp)return 0;b.bank+=units;const whole=Math.floor(b.bank+1e-8),n=Math.min(whole,b.hp);b.bank=Math.max(0,b.bank-whole);b.hp-=n;if(test)s.demo+=n;else s.stats[id].damage+=n;if(!b.hp){b.bank=0;b.wins++;if(!b.rewarded){s.coins+=boss(id,level).reward;b.rewarded=true;}}return n;}
function reset(s,age,id){const b=ensure(s,age,id);b.hp=maxHP(age,id,stage(s,age,id));if('bank'in b)b.bank=0;return b;}
const api={factors,names,baseHP,maxHP,boss,stage,ensure,unlocked,select,next,apply,reset};root.HeroCampaign=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
