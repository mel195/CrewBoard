/* ============ extra job data ============ */
Object.assign(JOBS.hernandez,{colorsOk:true,photos:14,sig:{returning:'2019 interior',referrals:5}});
Object.assign(JOBS.okafor,{colorsOk:true,photos:6,sig:{}});
Object.assign(JOBS.patel,{colorsOk:false,photos:9,sig:{}});
Object.assign(JOBS.gutierrez,{colorsOk:true,photos:11,sig:{}});
Object.values(JOBS).forEach(j=>delete j.important);
const RATE={D:28,B:30,A:27,C:25};
const crewPay=(job,cr)=>cr==='S'?Math.round(job.value*0.55/10)*10:Math.round(job.hours*RATE[cr]/10)*10;
const IDLE_COST=1000;
const PDESC={'Balanced':'Skills first, then trust, start date and client fit.','Protect margin':'Crews that finish on budget and work well together.','Fastest start':'Whoever can start soonest.','White glove':'Best skills, trust and client fit. Used for important clients.'};
const IMPT=[
 ['returning','Returning client',j=>j.sig.returning?`Returning client (${j.sig.returning})`:null],
 ['referrals','Has referred 2 or more jobs',j=>(j.sig.referrals||0)>=2?`Has referred ${j.sig.referrals} jobs`:null],
 ['value','Job worth $12,000 or more',j=>j.value>=12000?`${money(j.value)} job`:null],
 ['crm','Tagged VIP in the CRM',j=>j.sig.crm?'Tagged VIP in the CRM':null],
 ['trade','Designer, realtor or property manager',j=>j.sig.trade||null],
 ['manual','Flagged by the estimator',j=>j.sig.manual?`Estimator note: ${j.sig.manual}`:null]];
const BOOKS=BOOK0.map((x,i)=>({...x,id:'b'+i}));
const MEM={
 Yesenia:{role:'Crew lead',yrs:11,langs:'English, Spanish',skills:['Stucco & elastomeric','Spray rig','Color matching'],certs:['OSHA 10'],jobs:44,over:-2,cb:1,g:4.9,i:4.8,best:'Mateo, Jorge',off:'None booked',
  fb:[['Ruiz family · Google review','“Yesenia walked us through everything in Spanish. The house looks brand new.”','Oct 2026'],['Dana R. · PM note','Best with picky HOA boards. Use her on front-facing jobs.','Sep 2026']],
  past:[['Brightwater HOA, phase 1','Oct 2026','On budget'],['Ruiz exterior','Sep 2026','2% under hours'],['Castillo exterior','Aug 2026','On budget']]},
 Mateo:{role:'Painter, lift operator',yrs:6,langs:'English, Spanish',skills:['Boom lift','Pressure washing','Stucco repair'],certs:['Lead-safe RRP (exp. Mar 2028)','Lift operator'],jobs:41,over:-1,cb:2,g:4.8,i:4.6,best:'Yesenia',off:'None booked',
  fb:[['Dana R. · PM note','Go-to for second-story work. Careful with masking.','Aug 2026']],past:[['Brightwater HOA, phase 1','Oct 2026','On budget'],['Ortega exterior','Jul 2026','3% under hours']]},
 Jorge:{role:'Painter',yrs:4,langs:'Spanish',skills:['Prep and patching','Pressure washing'],certs:[],jobs:38,over:1,cb:2,g:4.7,i:4.4,best:'Yesenia, Mateo',off:'None booked',
  fb:[['Lee family · Google review','“Jorge’s prep work was spotless.”','Jun 2026']],past:[['Ruiz exterior','Sep 2026','2% under hours']]},
 Kevin:{role:'Apprentice',yrs:1,langs:'English',skills:['Prep','Cleanup'],certs:[],jobs:12,over:4,cb:3,g:null,i:4.0,best:'Jorge',off:'Out Nov 2 and 3',
  fb:[['Yesenia · crew lead note','Learning fast. Keep him on prep with Jorge for now.','Oct 2026']],past:[['Brightwater HOA, phase 1','Oct 2026','On budget']]},
 Carlos:{role:'Crew lead',yrs:14,langs:'English, Spanish',skills:['Fine finish','Cabinets','Wallpaper removal'],certs:['OSHA 30'],jobs:38,over:-5,cb:0,g:5.0,i:4.9,best:'Ana',off:'None booked',
  fb:[['Hernandez family · 2019 job','“Carlos treated our home like his own.”','2019'],['Dana R. · PM note','No callbacks on his last 6 jobs.','Oct 2026']],past:[['Alvarez interior','Oct 2026','6% under hours'],['Hernandez interior','2019','On budget']]},
 Ana:{role:'Painter, sprayer',yrs:8,langs:'English, Spanish',skills:['Spray finish','Cabinets','Color matching'],certs:['Lead-safe RRP (exp. Jan 2027)'],jobs:36,over:-4,cb:1,g:4.9,i:4.8,best:'Carlos',off:'None booked',
  fb:[['Interior designer · referral partner','“Ana’s cabinet finish is the best I’ve seen from a residential crew.”','Aug 2026']],past:[['Chen kitchen','Sep 2026','4% under hours']]},
 'Luis M.':{role:'Painter',yrs:5,langs:'Spanish',skills:['Drywall and plaster repair','Ceilings'],certs:[],jobs:33,over:-2,cb:1,g:4.8,i:4.5,best:'Carlos',off:'None booked',fb:[],past:[['Alvarez interior','Oct 2026','On budget']]},
 Marcus:{role:'Crew lead',yrs:9,langs:'English',skills:['Exterior','Boom lift','Elastomeric'],certs:['Lift operator'],jobs:41,over:6,cb:3,g:4.6,i:4.3,best:'Dev',off:'None booked',
  fb:[['Dana R. · PM note','Fast, but runs over on detailed trim. Pair with Dev.','Sep 2026']],past:[['Delgado exterior','Oct 2026','5% over hours']]},
 Dev:{role:'Painter',yrs:5,langs:'English',skills:['Trim detail','Pressure washing'],certs:[],jobs:39,over:2,cb:2,g:4.7,i:4.5,best:'Marcus',off:'None booked',fb:[],past:[['Lopez exterior','Sep 2026','On budget']]},
 Pete:{role:'Painter',yrs:2,langs:'English',skills:['Prep','Exterior'],certs:[],jobs:20,over:7,cb:4,g:null,i:4.0,best:'Dev',off:'None booked',fb:[],past:[]},
 Tony:{role:'Crew lead',yrs:7,langs:'English',skills:['Interior','Drywall repair'],certs:[],jobs:22,over:9,cb:6,g:4.3,i:3.9,best:'Ray',off:'None booked',
  fb:[['Dana R. · PM note','Two callbacks on cut lines this quarter. Coaching in progress.','Oct 2026']],past:[['Kim interior','Sep 2026','11% over hours']]},
 Ray:{role:'Painter',yrs:3,langs:'English',skills:['Interior'],certs:[],jobs:22,over:8,cb:5,g:null,i:4.0,best:'Tony',off:'None booked',fb:[],past:[]},
 Ramon:{role:'Owner, Ortiz Painting (sub)',yrs:6,langs:'English, Spanish',skills:['Exterior','Stucco','Boom lift'],certs:['Lead-safe RRP (exp. Jun 2027)','Licensed and insured'],jobs:15,over:0,cb:4,g:4.5,i:4.4,best:'Eli',off:'None booked',
  fb:[['Dana R. · PM note','Reliable on big exteriors, harder to reach by phone.','Aug 2026']],past:[['Brightwater HOA, phase 1','Oct 2026','On budget']]}};
const memberInfo=n=>MEM[n]||{role:'Painter',yrs:2,langs:'English, Spanish',skills:['Exterior','Prep'],certs:[],jobs:12,over:1,cb:3,g:null,i:4.2,best:'Ramon',off:'None booked',fb:[],past:[]};
const crewOf=n=>ORDER.find(cr=>CREWS[cr].members.some(m=>m[0]===n));
const ICON={cal:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
 people:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c1.8.8 3 2.6 3.5 5.2"/></svg>',
 clock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
 pay:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/></svg>',
 arrow:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h15M13 6l6 6-6 6"/></svg>',
 cam:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
 spark:'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/></svg>',
 target:'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>'};
/* ============ state ============ */
const ME='Mel (Scheduler)';
const S={view:'queue',job:'hernandez',preset:{},w:{},trust:{D:4,B:5,A:4,C:3,S:3},trustBar:4,rules:{lead:true,trust:true,weather:true,maxDrive:true,keep:true},
 place:{},drawer:false,msgTab:'crew',toast:null,modal:null,showOut:false,estOpen:true,vis:{},impOn:{returning:true,referrals:true,value:true,crm:true,trade:true,manual:true},
 shift:{},lock:5,hideOthers:false,onlyOk:false,calF:{show:'all',crews:{D:1,B:1,A:1,C:1,S:1},open:true},custom:[],impWhyOpen:false,
 log:[{t:'Oct 18, 2:31 PM',who:ME,type:'Decision',text:'Confirmed Crew D for Ruiz exterior, Mon Nov 2 to Wed Nov 4. Top-ranked crew, score 91.',job:'Ruiz exterior'},
  {t:'Oct 17, 9:02 AM',who:ME,type:'Setting',text:'Raised Crew B trust from 4 to 5. Reason: no callbacks on the last 6 jobs.'},
  {t:'Oct 16, 4:10 PM',who:'Dana R. (Estimator)',type:'Import',text:'Hernandez exterior imported from PaintScout #4127. Marked important: returning client, has referred 5 jobs.',job:'Hernandez exterior'}]};
const J=()=>JOBS[S.job];
const impWhy=j=>IMPT.filter(([k])=>S.impOn[k]).map(x=>x[2](j)).filter(Boolean);
const imp=j=>{const w=impWhy(j);return w.length?w.join(', '):null;};
function presetFor(id){return S.preset[id]||(imp(JOBS[id])?'White glove':'Balanced');}
function weights(id){return S.w[id]||PRESETS[presetFor(id)];}
const rankName=id=>S.w[id]?'Custom (unsaved)':presetFor(id);
const stamp=()=>new Date().toLocaleString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});
function log(type,text,job,detail){S.log.unshift({t:stamp(),who:ME,type,text,job:job||'',detail:detail||null});}
function snap(jid){const R=rank(jid);return{ranked:rankName(jid),ranking:R.map(r=>({crew:CREWS[r.crew].name,score:r.score,ok:r.ok,fails:r.fails}))};}
/* ============ engine ============ */
function bookings(exceptJob){const b=BOOKS.map(x=>{const k=S.shift[x.id]||0;return{...x,s:x.s+k,e:x.e+k,fixed:true,moved:k};});
 Object.entries(S.place).forEach(([jid,p])=>{if(jid===exceptJob)return;const sg=segs(p);sg.forEach(([a,z],i)=>b.push({crew:p.crew,name:JOBS[jid].title.split(' ')[0],what:p.status==='scheduled'?'Scheduled':'Draft',s:a,e:z,jid,prop:p.status!=='scheduled',seg:sg.length>1?i+1:0}));});return b;}
function segs(p){const pz=p.pauses||[];if(!pz.length)return[[p.s,p.e]];const out=[];let a=null;for(let d=p.s;d<=p.e+1;d++){const w=d<=p.e&&!pz.includes(d);if(w&&a===null)a=d;if(!w&&a!==null){out.push([a,d-1]);a=null;}}return out;}
const busy=(B,crew,d)=>B.some(x=>x.crew===crew&&d>=x.s&&d<=x.e);
function need(job,crew){return Math.max(1,Math.ceil(job.hours/(CREWS[crew].members.length*8)));}
function span(job,crew,start,B,pz){const n=need(job,crew);let c=0,d=start,pd=0;const holds=[],conf=[],pauses=[];
 while(c<n){if(d>23)break;
  if(pz&&c===pz.at&&pd<pz.len){pauses.push(d);pd++;d++;continue;}
  if(busy(B,crew,d))conf.push(d);
  if(job.ext&&S.rules.weather&&rain(d)&&!(c===0&&n>=3)){holds.push(d);}else c++;d++;}
 return{s:start,e:d-1,holds,conf,n,pauses};}
function setPlace(jid,crew,s,status,pz){const old=S.place[jid];if(pz===undefined)pz=old&&old.crew===crew?old.pz||null:null;
 if(pz){const n=need(JOBS[jid],crew);if(n<2)pz=null;else pz={at:Math.max(1,Math.min(n-1,pz.at)),len:pz.len};}
 const sp=span(JOBS[jid],crew,s,bookings(jid),pz);S.place[jid]={crew,s,e:sp.e,status:status||'draft',pz,pauses:sp.pauses};return S.place[jid];}
function earliestSlot(job,crew,B){for(let s=job.earliest;s<=19;s++){if(busy(B,crew,s))continue;const sp=span(job,crew,s,B);if(!sp.conf.length&&sp.e<=23)return sp;}return null;}
function hard(job,crew){const c=CREWS[crew],t=S.trust[crew],out=[];
 job.must.forEach(k=>{if(!c.skills.includes(k))out.push(`No ${SKILL[k].toLowerCase()} skills`);});
 if(S.rules.lead&&job.built<1978&&!c.certs.includes('leadsafe'))out.push(`No lead-safe certified painter (house built ${job.built})`);
 if(S.rules.trust&&imp(job)&&t<S.trustBar)out.push(`Trust ${t}, important clients need ${S.trustBar}+`);
 if(S.rules.maxDrive&&DRIVE[crew][job.area]>35)out.push(`${DRIVE[crew][job.area]} min away, limit is 35`);
 return out;}
function util(B,crew){let n=0;for(let d=0;d<20;d++)if(busy(B,crew,d))n++;return Math.round(n/20*100);}
function openDays(B=bookings()){let n=0;['D','B','A','C'].forEach(cr=>{for(let d=0;d<10;d++)if(!busy(B,cr,d))n++;});return n;}
function factors(job,crew,slot,B){const c=CREWS[crew];const f={};
 const cov=job.nice.length?job.nice.filter(k=>c.skills.includes(k)).length/job.nice.length:1;
 f.skill=Math.round(70+30*cov-((job.ext?'exterior':'interior')===c.spec?0:15));
 f.trust=S.trust[crew]*20;
 f.together=Math.min(100,Math.round(c.together/15*100));
 f.record=Math.max(0,Math.min(100,100-Math.max(0,c.over)*5-c.cb*6+(c.over<0?5:0)));
 f.distance=Math.max(0,100-DRIVE[crew][job.area]*2);
 const delay=slot?slot.s-job.earliest:10;f.timing=Math.max(0,100-delay*12);
 f.client=(job.lang==='spanish'?(c.spanish?70:30):70)+(job.past===crew?30:0);
 f.balance=100-util(B,crew);
 return f;}
function score(f,w){let t=0,s=0;for(const k in w){t+=w[k]*f[k];s+=w[k];}return s?Math.round(t/s):0;}
function rank(jid){const job=JOBS[jid];const B=bookings(jid);const w=weights(jid);
 return ORDER.map(cr=>{const fails=hard(job,cr);const slot=earliestSlot(job,cr,B);
  if(slot&&slot.e>job.deadline)fails.push(`Earliest finish ${sdate(slot.e)}, after the ${sdate(job.deadline)} deadline`);
  if(!slot)fails.push('No opening in the next 4 weeks');
  const f=factors(job,cr,slot,B);return{crew:cr,ok:!fails.length,fails,slot,f,score:score(f,w)};}).sort((a,b)=>(b.ok-a.ok)||(b.score-a.score));}
function whyLines(job,r){const c=CREWS[r.crew],w=weights(job.id),L=[];
 const add=(k,t)=>L.push([k,r.f[k]*(w[k]||0.1),t]);
 add('skill',job.ext&&c.spec==='exterior'?`Exterior specialists${job.nice.every(k=>c.skills.includes(k))&&job.nice.length?', handle stucco and washing themselves':''}`:c.spec==='interior'&&!job.ext?'Interior specialists':`Have the skills: ${job.must.map(k=>SKILL[k].toLowerCase()).join(' and ')}`);
 add('trust',`Your PM rates their trust ${S.trust[r.crew]} of 5`);
 add('together',`Have done ${c.together} jobs together`);
 add('record',`Usually finish ${c.over<=0?Math.abs(c.over)+'% under':c.over+'% over'} the estimated hours, ${c.cb}% callbacks`);
 add('distance',`${DRIVE[r.crew][job.area]} min drive from ${c.base}`);
 add('timing',r.slot&&r.slot.s===job.earliest?`Can start ${dlabel(r.slot.s)}, the first possible day`:`First opening is ${r.slot?dlabel(r.slot.s):'not in the next 4 weeks'}`);
 add('client',`${job.past===r.crew?'Painted this client’s home before. ':''}${job.lang==='spanish'&&c.spanish?'Lead speaks Spanish with the client':''}`.trim()||'No history with this client');
 const s=[...L].sort((a,b)=>b[1]-a[1]);const plus=s.slice(0,3).map(x=>x[2]).filter(Boolean);
 const minusK=FACT.map(x=>x[0]).filter(k=>(w[k]||0)>0).sort((a,b)=>r.f[a]-r.f[b])[0];
 const mt={skill:`Not specialists in this kind of job`,trust:`Lower trust score`,together:`Newer crew (${c.together} jobs together)`,record:`Usually run ${c.over}% over the hours`,distance:`${DRIVE[r.crew][job.area]} min drive`,timing:`Can’t start until ${r.slot?dlabel(r.slot.s):'later'}`,client:job.lang==='spanish'&&!c.spanish?'Nobody on the crew speaks Spanish':'No history with this client',balance:`Already ${100-r.f.balance}% booked over the next 4 weeks`}[minusK];
 return{plus,minus:r.f[minusK]<75?mt:null};}
const FDESC={skill:'Has every must-have skill. Extra points for nice-to-haves, minus 15 if this isn’t their specialty',trust:'Trust score your PM set (1 to 5), times 20',together:'Jobs finished together in the last 12 months. 15 or more scores 100',record:'Hours vs estimate and callback rate, last 12 months',distance:'100, minus 2 per minute of drive from their base',timing:'100 if they can start on the first possible day, minus 12 per day later',client:'Language the client asked for, and past work for this client',balance:'Share of the next 4 weeks they still have open'};
function ruleChecks(job,cr,r){const c=CREWS[cr];const L=[];
 job.must.forEach(k=>L.push([c.skills.includes(k),`Must have: ${SKILL[k]}`,c.skills.includes(k)?'In the crew’s skill list':'Not in the crew’s skill list']));
 if(job.built<1978)L.push([!S.rules.lead||c.certs.includes('leadsafe'),`Lead-safe painter (home built ${job.built})`,c.certs.includes('leadsafe')?`${c.members.find(m=>m[1])[0]} is certified`:'Nobody on the crew is certified']);
 if(imp(job))L.push([!S.rules.trust||S.trust[cr]>=S.trustBar,`Trust ${S.trustBar}+ for important clients`,`Trust is ${S.trust[cr]}`]);
 L.push([!S.rules.maxDrive||DRIVE[cr][job.area]<=35,'Within 35 min drive',`${DRIVE[cr][job.area]} min`]);
 L.push([!!r.slot&&r.slot.e<=job.deadline,`Done by ${dlabel(job.deadline)}`,r.slot?`Earliest finish ${dlabel(r.slot.e)}`:'No opening in 4 weeks']);
 return L;}
const csvq=v=>`"${String(v==null?'':v).replace(/"/g,'""')}"`;
function auditCSV(job){const R=rank(job.id);const w=weights(job.id);const sw=Object.values(w).reduce((a,b)=>a+b,0);
 const L=[['Crewboard score record'],['Job',job.title],['Client',job.client],['Run at',stamp()],['Run by',ME],['Ranking',rankName(job.id)],['Rules on',Object.entries(S.rules).filter(([,v])=>v).map(([k])=>k).join('; ')],[],
  ['Crew','Can take it','Rules failed',...FACT.map(([,l])=>l+' value'),...FACT.map(([,l])=>l+' weight'),...FACT.map(([,l])=>l+' points'),'Score']];
 R.forEach(r=>L.push([CREWS[r.crew].name,r.ok?'Yes':'No',r.fails.join('; '),...FACT.map(([k])=>r.f[k]),...FACT.map(([k])=>w[k]||0),...FACT.map(([k])=>sw?((w[k]||0)*r.f[k]/sw).toFixed(1):0),r.score]));
 L.push([],['How each factor is measured'],...FACT.map(([k,l])=>[l,FDESC[k]]));
 L.push([],['Inputs used: skills, certifications, trust score, past job results, drive time, availability, client requests. Not used: age, gender, race, ethnicity, national origin, religion, disability or any other personal trait. A person confirms every assignment.']);
 return L.map(l=>l.map(csvq).join(',')).join('\n');}
function logCSV(){return [['When','Who','Type','Job','What happened','Scores at the time'],...S.log.map(e=>[e.t,e.who,e.type,e.job,e.text,e.detail?e.detail.ranking.map(r=>`${r.crew} ${r.score}${r.ok?'':' (ruled out)'}`).join('; '):''])].map(l=>l.map(csvq).join(',')).join('\n');}
let DLCAP=null;(async()=>{try{if(window.claude&&window.claude.use)DLCAP=await window.claude.use('downloads');}catch(_){}})();
async function saveFile(name,text){if(DLCAP){try{await DLCAP.save({filename:name,data:text});toast('Saved '+name);return;}catch(e){if(e&&e.code==='declined')return;}}
 try{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:'text/csv'}));a.download=name;document.body.appendChild(a);a.click();a.remove();toast('Downloaded '+name);}catch(_){toast('Downloads aren’t available here');}}
/* ============ optimizer ============ */
function optimize(){const savedP=JSON.parse(JSON.stringify(S.place)),savedS={...S.shift};const before=openDays();
 const todo=QORDER.filter(j=>S.place[j]?.status!=='scheduled');todo.forEach(j=>delete S.place[j]);
 const opts=Object.fromEntries(todo.map(j=>[j,rank(j).filter(x=>x.ok).length]));
 todo.sort((a,b)=>(!!imp(JOBS[b])-!!imp(JOBS[a]))||(opts[a]-opts[b])||(JOBS[a].deadline-JOBS[b].deadline));
 const moves=[];
 todo.forEach(jid=>{const job=JOBS[jid];const R=rank(jid).filter(r=>r.ok);if(!R.length)return;let best=null;
  R.forEach(r=>{const B=bookings(jid);
   for(let s=job.earliest;s<=19;s++){if(busy(B,r.crew,s))continue;
    const sp=span(job,r.crew,s,B);
    if(!sp.conf.length&&sp.e<=job.deadline){const fit=(s>0&&busy(B,r.crew,s-1)?1:0)+(busy(B,r.crew,sp.e+1)?1:0);const v=fit*6-(s-job.earliest)*2+r.score/10;
     if(!best||v>best.v)best={v,jid,crew:r.crew,s,e:sp.e,score:r.score,top:R[0].crew,topScore:R[0].score,shift:null};continue;}
    if(!(s===job.earliest||busy(B,r.crew,s-1)))continue;
    let g=s;while(g+1<=19&&!busy(B,r.crew,g+1))g++;
    const x=B.find(y=>y.crew===r.crew&&y.s===g+1&&y.fixed);if(!x||x.s<S.lock||S.shift[x.id])continue;
    for(let k=1;k<=2;k++){S.shift[x.id]=k;const B2=bookings(jid);const sp2=span(job,r.crew,s,B2);
     const Bx=B.filter(y=>y.id!==x.id);let clash=x.e+k>19;for(let d=x.e+1;d<=x.e+k;d++)if(busy(Bx,r.crew,d))clash=true;
     delete S.shift[x.id];
     if(!sp2.conf.length&&sp2.e<=job.deadline&&!clash){const v=12-(s-job.earliest)*2+r.score/10-4;
      if(!best||v>best.v)best={v,jid,crew:r.crew,s,e:sp2.e,score:r.score,top:R[0].crew,topScore:R[0].score,shift:{id:x.id,k,name:`${x.name} ${x.what.toLowerCase()}`,from:x.s}};break;}}}});
  if(best){if(best.shift)S.shift[best.shift.id]=best.shift.k;S.place[jid]={crew:best.crew,s:best.s,e:best.e,status:'draft',pz:null,pauses:[]};
   let fill=0;for(let d=best.s;d<=best.e;d++)if(d<10&&best.crew!=='S')fill++;best.fill=fill;moves.push(best);}});
 const after=openDays();
 for(const k in S.place)delete S.place[k];Object.assign(S.place,savedP);for(const k in S.shift)delete S.shift[k];Object.assign(S.shift,savedS);
 return{type:'opt',moves,before,after,sel:moves.map(()=>true)};}
function optAfter(m){const savedP=JSON.parse(JSON.stringify(S.place)),savedS={...S.shift};applyMoves(m,false);const a=openDays();
 for(const k in S.place)delete S.place[k];Object.assign(S.place,savedP);for(const k in S.shift)delete S.shift[k];Object.assign(S.shift,savedS);return a;}
function applyMoves(m,commit){m.moves.forEach((mv,i)=>{if(!m.sel[i])return;if(mv.shift){S.shift[mv.shift.id]=(S.shift[mv.shift.id]||0)+mv.shift.k;}});
 m.moves.forEach((mv,i)=>{if(!m.sel[i])return;S.place[mv.jid]={crew:mv.crew,s:mv.s,e:mv.e,status:'draft',pz:null,pauses:[]};
  if(commit){if(mv.shift)log('Optimizer',`Moved ${mv.shift.name} (${CREWS[mv.crew].name}) ${mv.shift.k} day${mv.shift.k>1?'s':''} later to ${dlabel(mv.shift.from+mv.shift.k)} to fit ${JOBS[mv.jid].title}. Client text queued.`,mv.shift.name);
   log('Optimizer',`Placed ${JOBS[mv.jid].title} on ${CREWS[mv.crew].name} as a draft, ${dlabel(mv.s)} to ${dlabel(mv.e)}. ${mv.crew===mv.top?`Top-ranked crew, score ${mv.score}.`:`Not the top-ranked crew (${mv.score} vs ${mv.topScore}), picked to fill open days.`} Approved by ${ME}.`,JOBS[mv.jid].title,snap(mv.jid));}});}
/* ============ helpers ============ */
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
const money=v=>'$'+Math.round(v).toLocaleString();
const initials=n=>n.split(/[ .]/).filter(Boolean).map(x=>x[0]).join('').slice(0,2);
const plural=(n,w)=>`${n} ${w}${n===1?'':'s'}`;
function ringSvg(v,color){const r=32,c=2*Math.PI*r;return `<svg viewBox="0 0 76 76" aria-hidden="true"><circle cx="38" cy="38" r="${r}" fill="none" stroke="var(--sunk)" stroke-width="8"/><circle cx="38" cy="38" r="${r}" fill="none" stroke="${color}" stroke-width="8" stroke-linecap="round" stroke-dasharray="${c*v/100} ${c}"/></svg>`;}
function wxIcon(t){if(t==='sun')return '<svg viewBox="0 0 24 24" fill="none" stroke="var(--warn)" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"/></svg>';
 if(t==='cloud')return '<svg viewBox="0 0 24 24" fill="none" stroke="var(--soft)" stroke-width="2"><path d="M7 18h10a4 4 0 0 0 0-8 6 6 0 0 0-11.5 1.5A3.3 3.3 0 0 0 7 18z"/></svg>';
 return '<svg viewBox="0 0 24 24" fill="none" stroke="var(--tape)" stroke-width="2"><path d="M7 14h10a4 4 0 0 0 0-8 6 6 0 0 0-11.5 1.5A3.3 3.3 0 0 0 7 14z"/><path d="M8 18l-1 3M12 18l-1 3M16 18l-1 3"/></svg>';}
const tdots=n=>`<span class="tdots" aria-label="Trust ${n} of 5">${[1,2,3,4,5].map(i=>`<i class="${i<=n?'on':''}"></i>`).join('')}</span>`;
const avs=cr=>`<div class="members">${CREWS[cr].members.map(([n,cert])=>`<button class="av ${cert?'cert':''}" style="--c:${CREWS[cr].c}" data-act="member" data-v="${esc(n)}" title="${esc(n)}${cert?' · lead-safe certified':''}. See profile" aria-label="${esc(n)} profile">${initials(n)}</button>`).join('')}</div>`;
const fbBtn=(key,label='Feedback')=>`<button class="fb" data-fb="${key}" title="Leave feedback here">\u{1F4AC} ${label}</button>`;
function toast(t){S.toast=t;drawLayer();clearTimeout(toast.h);toast.h=setTimeout(()=>{S.toast=null;drawLayer();},3200);}
function lum(c){if(!/^#/.test(c))return .6;const n=parseInt(c.slice(1),16);const r=(n>>16&255)/255,g=(n>>8&255)/255,b=(n&255)/255;return .2126*r+.7152*g+.0722*b;}
const pos=(s,e)=>`left:calc(var(--lw) + var(--cw) * ${s} + 2px);width:calc(var(--cw) * ${e-s+1} - 4px)`;
function ghead(){return `<div class="grow-h"><div class="lab" style="padding:6px 12px;justify-content:flex-end"><span class="tiny">Crew</span></div>${DAYS.map((d,i)=>`<div class="gh ${d.dow==='Mon'&&i?'wk':''} ${i===0?'gtoday':''}">${d.dow.slice(0,2)}<b class="num">${d.n}</b></div>`).join('')}</div>
  <div class="wx"><div class="lab" style="padding:4px 12px"><span class="tiny">Forecast</span></div>${WX.map(([pp,t],i)=>`<div class="${rain(i)?'rain':''}" title="${t==='rain'?'Rain':t==='cloud'?'Cloudy':'Sunny'} ${pp}%">${wxIcon(t)}<span class="num">${pp}%</span></div>`).join('')}</div>`;}
function bkHtml(x,c){const n=x.e-x.s+1;const id=x.jid||x.id;const label=x.jid?(x.seg?`Visit ${x.seg} · `:'')+(x.prop?'Draft':'Confirmed'):`${plural(n,'day')}${x.moved?' · moved':''}`;
 return `<button class="bk ${x.prop?'prop':''}" data-act="hub" data-v="${id}" title="${esc(x.name)}. Open project" style="--c:${c.c};${pos(x.s,Math.min(19,x.e))}"><b>${esc(x.name)}</b><span>${label}</span></button>`;}

/* ============ views ============ */
const V={};
V.queue=()=>{const waiting=QORDER.filter(j=>!S.place[j]||S.place[j].status!=='scheduled');const B=bookings();
 const util4=Math.round(ORDER.slice(0,4).reduce((a,c)=>a+util(B,c),0)/4);const $w=waiting.reduce((a,j)=>a+JOBS[j].value,0);const od=openDays(B);
 return `<div class="qhead"><div class="grow"><div class="eyebrow">Sold, deposit in</div><h1>Ready to schedule</h1></div>
  <button class="btn line" data-go="cal">Open the calendar</button><button class="btn line" data-act="planall" ${waiting.length?'':'disabled'}>Plan all ${waiting.length} jobs</button><button class="btn tape" data-go="add">+ Add a job</button>${fbBtn('queue')}</div>
 <div class="kpis"><div class="card kpi"><span>Jobs waiting for a crew</span><b class="num">${waiting.length}</b></div>
  <div class="card kpi"><span>Sold work not yet scheduled</span><b class="num">${money($w)}</b></div>
  <div class="card kpi"><span>Open crew days, next 2 weeks</span><b class="num">${od}</b><span>About ${money(od*IDLE_COST)} not billed</span></div>
  <div class="card kpi"><span>In-house crews booked, next 4 weeks</span><b class="num">${util4}%</b></div></div>
 <div class="jobs">${QORDER.map(jid=>{const j=JOBS[jid];const p=S.place[jid];const r=rank(jid);const top=r.find(x=>x.ok);const im=imp(j);
  const flags=[j.ext?'<span class="chip tape">Exterior · weather</span>':'<span class="chip">Interior</span>',j.built<1978?'<span class="chip warn">Lead-safe</span>':'',im?`<span class="chip bad" title="${esc(im)}">Important client</span>`:'',j.must.includes('cabinets')?'<span class="chip">Cure time</span>':''].join('');
  const gap=top&&top.slot&&top.slot.s===top.slot.e&&busy(bookings(jid),top.crew,top.slot.s-1)&&busy(bookings(jid),top.crew,top.slot.s+1);
  const pc=p?p.crew:top?top.crew:null;
  const colors=j.colorsOk===true?'<span class="lk good">✓ Colors confirmed</span>':j.colorsOk==='sent'?'<span class="lk warn">Color form sent, waiting on client</span>':`<button class="lk warn" data-act="colors" data-v="${jid}">! Colors not confirmed · text client</button>`;
  return `<article class="card job"><div class="chipband">${j.colors.map(([n,c])=>`<div style="background:${c}"><span style="color:${lum(c)>0.55?'#1A1D21':'#fff'}">${esc(n)}</span></div>`).join('')}</div>
  <div class="bd"><div class="row" style="align-items:flex-start"><div class="grow"><h3>${esc(j.title)}</h3><div class="small muted">${esc(j.client)} · ${AREA[j.area]}</div></div>${j.colorsOk===true?'':'<span class="chip warn">Not ready</span>'}</div>
   <div class="chips">${flags}</div>
   <div class="facts f4"><div><b class="num">${money(j.value)}</b><span>Sold</span></div><div><b class="num">${j.hours} hrs</b><span>Estimated work</span></div>
    <div><b class="num">${pc?'~'+money(crewPay(j,pc)):'n/a'}</b><span>Suggested crew pay${pc?` (${CREWS[pc].name})`:''}</span></div><div><b>${dlabel(j.deadline)}</b><span>Finish by</span></div></div>
   <div class="links">${colors}<button class="lk" data-act="photos" data-v="${jid}">${ICON.cam} ${j.photos||0} photos</button></div>
   <div class="rec">${p?`<span class="dot" style="--c:${CREWS[p.crew].c}"></span><span class="grow small"><b>${CREWS[p.crew].name}</b> · ${sdate(p.s)} to ${sdate(p.e)}<br><span class="tiny">${p.status==='scheduled'?'Scheduled, everyone notified':'Draft, not confirmed'}</span></span>
     <button class="btn sm ${p.status==='scheduled'?'line':'tape'}" data-act="board" data-v="${jid}">${p.status==='scheduled'?'View':'Review'}</button>`:
    top?`<span class="dot" style="--c:${CREWS[top.crew].c}"></span><span class="grow small"><b>${CREWS[top.crew].name}</b> fits best · ${top.score}<br><span class="tiny">${gap?`Fills an empty ${DAYS[top.slot.s].dow} in their week`:`Can start ${dlabel(top.slot.s)}`}</span></span>
     ${gap?`<button class="btn sm line" data-act="quick" data-v="${jid}">Book it</button>`:''}<button class="btn sm tape" data-act="match" data-v="${jid}">Find a crew</button>`:'<span class="grow small muted">No crew fits. Check the rules.</span>'}</div></div></article>`;}).join('')}</div>`;};

const REQ_LABEL=job=>{const L=[];
 job.must.forEach(k=>L.push(['must',SKILL[k],k==='highreach'?'reach':k==='exterior'?'ext':k==='interior'?'int':k==='cabinets'?'cab':k==='sprayer'?'spray':k,'Every crew needs this']));
 if(job.built<1978)L.push(['must','Lead-safe certified painter on site','lead',`Federal RRP rule, home built ${job.built}`]);
 if(imp(job))L.push(['must',`Crew trust ${S.trustBar} or higher`,'vip','Important client']);
 if(job.ext)L.push(['must','Body coats only on dry days','ext','Rain over 50% turns a day into a rain day']);
 if(job.hoa||job.writeup.includes('[hoa|'))L.push(['must','Weekdays 8am to 5pm','hoa','HOA rule']);
 L.push(['must',`Finished by ${dlabel(job.deadline)}`,'due','From the client']);
 job.nice.forEach(k=>L.push(['nice',SKILL[k],k==='finework'?'fine':k,'Ranks higher, not required']));
 if(job.lang==='spanish')L.push(['nice','Spanish-speaking crew lead','lang','Client preference']);
 if(job.past)L.push(['nice','Crew that has worked for them before','vip','Client history']);
 return L;};
function impBox(job){const fired=Object.fromEntries(IMPT.map(([k,,f])=>[k,f(job)]));
 return `<div class="card impbox"><div class="row"><b class="grow">Why this client is marked important</b><button class="btn sm line" data-act="impwhy">Close</button></div>
  <p class="tiny" style="margin:4px 0 8px">A client is important when any trigger below is on and true. Important clients only get crews with trust ${S.trustBar}+ and rank for White glove by default. Turn triggers on or off for your company.</p>
  ${IMPT.map(([k,l])=>`<div class="hr"><span class="check ${fired[k]&&S.impOn[k]?'ok':''}" style="padding:0"><i>${fired[k]?'✓':''}</i></span><span class="grow">${l}${fired[k]?`<span class="tiny" style="display:block">${esc(fired[k])}</span>`:''}</span><button class="tog ${S.impOn[k]?'on':''}" data-act="impt" data-v="${k}" role="switch" aria-checked="${S.impOn[k]}" aria-label="${l}"><i></i></button></div>`).join('')}</div>`;}
function crewCard(job,r,i){const c=CREWS[r.crew];const wl=whyLines(job,r);const col=i===0?'var(--tape)':c.c;const sl=r.slot;const w=weights(job.id);const left=job.deadline-sl.e;
 return `<article class="card crew ${i===0?'best':''}"><div class="ring">${ringSvg(r.score,col)}<b class="num">${r.score}</b><small>match</small></div>
  <div style="min-width:0"><div class="row" style="flex-wrap:wrap"><h3 style="font-size:19px">${c.name}</h3>${i===0?'<span class="chip tape">Best fit</span>':''}<span class="chip">${c.type}</span><span class="grow"></span>${avs(r.crew)}</div>
   <div class="lines">
    <div class="ln">${ICON.cal}<span><b>${dlabel(sl.s)} to ${dlabel(sl.e)}</b></span></div>
    <div class="ln">${ICON.people}<span>${c.members.length} painters, led by ${c.lead}</span></div>
    <div class="ln">${ICON.clock}<span>${plural(sl.n,'day')} on site${sl.holds.length?`, plus ${plural(sl.holds.length,'rain day')}`:''} <small>· ${left>0?`done ${plural(left,'day')} before the deadline`:'done on the deadline'}</small></span></div>
    <div class="ln">${ICON.pay}<span>About ${money(crewPay(job,r.crew))} crew pay <small>· ${r.crew==='S'?'55% of the sold price':`${job.hours} hrs at $${RATE[r.crew]}/hr`}</small></span></div>
   </div>
   <ul class="why">${wl.plus.map(x=>`<li>${esc(x)}</li>`).join('')}${wl.minus?`<li class="minus">${esc(wl.minus)}</li>`:''}</ul>
   <div class="factors">${FACT.map(([k,l])=>`<div class="f ${(w[k]||0)===0?'w0':''}"><span>${l}</span><span class="bar"><i style="width:${r.f[k]}%;opacity:${0.35+0.65*Math.min(1,(w[k]||0)/4)}"></i></span><span class="v num">${r.f[k]}</span></div>`).join('')}</div>
   <div class="row" style="margin-top:14px;flex-wrap:wrap"><button class="btn sm ${i===0?'tape':'line'}" data-act="pick" data-v="${r.crew}">Schedule ${c.name}</button><button class="btn sm line" data-act="audit" data-v="${r.crew}">How this score was worked out</button></div></div></article>`;}
function closeList(job){const P={P:[300,160],CG:[265,62],K:[105,150],SM:[190,128],Westchester:[130,62],'Coral Gables':[265,62],Kendall:[105,150],'South Miami':[190,128],Homestead:[70,208]};
 const jp=P[job.area];const R=rank(job.id);const max=Math.max(...ORDER.map(cr=>DRIVE[cr][job.area]));
 const dirs=['east','northeast','north','northwest','west','southwest','south','southeast'];
 return ORDER.map(cr=>({cr,m:DRIVE[cr][job.area]})).sort((a,b)=>a.m-b.m).map(({cr,m})=>{const c=CREWS[cr];const p=P[c.base];const dx=jp[0]-p[0],dy=p[1]-jp[1];
  const same=Math.abs(dx)<4&&Math.abs(dy)<4;const deg=Math.atan2(dy,dx)*180/Math.PI;const word=dirs[((Math.round(deg/45)%8)+8)%8];const ok=R.find(x=>x.crew===cr).ok;
  return `<div class="near ${ok?'':'off'}"><span class="dot" style="--c:${c.c}"></span><div class="grow"><b>${c.name}</b>${ok?'':' <span class="tiny">can’t take it</span>'}<div class="tiny">${same?`Based in ${c.base}, same area`:`From ${c.base}, heading ${word}`}</div><div class="nbar"><i style="width:${Math.max(6,m/max*100)}%;background:${c.c}"></i></div></div><span class="arr" aria-hidden="true" style="${same?'visibility:hidden':`transform:rotate(${-deg}deg)`}">${ICON.arrow}</span><b class="num" style="min-width:52px;text-align:right">${m} min</b></div>`;}).join('');}
V.match=()=>{const job=J();const R=rank(job.id);const ok=R.filter(r=>r.ok),out=R.filter(r=>!r.ok);const pr=rankName(job.id);
 const vis=S.vis[job.id]||(S.vis[job.id]={});const iw=impWhy(job);
 const src=job.src?esc(job.src):'From the estimate · PaintScout #4127 · imported Oct 16';
 const wu=job.writeup.replace(/\[(\w+)\|([^\]]+)\]/g,(m,k,t)=>`<mark data-k="${k}">${t}</mark>`);
 const left=`<div class="lcol">
  <section class="card pad"><div class="row" style="margin-bottom:8px;align-items:flex-start"><div class="src grow" style="margin:0">${src}</div><button class="btn sm line" data-act="est" aria-expanded="true">Hide estimate</button></div><h3 style="font-size:16px;margin-bottom:8px">Project write-up</h3><p class="writeup" style="margin:0${job.src?';white-space:pre-line':''}">${wu}</p></section>
  <section class="card pad"><div class="row"><h3 style="font-size:16px" class="grow">What this job needs</h3><button class="btn sm line" data-act="editjob">Edit</button></div>
   <div class="reqs">${REQ_LABEL(job).map(([t,l,k,s])=>`<div class="req ${t}" data-k="${k}"><span class="ic">${t==='must'?'!':'+'}</span><span class="grow">${l}<small>${s}</small></span><span class="tiny">${t==='must'?'Must':'Nice'}</span></div>`).join('')}</div></section>
  <section class="card pad"><div class="row" style="margin-bottom:4px"><h3 style="font-size:16px" class="grow">Who’s close</h3><span class="tiny">Drive to the job</span></div>${closeList(job)}</section></div>`;
 const strip=`<section class="card pad estrip"><div class="row" style="flex-wrap:wrap;align-items:flex-start"><div class="grow"><div class="src" style="margin:0 0 6px">${src}</div><div class="chips">${REQ_LABEL(job).filter(x=>x[0]==='must').map(x=>`<span class="chip">${x[1]}</span>`).join('')}</div></div><button class="btn sm line" data-act="editjob">Edit</button><button class="btn sm line" data-act="est" aria-expanded="false">Show estimate</button></div></section>`;
 const right=`<div>
  <div class="prio"><div class="prio-t"><span class="prio-ic" aria-hidden="true">${ICON.target}</span><div><div class="eyebrow">Ranking crews by</div><h2>What matters most</h2></div></div>
   <div class="prio-opts">${Object.keys(PRESETS).map(p=>`<button class="pill ${!S.w[job.id]&&pr===p?'on':''}" data-act="preset" data-v="${esc(p)}" aria-pressed="${!S.w[job.id]&&pr===p}">${esc(p)}${S.custom.includes(p)?' <small>saved</small>':''}</button>`).join('')}${S.w[job.id]?'<span class="pill on">Custom, not saved</span>':''}<button class="btn sm line" data-act="drawer">${S.drawer?'Hide rules and weights':'Rules and weights'}</button></div>
   <p class="tiny" style="margin:8px 0 0">${S.w[job.id]?'Your own weights. Save them as a new priority to reuse.':esc(PDESC[pr]||'Your saved priority.')}</p></div>
  ${S.drawer?drawer(job):''}
  <div class="sec-h"><h2>${ok.length?'Best crew for this job':'No crew can take it yet'}</h2><span class="tiny">${ok.length} of ${R.length} crews can take it</span></div>
  ${ok.length?crewCard(job,ok[0],0):'<div class="card pad" style="margin-bottom:12px">No crew passes the rules. Loosen a rule or raise a trust score.</div>'}
  ${ok.length>1?`<section class="card pad others"><div class="row" style="flex-wrap:wrap"><b class="grow">Compare with ${plural(ok.length-1,'other crew')}</b>${ok.slice(1).map(r=>`<button class="pill ${vis[r.crew]?'on':''}" data-act="vis" data-v="${r.crew}" aria-pressed="${!!vis[r.crew]}"><span class="dot" style="--c:${CREWS[r.crew].c}"></span>${CREWS[r.crew].name} · ${r.score}</button>`).join('')}<button class="btn sm line" data-act="visall">${ok.slice(1).every(r=>vis[r.crew])?'Hide all':'Show all'}</button></div></section>`:''}
  ${ok.slice(1).filter(r=>vis[r.crew]).map(r=>crewCard(job,r,ok.indexOf(r))).join('')}
  ${out.length?`<div class="card" style="margin-top:6px"><button class="out" style="width:100%;border:0;background:none;text-align:left" data-act="toggleout" aria-expanded="${S.showOut}"><b class="grow">${out.length} can’t take it</b><span class="tiny">${S.showOut?'Hide':'Show why'}</span></button>
   ${S.showOut?out.map(r=>`<div class="out"><span class="dot" style="--c:${CREWS[r.crew].c};margin-top:5px"></span><div class="grow"><b>${CREWS[r.crew].name}</b> <span class="tiny">${CREWS[r.crew].type}</span><div class="rules">${r.fails.map(f=>`<span class="rule x">${esc(f)}</span>`).join('')}</div></div>
    ${r.fails.some(f=>f.startsWith('Trust'))?`<button class="btn sm line" data-act="trustup" data-v="${r.crew}">Raise trust to ${S.trustBar}</button>`:''}</div>`).join(''):''}</div>`:''}</div>`;
 return `<button class="back" data-go="queue">← Ready to schedule</button>
 <div class="mhead"><div class="grow"><div class="eyebrow">Find a crew</div><h1>${esc(job.title)}</h1>
  <div class="chips" style="margin-top:8px"><span class="chip">${AREA[job.area]}</span><span class="chip num">${money(job.value)}</span><span class="chip num">${job.hours} hours of work</span><span class="chip">Finish by ${dlabel(job.deadline)}</span>${iw.length?`<button class="chip bad" style="border:0" data-act="impwhy" aria-expanded="${S.impWhyOpen}">Important client · why?</button>`:''}</div>
  ${S.impWhyOpen&&iw.length?impBox(job):''}</div>${fbBtn('match')}</div>
 ${S.estOpen?`<div class="split">${left}${right}</div>`:strip+right}`;};
function drawer(job){const w=weights(job.id);
 return `<section class="card drawer"><div class="row" style="margin-bottom:8px"><h3 style="font-size:16px" class="grow">How crews are ranked</h3><button class="btn sm line" data-act="resetw">Reset</button></div>
 <div class="tiny" style="margin-bottom:8px">Rules remove crews. Weights rank the rest.</div>
 <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:18px">
 <div><div class="eyebrow" style="margin-bottom:4px">Rules</div>
  ${[['lead','Lead-safe painter for pre-1978 homes'],['trust','Trust bar for important clients'],['weather','Hold exterior coats on rain days'],['maxDrive','No crew more than 35 min away']].map(([k,l])=>`<div class="hr"><span class="grow">${l}</span>${k==='trust'?`<span class="stepper"><button data-act="bar" data-v="-1" aria-label="Lower">−</button><b class="num">${S.trustBar}</b><button data-act="bar" data-v="1" aria-label="Raise">+</button></span>`:''}<button class="tog ${S.rules[k]?'on':''}" data-act="rule" data-v="${k}" role="switch" aria-checked="${S.rules[k]}" aria-label="${l}"><i></i></button></div>`).join('')}
  <div class="eyebrow" style="margin:14px 0 4px">What makes a client important</div>
  ${IMPT.map(([k,l])=>`<div class="hr"><span class="grow">${l}</span><button class="tog ${S.impOn[k]?'on':''}" data-act="impt" data-v="${k}" role="switch" aria-checked="${S.impOn[k]}" aria-label="${l}"><i></i></button></div>`).join('')}</div>
 <div><div class="eyebrow" style="margin-bottom:4px">Weights</div>
  ${FACT.map(([k,l])=>`<label class="wrow"><span>${l}</span><input type="range" min="0" max="5" step="1" value="${w[k]||0}" data-w="${k}" id="w-${k}"><b class="num">${w[k]||0}</b></label>`).join('')}
  ${S.w[job.id]?`<div class="savep"><label class="tiny" for="pname">Save these weights as a new priority</label><div class="row" style="margin-top:4px"><input class="in" id="pname" placeholder="e.g. Rainy season, HOA jobs" maxlength="28"><button class="btn sm tape" data-act="savepreset">Save</button></div></div>`:'<p class="tiny" style="margin:10px 0 0">Move a slider to make your own mix, then save it with a name.</p>'}</div></div></section>`;}

/* ---------- board: scheduling one job ---------- */
V.board=()=>{const job=J();const B=bookings(job.id);const p=S.place[job.id];const R=rank(job.id);
 const eligible=new Set(R.filter(r=>r.ok).map(r=>r.crew));
 const rowsFor=ORDER.filter(cr=>!S.onlyOk||eligible.has(cr)||(p&&p.crew===cr));
 const rows=rowsFor.map(cr=>{const c=CREWS[cr];const ok=eligible.has(cr);const rr=R.find(x=>x.crew===cr);
  const bars=S.hideOthers?'':B.filter(x=>x.crew===cr).map(x=>bkHtml(x,c)).join('');
  const ghost=!p&&ok&&rr.slot?`<button class="ghost" data-act="place" data-v="${cr}" style="${pos(rr.slot.s,Math.min(19,rr.slot.e))}" aria-label="Place on ${c.name}, match ${rr.score}">${rr.score} · ${rr===R[0]?'Best fit':'Option'}</button>`:'';
  let nb='';if(p&&p.crew===cr){const sp=span(job,cr,p.s,B,p.pz);const days=[];for(let d=sp.s;d<=Math.min(19,sp.e);d++)days.push(d);let wi=0;
   nb=`<div class="nb ${(sp.conf.length||!ok||sp.e>job.deadline)?'badpos':''}" id="nb" style="${pos(sp.s,Math.min(19,sp.e))}" role="button" tabindex="0" aria-label="${esc(job.title)}, drag to move"><div class="nbt">${esc(job.title)}</div><div class="nbd">${days.map(d=>{const h=sp.holds.includes(d),pz=sp.pauses.includes(d);return `<div class="ph ${h?'hold':''} ${pz?'pz':''}">${pz?'Pause':h?'Rain':'Day '+(++wi)}</div>`;}).join('')}</div></div>`;}
  return `<div class="crow ${!ok?'inel':''}" data-crew="${cr}"><div class="lab" style="position:absolute;left:0;top:0;bottom:0;width:var(--lw)"><b><span class="dot" style="--c:${c.c}"></span>${c.name}</b><span>${c.members.length} painters · ${tdots(S.trust[cr])}</span><span class="num">${util(B,cr)}% booked${!ok?' · <b style="color:var(--bad);font-size:11px;display:inline">can’t take it</b>':''}</span></div>
   <div class="cells">${DAYS.map((d,i)=>`<div class="${d.dow==='Mon'&&i?'wk':''} ${rain(i)?'rain':''}"></div>`).join('')}</div>${bars}${ghost}${nb}</div>`;}).join('');
 const cap=`<div class="cap"><div class="lab" style="padding:4px 12px"><span class="tiny">Crews free</span></div>${DAYS.map((d,i)=>{const free=ORDER.filter(cr=>!busy(bookings(),cr,i)).length;return `<div style="background:color-mix(in srgb,var(--good) ${free*16}%,transparent)" class="num">${free}</div>`;}).join('')}</div>`;
 const dl=job.deadline<20?`<div class="dl" style="left:calc(var(--lw) + var(--cw) * ${job.deadline+1})"><span>Due ${sdate(job.deadline)}</span></div>`:'';
 return `<button class="back" data-go="${p&&p.status==='scheduled'?'queue':'match'}">← ${p&&p.status==='scheduled'?'Ready to schedule':'Crew ranking'}</button>
 <div class="mhead"><div class="grow"><div class="eyebrow">Scheduling</div><h1>${esc(job.title)}</h1><div class="small muted" style="margin-top:4px">${esc(job.client)} · ${AREA[job.area]} · ${job.hours} hours of work · finish by ${dlabel(job.deadline)}</div></div>
  <div class="seg" role="group" aria-label="Job">${QORDER.map(j=>`<button aria-pressed="${j===S.job}" data-act="setjob" data-v="${j}">${esc(JOBS[j].title.split(' ')[0])}${S.place[j]?.status==='scheduled'?' ✓':''}</button>`).join('')}</div>${fbBtn('board')}</div>
 <div class="banner">${p?`<b>${CREWS[p.crew].name}, ${dlabel(p.s)} to ${dlabel(p.e)}.</b><span class="muted small grow">Drag the blue bar to another day or crew. Checks update as you move it.</span>`:
  `<b>Pick a slot.</b><span class="muted small grow">Dashed outlines are each crew’s earliest opening, with its match score. Striped rows can’t take this job.</span>`}
  <span class="filt"><button class="pill ${S.hideOthers?'on':''}" data-act="hideothers" aria-pressed="${S.hideOthers}">Hide other jobs</button><button class="pill ${S.onlyOk?'on':''}" data-act="onlyok" aria-pressed="${S.onlyOk}">Only crews that can take it</button></span></div>
 <div class="boardwrap"><div><div class="card gscroll"><div class="gantt" id="gantt">${ghead()}${rows}${cap}${dl}</div></div>
  <div class="legend"><span><i style="background:var(--tape)"></i>This job</span><span><i style="border:2px dashed var(--tape)"></i>Suggested slot</span><span><i style="background:repeating-linear-gradient(135deg,var(--tape) 0 3px,transparent 3px 6px)"></i>Rain day</span><span><i style="background:var(--sunk);border:1px dashed var(--faint)"></i>Draft, not confirmed</span><span><i style="background:color-mix(in srgb,var(--good) 50%,transparent)"></i>More crews free</span></div></div>
  ${planPanel(job,B,eligible)}</div>`;};
function planPanel(job,B,eligible){const p=S.place[job.id];
 if(!p) return `<aside class="card plan"><h3 style="font-size:17px">Plan</h3><p class="small muted">Pick a dashed slot to see the checks, the hours and the messages that go out.</p>
  <div class="eyebrow" style="margin-top:14px">Best fit</div>${(()=>{const r=rank(job.id).find(x=>x.ok);return r?`<div class="row" style="margin-top:6px"><span class="dot" style="--c:${CREWS[r.crew].c}"></span><b class="grow">${CREWS[r.crew].name}</b><span class="chip tape num">${r.score}</span></div><div class="small muted" style="margin-top:4px">${dlabel(r.slot.s)} to ${dlabel(r.slot.e)}</div><button class="btn tape sm" style="margin-top:10px" data-act="place" data-v="${r.crew}">Use this slot</button>`:'<div class="small">No crew fits.</div>';})()}</aside>`;
 const c=CREWS[p.crew];const sp=span(job,p.crew,p.s,B,p.pz);const ok=eligible.has(p.crew);const fails=hard(job,p.crew);const sched=p.status==='scheduled';
 const planned=sp.n*c.members.length*8;const hoa=job.hoa||job.writeup.includes('[hoa|');
 const checks=[];
 if(ok)checks.push(['ok',`${c.name} passes every rule`]);else fails.forEach(f=>checks.push(['no',f]));
 if(sp.conf.length)checks.push(['no',`Overlaps ${B.find(x=>x.crew===p.crew&&sp.conf.some(d=>d>=x.s&&d<=x.e))?.name||'another job'} on ${sp.conf.map(sdate).join(', ')}`]);
 if(sp.e>job.deadline)checks.push(['no',`Finishes ${sdate(sp.e)}, after the ${sdate(job.deadline)} deadline`]);else checks.push(['ok',`Finishes ${dlabel(sp.e)}, ${plural(job.deadline-sp.e,'day')} to spare`]);
 sp.holds.forEach(d=>checks.push(['wn',`${dlabel(d)}: ${WX[d][0]}% chance of rain. Rain day, crew does covered prep and the front door`]));
 if(job.ext&&!sp.holds.length&&sp.s<20&&rain(sp.s))checks.push(['wn',`Day 1 looks rainy. Fine for pressure washing`]);
 if(p.pz)checks.push(['wn',`Split into two visits with a ${plural(p.pz.len,'day')} pause. Clients usually prefer one stretch`]);
 if(job.colorsOk!==true)checks.push(['wn',job.colorsOk==='sent'?'Colors not confirmed yet. The color form is with the client':'Colors not confirmed. Text the client before you confirm']);
 if(job.built<1978&&c.certs.includes('leadsafe'))checks.push(['ok',`Lead-safe: ${c.members.find(m=>m[1])[0]} is certified and on site`]);
 checks.push([planned>job.hours*1.1?'wn':'ok',`${c.members.length} painters × ${plural(sp.n,'day')} = ${planned} hours booked. The estimate is ${job.hours}${planned>job.hours*1.1?'. Expect a short last day':''}`]);
 const sp1=dlabel(sp.s),spE=dlabel(sp.e);const first=job.client.split(' ')[0];
 const msgs={crew:{to:`${c.lead} · WhatsApp`,x:`New job: ${job.title}\n${sp1} to ${spE}, start 8am\n${job.ext?'Exterior. Wash on day 1, body coats on dry days only.':'Interior.'}${hoa?' HOA hours 8 to 5.':''}\n${job.built<1978?'Lead-safe setup required.\n':''}Colors: ${job.colors.map(x=>x[0]).join(', ')}\nFull work order and photos in the app.`},
  client:{to:`${first} · Text${job.lang==='spanish'?' in Spanish':''}`,x:job.lang==='spanish'?`Hola ${first}, su proyecto de pintura empieza el ${sp1.replace('Mon','lunes').replace('Tue','martes').replace('Wed','miércoles').replace('Thu','jueves').replace('Fri','viernes')}. El equipo de ${c.lead} llega a las 8am. Si llueve, le avisamos. ¿Preguntas? Respóndanos aquí.`:`Hi ${first}, your project starts ${sp1}. ${c.lead}’s crew arrives at 8am. Reply here with any questions.`},
  hoa:{to:'HOA office · Email',x:`Work notice for the ${job.client.split(' ').slice(-1)[0]} residence: exterior painting ${sp1} to ${spE}, weekdays 8am to 5pm. Approved colors on file.`},
  supplier:{to:'Sherwin-Williams · PO',x:`Order for ${job.title}: ${job.colors.map(x=>x[0]).join(', ')}. Ready for pickup ${dlabel(Math.max(0,sp.s-1))}, 7am.`}};
 const tabs=job.ext&&hoa?['crew','client','hoa','supplier']:['crew','client','supplier'];
 const m=msgs[S.msgTab]||msgs.crew;const canOk=ok&&!sp.conf.length&&sp.e<=job.deadline;
 const splitCtl=!sched&&sp.n>1?`<div class="hr" style="border-top:1px solid var(--line);margin-top:6px"><span class="grow">Split into two visits<span class="tiny" style="display:block">For a rain gap, or to slot in a short job</span></span><button class="tog ${p.pz?'on':''}" data-act="split" role="switch" aria-checked="${!!p.pz}" aria-label="Split into two visits"><i></i></button></div>
  ${p.pz?`<div class="hr"><span class="grow">First visit</span><span class="stepper"><button data-act="pzat" data-v="-1" aria-label="Shorter first visit">−</button><b class="num">${plural(p.pz.at,'day')}</b><button data-act="pzat" data-v="1" aria-label="Longer first visit">+</button></span></div><div class="hr"><span class="grow">Pause between visits</span><span class="stepper"><button data-act="pzlen" data-v="-1" aria-label="Shorter pause">−</button><b class="num">${plural(p.pz.len,'day')}</b><button data-act="pzlen" data-v="1" aria-label="Longer pause">+</button></span></div>`:''}`:'';
 return `<aside class="card plan"><div class="row"><span class="dot" style="--c:${c.c}"></span><h3 style="font-size:17px" class="grow">${c.name}</h3><span class="chip ${sched?'good':'tape'}">${sched?'Scheduled':'Draft'}</span></div>
 <div class="lines" style="margin:8px 0 6px">
  <div class="ln">${ICON.cal}<span><b>${sp1} to ${spE}</b></span></div>
  <div class="ln">${ICON.people}<span>${c.members.length} painters, led by ${c.lead}</span></div>
  <div class="ln">${ICON.clock}<span>${plural(sp.n,'day')} on site${sp.holds.length?`, plus ${plural(sp.holds.length,'rain day')}`:''}${sp.pauses.length?`, ${plural(sp.pauses.length,'day')} paused`:''}</span></div>
  <div class="ln">${ICON.pay}<span>About ${money(crewPay(job,p.crew))} crew pay</span></div></div>
 ${splitCtl}
 <div style="margin-top:8px">${checks.map(([k,t])=>`<div class="check ${k}"><i>${k==='ok'?'✓':k==='wn'?'!':'×'}</i><span>${esc(t)}</span></div>`).join('')}</div>
 <div class="eyebrow" style="margin-top:14px">What goes out on confirm</div>
 <div class="msgtabs" role="group">${tabs.map(t=>`<button aria-pressed="${S.msgTab===t||(!tabs.includes(S.msgTab)&&t==='crew')}" data-act="msg" data-v="${t}">${{crew:'Crew lead',client:'Client',hoa:'HOA',supplier:'Supplier'}[t]}</button>`).join('')}</div>
 <div class="tiny" style="margin-bottom:4px">${m.to}</div><div class="bubble">${esc(m.x)}</div>
 <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap">${sched?`<button class="btn line" data-act="unschedule">Unschedule</button>`:`<button class="btn tape" data-act="confirm" ${canOk?'':'disabled'}>Confirm and notify</button><button class="btn line" data-act="clear">Clear</button>`}</div>
 ${!sched&&!canOk?'<div class="tiny" style="margin-top:8px">Fix the red checks to confirm.</div>':''}</aside>`;}

/* ---------- crew calendar ---------- */
V.cal=()=>{const B=bookings();const F=S.calF;const crews=ORDER.filter(cr=>F.crews[cr]);const od=openDays(B);
 const showBk=x=>F.show==='all'||(F.show==='confirmed'&&!x.prop)||(F.show==='drafts'&&x.prop);
 const waiting=QORDER.filter(j=>S.place[j]?.status!=='scheduled').length;
 const rows=crews.map(cr=>{const c=CREWS[cr];const bars=F.show==='none'?'':B.filter(x=>x.crew===cr&&showBk(x)).map(x=>bkHtml(x,c)).join('');
  return `<div class="crow tall" data-crew="${cr}"><div class="lab" style="position:absolute;left:0;top:0;bottom:0;width:var(--lw)"><b><span class="dot" style="--c:${c.c}"></span>${c.name}</b><span>${c.members.length} painters · ${c.type}</span><span class="num">${util(B,cr)}% booked</span></div>
   <div class="cells">${DAYS.map((d,i)=>{const idle=F.open&&i<10&&cr!=='S'&&!busy(B,cr,i);return `<div class="${d.dow==='Mon'&&i?'wk':''} ${rain(i)?'rain':''} ${idle?'idle':''}">${idle?'<span>open</span>':''}</div>`;}).join('')}</div>${bars}</div>`;}).join('');
 return `<div class="qhead"><div class="grow"><div class="eyebrow">All crews · next 4 weeks</div><h1>Crew calendar</h1></div>
  <button class="btn tape" data-act="optimize">${ICON.spark} Optimizer</button>${fbBtn('cal')}</div>
 <div class="kpis k3"><div class="card kpi"><span>Open crew days, next 2 weeks</span><b class="num" style="color:${od?'var(--warn)':'var(--good)'}">${od}</b><span>About ${money(od*IDLE_COST)} not billed</span></div>
  <div class="card kpi"><span>Jobs waiting for a crew</span><b class="num">${waiting}</b><span>${money(QORDER.filter(j=>S.place[j]?.status!=='scheduled').reduce((a,j)=>a+JOBS[j].value,0))} sold</span></div>
  <div class="card kpi"><span>Confirmed jobs moved this month</span><b class="num">${Object.values(S.shift).filter(Boolean).length}</b><span>Each one texts the client</span></div></div>
 <section class="card pad calf"><div class="fgroup"><span class="eyebrow">Show</span><div class="seg" role="group" aria-label="Jobs to show">${[['all','All jobs'],['confirmed','Confirmed'],['drafts','Drafts'],['none','No jobs']].map(([k,l])=>`<button aria-pressed="${F.show===k}" data-act="calshow" data-v="${k}">${l}</button>`).join('')}</div></div>
  <div class="fgroup"><span class="eyebrow">Crews</span><div class="chips">${ORDER.map(cr=>`<button class="pill ${F.crews[cr]?'on':''}" data-act="calcrew" data-v="${cr}" aria-pressed="${!!F.crews[cr]}"><span class="dot" style="--c:${CREWS[cr].c}"></span>${CREWS[cr].name}</button>`).join('')}</div></div>
  <div class="fgroup"><span class="eyebrow">Open days</span><button class="tog ${F.open?'on':''}" data-act="calopen" role="switch" aria-checked="${F.open}" aria-label="Highlight open days"><i></i></button></div></section>
 <div class="card gscroll"><div class="gantt cal" id="gantt">${ghead()}${rows||'<div class="pad small muted">Pick at least one crew.</div>'}</div></div>
 <div class="legend"><span><i style="background:color-mix(in srgb,var(--c0,#888) 20%,var(--surface));border:1px solid var(--line)"></i>Confirmed</span><span><i style="background:var(--sunk);border:1px dashed var(--faint)"></i>Draft</span><span><i style="background:color-mix(in srgb,var(--warn) 18%,transparent)"></i>Open day (about $1,000 lost)</span><span>Click any job to open it</span></div>`;};

/* ---------- crews ---------- */
V.crews=()=>{const B=bookings();const people=['D','B','A'].flatMap(cr=>CREWS[cr].members.slice(0,3).map(m=>[m[0],cr]));
 const TOG={'Yesenia|Mateo':31,'Yesenia|Jorge':24,'Mateo|Jorge':22,'Carlos|Ana':38,'Carlos|Luis M.':16,'Ana|Luis M.':15,'Marcus|Dev':19,'Marcus|Pete':9,'Dev|Pete':10,'Jorge|Marcus':4,'Ana|Mateo':3,'Carlos|Yesenia':2,'Luis M.|Dev':5};
 const tg=(a,b)=>TOG[a+'|'+b]||TOG[b+'|'+a]||0;
 const open=cr=>{let n=0;for(let d=0;d<20;d++)if(!busy(B,cr,d))n++;return n;};
 const RT={D:[4.8,4.6],B:[4.9,4.9],A:[4.6,4.3],C:[4.3,3.9],S:[4.5,4.4]};
 return `<div class="qhead"><div class="grow"><div class="eyebrow">Who can do what</div><h1>Crews</h1><p class="muted small" style="margin:6px 0 0">Tap any painter to see their profile, feedback and past jobs.</p></div>${fbBtn('crews')}</div>
 <div class="cgrid">${ORDER.map(cr=>{const c=CREWS[cr];return `<article class="card ccard" style="--c:${c.c}"><div class="row"><div class="grow"><h3 style="font-size:19px">${c.name}</h3><div class="small muted">${c.type} · based in ${c.base}</div></div>${avs(cr)}</div>
  <div class="mlist">${c.members.map(([n,cert])=>`<button class="mrow" data-act="member" data-v="${esc(n)}"><b>${esc(n)}</b><span class="tiny">${memberInfo(n).role}${cert?' · lead-safe':''}</span><span class="grow"></span><span class="tiny">Profile →</span></button>`).join('')}</div>
  <div class="row"><span class="small grow">Trust ${tdots(S.trust[cr])} <span class="tiny">set by your PM</span></span><span class="stepper"><button data-act="trust" data-v="${cr}" data-d="-1" aria-label="Lower trust">−</button><b class="num">${S.trust[cr]}</b><button data-act="trust" data-v="${cr}" data-d="1" aria-label="Raise trust">+</button></span></div>
  <div class="chips">${c.skills.map(k=>`<span class="chip">${SKILL[k]}</span>`).join('')}${c.certs.map(k=>`<span class="chip good">${SKILL[k]}</span>`).join('')}${c.spanish?'<span class="chip tape">Spanish</span>':''}</div>
  <div class="stats"><div><b class="num" style="color:${open(cr)>4?'var(--warn)':'var(--ink)'}">${open(cr)}</b><span>Open days, 4 wks</span></div><div><b class="num" style="color:${c.over>0?'var(--warn)':'var(--good)'}">${c.over>0?'+':''}${c.over}%</b><span>Hours vs est.</span></div><div><b class="num">${c.cb}%</b><span>Callbacks</span></div><div><b class="num">${RT[cr][0]} · ${RT[cr][1]}</b><span>Google · internal</span></div></div>
  <div class="small muted">${c.together} jobs together as this crew · ${c.ytd} jobs this year</div></article>`;}).join('')}</div>
 <section class="card pad" style="margin-top:16px"><div class="row" style="margin-bottom:10px"><div class="grow"><h3 style="font-size:17px">Who works well together</h3><div class="small muted">Jobs finished side by side in the last 12 months. Pairs that stay together run closer to estimate.</div></div>${fbBtn('pairs')}</div>
  <div class="matrix"><table><tr><th></th>${people.map(([n])=>`<th class="rot"><span>${n}</span></th>`).join('')}</tr>
  ${people.map(([a,ca])=>`<tr><th style="text-align:right"><span class="dot" style="--c:${CREWS[ca].c};display:inline-block;margin-right:6px"></span>${a}</th>${people.map(([b])=>{if(a===b)return '<td style="background:var(--sunk)"></td>';const v=tg(a,b);return `<td style="background:color-mix(in srgb,var(--tape) ${Math.min(90,v*2.4)}%,var(--sunk));color:${v>22?'var(--tape-ink)':'var(--ink)'}">${v||''}</td>`;}).join('')}</tr>`).join('')}</table></div></section>`;};

/* ---------- audit log ---------- */
V.audit=()=>`<div class="qhead"><div class="grow"><div class="eyebrow">Every decision, explained</div><h1>Audit log</h1><p class="muted" style="margin:6px 0 0;max-width:640px">Who picked which crew, the scores at the time, and the reason when the top crew wasn’t picked. Export it any time.</p></div><button class="btn line" data-act="exportlog">Download CSV</button>${fbBtn('audit')}</div>
 <section class="card pad safe"><div><b>Only job-related inputs</b><p class="small muted">Skills, certifications, trust, past job results, drive time, availability and what the client asked for. Never age, gender, race, national origin, religion or disability.</p></div>
  <div><b>A person makes the call</b><p class="small muted">Crewboard suggests. A scheduler confirms every assignment, and picking anyone other than the top crew needs a reason.</p></div>
  <div><b>Every score can be explained</b><p class="small muted">Each score breaks down into rules and weighted factors, saved with the decision and exportable for review.</p></div></section>
 <section class="card" style="margin-top:14px">${S.log.map(e=>`<div class="lrow"><span class="chip ${e.type==='Decision'?'tape':e.type==='Optimizer'?'good':e.type==='Edit'?'warn':''}" style="min-width:76px;justify-content:center">${e.type}</span><div class="grow" style="min-width:0"><div>${esc(e.text)}</div><div class="tiny">${e.t} · ${esc(e.who)}${e.job?' · '+esc(e.job):''}</div>
  ${e.detail?`<details><summary>Scores at the time (${esc(e.detail.ranked)})</summary><div class="tscroll"><table class="atable"><tr><th>Crew</th><th>Score</th><th>Result</th></tr>${e.detail.ranking.map(r=>`<tr><td>${esc(r.crew)}</td><td class="n">${r.score}</td><td>${r.ok?'Could take it':esc(r.fails.join('; '))}</td></tr>`).join('')}</table></div></details>`:''}</div></div>`).join('')}</section>`;

/* ---------- ideas ---------- */
const IDEAS=[
 ['Matching',[
  ['Explainable match score','Every pick shows the factors behind it and what would change it. Dispatchers trust what they can read.','In this prototype','ServiceTitan Dispatch Pro, Salesforce Field Service'],
  ['Score audit trail','Rules, factors and weights saved with every decision, exportable for review. Overrides need a reason.','In this prototype','Response to AI hiring lawsuits (Mobley v. Workday)'],
  ['Rules first, then weights','Hard rules remove crews (skills, lead-safe, trust bar). Weighted goals rank the rest.','In this prototype','Salesforce scheduling policies'],
  ['Saved priorities','Name and reuse your own weight mixes, like “Rainy season” or “HOA jobs”.','In this prototype','Salesforce service objectives'],
  ['Requirements read from the estimate','Skills, certifications, deadlines and client preferences pulled from the estimate, each linked back to its sentence, and editable.','In this prototype','Bridgit Bench smart suggestions'],
  ['Painter profiles','Skills, certifications, feedback and past jobs for every painter, not just the crew.','In this prototype',''],
  ['Learned crew performance','Hours vs estimate and callbacks by job type update after every job, so the ranking gets smarter.','Next','ServiceTitan technician ranking'],
  ['Build a crew for one job','Borrow a certified painter from another crew for a day instead of ruling out the whole crew.','Next','Bridgit Bench']]],
 ['Scheduling',[
  ['Optimizer','Fills open crew days, moving confirmed jobs a day or two only when it helps and only outside your no-move window.','In this prototype','Ido feedback'],
  ['Weather-aware days','Wash on rainy days, body coats only on dry days, rain days shown on the calendar.','In this prototype','Painting weather rules'],
  ['Split visits','Pause a job and come back, for rain gaps or a quick job in between. Off by default.','In this prototype','Ido feedback'],
  ['Plan the whole queue','Schedule every sold job at once, then review. Not one at a time.','In this prototype','ServiceTitan Assist mode'],
  ['High-rise and building hours','Restricted work hours from PaintScout’s high-rise burden flow straight into the schedule.','Next','PaintScout'],
  ['Jobs running over','Flag a job that’s running long and push the next one, with a manual override.','Next','Ido feedback'],
  ['Cure time and return visits','Cabinets and multi-coat jobs scheduled as linked visits with drying gaps between.','Next',''],
  ['Material-ready start','Never start a crew before paint is delivered or colors are confirmed.','Next','']]],
 ['Capacity and money',[
  ['Open crew days','Every empty crew day costs about $1,000. Tracked on the calendar and the queue.','In this prototype','Ido feedback'],
  ['Suggested crew pay','Hours times the crew’s rate, or the sub’s share, shown before you assign.','In this prototype','Ido feedback'],
  ['Backlog runway','Weeks of sold work per crew, so you know when to push sales or hire a sub.','Next','Bridgit Bench forecasting'],
  ['What-if scenarios','See the calendar if you win the HOA bid, before you bid.','Later','Bridgit Bench scenarios']]],
 ['Crew and client experience',[
  ['Colors check before scheduling','Jobs without confirmed colors are flagged, with a one-tap text and color form for the client.','In this prototype','Ido feedback'],
  ['Project photos','Link each job to its CompanyCam project so crews see the house before day 1.','Next','CompanyCam'],
  ['Crew packet on WhatsApp','Dates, colors, access notes and lead-safe setup sent in the crew lead’s language.','In this prototype',''],
  ['Client start-date text','Sent in the client’s language, with a heads-up if weather moves it.','In this prototype','Housecall Pro'],
  ['Crew accepts the job','Crew lead taps accept or flags a problem before the client is told.','Next','']]]];
V.ideas=()=>`<div class="qhead"><div class="grow"><div class="eyebrow">Idea bank</div><h1>Where this could go</h1><p class="muted" style="margin:6px 0 0;max-width:640px">Everything we considered, grouped. Tags show what’s in this prototype. Leave feedback on any card.</p></div></div>
 ${IDEAS.map(([cat,list])=>`<h2 class="icat">${cat}</h2><div class="igrid">${list.map(([t,d,tag,src],i)=>`<article class="card idea" id="idea-${cat.slice(0,4)}-${i}"><div class="row"><span class="chip ${tag==='In this prototype'?'tape':tag==='Next'?'good':''}">${tag}</span><span class="grow"></span>${fbBtn('idea','')}</div><h3>${t}</h3><p>${d}</p>${src?`<span class="tiny">From: ${src}</span>`:''}</article>`).join('')}</div>`).join('')}`;

/* ============ modals ============ */
const MW=(label,inner,wide)=>`<div class="ov" data-act="closemodal"><div class="card modal ${wide?'wide':''}" role="dialog" aria-modal="true" aria-label="${esc(label)}"><button class="x noprint" data-act="closemodal2" aria-label="Close">×</button>${inner}</div></div>`;
const M={};
M.planall=m=>MW('Plan for all jobs',`<div class="eyebrow">Plan all</div><h2 style="font-size:24px;margin:2px 0 6px">${plural(m.items.length,'job')} placed</h2><p class="small muted" style="margin:0 0 12px">Important jobs first, then the jobs with the fewest crews that can do them, so nothing gets stranded. Each takes the best crew still free. Nothing is sent until you confirm.</p>
  ${m.items.map(it=>`<div class="row" style="padding:10px 0;border-top:1px solid var(--line)"><span class="dot" style="--c:${CREWS[it.crew].c}"></span><div class="grow"><b>${esc(JOBS[it.jid].title)}</b><div class="small muted">${CREWS[it.crew].name} · ${it.s===it.e?dlabel(it.s):dlabel(it.s)+' to '+dlabel(it.e)}</div></div><span class="chip tape num">${it.score}</span></div>`).join('')}
  ${m.skipped.map(j=>`<div class="row" style="padding:10px 0;border-top:1px solid var(--line)"><span class="dot" style="--c:var(--bad)"></span><div class="grow"><b>${esc(JOBS[j].title)}</b><div class="small muted">No crew passes the rules</div></div></div>`).join('')}
  <div class="row" style="margin-top:12px;padding-top:12px;border-top:1px solid var(--line)"><span class="small grow">In-house crews booked: <b class="num">${m.before}% → ${m.after}%</b></span></div>
  <div class="row" style="margin-top:14px;flex-wrap:wrap"><button class="btn tape" data-act="confirmall">Confirm all and notify</button><button class="btn line" data-act="reviewall">Review on the calendar</button></div>`);
M.audit=m=>{const job=J();const R=rank(job.id);const r=R.find(x=>x.crew===m.crew);const c=CREWS[m.crew];const w=weights(job.id);const sw=Object.values(w).reduce((a,b)=>a+b,0);const rc=ruleChecks(job,m.crew,r);
 return MW('Score breakdown',`<div class="eyebrow">Score record</div><h2 style="font-size:23px;margin:2px 0 4px">How ${c.name} scored ${r.score} for ${esc(job.title)}</h2>
  <div class="tiny">Worked out ${stamp()} · for ${ME} · ranking “${esc(rankName(job.id))}” · position ${R.indexOf(r)+1} of ${R.length}</div>
  <h3 class="mh">1. Rules (pass or fail)</h3>${rc.map(([okk,l,why])=>`<div class="check ${okk?'ok':'no'}"><i>${okk?'✓':'×'}</i><span><b>${esc(l)}</b> · <span class="muted">${esc(why)}</span></span></div>`).join('')}
  <h3 class="mh">2. Weighted factors</h3><div class="tscroll"><table class="atable"><tr><th>Factor</th><th>How it’s measured</th><th class="n">Value</th><th class="n">Weight</th><th class="n">Points</th></tr>
  ${FACT.map(([k,l])=>`<tr><td><b>${l}</b></td><td class="muted">${FDESC[k]}</td><td class="n">${r.f[k]}</td><td class="n">${w[k]||0}</td><td class="n">${sw?((w[k]||0)*r.f[k]/sw).toFixed(1):0}</td></tr>`).join('')}
  <tr><td colspan="4"><b>Score</b> (points add up, rounded)</td><td class="n"><b>${r.score}</b></td></tr></table></div>
  <h3 class="mh">3. What’s never used</h3><p class="small muted" style="margin:0">Age, gender, race, ethnicity, national origin, religion, disability or any other personal trait. Spanish only counts when the client asks for it, as a communication need.</p>
  <h3 class="mh">4. Who decides</h3><p class="small muted" style="margin:0">This is a suggestion. A scheduler confirms the crew. If they pick someone other than the top crew, they add a reason and it’s saved in the audit log.</p>
  <div class="row noprint" style="margin-top:16px;flex-wrap:wrap"><button class="btn tape" data-act="exportscore">Download CSV (all crews)</button><button class="btn line" data-act="printit">Print or save as PDF</button></div>`,true);};
M.reason=m=>MW('Reason for override',`<div class="eyebrow">Picking a different crew</div><h2 style="font-size:22px;margin:2px 0 6px">${CREWS[m.crew].name} isn’t the top-ranked crew</h2>
  <p class="small muted" style="margin:0 0 12px">${CREWS[m.best].name} scored ${m.bs}, ${CREWS[m.crew].name} scored ${m.sc}. That’s fine. Add a reason so the decision is on record.</p>
  <div class="chips">${['Client asked for this crew','Top crew is needed on another job','Pairing or training','Schedule or travel reason','Other'].map(x=>`<button class="pill ${m.pick===x?'on':''}" data-act="reasonpick" data-v="${x}" aria-pressed="${m.pick===x}">${x}</button>`).join('')}</div>
  <label class="tiny" for="rnote" style="display:block;margin-top:12px">Note (optional)</label><textarea class="in" id="rnote" rows="2" style="margin-top:4px;resize:vertical">${esc(m.note||'')}</textarea>
  <div class="row" style="margin-top:14px"><button class="btn tape" data-act="reasonok" ${m.pick?'':'disabled'}>Confirm with this reason</button><button class="btn line" data-act="closemodal2">Cancel</button></div>`);
M.member=m=>{const n=m.name;const cr=crewOf(n);const c=CREWS[cr];const I=memberInfo(n);const cert=c.members.find(x=>x[0]===n)[1];
 return MW(n+' profile',`<div class="mp-h"><span class="av lg" style="--c:${c.c}">${initials(n)}</span><div class="grow"><h2 style="font-size:24px">${esc(n)}</h2><div class="small muted">${I.role} · ${c.name} · ${plural(I.yrs,'year')} with you</div></div></div>
  <div class="stats" style="margin-top:14px"><div><b class="num">${I.jobs}</b><span>Jobs, 12 months</span></div><div><b class="num" style="color:${I.over>0?'var(--warn)':'var(--good)'}">${I.over>0?'+':''}${I.over}%</b><span>Hours vs est.</span></div><div><b class="num">${I.cb}%</b><span>Callbacks</span></div><div><b class="num">${I.g?I.g+' · ':''}${I.i}</b><span>${I.g?'Google · internal':'Internal rating'}</span></div></div>
  <h3 class="mh">What we match on</h3>
  <div class="hr"><span class="muted" style="width:120px">Skills</span><span class="chips grow">${I.skills.map(s=>`<span class="chip">${esc(s)}</span>`).join('')}</span></div>
  <div class="hr"><span class="muted" style="width:120px">Certifications</span><span class="chips grow">${(cert&&!I.certs.some(x=>/Lead/.test(x))?['Lead-safe RRP']:[]).concat(I.certs).map(s=>`<span class="chip good">${esc(s)}</span>`).join('')||'<span class="tiny">None on file</span>'}</span></div>
  <div class="hr"><span class="muted" style="width:120px">Languages</span><span class="grow">${I.langs}</span></div>
  <div class="hr"><span class="muted" style="width:120px">Works best with</span><span class="grow">${I.best}</span></div>
  <div class="hr"><span class="muted" style="width:120px">Time off</span><span class="grow">${I.off}</span></div>
  <h3 class="mh">Feedback</h3>${I.fb.length?I.fb.map(([who,q,d])=>`<div class="quote">${esc(q)}<div class="tiny">${esc(who)} · ${d}</div></div>`).join(''):'<p class="tiny" style="margin:0">No feedback yet.</p>'}
  <h3 class="mh">Recent jobs</h3>${I.past.length?I.past.map(([j,d,r])=>`<div class="row" style="padding:6px 0;border-top:1px solid var(--line)"><span class="grow">${esc(j)}</span><span class="tiny">${d}</span><span class="chip ${/over/.test(r)?'warn':'good'}">${r}</span></div>`).join(''):'<p class="tiny" style="margin:0">No jobs logged yet.</p>'}
  <p class="tiny" style="margin:14px 0 0">Only job-related information is used for matching.</p>`);};
M.hub=m=>{const B=bookings();if(JOBS[m.id]){const j=JOBS[m.id];const p=S.place[m.id];const sp=p?span(j,p.crew,p.s,bookings(m.id),p.pz):null;let n=0;
  return MW(j.title,`<div class="eyebrow">Project</div><h2 style="font-size:24px;margin:2px 0 4px">${esc(j.title)}</h2><div class="small muted">${esc(j.client)} · ${AREA[j.area]} · ${money(j.value)}</div>
   ${p?`<div class="lines" style="margin-top:12px"><div class="ln">${ICON.people}<span><b>${CREWS[p.crew].name}</b>, ${CREWS[p.crew].members.length} painters, led by ${CREWS[p.crew].lead}</span></div><div class="ln">${ICON.cal}<span>${dlabel(sp.s)} to ${dlabel(sp.e)} · ${p.status==='scheduled'?'Confirmed, client notified':'Draft, not confirmed'}</span></div></div>
   <div class="daylist">${(()=>{const o=[];for(let d=sp.s;d<=sp.e;d++){const h=sp.holds.includes(d),pz=sp.pauses.includes(d);o.push(`<span class="dchip ${h?'h':''} ${pz?'p':''}"><b>${pz?'Pause':h?'Rain day':'Day '+(++n)}</b>${dlabel(d)}</span>`);}return o.join('');})()}</div>`:'<p class="small">Not on the calendar yet.</p>'}
   <div class="links" style="margin-top:12px">${j.colorsOk===true?'<span class="lk good">✓ Colors confirmed</span>':'<span class="lk warn">Colors not confirmed</span>'}<button class="lk" data-act="photos" data-v="${m.id}">${ICON.cam} ${j.photos||0} photos in CompanyCam</button><span class="lk">PaintScout estimate</span></div>
   <div class="row" style="margin-top:16px;flex-wrap:wrap"><button class="btn tape" data-act="board" data-v="${m.id}">${p?'Move or change':'Schedule it'}</button><button class="btn line" data-act="match" data-v="${m.id}">Crew ranking</button></div>`);}
 const x=B.find(y=>y.id===m.id);const c=CREWS[x.crew];
 return MW(x.name,`<div class="eyebrow">Project</div><h2 style="font-size:24px;margin:2px 0 4px">${esc(x.name)} ${esc(x.what.toLowerCase())}</h2><div class="small muted">Confirmed · client notified${x.moved?` · moved ${plural(x.moved,'day')} later by the optimizer`:''}</div>
  <div class="lines" style="margin-top:12px"><div class="ln">${ICON.people}<span><b>${c.name}</b>, ${c.members.length} painters, led by ${c.lead}</span></div><div class="ln">${ICON.cal}<span>${dlabel(x.s)} to ${dlabel(x.e)}</span></div></div>
  <div class="daylist">${Array.from({length:x.e-x.s+1},(_,i)=>`<span class="dchip"><b>Day ${i+1}</b>${dlabel(x.s+i)}</span>`).join('')}</div>
  <div class="links" style="margin-top:12px"><span class="lk good">✓ Colors confirmed</span><button class="lk" data-act="photos" data-v="${x.id}">${ICON.cam} Photos in CompanyCam</button><span class="lk">PaintScout estimate</span></div>
  <p class="tiny" style="margin:12px 0 0">In the full product this opens the project hub.</p>`);};
M.colors=m=>{const j=JOBS[m.id];const first=j.client.split(' ')[0];
 return MW('Text the client',`<div class="eyebrow">Colors not confirmed</div><h2 style="font-size:22px;margin:2px 0 6px">Text ${esc(first)} a color form</h2><p class="small muted" style="margin:0 0 12px">The job stays in the queue and you can still pick a crew. You’ll get a flag before confirming until colors come back.</p>
  <div class="tiny" style="margin-bottom:4px">${esc(first)} · Text</div><div class="bubble">Hi ${esc(first)}, it’s Brightline Painting. We’re ready to get your ${esc(j.title.split(' ').slice(1).join(' '))} on the calendar. Can you confirm your colors here? brightline.co/colors/${m.id} Takes 2 minutes.</div>
  <div class="row" style="margin-top:14px"><button class="btn tape" data-act="sendcolors" data-v="${m.id}">Send text</button><button class="btn line" data-act="closemodal2">Not now</button></div>`);};
M.opt=m=>{const after=optAfter(m);const n=m.sel.filter(Boolean).length;
 return MW('Optimizer',`<div class="eyebrow">${ICON.spark} Optimizer</div><h2 style="font-size:24px;margin:2px 0 6px">Close the gaps</h2><p class="small muted" style="margin:0 0 12px">Fills open crew days over the next 2 weeks. Confirmed jobs only move a day or two, never inside your no-move window, and never twice. Nothing changes until you apply.</p>
  <div class="kpis k2"><div class="card kpi"><span>Open crew days now</span><b class="num">${m.before}</b><span>About ${money(m.before*IDLE_COST)} not billed</span></div><div class="card kpi"><span>After selected moves</span><b class="num" style="color:var(--good)">${after}</b><span>${plural(m.before-after,'day')} filled · about ${money((m.before-after)*IDLE_COST)}</span></div></div>
  <div class="hr"><span class="grow">Don’t move confirmed jobs that start in the next</span><span class="stepper"><button data-act="lock" data-v="-1" aria-label="Fewer days">−</button><b class="num">${plural(S.lock,'day')}</b><button data-act="lock" data-v="1" aria-label="More days">+</button></span></div>
  ${m.moves.length?m.moves.map((mv,i)=>{const job=JOBS[mv.jid];const late=mv.s-job.earliest;return `<label class="mv"><input type="checkbox" data-opt="${i}" ${m.sel[i]?'checked':''}><div class="grow"><b>${esc(job.title)}</b> <span class="muted">→</span> <b>${CREWS[mv.crew].name}</b><div class="small muted">${dlabel(mv.s)} to ${dlabel(mv.e)}</div>
   <div class="chips" style="margin-top:6px">${mv.fill?`<span class="chip good">Fills ${plural(mv.fill,'open day')}</span>`:''}${mv.crew===mv.top?'<span class="chip good">Top-ranked crew</span>':`<span class="chip warn">Not the top crew (${mv.score} vs ${mv.topScore})</span>`}${late>0?`<span class="chip warn">Starts ${plural(late,'day')} after the first possible day</span>`:'<span class="chip good">Starts the first possible day</span>'}</div>
   ${mv.shift?`<div class="check wn" style="margin-top:6px"><i>!</i><span>Moves a confirmed job: ${esc(mv.shift.name)} shifts ${plural(mv.shift.k,'day')} later, to ${dlabel(mv.shift.from+mv.shift.k)}. That client gets a text.</span></div>`:''}</div></label>`;}).join(''):'<p class="small">No moves found. The schedule is already tight.</p>'}
  <div class="row" style="margin-top:14px;flex-wrap:wrap"><button class="btn tape" data-act="optapply" ${n?'':'disabled'}>Apply ${plural(n,'move')}</button><button class="btn line" data-act="closemodal2">Cancel</button><span class="tiny">Jobs go on as drafts. You confirm them as usual.</span></div>`,true);};

/* ============ render ============ */
function render(){
 const tabView=S.view==='match'||S.view==='add'||S.view==='board'?'queue':S.view;
 $('#tabs').innerHTML=[['queue','Ready to schedule',QORDER.filter(j=>S.place[j]?.status!=='scheduled').length],['cal','Crew calendar'],['crews','Crews'],['audit','Audit log'],['ideas','Ideas']].map(([v,l,n])=>`<button data-go="${v}" ${tabView===v?'aria-current="page"':''}>${l}${n?`<span class="ct num">${n}</span>`:''}</button>`).join('');
 $('#app').innerHTML=V[S.view]();
 bindDrag(); drawLayer();}
function drawLayer(){let h='';if(S.modal)h+=M[S.modal.type](S.modal);
 if(S.toast)h+=`<div class="toast" role="status">${esc(S.toast)}</div>`;
 $('#layer').innerHTML=h;}

/* ============ drag on board ============ */
function bindDrag(){const nb=document.getElementById('nb');if(!nb)return;const g=document.getElementById('gantt');
 let st=null;
 nb.addEventListener('pointerdown',e=>{const p=S.place[S.job];if(!p||p.status==='scheduled')return;nb.setPointerCapture(e.pointerId);st={x:e.clientX,y:e.clientY,s:p.s,crew:p.crew,moved:false};nb.classList.add('dragging');});
 nb.addEventListener('pointermove',e=>{if(!st)return;const cwPx=parseFloat(getComputedStyle(g).getPropertyValue('--cw'));const dx=Math.round((e.clientX-st.x)/cwPx);
  nb.style.transform=`translate(${dx*cwPx}px,${e.clientY-st.y}px)`;st.moved=true;
  document.querySelectorAll('.crow').forEach(r=>{const b=r.getBoundingClientRect();r.classList.toggle('drop',e.clientY>=b.top&&e.clientY<b.bottom);});});
 const end=e=>{if(!st)return;const cwPx=parseFloat(getComputedStyle(g).getPropertyValue('--cw'));const dx=Math.round((e.clientX-st.x)/cwPx);
  let crew=st.crew;document.querySelectorAll('.crow').forEach(r=>{const b=r.getBoundingClientRect();if(e.clientY>=b.top&&e.clientY<b.bottom)crew=r.dataset.crew;});
  const s=Math.max(0,Math.min(19,st.s+dx));setPlace(S.job,crew,s,'draft');st=null;render();};
 nb.addEventListener('pointerup',end);nb.addEventListener('pointercancel',end);
 nb.addEventListener('keydown',e=>{const p=S.place[S.job];if(!p||p.status==='scheduled')return;let d=0,cr=ORDER.indexOf(p.crew);
  if(e.key==='ArrowRight')d=1;else if(e.key==='ArrowLeft')d=-1;else if(e.key==='ArrowDown')cr=Math.min(ORDER.length-1,cr+1);else if(e.key==='ArrowUp')cr=Math.max(0,cr-1);else return;
  e.preventDefault();setPlace(S.job,ORDER[cr],Math.max(0,Math.min(19,p.s+d)),'draft');render();document.getElementById('nb')?.focus();});}

/* ============ actions ============ */
function placeJob(jid,crew){const r=rank(jid).find(x=>x.crew===crew);const job=JOBS[jid];const sl=r.slot||span(job,crew,job.earliest,bookings(jid));setPlace(jid,crew,sl.s,'draft',null);}
function planAll(){const B0=bookings();const before=Math.round(ORDER.slice(0,4).reduce((a,c)=>a+util(B0,c),0)/4);const items=[],skipped=[];
 const todo=QORDER.filter(j=>S.place[j]?.status!=='scheduled');
 todo.forEach(j=>{delete S.place[j];});
 const opts=Object.fromEntries(todo.map(j=>[j,rank(j).filter(x=>x.ok).length]));
 todo.sort((a,b)=>(!!imp(JOBS[b])-!!imp(JOBS[a]))||(opts[a]-opts[b])||(JOBS[a].deadline-JOBS[b].deadline));
 todo.forEach(j=>{const r=rank(j).find(x=>x.ok);if(!r){skipped.push(j);return;}setPlace(j,r.crew,r.slot.s,'draft',null);items.push({jid:j,crew:r.crew,s:r.slot.s,e:r.slot.e,score:r.score});});
 const B1=bookings();const after=Math.round(ORDER.slice(0,4).reduce((a,c)=>a+util(B1,c),0)/4);S.modal={type:'planall',items,skipped,before,after};}
function doConfirm(reason){const job=J();const p=S.place[job.id];const R=rank(job.id);const me=R.find(x=>x.crew===p.crew);const best=R.find(x=>x.ok);
 p.status='scheduled';
 log('Decision',`Confirmed ${CREWS[p.crew].name} for ${job.title}, ${dlabel(p.s)} to ${dlabel(p.e)}. ${!reason?`Top-ranked crew, score ${me.score}.`:`Not the top-ranked crew (${me.score} vs ${best.score}). Reason: ${reason}.`}`,job.title,{ranked:rankName(job.id),ranking:R.map(r=>({crew:CREWS[r.crew].name,score:r.score,ok:r.ok,fails:r.fails}))});
 S.modal=null;render();toast(`Scheduled. ${CREWS[p.crew].lead}, the client${(job.hoa||job.writeup.includes('[hoa|'))?', the HOA':''} and the supplier are notified`);}
document.addEventListener('click',async e=>{const th=e.target.closest('[data-theme-set]');if(th){setTheme(th.dataset.themeSet);return;}
 const fb=e.target.closest('[data-fb]');if(fb){feedback(fb);return;}
 const go=e.target.closest('[data-go]');if(go){S.view=go.dataset.go;S.modal=null;render();window.scrollTo(0,0);return;}
 const b=e.target.closest('[data-act]');if(!b||b.disabled)return;const a=b.dataset.act,v=b.dataset.v;
 switch(a){
 case 'match':S.job=v;S.modal=null;S.view='match';render();window.scrollTo(0,0);break;
 case 'board':S.job=v;S.modal=null;S.view='board';render();window.scrollTo(0,0);break;
 case 'setjob':S.job=v;render();break;
 case 'preset':delete S.w[S.job];S.preset[S.job]=v;render();break;
 case 'drawer':S.drawer=!S.drawer;render();break;
 case 'resetw':delete S.w[S.job];delete S.preset[S.job];render();break;
 case 'savepreset':{const inp=document.getElementById('pname');const name=(inp&&inp.value||'').trim();if(!name){toast('Give it a name first');inp&&inp.focus();break;}
  if(PRESETS[name]&&!S.custom.includes(name)){toast('That name is taken. Try another');break;}
  PRESETS[name]={...S.w[S.job]};if(!S.custom.includes(name))S.custom.push(name);PDESC[name]='Your saved priority: '+FACT.filter(([k])=>PRESETS[name][k]>=3).map(([,l])=>l.toLowerCase()).join(', ')+'.';
  delete S.w[S.job];S.preset[S.job]=name;log('Setting',`Saved a new priority “${name}”: ${FACT.map(([k,l])=>`${l} ${PRESETS[name][k]}`).join(', ')}.`);render();toast(`Saved “${name}”. It’s now an option for every job`);break;}
 case 'rule':S.rules[v]=!S.rules[v];log('Setting',`Turned ${S.rules[v]?'on':'off'} the rule: ${v==='lead'?'lead-safe painter for pre-1978 homes':v==='trust'?'trust bar for important clients':v==='weather'?'hold exterior coats on rain days':'no crew more than 35 min away'}.`);render();toast(`${S.rules[v]?'Rule on':'Rule off'}. Ranking updated`);break;
 case 'impt':S.impOn[v]=!S.impOn[v];log('Setting',`${S.impOn[v]?'Turned on':'Turned off'} the important-client trigger: ${IMPT.find(x=>x[0]===v)[1].toLowerCase()}.`);render();break;
 case 'impwhy':S.impWhyOpen=!S.impWhyOpen;render();break;
 case 'bar':S.trustBar=Math.max(1,Math.min(5,S.trustBar+ +v));log('Setting',`Set the trust bar for important clients to ${S.trustBar}.`);render();break;
 case 'toggleout':S.showOut=!S.showOut;render();break;
 case 'trustup':S.trust[v]=S.trustBar;log('Setting',`Raised ${CREWS[v].name} trust to ${S.trustBar} from the crew ranking.`);render();toast(`${CREWS[v].name} trust raised to ${S.trustBar}. They’re in the running`);break;
 case 'trust':{const o=S.trust[v];S.trust[v]=Math.max(1,Math.min(5,o+ +b.dataset.d));if(o!==S.trust[v])log('Setting',`Changed ${CREWS[v].name} trust from ${o} to ${S.trust[v]}.`);render();break;}
 case 'est':S.estOpen=!S.estOpen;render();break;
 case 'vis':{const vis=S.vis[S.job]||(S.vis[S.job]={});vis[v]=!vis[v];render();break;}
 case 'visall':{const vis=S.vis[S.job]||(S.vis[S.job]={});const ok=rank(S.job).filter(r=>r.ok).slice(1);const all=ok.every(r=>vis[r.crew]);ok.forEach(r=>vis[r.crew]=!all);render();break;}
 case 'audit':S.modal={type:'audit',crew:v};drawLayer();break;
 case 'exportscore':saveFile(`crewboard-score-${J().title.toLowerCase().replace(/[^a-z0-9]+/g,'-')}.csv`,auditCSV(J()));break;
 case 'exportlog':saveFile('crewboard-audit-log.csv',logCSV());break;
 case 'printit':window.print();break;
 case 'member':S.modal={type:'member',name:v};drawLayer();break;
 case 'hub':S.modal={type:'hub',id:v};drawLayer();break;
 case 'photos':toast(`Opens the CompanyCam project${JOBS[v]?` (${JOBS[v].photos||0} photos)`:''}`);break;
 case 'colors':S.modal={type:'colors',id:v};drawLayer();break;
 case 'sendcolors':JOBS[v].colorsOk='sent';log('Edit',`Texted ${JOBS[v].client} a color form for ${JOBS[v].title}.`,JOBS[v].title);S.modal=null;render();toast('Color form sent. You’ll see it here when they reply');break;
 case 'editjob':openEdit(S.job);break;
 case 'pick':placeJob(S.job,v);S.view='board';render();window.scrollTo(0,0);toast(`Placed on ${CREWS[v].name}. Drag to adjust`);break;
 case 'place':placeJob(S.job,v);render();toast(`Placed on ${CREWS[v].name}. Drag to adjust`);break;
 case 'quick':{placeJob(v,rank(v).find(x=>x.ok).crew);const p=S.place[v];const R=rank(v);p.status='scheduled';log('Decision',`Booked ${CREWS[p.crew].name} for ${JOBS[v].title} on ${dlabel(p.s)} to fill an open day. Top-ranked crew, score ${R.find(x=>x.crew===p.crew).score}.`,JOBS[v].title,snap(v));render();toast(`${JOBS[v].title} booked on ${CREWS[p.crew].name}. Crew and client notified`);break;}
 case 'msg':S.msgTab=v;render();break;
 case 'split':{const p=S.place[S.job];const n=need(J(),p.crew);setPlace(S.job,p.crew,p.s,p.status,p.pz?null:{at:Math.ceil(n/2),len:1});render();break;}
 case 'pzat':{const p=S.place[S.job];setPlace(S.job,p.crew,p.s,p.status,{at:p.pz.at+ +v,len:p.pz.len});render();break;}
 case 'pzlen':{const p=S.place[S.job];setPlace(S.job,p.crew,p.s,p.status,{at:p.pz.at,len:Math.max(1,Math.min(5,p.pz.len+ +v))});render();break;}
 case 'confirm':{const p=S.place[S.job];const best=rank(S.job).find(x=>x.ok);if(best&&best.crew!==p.crew){const me=rank(S.job).find(x=>x.crew===p.crew);S.modal={type:'reason',crew:p.crew,best:best.crew,bs:best.score,sc:me.score,pick:null,note:''};drawLayer();break;}doConfirm(null);break;}
 case 'reasonpick':S.modal.note=(document.getElementById('rnote')||{}).value||'';S.modal.pick=v;drawLayer();break;
 case 'reasonok':{const note=((document.getElementById('rnote')||{}).value||'').trim();doConfirm(S.modal.pick+(note?` (${note})`:''));break;}
 case 'clear':delete S.place[S.job];render();break;
 case 'unschedule':S.place[S.job].status='draft';log('Decision',`Unscheduled ${J().title}. Back to draft.`,J().title);render();toast('Back to draft. Nobody has been told yet');break;
 case 'planall':planAll();render();break;
 case 'closemodal':if(e.target===b){S.modal=null;drawLayer();}break;
 case 'closemodal2':S.modal=null;drawLayer();break;
 case 'reviewall':S.modal=null;S.view='cal';render();window.scrollTo(0,0);break;
 case 'confirmall':{const n=S.modal.items.length;S.modal.items.forEach(it=>{S.place[it.jid].status='scheduled';log('Decision',`Confirmed ${CREWS[it.crew].name} for ${JOBS[it.jid].title} through Plan all, ${dlabel(it.s)} to ${dlabel(it.e)}. Top available crew, score ${it.score}.`,JOBS[it.jid].title,snap(it.jid));});S.modal=null;render();toast(`${plural(n,'job')} scheduled. Crews and clients notified`);break;}
 case 'hideothers':S.hideOthers=!S.hideOthers;render();break;
 case 'onlyok':S.onlyOk=!S.onlyOk;render();break;
 case 'calshow':S.calF.show=v;render();break;
 case 'calcrew':S.calF.crews[v]=!S.calF.crews[v];render();break;
 case 'calopen':S.calF.open=!S.calF.open;render();break;
 case 'optimize':S.modal=optimize();drawLayer();break;
 case 'lock':S.lock=Math.max(3,Math.min(7,S.lock+ +v));S.modal=optimize();drawLayer();break;
 case 'optapply':{const m=S.modal;const n=m.sel.filter(Boolean).length;const shifts=m.moves.filter((mv,i)=>m.sel[i]&&mv.shift).length;applyMoves(m,true);S.modal=null;render();toast(`${plural(n,'job')} placed as drafts${shifts?`. ${plural(shifts,'client text')} queued for moved jobs`:''}`);break;}
 }});
document.addEventListener('change',e=>{const t=e.target;
 if(t.dataset.opt!=null&&S.modal&&S.modal.type==='opt'){S.modal.sel[+t.dataset.opt]=t.checked;drawLayer();}
 if(t.dataset.w){const l=FACT.find(x=>x[0]===t.dataset.w)[1];log('Setting',`Set the ${l.toLowerCase()} weight to ${t.value} for ${J().title}.`,J().title);}});
document.addEventListener('input',e=>{const t=e.target;if(t.dataset.w){const w={...weights(S.job)};w[t.dataset.w]=+t.value;S.w[S.job]=w;render();const el=document.getElementById(t.id);if(el)el.focus();}});
document.addEventListener('mouseover',e=>{const r=e.target.closest('.req,.fld,.skc,.hr[data-k]');document.querySelectorAll('.writeup mark').forEach(m=>m.classList.toggle('on',!!r&&m.dataset.k===r.dataset.k));});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&S.modal){S.modal=null;drawLayer();}});
/* theme */
function setTheme(t){document.documentElement.dataset.theme=t;try{localStorage.setItem('cb-theme',t);}catch(_){}document.querySelectorAll('[data-theme-set]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.themeSet===t));}
(()=>{let t=null;try{t=localStorage.getItem('cb-theme');}catch(_){}if(!t)t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';setTheme(t);})();
