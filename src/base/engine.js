/* ============ state ============ */
const PEOPLE={admin:'Ido D. (Admin)',scheduler:'Carla M. (Scheduler)'};
const ME=()=>PEOPLE[S.role];
const NOW=new Date(2026,9,25,16,30).getTime();
const S={role:'admin',view:'queue',job:'hernandez',label:{},w:{},
 rules:{minType:3,lead:true,imp:true,impBar:4,weather:true,maxDrive:45,untested:false},
 impOn:{returning:true,referrals:true,value:true,crm:true,trade:true,manual:true},
 place:{},shift:{},reassign:{},lock:5,msgTab:'crew',msgLang:{},toast:null,modal:null,estOpen:true,vis:{},showOut:false,impWhyOpen:false,
 calF:{view:'twoWeeks',show:'all',group:'ready',open:true,zoom:1,date:null},hideOthers:false,allCrews:false,crewF:'all',pairCrew:'gian',
 audit:{range:'30',from:'',to:'',type:'all'},ofb:{reject:{},pin:{},noMove:{},block:[]},optRuns:0,
 riley:{stage:0,observed:46,agreed:34,byType:{exterior:[18,15],interior:[14,10],cabinets:[6,5],commercial:[8,4]},
  from:{'Carla M.':{n:29,on:true},'Jessie T.':{n:17,on:true}},
  learned:[
   {id:'p1',text:'Schedulers pick Gian for exteriors worth $12,000 or more, even when another crew can start sooner.',crew:'gian',test:j=>j.type==='exterior'&&j.value>=12000,n:6,status:'kept'},
   {id:'p2',text:'Tania’s crew of 6 goes on commercial and HOA jobs first because they finish big jobs fastest.',crew:'tania',test:j=>j.type==='commercial',n:5,status:'kept'},
   {id:'p3',text:'Johan & Dani get passed over for interiors with plaster or drywall repair.',crew:null,avoid:'johan-dani',test:j=>j.type==='interior'&&j.skills.includes('drywall'),n:4,status:'new'}]},
 log:[]};
const J=()=>JOBS[S.job];
const isAdmin=()=>S.role==='admin';
const impWhy=j=>IMPT.filter(([k])=>S.impOn[k]).map(x=>x[2](j)).filter(Boolean);
const imp=j=>{const w=impWhy(j);return w.length?w.join(', '):null;};
const labelFor=id=>S.label[id]&&LABELS[S.label[id]]?S.label[id]:(imp(JOBS[id])?'White glove':'Balanced');
const weights=id=>S.w[id]||LABELS[labelFor(id)].w;
const rankName=id=>S.w[id]?'Custom (not saved)':labelFor(id);
const stamp=t=>new Date(t||Date.now()).toLocaleString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});
function log(type,text,job,detail){S.log.unshift({ts:Date.now(),t:stamp(),who:ME(),type,text,job:job||'',detail:detail||null});}
S.log=[
 {ts:NOW-1*864e5,t:'Oct 24, 3:12 PM',who:'Carla M. (Scheduler)',type:'Decision',text:'Confirmed Rigo for Ortega exterior, Wed Nov 11 to Tue Nov 17. Top-ranked crew, score 86.',job:'Ortega exterior'},
 {ts:NOW-2*864e5,t:'Oct 23, 10:40 AM',who:'Jessie T. (Scheduler)',type:'Override',text:'Confirmed Tania for Brickell Bay condo halls instead of Gian (79 vs 84). Reason: Top crew is needed on another job (Gian on Brightwater).',job:'Brickell Bay condo halls'},
 {ts:NOW-0.1*864e5,t:'Oct 25, 2:05 PM',who:'Ido D. (Admin)',type:'Crew data',text:'Imported crews-with-ratings.xlsx: 22 crews, 18 rating columns. Fixed 16 crew sizes Excel had turned into dates. Set status for all crews.'},
 {ts:NOW-9*864e5,t:'Oct 16, 4:10 PM',who:'Dana R. (Estimator)',type:'Import',text:'Hernandez exterior imported from PaintScout #4127. Marked important: returning client, has referred 5 jobs.',job:'Hernandez exterior'}].sort((a,b)=>b.ts-a.ts);
/* ============ crew readiness ============ */
function missing(c){const m=[];if(!c.f.status)m.push('status');if(!c.f.size)m.push('size');if(!c.f.base)m.push('base');if(!dimsOf('job').some(d=>c.r[d.k]!=null))m.push('jobRating');return m;}
const ready=c=>c.f.status==='active'&&!missing(c).length;
const activeCrews=()=>CREWS.filter(c=>c.f.status==='active');
const leadTracked=()=>RECOMMENDED.find(x=>x.k==='leadSafe').added;
const langTracked=()=>RECOMMENDED.find(x=>x.k==='languages').added;
/* ============ occupancy ============ */
function crewOfBooking(x){return S.reassign[x.id]||x.crew;}
function bookings(except){const b=BOOKS.map(x=>{const k=S.shift[x.id]||0;return{...x,crew:crewOfBooking(x),s:x.s+k,e:x.e+k,fixed:true,moved:k};});
 Object.entries(S.place).forEach(([jid,p])=>{if(jid===except||!JOBS[jid])return;p.segs.forEach(([a,z],i)=>b.push({id:'job:'+jid+':'+i,crew:p.crew,name:JOBS[jid].title,what:p.status==='scheduled'?'Confirmed':'Draft',s:a,e:z,jid,seg:p.segs.length>1?i+1:0,prop:p.status!=='scheduled',half:p.half||null,value:JOBS[jid].value}));});return b;}
function occ(B,crew,d){let full=0,h=new Set();B.forEach(x=>{if(x.crew===crew&&d>=x.s&&d<=x.e){if(x.half)h.add(x.half);else full=1;}});return full?1:h.size>=2?1:h.size?0.5:0;}
function freeHalf(B,crew,d){const used=new Set(B.filter(x=>x.crew===crew&&x.half&&d>=x.s&&d<=x.e).map(x=>x.half));return occ(B,crew,d)===1?null:!used.has('am')?'am':!used.has('pm')?'pm':null;}
const busy=(B,crew,d)=>occ(B,crew,d)>0;
const painterDays=j=>Math.round(j.hours/8*10)/10;
function need(job,crew){const c=crewById(crew);const sz=planSize(c)||1;const days=job.hours/8/sz;return days<=0.5?{n:1,half:true}:{n:Math.ceil(days),half:false};}
function span(job,crew,start,B){const nd=need(job,crew);
 if(nd.half){const h=freeHalf(B,crew,start);return{s:start,e:start,holds:[],conf:h?[]:[start],n:1,half:h||'am'};}
 let c=0,d=start;const holds=[],conf=[];
 while(c<nd.n){if(d>27)break;if(busy(B,crew,d))conf.push(d);
  if(job.ext&&S.rules.weather&&rain(d)&&!(c===0&&nd.n>=3))holds.push(d);else c++;d++;}
 return{s:start,e:d-1,holds,conf,n:nd.n,half:null};}
function earliestSlot(job,crew,B){for(let s=job.earliest;s<=19;s++){const sp=span(job,crew,s,B);if(!sp.conf.length)return sp;}return null;}
function setPlace(jid,crew,s,status,keepSegs){const job=JOBS[jid];const sp=span(job,crew,s,bookings(jid));const old=S.place[jid];
 let segs=[[sp.s,sp.e]];if(keepSegs&&old&&old.segs.length>1){const d=s-old.segs[0][0];segs=old.segs.map(([a,z])=>[a+d,z+d]);}
 S.place[jid]={crew,segs,status:status||'draft',half:sp.half,holds:sp.holds};return S.place[jid];}
const pS=p=>p.segs[0][0],pE=p=>p.segs[p.segs.length-1][1];
function placeConf(jid){const p=S.place[jid];const B=bookings(jid);const out=[];p.segs.forEach(([a,z])=>{for(let d=a;d<=z;d++){if(p.half?freeHalf(B,p.crew,d)!==p.half&&occ(B,p.crew,d)>0&&!(occ(B,p.crew,d)===0.5&&freeHalf(B,p.crew,d)===p.half):busy(B,p.crew,d))out.push(d);}});return out;}
function placeDays(jid){const p=S.place[jid];const job=JOBS[jid];const out=[];let w=0;p.segs.forEach(([a,z],si)=>{if(si>0){for(let d=p.segs[si-1][1]+1;d<a;d++)out.push({d,k:'pause'});}for(let d=a;d<=z;d++){const h=job.ext&&S.rules.weather&&rain(d)&&!(w===0&&need(job,p.crew).n>=3)&&!p.half;out.push({d,k:h?'rain':'work',n:h?null:++w});}});return out;}
/* ============ rules ============ */
function hard(job,cid){const c=crewById(cid);const out=[];
 if(c.f.status!=='active'){out.push('Inactive');return out;}
 const mi=missing(c).filter(x=>x!=='jobRating');if(mi.length)out.push(`Missing setup: ${mi.map(x=>x==='size'?'crew size':x==='base'?'home base':x).join(', ')}`);
 const r=c.r[job.type];if(r==null){if(!S.rules.untested)out.push(`Not rated for ${dimL(job.type).toLowerCase()} yet`);}else if(r<S.rules.minType)out.push(`Rated ${r} for ${dimL(job.type).toLowerCase()}, minimum is ${S.rules.minType}`);
 if(S.rules.lead&&job.built<1978){if(!leadTracked())out.push('Lead-safe isn’t tracked yet');else if(c.f.leadSafe!==true)out.push(`No lead-safe certification on file (home built ${job.built})`);}
 if(S.rules.imp&&imp(job)){const q=c.r.quality,cf=c.r.client;if(q==null||cf==null||q<S.rules.impBar||cf<S.rules.impBar)out.push(`Important client: needs quality and client-facing ${S.rules.impBar}+`);}
 const dm=driveMin(c.f.base,job.area);if(dm!=null&&dm>S.rules.maxDrive)out.push(`${dm} min away, limit is ${S.rules.maxDrive}`);
 return out;}
function util(B,crew,days=20){let n=0;for(let d=0;d<days;d++)n+=occ(B,crew,d);return Math.round(n/days*100);}
function hist(cid){const h=HIST[cid];if(!h)return null;return{...h,overPct:Math.round((h.actual-h.sold)/h.sold*1000)/10,payAct:Math.round(h.pay/h.actual),costSold:Math.round(h.pay/h.sold)};}
const r20=v=>v==null?null:Math.round(v*20);
function factors(job,cid,slot,B){const c=crewById(cid);const f={};const h=hist(cid);
 f.jobType=r20(c.r[job.type])??50;
 const sk=job.skills.map(k=>c.r[k]).filter(v=>v!=null);f.skills=sk.length?Math.round(sk.reduce((a,b)=>a+b,0)/sk.length*20):60;
 dimsOf('attr').forEach(d=>f[d.k]=r20(c.r[d.k])??60);
 f.record=h?Math.max(0,Math.min(100,Math.round(100-Math.max(0,h.overPct)*6+(h.overPct<0?0:0)))):60;
 f.cost=h?Math.max(0,Math.min(100,Math.round(70+(AVG_COST-h.costSold)/AVG_COST*300))):60;
 const dm=driveMin(c.f.base,job.area);f.distance=dm==null?50:Math.max(0,100-dm*2);
 const delay=slot?slot.s-job.earliest:10;f.timing=Math.max(0,100-delay*12);
 f.balance=100-util(B,cid);
 f.language=job.lang==='en'?80:(langTracked()&&(c.f.languages||'').toLowerCase().includes(LANGS[job.lang].split(' ').pop().toLowerCase())?100:30);
 return f;}
function score(f,w){let t=0,s=0;for(const k in w){if(f[k]==null)continue;t+=w[k]*f[k];s+=w[k];}return s?Math.round(t/s):0;}
function rank(jid){const job=JOBS[jid];const B=bookings(jid);const w=weights(jid);
 return activeCrews().map(c=>{const fails=hard(job,c.id);const slot=earliestSlot(job,c.id,B);
  if(slot&&slot.e>job.deadline)fails.push(`Earliest finish ${sdate(slot.e)}, after the ${sdate(job.deadline)} deadline`);
  if(!slot)fails.push('No opening in the next 4 weeks');
  const f=factors(job,c.id,slot,B);return{crew:c.id,ok:!fails.length,fails,slot,f,score:score(f,w),needsRating:c.r[job.type]==null};}).sort((a,b)=>(b.ok-a.ok)||(b.score-a.score));}
const FDESC={jobType:'Admin’s 1 to 5 rating for this job type, times 20',skills:'Average of the crew’s ratings for the skills this job needs, times 20',speed:'Speed rating, times 20',reliability:'Reliability rating, times 20',quality:'Quality rating, times 20',communication:'Communication rating, times 20',care:'Jobsite care rating, times 20',independence:'Independence rating, times 20',client:'Client-facing rating, times 20',
 record:'Painter days used vs sold, last 12 months. Each 1% over costs 6 points',cost:'Pay ÷ painter days sold, compared to the company average ($152)',distance:'100, minus 2 per minute of drive from their home base',timing:'100 if they can start on the first possible day, minus 12 per day later',balance:'Share of the next 4 weeks they still have open',language:'Speaks the language the client asked for (from the crew’s languages field)'};
const fdesc=k=>FDESC[k]||`${dimL(k)} rating, times 20`;
const flabel=k=>(factorList().find(x=>x[0]===k)||[k,dimL(k)])[1];
function whyLines(job,r){const c=crewById(r.crew),w=weights(job.id),L=[];const h=hist(r.crew);const dm=driveMin(c.f.base,job.area);
 const add=(k,t)=>L.push([k,(r.f[k]||0)*(w[k]||0.1),t]);
 add('jobType',`Rated ${c.r[job.type]} of 5 for ${dimL(job.type).toLowerCase()}`);
 if(job.skills.length)add('skills',`${job.skills.map(k=>`${dimL(k)} ${c.r[k]??'not rated'}`).join(', ')}`);
 add('quality',`Quality ${c.r.quality??'not rated'}, reliability ${c.r.reliability??'not rated'}`);
 add('record',h?`Used ${h.overPct<=0?Math.abs(h.overPct)+'% fewer':h.overPct+'% more'} painter days than sold`:'No job history yet');
 add('distance',dm!=null?`${dm} min drive from ${c.f.base}`:'Home base not set');
 add('timing',r.slot&&r.slot.s===job.earliest?`Can start ${dlabel(r.slot.s)}, the first possible day`:`First opening is ${r.slot?dlabel(r.slot.s):'not in the next 4 weeks'}`);
 if(job.lang!=='en')add('language',r.f.language>=100?`Speaks ${LANGS[job.lang]} with the client`:`Nobody listed who speaks ${LANGS[job.lang]}`);
 const s=[...L].sort((a,b)=>b[1]-a[1]);const plus=s.slice(0,3).map(x=>x[2]);
 const minusK=Object.keys(w).filter(k=>w[k]>0&&r.f[k]!=null).sort((a,b)=>r.f[a]-r.f[b])[0];
 const mt=minusK&&r.f[minusK]<70?({timing:`Can’t start until ${r.slot?dlabel(r.slot.s):'later'}`,distance:`${dm} min drive`,record:h?`Used ${h.overPct}% more painter days than sold`:'No job history yet',cost:'Costs more per painter day than average',balance:`Already ${100-r.f.balance}% booked`,language:`Nobody listed who speaks ${LANGS[job.lang]}`}[minusK]||`${flabel(minusK)} is lower (${r.f[minusK]})`):null;
 return{plus,minus:mt};}
function ruleChecks(job,cid,r){const c=crewById(cid);const L=[];const rt=c.r[job.type];
 L.push([rt!=null&&rt>=S.rules.minType||(rt==null&&S.rules.untested),`${dimL(job.type)} rating ${S.rules.minType}+`,rt==null?'Not rated yet':`Rated ${rt}`]);
 if(job.built<1978&&S.rules.lead)L.push([c.f.leadSafe===true,`Lead-safe certified (home built ${job.built})`,c.f.leadSafe===true?'On file':'Not on file']);
 if(imp(job)&&S.rules.imp)L.push([(c.r.quality||0)>=S.rules.impBar&&(c.r.client||0)>=S.rules.impBar,`Quality and client-facing ${S.rules.impBar}+ (important client)`,`Quality ${c.r.quality??'not rated'}, client-facing ${c.r.client??'not rated'}`]);
 const dm=driveMin(c.f.base,job.area);L.push([dm!=null&&dm<=S.rules.maxDrive,`Within ${S.rules.maxDrive} min drive`,dm!=null?`${dm} min from ${c.f.base}`:'No home base']);
 L.push([!!r.slot&&r.slot.e<=job.deadline,`Done by ${dlabel(job.deadline)}`,r.slot?`Earliest finish ${dlabel(r.slot.e)}`:'No opening in 4 weeks']);
 return L;}
function crewPay(job,cid){const h=hist(cid);const rate=h?h.costSold:AVG_COST;return{amt:Math.round(painterDays(job)*rate/10)*10,rate,src:h?'their cost per painter day sold':'company average per painter day'};}
/* ============ Riley ============ */
function rileyPick(jid){const job=JOBS[jid];const R=rank(jid).filter(r=>r.ok);if(!R.length)return null;
 const p=S.riley.learned.find(x=>x.status==='kept'&&x.crew&&x.test(job)&&R.some(r=>r.crew===x.crew));
 if(p)return{crew:p.crew,why:p.text,n:p.n,pattern:true};
 const av=S.riley.learned.find(x=>x.status==='kept'&&x.avoid&&x.test(job));
 const pick=R.find(r=>!av||r.crew!==av.avoid)||R[0];return{crew:pick.crew,why:pick===R[0]?'Agrees with the ranking.':av.text,pattern:pick!==R[0]};}
function rileyLearn(jid,crew,reason){const rp=rileyPick(jid);S.riley.observed++;const agree=rp&&rp.crew===crew;if(agree)S.riley.agreed++;
 const t=JOBS[jid].type;const bt=S.riley.byType[t]||(S.riley.byType[t]=[0,0]);bt[0]++;if(agree)bt[1]++;
 const who=ME().split(' (')[0];if(S.riley.from[who])S.riley.from[who].n++;
 if(!agree&&rp){const txt=`${who} picked ${crewById(crew).name} over ${crewById(rp.crew).name} for ${JOBS[jid].title}${reason?`. Reason: ${reason}`:''}.`;S.riley.learned.unshift({id:'p'+Date.now(),text:txt,crew:null,test:()=>false,n:1,status:'new'});}
 return agree;}
const rileyPct=()=>Math.round(S.riley.agreed/S.riley.observed*100);
const STAGES=[['Watching','Learns from every decision. Shows its pick, books nothing.'],['Suggesting','Its pick shows first. A scheduler still confirms every job.'],['Booking small jobs','Books jobs under $2,500 on its own. Every booking is logged and can be undone.'],['Booking with approval','Plans the whole queue. A scheduler approves the plan.']];
