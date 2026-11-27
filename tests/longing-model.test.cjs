const test=require('node:test'),assert=require('node:assert/strict');
const {sample}=require('../assets/js/longing-model.js');
const at=time=>Date.parse(`2026-11-27T${time}+08:00`);
test('Daily curve is nonlinear and continuous through Shanghai midnight',()=>{
 assert(sample(at('09:00:00')).base>=80);
 assert(sample(at('06:00:00')).base>=70);
 assert(sample(at('20:00:00')).base>sample(at('12:00:00')).base);
 assert(sample(at('06:00:00')).base<sample(at('03:00:00')).base);
 const morning=sample(at('10:00:00')).base-sample(at('09:00:00')).base;
 const evening=sample(at('18:00:00')).base-sample(at('17:00:00')).base;
 assert(Math.abs(morning-evening)>.2);
 const midnight=at('00:00:00');assert(Math.abs(sample(midnight).value-sample(midnight-1).value)<.001);
});
test('A whole day stays finite and bounded, while breathing and spontaneous heart flutters vary',()=>{
 let flutters=0,minBreath=1,maxBreath=-1,last=sample(at('00:00:00')).value;
 for(let t=at('00:00:00');t<at('00:00:00')+86400000;t+=10000){const s=sample(t);assert(s.value>=4&&s.value<=99.9);assert(s.bpm>=58&&s.bpm<=88);assert(s.trace>=0&&s.trace<2.6);assert(Number.isFinite(s.value));if(s.flutter>.5)flutters++;minBreath=Math.min(minBreath,s.breath);maxBreath=Math.max(maxBreath,s.breath);assert(Math.abs(s.value-last)<5);last=s.value}
 assert(flutters>50);assert(maxBreath-minBreath>.8);
});
test('11:11 and 23:11 carry two waves and end quietly rather than replaying later',()=>{
 for(const hour of ['11','23']){const start=at(`${hour}:11:00`);assert.equal(sample(start-1).appointed,false);assert(sample(start+6000).appointment>sample(start+9500).appointment);assert(sample(start+13000).appointment>sample(start+9500).appointment);assert.equal(sample(start+24000).appointment,0);assert.equal(sample(start+60000).appointed,false)}
});
test('Date-seeded moments survive reload/order changes, and a flutter leaves a fading trace',()=>{
 const time=at('15:28:00'),before=sample(time);sample(time+3*86400000);assert.deepEqual(sample(time),before);
 let peak;for(let t=at('06:00:00');t<at('07:00:00');t+=1000){if(sample(t).flutter>.8){peak=t;break}}
 assert(peak);let end=peak;while(sample(end).flutter>0)end+=1000;
 assert(sample(end+5000).trace>sample(peak-20000).trace);
});
