/* ================= v7: Nico + Oct 26 feedback ================= */
/* ---------- users: Ido (admin), Carla and Jessie (schedulers) ---------- */
PEOPLE.scheduler2='Jessie T. (Scheduler)';
const _isAdminOld=isAdmin;
(()=>{const seg=document.querySelector('.seg.role');if(seg){seg.setAttribute('aria-label','Signed in as');seg.innerHTML='<button data-role="admin">Ido · Admin</button><button data-role="scheduler">Carla · Scheduler</button><button data-role="scheduler2">Jessie · Scheduler</button>';}
 const t=document.querySelector('.today');if(t&&!document.querySelector('.tourbtn')){const b=document.createElement('button');b.className='tourbtn';b.dataset.act='tour';b.innerHTML='▶ Tour';b.title='Watch the 2-minute tour';t.insertBefore(b,t.querySelector('.fb'));}})();
/* activity tracking across admin and schedulers */
S.act=[
 {t:'Oct 26, 8:12 AM',who:'Carla M. (Scheduler)',what:'job',x:'Hernandez exterior'},{t:'Oct 26, 8:14 AM',who:'Carla M. (Scheduler)',what:'job',x:'Okafor trim & door'},{t:'Oct 26, 8:31 AM',who:'Carla M. (Scheduler)',what:'view',x:'Calendar'},
 {t:'Oct 26, 9:05 AM',who:'Jessie T. (Scheduler)',what:'view',x:'Calendar'},{t:'Oct 26, 9:07 AM',who:'Jessie T. (Scheduler)',what:'opt',x:'Optimizer'},{t:'Oct 26, 9:20 AM',who:'Jessie T. (Scheduler)',what:'job',x:'Patel kitchen cabinets'},
 {t:'Oct 26, 10:02 AM',who:'Ido D. (Admin)',what:'view',x:'Setup'},{t:'Oct 26, 10:05 AM',who:'Ido D. (Admin)',what:'view',x:'Riley'}];
S.log.push({ts:NOW-0.6*864e5,t:'Oct 26, 8:40 AM',who:'Carla M. (Scheduler)',type:'Edit',text:'Texted Priya Patel the color form for Patel kitchen cabinets.',job:'Patel kitchen cabinets'},
 {ts:NOW-0.55*864e5,t:'Oct 26, 9:12 AM',who:'Jessie T. (Scheduler)',type:'Optimizer',text:'Ran the optimizer for the next 2 weeks. Rejected moving Okafor to Gian: crew isn’t available then.',job:''},
 {ts:NOW-0.5*864e5,t:'Oct 26, 10:04 AM',who:'Ido D. (Admin)',type:'Setting',text:'Minimum job-type rating set to 3.',job:''});
S.log.sort((a,b)=>b.ts-a.ts);
const VIEWN={queue:'Ready to schedule',riley:'Riley',cal:'Calendar',crews:'Crews',clients:'Clients',msgs:'Messages',audit:'Audit log',setup:'Setup',onboard:'Get started',ideas:'Ideas'};
document.addEventListener('click',e=>{const g=e.target.closest('[data-go]');if(g&&VIEWN[g.dataset.go])S.act.unshift({t:stamp(),who:ME(),what:'view',x:VIEWN[g.dataset.go]});
 const m=e.target.closest('[data-act="match"]');if(m&&JOBS[m.dataset.v])S.act.unshift({t:stamp(),who:ME(),what:'job',x:JOBS[m.dataset.v].title});
 const o=e.target.closest('[data-act="optimize"]');if(o)S.act.unshift({t:stamp(),who:ME(),what:'opt',x:'Optimizer'});},true);
/* ---------- clients, CRM ---------- */
const CLIENTS=[
 {id:'hernandez',name:'Rosa & Daniel Hernandez',first:'Rosa',phone:'(305) 555-0141',email:'rosa.h@example.com',channel:'whatsapp',lang:'es',area:'Pinecrest',addr:'7840 SW 112 St, Pinecrest',sf:{id:'0015g00000HZr1Q',match:'Name and address'},jobs:['hernandez'],past:[['2019','Interior repaint','Tania','5★']],notes:'Returning client. Has referred 5 jobs. Gate code in PaintScout.'},
 {id:'okafor',name:'James Okafor',first:'James',phone:'(305) 555-0187',email:'jokafor@example.com',channel:'text',lang:'en',area:'Pinecrest',addr:'6120 SW 128 St, Pinecrest',sf:{id:'0015g00000HZs7K',match:'Email'},jobs:['okafor'],past:[],notes:''},
 {id:'patel',name:'Priya Patel',first:'Priya',phone:'(786) 555-0112',email:'priya.patel@example.com',channel:'text',lang:'en',area:'Kendall',addr:'9301 SW 104 Ct, Kendall',sf:{id:'0015g00000HZt2B',match:'Phone'},jobs:['patel'],past:[],notes:'Colors not picked yet. Color form sent.'},
 {id:'gutierrez',name:'Ana Gutierrez',first:'Ana',phone:'(305) 555-0166',email:'',channel:'whatsapp',lang:'ht',area:'Coral Gables',addr:'1420 Sorolla Ave, Coral Gables',sf:null,jobs:['gutierrez'],past:[],notes:'Prefers Haitian Creole.'},
 {id:'morales',name:'Luis & Carmen Morales',first:'Carmen',phone:'(305) 555-0199',email:'cmorales@example.com',channel:'whatsapp',lang:'es',area:'South Miami',addr:'6410 SW 58 Pl, South Miami',sf:{id:'0015g00000HZm9A',match:'Name and address'},jobs:[],past:[['2021','Interior repaint','Gian','5★']],notes:'Past client. Dogs in the backyard.'},
 {id:'ortega',name:'Ortega family',first:'Marisol',phone:'(786) 555-0134',email:'ortega.fam@example.com',channel:'text',lang:'es',area:'Westchester',addr:'8820 SW 40 St, Westchester',sf:{id:'0015g00000HZq4D',match:'Name and address'},jobs:[],past:[['2026','Exterior repaint','Rigo','On the calendar']],notes:''}];
const SF_DIR=['Thao Nguyen','Marcy Feld','Hector Delgado','Brightwater HOA'];
const clientByName=n=>{if(!n)return null;const ln=String(n).toLowerCase().split(/[ &]/).filter(Boolean).pop();return CLIENTS.find(c=>c.name.toLowerCase()===String(n).toLowerCase())||CLIENTS.find(c=>c.name.toLowerCase().split(/[ &]/).includes(ln));};
const clientOfJob=j=>JOBS[j]?clientByName(JOBS[j].client):null;
SRC.history=['From this client’s past jobs','src-hist'];
function clientHistoryFill(d,src){const c=clientByName(d.client);d.clientId=c?c.id:null;if(!c||!c.past.length)return;
 if(!d.lang&&c.lang){d.lang=c.lang;src.lang='history';}
 if(!d.impOn){d.impOn=true;d.important=`Returning client (${c.past[0][0]} ${c.past[0][1].toLowerCase()})`;}}
const crmChip=c=>c?(c.sf?`<button class="chip crm" data-act="client" data-v="${c.id}" title="Matched in Salesforce by ${esc(c.sf.match.toLowerCase())}">${ICON.check||'✓'} Salesforce</button>`:`<button class="chip warn" data-act="client" data-v="${c.id}">Not in Salesforce</button>`):'';
/* ---------- calendar: working-day runs, resize, split ---------- */
function runsOf(x,opts){if(x.half)return[evOf(x,opts)];const runs=[];let cur=null;
 for(let d=x.s;d<=x.e;d++){if(dayCap(x.crew,d)>0){if(cur&&cur[1]===d-1)cur[1]=d;else{cur=[d,d];runs.push(cur);}}}
 if(!runs.length)return[];const p=x.jid?S.place[x.jid]:null;const multi=!!(p&&p.segs.length>1&&x.prop&&!x.extraCrew);
 return runs.map((r,i)=>{const e=evOf({...x,s:r[0],e:r[1]},opts);e.id+=':r'+i;e.extendedProps={...e.extendedProps,run:r.slice(),lastRun:i===runs.length-1};e.durationEditable=multi&&i===runs.length-1;return e;});}
function segCap(cs,a,z){let c=0;for(let d=a;d<=z;d++)c+=capAll(cs,d);return c;}
function nextWork(cs,d){while(d<41&&!capAll(cs,d))d++;return d;}
function rebalance(jid,fixed){const p=S.place[jid];const job=JOBS[jid];const cs=crewsOf(p.crew,p.extra);const n=need(job,p.crew,p.extra).n;
 const f=p.segs[fixed];const rem=n-segCap(cs,f[0],f[1]);const o=fixed===0?1:0;
 if(rem<=0.01){p.segs=[f];return 'one';}
 if(!p.segs[o])p.segs.push([nextWork(cs,nextWork(cs,f[1]+1)+1),0]);
 const g=p.segs[o];
 if(o>fixed){if(g[0]<=f[1]+1)g[0]=nextWork(cs,f[1]+2);g[0]=nextWork(cs,g[0]);let c=0,d=g[0];while(d<41){c+=capAll(cs,d);if(c>=rem-1e-6)break;d++;}g[1]=d;}
 else{g[0]=nextWork(cs,g[0]);let c=0,d=g[0];while(d<41){c+=capAll(cs,d);if(c>=rem-1e-6)break;d++;}g[1]=d;if(g[1]>=f[0]-1){const sh=g[1]-f[0]+2;f[0]+=sh;f[1]+=sh;f[0]=nextWork(cs,f[0]);}}
 p.segs.sort((a,b)=>a[0]-b[0]);return 'two';}
function splitVisits(jid){const p=S.place[jid];const cs=crewsOf(p.crew,p.extra);const wd=[];for(let d=pS(p);d<=pE(p);d++)if(capAll(cs,d))wd.push(d);
 if(wd.length<2)return;const k=Math.ceil(wd.length/2);p.segs=[[wd[0],wd[k-1]]];rebalance(jid,0);}
function onResize(info){const x=info.event.extendedProps;if(x.kind!=='job'||!x.lastRun){info.revert();return;}
 const p=S.place[x.id];const sg=p&&p.segs[x.seg];const end=idxOfDate(info.event.end)-1;
 if(!sg||end<sg[0]){info.revert();return;}
 const cs=crewsOf(p.crew,p.extra);let e2=end;while(e2>sg[0]&&!capAll(cs,e2))e2--;sg[1]=e2;
 const r=rebalance(x.id,x.seg);render();
 const wd=a=>{let n=0;for(let d=a[0];d<=a[1];d++)if(capAll(cs,d))n++;return n;};
 toast(r==='one'?'All the work fits in one visit now':`Visit 1: ${plural(wd(p.segs[0]),'working day')}. Visit 2: ${plural(wd(p.segs[1]),'working day')}`);}
/* who is recommending: optimizer or Riley picks need no reason */
function autoReason(jid){const p=S.place[jid];if(!p)return null;if(p.by&&p.byCrew===p.crew)return p.by;const rp=rileyPick(jid);if(rp&&rp.pattern&&rp.crew===p.crew)return 'Riley recommended';return null;}
const _applyMoves=applyMoves;applyMoves=function(m){const it=_applyMoves(m);it.forEach(mv=>{const p=S.place[mv.jid];if(p){p.by='Optimizer recommended';p.byCrew=mv.crew;}});return it;};
/* ---------- optimizer: margin and all crews ---------- */
S.optAll=false;S.optMargin=true;S._oc=false;
function margin(jid,cid){const job=JOBS[jid];if(!job||!job.value)return null;const pay=crewPay(job,cid).amt;return Math.round((job.value-pay)/job.value*100);}
function mgScore(jid,cid){if(!S.optMargin)return 0;const m=margin(jid,cid);return m==null?0:(m-55)/4;}
function optAllOk(r){if(!S._oc||!r.slot)return false;const c=crewById(r.crew);if(!c.f.size||!c.f.base)return false;return r.fails.every(f=>/^Not rated|rating is based on/.test(f));}
function openDays(B=bookings(),from=0,to=13){let n=0;activeCrews().filter(c=>ready(c)||(S._oc&&c.f.size&&c.f.base)).forEach(c=>{for(let d=from;d<=to;d++){if(!dayCap(c.id,d))continue;n+=1-occ(B,c.id,d);}});return n;}
const _optimize=optimize;optimize=function(k){S._oc=S.optAll;try{const m=_optimize(k);m.optAll=S.optAll;m.optMargin=S.optMargin;return m;}finally{S._oc=false;}};
M.opt=(()=>{const old=M.opt;return m=>{let h=old(m);let i=0;
 h=h.replace(/<div class="chips" style="margin-top:6px">/g,x=>{const mv=m.moves[i++];if(!mv)return x;const mg=mv.mg!=null?mv.mg:margin(mv.jid,mv.crew);return x+(mg!=null?`<span class="chip ${mg>=60?'good':mg>=45?'':'warn'}">Margin ${mg}% after crew pay</span>`:'')+(mv.notReady?'<span class="chip warn">Crew not fully set up</span>':'');});
 const opts=`<div class="optopts"><div class="hr"><span class="grow"><b>Crews to use</b><span class="tiny" style="display:block">All crews adds crews that still need ratings. Their picks are marked.</span></span><div class="seg" role="group" aria-label="Crews to use"><button aria-pressed="${!S.optAll}" data-act="optall" data-v="0">Ready to match</button><button aria-pressed="${S.optAll}" data-act="optall" data-v="1">All crews</button></div></div>
  <div class="hr"><span class="grow"><b>Weigh margin</b><span class="tiny" style="display:block">Prefers the crew that leaves more of the sold price after crew pay</span></span><button class="tog ${S.optMargin?'on':''}" data-act="optmargin" role="switch" aria-checked="${S.optMargin}" aria-label="Weigh margin"><i></i></button></div></div>`;
 h=h.replace('<div class="hr"><span class="grow">Don’t move confirmed jobs',opts+'<div class="hr"><span class="grow">Don’t move confirmed jobs');
 h=h.replace('</ol>','<li>Margin counts too: each point of margin after crew pay above 55% adds a quarter point. Turn it off below.</li></ol>');return h;};})();
/* ---------- Riley: why link, learned list, daily updates ---------- */
function learnedList(R){const open=R.learned.filter(p=>p.status==='new');const done=R.learned.filter(p=>p.status!=='new');
 const row=p=>`<div class="lrn new"><div class="grow"><div>${esc(p.text)}</div><div class="tiny">Seen in ${plural(p.n,'decision')} · New, waiting for review</div></div>${isAdmin()?`<span class="row" style="gap:6px"><button class="btn sm line" data-act="lkeep" data-v="${p.id}">Keep</button><button class="btn sm line" data-act="lignore" data-v="${p.id}">Ignore</button></span>`:''}</div>`;
 const small=p=>`<div class="lrn-l"><span class="chip ${p.status==='kept'?'good':''}">${p.status==='kept'?'Kept':'Ignored'}</span><span class="small grow">${esc(p.text)}</span>${isAdmin()?`<button class="lnk" data-act="${p.status==='kept'?'lignore':'lkeep'}" data-v="${p.id}">${p.status==='kept'?'Ignore':'Keep'}</button>`:''}</div>`;
 return (open.length?open.map(row).join(''):'<p class="small muted" style="margin:0 0 8px">Nothing new to review. New habits show up here after tonight’s update.</p>')+(done.length?`<details class="logged" ${S.loggedOpen?'open':''} data-logged><summary><b>Logged</b> <span class="tiny">${done.filter(p=>p.status==='kept').length} kept · ${done.filter(p=>p.status==='ignored').length} ignored</span></summary>${done.map(small).join('')}</details>`:'');}
M.rwhy=m=>{const job=JOBS[m.id];const rp=rileyPick(m.id);const R=rank(m.id).filter(r=>r.ok);const me=R.find(r=>r.crew===rp.crew)||R[0];const c=crewById(rp.crew);const i=R.indexOf(me);const nx=R[i===0?1:0];
 const wl=whyLines(job,me);const sim=S.riley.trainLog.filter(x=>x.job.toLowerCase().includes(job.type==='cabinets'?'cabinet':job.type)).slice(0,4);
 return MW('Why Riley picked this crew',`<div class="eyebrow">Riley · ${STAGES[S.riley.stage][0]}</div><div class="row" style="gap:12px;margin:4px 0 10px">${riley(44)}<h2 class="mt" style="margin:0">Why ${esc(c.name)} for ${esc(job.title)}?</h2></div>
 ${rp.pattern?`<div class="check ok"><i>✓</i><span><b>A habit your team kept:</b> ${esc(rp.why)} Seen in ${plural(rp.n||1,'decision')}.</span></div>`:`<div class="check ok"><i>✓</i><span><b>Top of the ranking.</b> ${esc(c.name)} has the highest match score (${me.score}) for the “${esc(rankName(m.id))}” label.</span></div>`}
 <h3 class="mh">What stands out</h3><ul class="why">${wl.plus.map(x=>`<li>${esc(x)}</li>`).join('')}${wl.minus?`<li class="minus">${esc(wl.minus)}</li>`:''}</ul>
 ${nx?`<div class="hr"><span class="grow">Next best: <b>${esc(crewById(nx.crew).name)}</b></span><span class="small num">${nx.score} vs ${me.score}</span></div>`:''}
 <h3 class="mh">Similar decisions your team made</h3>${sim.length?sim.map(x=>`<div class="hr"><span class="grow small">${esc(x.who)} · ${esc(x.job)}</span><span class="small">${x.agree?'picked':'<b>picked</b>'} ${esc(x.pick)}${x.agree?'':` over ${esc(x.rp)}`}</span></div>`).join(''):'<p class="small muted">None yet for this job type.</p>'}
 <p class="tiny" style="margin-top:10px">${S.riley.stage===0?'Riley is in Training: it shows its pick and books nothing. ':''}Riley agrees with your team ${rileyPct()}% of the time so far.</p>
 <div class="row" style="margin-top:12px;flex-wrap:wrap"><button class="btn tape" data-act="rwhypick" data-v="${m.id}">Use ${esc(c.name)}</button><button class="btn line" data-go="riley">How Riley learns</button><button class="btn line" data-act="closemodal2">Close</button></div>`);};
const DKEY=t=>String(t||'').split(',')[0];
const QDAY={q1:'Oct 24',q2:'Oct 25',q3:'Oct 26'};
function dayDigest(day){const short=w=>w.split(' (')[0];
 const L=S.log.filter(x=>DKEY(x.t)===day);const T=S.riley.trainLog.filter(x=>DKEY(x.t)===day);const A=S.act.filter(x=>DKEY(x.t)===day);
 const who=[...new Set([...L.map(x=>short(x.who)),...T.map(x=>x.who),...A.map(x=>short(x.who))])].filter(w=>!/Estimator/.test(w)&&w!=='Dana R.');
 const per=who.map(w=>{const l=L.filter(x=>short(x.who)===w);const t=T.filter(x=>x.who===w);const a=A.filter(x=>short(x.who)===w);const bits=[];
  const booked=Math.max(t.length,l.filter(x=>/^Confirmed/.test(x.text)).length);if(booked)bits.push(plural(booked,'job')+' booked');
  const ov=t.filter(x=>!x.agree).length;if(ov)bits.push(plural(ov,'pick')+' different from Riley');
  const mv=l.filter(x=>/^Moved/.test(x.text)).length;if(mv)bits.push(plural(mv,'move'));
  const ms=l.filter(x=>x.type==='Message').length;if(ms)bits.push(plural(ms,'message batch','message batches'));
  const op=l.filter(x=>x.type==='Optimizer').length+a.filter(x=>x.what==='opt').length;if(op)bits.push(plural(op,'optimizer run'));
  const st=l.filter(x=>/Setting|Crew data|Export/.test(x.type)).length;if(st)bits.push(plural(st,'setup change'));
  const jo=new Set(a.filter(x=>x.what==='job').map(x=>x.x)).size;if(jo)bits.push(plural(jo,'job')+' opened');
  const vw=a.filter(x=>x.what==='view').length;if(vw&&!bits.length)bits.push(plural(vw,'screen')+' visited');
  return[w,bits];});
 const learned=T.filter(x=>!x.agree).map(x=>`${x.who} picked ${x.pick} over ${x.rp} for ${x.job}${x.reason?` (${x.reason.toLowerCase()})`:', no reason given'}.`);
 const agreeN=T.filter(x=>x.agree).length;if(agreeN)learned.unshift(`Matched ${agreeN} of ${T.length} picks your schedulers made.`);
 L.filter(x=>/habit Riley learned/.test(x.text)).forEach(x=>learned.push(x.text.replace(/^Kept a habit Riley learned: /,'Now using: ')));
 const qs=S.riley.questions.filter(q=>(q.day||QDAY[q.id])===day);
 return{per,learned,qs,empty:!per.length&&!learned.length&&!qs.length};}
function rileyDaily(){const today=stamp().split(',')[0];const days=[...new Set([today,'Oct 26',...S.log.map(x=>DKEY(x.t)),...S.riley.trainLog.map(x=>DKEY(x.t)),...S.act.map(x=>DKEY(x.t))])];
 const ord=d=>{const[m,n]=d.split(' ');return ({Oct:10,Nov:11,Dec:12}[m]||0)*100+(+n||0);};days.sort((a,b)=>ord(b)-ord(a));
 const shown=days.slice(0,S.digestAll?14:5);
 return `<section class="card pad digest"><div class="row" style="flex-wrap:wrap"><div class="grow"><h3 style="font-size:18px">Riley’s daily update</h3><p class="tiny" style="margin:2px 0 0">Written every night at 2:00 AM from what Ido, Carla and Jessie did that day: what Riley learned and what it wants to ask.</p></div><span class="chip">${shown.length} days</span></div>
 ${shown.map((d,i)=>{const g=dayDigest(d);const isToday=d===today;return `<details class="dday" ${i===0?'open':''}><summary><b>${isToday?'Today so far':esc(d)}</b><span class="tiny">${isToday?'Riley writes this up tonight at 2:00 AM':g.empty?'Quiet day':`${plural(g.per.length,'person','people')} active · ${plural(g.learned.length,'thing')} learned${g.qs.length?` · ${plural(g.qs.length,'question')}`:''}`}</span></summary>
  ${g.empty?'<p class="small muted">No scheduling activity.</p>':`<div class="dgrid"><div><div class="eyebrow">Who did what</div>${g.per.map(([w,b])=>`<div class="hr"><b style="min-width:84px">${esc(w)}</b><span class="small grow">${b.length?esc(b.join(' · ')):'<span class="faint">Signed in</span>'}</span></div>`).join('')||'<p class="tiny">No one active.</p>'}</div>
   <div><div class="eyebrow">What Riley learned</div>${g.learned.map(x=>`<div class="dl small">${esc(x)}</div>`).join('')||'<p class="tiny">Nothing new.</p>'}
   ${g.qs.length?`<div class="eyebrow" style="margin-top:10px">Questions it has</div>${g.qs.map(q=>`<div class="dl small">${esc(q.text)} ${q.ans?`<span class="chip good">Answered</span>`:'<a class="lnk" href="#rq">Answer below</a>'}</div>`).join('')}`:''}</div></div>`}</details>`;}).join('')}
 ${days.length>5?`<button class="lnk" data-act="digestall">${S.digestAll?'Show fewer days':'Show older days'}</button>`:''}</section>`;}
V.riley=(()=>{const old=V.riley;return()=>{let h=old();const i=h.indexOf('<section class="card pad" style="margin-top:14px"><div class="row"><h3 class="grow" style="font-size:18px">Milestones');
 h=h.replace('<h3 class="grow" style="font-size:17px">Riley’s questions</h3>','<h3 class="grow" style="font-size:17px" id="rq">Riley’s questions</h3>');
 return i>0?h.slice(0,i)+rileyDaily()+h.slice(i):h+rileyDaily();};})();
/* ---------- crew selection: collapsible weights and score breakdown ---------- */
const _drawer=drawer;drawer=function(job){return _drawer(job).replace('<button class="btn sm line" data-act="resetw">Reset</button>','<button class="btn sm line" data-act="resetw">Reset</button><button class="btn sm line" data-act="drawer" aria-expanded="true">Minimize</button>');};
S.facOpen={};
const _crewCard=crewCard;crewCard=function(job,r,i){let h=_crewCard(job,r,i);const open=S.facOpen[r.crew]!=null?S.facOpen[r.crew]:i===0;
 return h.replace(/<div class="factors">([\s\S]*?)<\/div>(\s*<div class="row" style="margin-top:14px)/,(x,inner,tail)=>`<details class="facd" data-fac="${r.crew}" ${open?'open':''}><summary><span class="when-open">Hide score breakdown</span><span class="when-closed">Show score breakdown</span></summary><div class="factors">${inner}</div></details>${tail}`);};
document.addEventListener('toggle',e=>{const d=e.target;if(d.dataset&&d.dataset.fac)S.facOpen[d.dataset.fac]=d.open;if(d.dataset&&d.dataset.logged!=null)S.loggedOpen=d.open;},true);
/* job header: client + CRM */
V.match=(()=>{const old=V.match;return()=>{const h=old();const job=J();const c=clientOfJob(job.id);
 return h.replace('<div class="chips" style="margin-top:8px">',`<div class="chips" style="margin-top:8px">${c?`<button class="chip" data-act="client" data-v="${c.id}">${esc(job.client)}</button>${crmChip(c)}`:`<span class="chip">${esc(job.client)}</span>`}`);};})();
V.add=(()=>{const old=V.add;return()=>{let h=old();const d=S.add.draft;if(S.add.stage!=='review'||!d)return h;const c=clientByName(d.client);
 const line=c?`<span class="tiny" style="display:block;margin-top:4px">${c.sf?`Matched in Salesforce (${esc(c.sf.match.toLowerCase())})`:'Known client, not in Salesforce yet'}${c.past.length?` · ${plural(c.past.length,'past job')}: ${esc(c.past.map(p=>p[0]+' '+p[1].toLowerCase()).join(', '))}`:''} · <button class="lnk" data-act="client" data-v="${c.id}">Open client</button></span>`:(d.client?`<span class="tiny" style="display:block;margin-top:4px">${SF_DIR.includes(d.client)?'Matched in Salesforce by name':'No match in Salesforce. We’ll create the account when you add the job'}</span>`:'');
 return h.replace('id="d-client">','id="d-client">'+line);};})();
/* ---------- who works well together, by job type ---------- */
const PAIRDATA=[['gian','tania',{commercial:4,exterior:2},-2],['gian','rigo',{exterior:3},1],['tania','johan-dani',{interior:3,commercial:1},-1],['johan-dani','rigo',{exterior:2,interior:1},0.5],['tania','maria',{interior:2},3],['gian','wonder-painting',{commercial:2},4],['paulo','vanderlay',{exterior:2},-1],['johan-dani','cabinet-canvas',{cabinets:2},-3],['rigo','paulo',{exterior:1},2]];
function pairsFor(cid,type){return PAIRDATA.filter(p=>p[0]===cid||p[1]===cid).map(p=>{const o=p[0]===cid?p[1]:p[0];const n=type==='all'?Object.values(p[2]).reduce((a,b)=>a+b,0):(p[2][type]||0);return[o,n,p[3],p[2]];}).filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1]);}
function pairNote(a,b,type){const p=pairsFor(a,type).find(x=>x[0]===b);return p?` · ${plural(p[1],'shared '+dimL(type).toLowerCase()+' job')}`:'';}
V.crews=(()=>{const old=V.crews;return()=>{let h=old();const i=h.indexOf('<section class="card pad" style="margin-top:16px"><div class="row" style="margin-bottom:10px;flex-wrap:wrap"><div class="grow"><h3 style="font-size:17px">Who works well together');if(i<0)return h;const j=h.indexOf('</section>',i)+10;
 const pc=crewById(S.pairCrew||'gian')||CREWS[0];const t=S.pairType||'all';const types=['all',...dimsOf('job').map(d=>d.k).filter(k=>PAIRDATA.some(p=>p[2][k]))];const prs=pairsFor(pc.id,t);
 const sec=`<section class="card pad" style="margin-top:16px"><div class="row" style="margin-bottom:10px;flex-wrap:wrap"><div class="grow"><h3 style="font-size:17px">Who works well together</h3><div class="small muted">Crews that shared jobs, by type of work. A good pair on cabinets isn’t always a good pair on exteriors.</div></div>
  <label class="tiny" for="paircrew">Crew</label><select class="in" id="paircrew" data-pair style="width:auto">${activeCrews().map(c=>`<option value="${c.id}" ${c.id===pc.id?'selected':''}>${esc(c.name)}</option>`).join('')}</select>${fbBtn('pairs')}</div>
  <div class="seg" role="group" aria-label="Job type" style="margin-bottom:10px;flex-wrap:wrap">${types.map(k=>`<button aria-pressed="${t===k}" data-act="pairtype" data-v="${k}">${k==='all'?'All work':dimL(k)}</button>`).join('')}</div>
  <div class="pairhead">${crewDot(pc.id)}<b>${esc(pc.name)}</b><span class="tiny">${sizeText(pc)} · ${esc(pc.f.base||'no base')}</span></div>
  ${prs.length?prs.map(([id,n,ov,by])=>{const o=crewById(id);return `<div class="prow">${crewDot(id)}<button class="lnk grow" data-act="crew" data-v="${id}"><b>${esc(o.name)}</b><span class="tiny" style="display:block">${Object.entries(by).map(([k,v])=>`${v} ${dimL(k).toLowerCase()}`).join(' · ')}</span></button><span class="pbar"><i style="width:${Math.min(100,n*18)}%;background:${o.c}"></i></span><span class="small num">${plural(n,'shared job')}</span><span class="chip ${ov>0?'warn':'good'}">${ov>0?'+':''}${ov}% days vs sold together</span></div>`;}).join(''):`<p class="small muted">${esc(pc.name)} hasn’t shared ${t==='all'?'any':dimL(t).toLowerCase()} jobs yet.</p>`}
  <p class="tiny" style="margin:10px 0 0">Sample data. In the product this comes from jobs where two crews were on the same calendar event. Shared counts also show when you add a second crew to a job.</p></section>`;
 return h.slice(0,i)+sec+h.slice(j);};})();
/* ---------- project managers, colors ---------- */
const PMS={bo:{name:'Bo',channel:'text',phone:'(305) 555-0170'},alan:{name:'Alan',channel:'email',phone:'(305) 555-0175'}};
Object.assign(TRIG,{colors:'Colors confirmed',followup:'Client follow-up'});
Object.keys(S.comm.triggers).forEach(k=>S.comm.triggers[k].pm=['confirm','move','cancel'].includes(k));S.comm.triggers.colors={crew:true,client:false,hoa:false,pm:true};
const COLORLINE={en:'\n\nOne more thing: we still need your color and material picks before we start. Reply here or use the color form we sent.',es:'\n\nUna cosa más: todavía necesitamos su selección de colores y materiales antes de comenzar. Responda aquí o use el formulario de colores que le enviamos.',ht:'\n\nYon lòt bagay: nou toujou bezwen chwa koulè ak materyèl ou yo anvan nou kòmanse. Reponn isit la oswa itilize fòm koulè nou voye a.',pt:'\n\nMais uma coisa: ainda precisamos da sua escolha de cores e materiais antes de começar. Responda aqui ou use o formulário de cores que enviamos.'};
function pmMsg(jid,trig){const job=JOBS[jid];const p=S.place[jid];const cs=crewsOf(p.crew,p.extra).map(crewById);const ok=job.colorsOk===true;
 const crewL=cs.map(c=>`${c.name}${c.f.phone?` (${c.f.phone})`:''}`).join(' + ');const dates=`${dtL(pS(p),'en')} to ${dtL(pE(p),'en')}`;
 if(trig==='cancel')return `Heads up: ${job.title} is off the calendar for now. Crew: ${crewL}. Hold any paint order. We’ll send a new date.`;
 if(trig==='move')return `Schedule change: ${job.title} now runs ${dates}. Crew: ${crewL}. Client: ${job.client}, ${job.area}.${ok?'':' Colors are still outstanding.'}`;
 return `New job for you: ${job.title}\nClient: ${job.client}, ${job.area}${job.hoa?' (HOA, 8 to 5)':''}\nCrew: ${crewL}\nDates: ${dates}\nWork: ${dimL(job.type).toLowerCase()}, ${painterDays(job)} painter days${job.built<1978?', lead-safe setup required':''}\nColors: ${job.colors.map(c=>c[0]).join(', ')}${ok?' (confirmed)':' (NOT confirmed yet, client has the color form)'}\nPaint order: ${ok?'ready to order':'hold until colors are confirmed'}`;}
const _buildMsgs=buildMsgs;buildMsgs=function(jid,trig){const out=_buildMsgs(jid,trig);const job=JOBS[jid];const p=S.place[jid];if(!p)return out;
 const cl=out.find(m=>m.role==='client');if(cl&&job.colorsOk!==true&&(trig==='confirm'||trig==='move')){const g=cl.gen;cl.gen=l=>g(l)+(COLORLINE[l]||COLORLINE.en);if(!cl.edited)cl.text=cl.gen(cl.lang);}
 if(p.pm&&PMS[p.pm]&&(S.comm.triggers[trig]||{}).pm){const pm=PMS[p.pm];const ek=jid+':pm';const m={key:'pm',role:'pm',to:`${pm.name} (PM)`,channel:S.msgCh[ek]||pm.channel,lang:'en',langs:['en'],job:job.title,trigger:trig,gen:()=>pmMsg(jid,trig),ek};m.text=S.msgEdit[ek]!=null?S.msgEdit[ek]:m.gen();m.edited=S.msgEdit[ek]!=null;out.push(m);}
 return out;};
const CCONF={en:(t,l)=>`Colors confirmed for ${t}: ${l}. You’re good to go.`,es:(t,l)=>`Colores confirmados para ${t}: ${l}. Todo listo.`,pt:(t,l)=>`Cores confirmadas para ${t}: ${l}. Tudo certo.`,ht:(t,l)=>`Koulè yo konfime pou ${t}: ${l}. Tout bagay pare.`};
function colorMsgs(jid){const job=JOBS[jid];const p=S.place[jid];if(!p)return[];const T=S.comm.triggers.colors;const list=job.colors.map(c=>c[0]).join(', ');const out=[];
 if(T.crew)crewsOf(p.crew,p.extra).forEach(cid=>{const c=crewById(cid);out.push({key:'crew:'+cid,role:'crew',to:`${c.name} (crew lead)`,channel:c.f.channel||'whatsapp',lang:c.f.clang||'es',langs:['en','es','pt','ht'],job:job.title,trigger:'colors',gen:l=>(CCONF[l]||CCONF.en)(job.title,list),ek:jid+':cc:'+cid});});
 if(T.pm&&p.pm&&PMS[p.pm])out.push({key:'pm',role:'pm',to:`${PMS[p.pm].name} (PM)`,channel:PMS[p.pm].channel,lang:'en',langs:['en'],job:job.title,trigger:'colors',gen:()=>`Colors confirmed for ${job.title} (${job.client}): ${list}. Paint order can go in. Crew: ${crewById(p.crew).name}, starts ${dtL(pS(p),'en')}.`,ek:jid+':ccpm'});
 out.forEach(m=>m.text=m.gen(m.lang));return out;}
function colorRow(job){if(job.colorsOk===true)return `<div class="hr" style="border-top:1px solid var(--line);margin-top:8px"><span class="grow small">✓ Colors confirmed</span></div>`;
 return `<div class="hr colorrow" style="border-top:1px solid var(--line);margin-top:8px"><span class="grow"><b>Colors not confirmed</b><span class="tiny" style="display:block">${job.colorsOk==='sent'?'Color form is with the client. ':''}The client message reminds them. When they confirm, the crew lead and PM get a heads-up.</span></span><span class="row" style="gap:6px;flex-wrap:wrap">${job.colorsOk==='sent'?'':`<button class="btn sm line" data-act="colors" data-v="${job.id}">Send color form</button>`}<button class="btn sm line" data-act="colorok" data-v="${job.id}">Mark confirmed</button></span></div>`;}
function pmRow(job,p){const sched=p.status==='scheduled';return `<div class="hr" style="border-top:1px solid var(--line);margin-top:8px"><span class="grow"><b>Project manager</b><span class="tiny" style="display:block">Gets the crew, client, type of work, dates and color status${sched?'':' when you confirm'}</span></span><select class="in sm" data-pm="${job.id}" style="width:auto" aria-label="Project manager"><option value="">Pick a PM</option>${Object.entries(PMS).map(([k,x])=>`<option value="${k}" ${p.pm===k?'selected':''}>${x.name}</option>`).join('')}</select>${sched&&p.pm?`<button class="btn sm line" data-act="pmsend" data-v="${job.id}">Send handoff</button>`:''}</div>`;}
const _planPanel=planPanel;planPanel=function(job){let h=_planPanel(job);const ar=autoReason(job.id);
 if(ar)h=h.replace(/Not the top-ranked crew \(([^)]*)\)\. You’ll add a reason when you confirm/,`Not the top-ranked crew ($1). ${ar}, so no reason needed`);return h;};
M.hub=(()=>{const old=M.hub;return m=>{let h=old(m);if(JOBS[m.id]&&JOBS[m.id].colorsOk!==true)h=h.replace('<span class="lk warn">Colors not confirmed</span>',`<span class="lk warn">Colors not confirmed</span><button class="lk" data-act="colorok" data-v="${m.id}">Mark confirmed</button>`);const c=clientOfJob(m.id);if(c)h=h.replace('<div class="links" style="margin-top:12px">',`<div class="links" style="margin-top:12px"><button class="lk" data-act="client" data-v="${c.id}">Client page</button>`);return h;};})();
/* ---------- templates ---------- */
const TEMPLATES=[
 {id:'t-follow',name:'Estimate follow-up',to:'client',text:{en:'Hi {first}, it’s {company}. Just checking in on your painting estimate. Any questions I can answer?',es:'Hola {first}, le escribe {company}. Solo queríamos saber si tiene preguntas sobre su presupuesto de pintura.',ht:'Bonjou {first}, se {company}. Nou jis vle konnen si w gen kesyon sou estimasyon penti w la.',pt:'Oi {first}, aqui é a {company}. Só passando para saber se tem dúvidas sobre o orçamento de pintura.'}},
 {id:'t-colors',name:'Colors and materials needed',to:'client',text:{en:'Hi {first}, it’s {company}. We still need your color and material picks for {job} before we start. Reply here with them, or use the color form.',es:'Hola {first}, le escribe {company}. Todavía necesitamos su selección de colores y materiales para {job} antes de comenzar. Respóndanos aquí o use el formulario de colores.',ht:'Bonjou {first}, se {company}. Nou toujou bezwen chwa koulè ak materyèl ou pou {job} anvan nou kòmanse. Reponn isit la oswa itilize fòm koulè a.',pt:'Oi {first}, aqui é a {company}. Ainda precisamos da sua escolha de cores e materiais para {job} antes de começar. Responda aqui ou use o formulário de cores.'}},
 {id:'t-intake',name:'Send us your details',to:'client',text:{en:'Hi {first}, it’s {company}. Please fill in your contact details and the best way to reach you here: {link}',es:'Hola {first}, le escribe {company}. Por favor complete sus datos de contacto y la mejor forma de comunicarnos aquí: {link}',ht:'Bonjou {first}, se {company}. Tanpri ranpli enfòmasyon kontak ou ak pi bon fason pou n jwenn ou isit la: {link}',pt:'Oi {first}, aqui é a {company}. Por favor preencha seus dados de contato e a melhor forma de falar com você aqui: {link}'}},
 {id:'t-late',name:'Crew running late',to:'client',text:{en:'Hi {first}, it’s {company}. {crew}’s crew is running about 30 minutes late today. Sorry about that.',es:'Hola {first}, le escribe {company}. El equipo de {crew} llegará unos 30 minutos tarde hoy. Disculpe.',ht:'Bonjou {first}, se {company}. Ekip {crew} ap an reta anviwon 30 minit jodi a. Eskize nou.',pt:'Oi {first}, aqui é a {company}. A equipe do {crew} vai atrasar uns 30 minutos hoje. Desculpe.'}},
 {id:'t-review',name:'After the job: ask for a review',to:'client',text:{en:'Hi {first}, thanks for choosing {company}. If you’re happy with the work, a quick Google review helps a lot: {link}',es:'Hola {first}, gracias por elegir a {company}. Si quedó contento con el trabajo, una reseña en Google nos ayuda mucho: {link}',ht:'Bonjou {first}, mèsi paske w chwazi {company}. Si w kontan ak travay la, yon ti revizyon sou Google ede nou anpil: {link}',pt:'Oi {first}, obrigado por escolher a {company}. Se gostou do trabalho, uma avaliação no Google ajuda muito: {link}'}}];
const AUTO_T=[['Job confirmed','Crew lead, client, HOA, PM'],['Job moved','Crew lead, client, PM'],['Job unscheduled','Crew lead, client, PM'],['Day-before reminder','Crew lead, client'],['Rain delay','Crew lead, client'],['Colors confirmed','Crew lead, PM']];
function fillT(t,c,jid){const job=jid?JOBS[jid]:(c&&c.jobs[0]?JOBS[c.jobs[0]]:null);const p=job&&S.place[job.id];return t.replace(/\{first\}/g,c?c.first:'there').replace(/\{company\}/g,COMPANY).replace(/\{job\}/g,job?job.title.toLowerCase():'your project').replace(/\{crew\}/g,p?crewById(p.crew).name:'our').replace(/\{link\}/g,'ppp.crewboard.app/c/'+(c?c.id:'new'));}
function templatesView(){const ed=isAdmin();const sel=TEMPLATES.find(t=>t.id===S.tplSel)||TEMPLATES[0];const l=S.tplLang||'en';
 return `<div class="split2 tplgrid"><section class="card pad"><div class="row"><h3 class="grow" style="font-size:17px">Your templates</h3>${ed?'<button class="btn sm line" data-act="tpladd">+ New template</button>':''}</div><p class="tiny" style="margin:4px 0 8px">Use these from any client page. Placeholders like {first} fill in automatically.</p>
  ${TEMPLATES.map(t=>`<button class="tplrow ${t===sel?'on':''}" data-act="tplsel" data-v="${t.id}"><b>${esc(t.name)}</b><span class="tiny">To client · ${Object.keys(t.text).length} languages</span></button>`).join('')}
  <h3 class="mh">Sent automatically</h3><p class="tiny" style="margin:0 0 6px">Written from the job details when the calendar changes. You can edit each one before it goes out.</p>${AUTO_T.map(([n,w])=>`<div class="hr"><span class="grow small"><b>${n}</b></span><span class="tiny">${w}</span></div>`).join('')}</section>
 <section class="card pad"><div class="row" style="flex-wrap:wrap"><h3 class="grow" style="font-size:17px">${esc(sel.name)}</h3><div class="seg" role="group" aria-label="Language">${['en','es','ht','pt'].map(k=>`<button aria-pressed="${l===k}" data-act="tpllang" data-v="${k}">${CLANGS[k]}</button>`).join('')}</div></div>
  ${ed?`<input class="in" data-tplname="${sel.id}" value="${esc(sel.name)}" aria-label="Template name" style="margin:10px 0 6px">`:''}
  <textarea class="in" rows="6" data-tpltext="${sel.id}" data-l="${l}" ${ed?'':'readonly'} style="margin-top:6px">${esc(sel.text[l]||'')}</textarea>
  <div class="tiny" style="margin-top:6px">Placeholders: {first} {company} {job} {crew} {link}${ed?'':' · Your admin edits templates.'}</div>
  <div class="eyebrow" style="margin-top:14px">Preview for Rosa Hernandez</div><div class="bubble" style="margin-top:6px">${esc(fillT(sel.text[l]||'',CLIENTS[0]))}</div>
  ${l!=='en'?'<div class="tiny" style="margin-top:6px">Have a native speaker check this translation before it goes live.</div>':''}</section></div>`;}
V.msgs=(()=>{const old=V.msgs;return()=>{const h=old();const cut=h.indexOf('<div class="row" style="flex-wrap:wrap;margin-bottom:12px">');const mv=S.msgView||'log';
 const seg=`<div class="seg" role="group" aria-label="Messages" style="margin-bottom:12px"><button aria-pressed="${mv==='log'}" data-act="msgview" data-v="log">Sent log</button><button aria-pressed="${mv==='tpl'}" data-act="msgview" data-v="tpl">Templates</button></div>`;
 return mv==='tpl'?h.slice(0,cut)+seg+templatesView():h.slice(0,cut)+seg+h.slice(cut);};})();
/* ---------- clients ---------- */
S.follow=[{cid:'patel',due:3,note:'Check if Priya picked colors'}];S.client=null;S.clientEdit=null;
function clientStatus(c){const j=c.jobs.map(x=>JOBS[x]).filter(Boolean);if(!j.length)return c.past.length?'Past client':'No open jobs';const p=S.place[j[0].id];return p?(p.status==='scheduled'?`Confirmed · ${dlabel(pS(p))}`:'Draft on the calendar'):'Waiting for a crew';}
V.clients=()=>{const q=(S.cq||'').toLowerCase();const list=CLIENTS.filter(c=>!q||c.name.toLowerCase().includes(q)||(c.area||'').toLowerCase().includes(q));const c=CLIENTS.find(x=>x.id===S.client)||null;const due=S.follow.filter(f=>!f.done);
 const lst=`<section class="card pad clist"><div class="row"><input class="in" placeholder="Search clients" data-cq value="${esc(S.cq||'')}" aria-label="Search clients"><button class="btn sm tape" data-act="clientadd">+ Add</button></div>
  ${due.length?`<div class="eyebrow" style="margin:12px 0 4px">Follow-ups due</div>${due.map(f=>{const x=CLIENTS.find(y=>y.id===f.cid);return `<button class="crow due" data-act="client" data-v="${x.id}"><b>${esc(x.name)}</b><span class="tiny">${esc(f.note)} · ${dlabel(f.due)}</span></button>`;}).join('')}`:''}
  <div class="eyebrow" style="margin:12px 0 4px">All clients</div>${list.map(x=>`<button class="crow ${c===x?'on':''}" data-act="client" data-v="${x.id}"><b>${esc(x.name)}</b><span class="tiny">${esc(x.area||'')} · ${esc(clientStatus(x))}</span>${x.sf?'':'<span class="chip warn" style="margin-top:4px">Not in Salesforce</span>'}</button>`).join('')||'<p class="small muted">No match.</p>'}</section>`;
 return `<div class="qhead"><div class="grow"><div class="eyebrow">Clients</div><h1>Clients</h1><p class="muted" style="margin:6px 0 0;max-width:640px">Contact details, Salesforce link, jobs and every message, in one place. Keep following up from here.</p></div>${fbBtn('clients')}</div>
 <div class="cgrid">${lst}${c?clientDetail(c):`<section class="card pad"><p class="muted">Pick a client to see their details and follow up.</p></section>`}</div>`;};
function clientDetail(c){const ed=S.clientEdit&&S.clientEdit.id===c.id;const E=ed?S.clientEdit:c;const thread=S.comms.filter(m=>m.role==='client'&&clientByName(m.to)===c);const tp=TEMPLATES.find(t=>t.id===S.ctpl)||null;const lang=S.clang||c.lang||'en';
 const row=(k,l,type)=>`<div class="hr"><span class="muted" style="width:120px">${l}</span><span class="grow">${ed?(type==='ch'?`<select class="in" data-cf="${k}">${Object.entries(CHANNELS).map(([v,t])=>`<option value="${v}" ${E[k]===v?'selected':''}>${t}</option>`).join('')}</select>`:type==='lang'?`<select class="in" data-cf="${k}">${['en','es','ht','pt'].map(v=>`<option value="${v}" ${E[k]===v?'selected':''}>${CLANGS[v]}</option>`).join('')}</select>`:`<input class="in" data-cf="${k}" value="${esc(E[k]||'')}">`):(type==='ch'?esc(CHANNELS[E[k]]||'–'):type==='lang'?esc(CLANGS[E[k]]||'–'):esc(E[k]||'–'))}</span></div>`;
 const fu=S.follow.filter(f=>f.cid===c.id&&!f.done);
 return `<div class="cdet"><section class="card pad"><div class="row" style="flex-wrap:wrap;gap:8px"><h2 class="grow" style="font-size:22px">${esc(c.name)}</h2>${c.sf?`<button class="chip crm" data-act="sfopen" data-v="${c.id}">Salesforce · ${esc(c.sf.id.slice(0,8))}… ↗</button>`:`<button class="btn sm line" data-act="sfcreate" data-v="${c.id}">Create in Salesforce</button>`}${ed?`<button class="btn sm tape" data-act="clientsave">Save</button><button class="btn sm line" data-act="clientcancel">Cancel</button>`:`<button class="btn sm line" data-act="clientedit" data-v="${c.id}">Edit</button>`}</div>
  <p class="tiny" style="margin:4px 0 10px">${c.sf?`Linked to the Salesforce account, matched by ${esc(c.sf.match.toLowerCase())}. Changes here sync back.`:'Not in Salesforce yet. Create the account to keep both in sync.'} Sample data.</p>
  ${row('first','First name')}${row('phone','Phone')}${row('email','Email')}${row('channel','Reach them by','ch')}${row('lang','Language','lang')}${row('addr','Address')}${row('notes','Notes')}</section>
 <section class="card pad"><h3 style="font-size:17px">Jobs</h3>${c.jobs.map(j=>{const job=JOBS[j];return `<div class="hr"><span class="grow"><b>${esc(job.title)}</b><span class="tiny" style="display:block">${money(job.value)} · ${esc(clientStatus({jobs:[j],past:[]}))} · ${job.colorsOk===true?'colors confirmed':'colors not confirmed'}</span></span><button class="btn sm line" data-act="match" data-v="${j}">Open</button></div>`;}).join('')}
  ${c.past.map(p=>`<div class="hr"><span class="grow small">${esc(p[0])} · ${esc(p[1])}</span><span class="tiny">${esc(p[2])} · ${esc(p[3])}</span></div>`).join('')}${!c.jobs.length&&!c.past.length?'<p class="small muted">No jobs yet.</p>':''}</section>
 <section class="card pad"><div class="row" style="flex-wrap:wrap"><h3 class="grow" style="font-size:17px">Messages</h3><span class="tiny">Outbound. Replies come in on ${esc(CHANNELS[c.channel]||'their phone')} as usual.</span></div>
  ${thread.length?thread.slice(0,6).map(m=>`<div class="lrow">${chBadge(m.channel)}<div class="grow" style="min-width:0"><div class="tiny">${esc(m.t)} · ${esc(TRIG[m.trigger]||m.trigger)} · ${esc(m.by)}</div><div class="bubble" style="margin-top:4px">${esc(m.text)}</div></div></div>`).join(''):'<p class="small muted">No messages yet.</p>'}
  <div class="compose"><div class="row" style="flex-wrap:wrap;gap:6px"><select class="in sm" data-ctpl aria-label="Template" style="width:auto"><option value="">Write your own…</option>${TEMPLATES.map(t=>`<option value="${t.id}" ${S.ctpl===t.id?'selected':''}>${esc(t.name)}</option>`).join('')}</select><select class="in sm" data-cch aria-label="Channel" style="width:auto">${Object.entries(CHANNELS).map(([k,l])=>`<option value="${k}" ${(S.cch||c.channel)===k?'selected':''}>${l}</option>`).join('')}</select><select class="in sm" data-clang aria-label="Language" style="width:auto">${['en','es','ht','pt'].map(k=>`<option value="${k}" ${lang===k?'selected':''}>${CLANGS[k]}</option>`).join('')}</select></div>
   <textarea class="in" rows="4" id="cmsg" style="margin-top:8px" placeholder="Message to ${esc(c.first)}">${esc(S.cdraft!=null?S.cdraft:tp?fillT(tp.text[lang]||tp.text.en,c):'')}</textarea>
   <div class="row" style="margin-top:8px;flex-wrap:wrap"><button class="btn sm tape" data-act="csend" data-v="${c.id}">Send</button><span class="tiny">Follow up in</span>${[[2,'2 days'],[3,'3 days'],[7,'a week']].map(([n,l])=>`<button class="pill" data-act="cfollow" data-v="${n}">${l}</button>`).join('')}</div>
   ${fu.map(f=>`<div class="check wn" style="margin-top:8px"><i>!</i><span class="grow">Follow-up due ${dlabel(f.due)}: ${esc(f.note)}</span><button class="lnk" data-act="cfdone" data-v="${S.follow.indexOf(f)}">Done</button></div>`).join('')}</div></section></div>`;}
M.clientadd=m=>MW('Add a client',`<div class="eyebrow">Clients</div><h2 class="mt">Add a client</h2><p class="small muted">We check Salesforce for a match when you save.</p>
 ${[['name','Full name'],['phone','Phone'],['email','Email'],['addr','Address']].map(([k,l])=>`<label class="tiny" for="na-${k}">${l}</label><input class="in" id="na-${k}" style="margin:4px 0 10px">`).join('')}
 <div class="row" style="gap:8px"><label class="tiny grow">Reach them by<select class="in" id="na-ch">${Object.entries(CHANNELS).map(([k,l])=>`<option value="${k}">${l}</option>`).join('')}</select></label><label class="tiny grow">Language<select class="in" id="na-lang">${['en','es','ht','pt'].map(k=>`<option value="${k}">${CLANGS[k]}</option>`).join('')}</select></label></div>
 <div class="row" style="margin-top:14px;flex-wrap:wrap"><button class="btn tape" data-act="clientaddok">Save client</button><button class="btn line" data-act="clientintake">Send them the details form instead</button><button class="btn line" data-act="closemodal2">Cancel</button></div>`);
/* ---------- onboarding tour, Apple style ---------- */
S.tour={on:false,i:0};try{if(!localStorage.getItem('cb_tour_v1'))S.tour.on=true;}catch(_){S.tour.on=true;}
const CLIP={
 intake:`<div class="clip ci"><div class="c-doc"><i></i><i></i><i></i><i></i></div><div class="c-card"><div class="c-f f1"><span>Client</span><b>Rosa Hernandez</b><em>✓</em></div><div class="c-f f2"><span>Crew hours</span><b>120</b><em>✓</em></div><div class="c-f f3"><span>Finish by</span><b>Nov 13</b><em>✓</em></div><div class="c-f f4 miss"><span>Earliest start</span><b>Not in the estimate</b><em>!</em></div></div></div>`,
 rank:`<div class="clip cr"><div class="c-riley"><span class="c-av"></span><span>Riley would pick <b>Gian</b> · <u>Why?</u></span></div><div class="c-rc r1"><span class="c-ring">92</span><b>Gian</b><span class="c-chip">Best fit</span></div><div class="c-rc r2"><span class="c-ring">84</span><b>Tania</b></div><div class="c-rc r3"><span class="c-ring">77</span><b>Rigo</b></div></div>`,
 cal:`<div class="clip cc"><div class="c-grid">${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=>`<span class="c-h">${d}</span>`).join('')}${[0,1,2].map(r=>[0,1,2,3,4,5,6].map(d=>`<span class="c-cell ${d===6||(d===5&&r!==1)?'off':''} ${r===0&&d<2?'busy':''} ${r===2&&d>2&&d<5?'busy':''}"></span>`).join('')).join('')}<span class="c-job">Hernandez</span></div><div class="c-hint">Weekends only for crews that work them</div></div>`,
 msgs:`<div class="clip cm"><div class="c-b b1"><span class="c-ch wa">WhatsApp · Español</span>Nuevo trabajo: Hernandez exterior · sábado 7 de noviembre</div><div class="c-b b2"><span class="c-ch tx">Text · Client</span>Your exterior painting project starts Saturday, November 7.</div><div class="c-b b3"><span class="c-ch em">Text · Bo, PM</span>Crew: Gian · Colors: confirmed · Paint order: ready</div></div>`,
 opt:`<div class="clip co"><div class="c-cnt"><b class="n1">14</b><b class="n2">4</b><span>open crew days</span></div><div class="c-row">${[0,1,2,3,4,5,6].map(i=>`<span class="c-o ${[1,2,4,5].includes(i)?'fill':''}" style="--d:${i*0.25}s"></span>`).join('')}</div><div class="c-row">${[0,1,2,3,4,5,6].map(i=>`<span class="c-o ${[0,3,6].includes(i)?'fill':''}" style="--d:${1+i*0.2}s"></span>`).join('')}</div></div>`,
 learn:`<div class="clip cl"><div class="c-meter"><i></i><em></em><span>80%</span></div><div class="c-ln l1">Carla picked Tania for an HOA job · learned</div><div class="c-ln l2">Jessie kept Gian free for a big exterior · learned</div><div class="c-ln l3">Question: should HOA jobs prefer Tania?</div></div>`};
const TOUR=()=>[
 ['Bring in a sold job','Upload the estimate, paste it, or pull it from PaintScout. Crew Board fills in only what the estimate says and flags what’s missing.',CLIP.intake],
 ['See the best crew, and why','Every crew that passes your rules is ranked for this job. Riley shows its pick. Tap “Why?” to see the reasons.',CLIP.rank],
 ['Drag it onto the calendar','Drop the job on a crew and day. Crew Board skips days a crew doesn’t work and splits visits around them.',CLIP.cal],
 ['Confirm, and everyone hears','Crew lead, client and project manager get the right message in their language, by WhatsApp, text or email. You can edit each one first.',CLIP.msgs],
 ['Fill the gaps','The optimizer looks at the next two weeks and fills open crew days, weighing margin. You approve every move.',CLIP.opt],
 ['Riley learns from your team','Riley watches how Carla and Jessie schedule, writes a daily update, and asks when something looks off. It starts in Training and books nothing.',CLIP.learn],
 isAdmin()?['You’re ready to set up','About an hour: bring in your crews, fill the must-have fields, set your rules. Get started walks you through it.','<div class="clip cf"><div class="c-chk"><span class="ok">✓ Import crews</span><span class="ok">✓ Must-have fields</span><span>Rules and rankings</span><span>Invite schedulers</span></div></div>']:['You’re ready','Start with Ready to schedule. Pick a job, check the best crew, place it and confirm.','<div class="clip cf"><div class="c-chk"><span class="ok">✓ Ready to schedule</span><span>Pick a crew</span><span>Place and confirm</span></div></div>']];
function drawTour(){let el=document.getElementById('tourl');if(!S.tour.on){if(el)el.remove();return;}
 if(!el){el=document.createElement('div');el.id='tourl';document.body.appendChild(el);}
 const T=TOUR();const i=Math.min(S.tour.i,T.length-1);const[t,d,clip]=T[i];const last=i===T.length-1;
 el.innerHTML=`<div class="tour" role="dialog" aria-modal="true" aria-label="Crew Board tour"><div class="tcard2"><div class="tclip" aria-hidden="true">${clip}</div><div class="ttext"><div class="eyebrow">${i===0?'Welcome to Crew Board':`${i+1} of ${T.length}`}</div><h2>${t}</h2><p>${d}</p>
  <div class="tdots">${T.map((_,k)=>`<button class="${k===i?'on':''}" data-act="tourgo" data-v="${k}" aria-label="Step ${k+1}"></button>`).join('')}</div>
  <div class="tnav">${i>0?'<button class="btn line" data-act="tourback">Back</button>':'<button class="btn line" data-act="tourskip">Skip</button>'}<button class="btn tape" data-act="${last?'tourdone':'tournext'}">${last?(isAdmin()?'Go to Get started':'Start scheduling'):'Continue'}</button></div></div></div></div>`;
 const b=el.querySelector('.tnav .tape');if(b&&document.activeElement&&!el.contains(document.activeElement))b.focus();}
const _render7=render;render=function(){_render7();drawTour();};
document.addEventListener('keydown',e=>{if(!S.tour.on)return;if(e.key==='Escape'){tourEnd();}else if(e.key==='ArrowRight'){S.tour.i=Math.min(TOUR().length-1,S.tour.i+1);drawTour();}else if(e.key==='ArrowLeft'){S.tour.i=Math.max(0,S.tour.i-1);drawTour();}});
function tourEnd(){S.tour.on=false;try{localStorage.setItem('cb_tour_v1','1');}catch(_){}drawTour();}
V.onboard=(()=>{const old=V.onboard;return()=>{const h=old();const i=h.indexOf('<div class="obtrack">');const hero=`<section class="card tourhero"><div class="tclip mini" aria-hidden="true">${CLIP.cal}</div><div class="grow"><div class="eyebrow">New here?</div><h2 style="font-size:20px">Take the 2-minute tour</h2><p class="small muted" style="margin:4px 0 10px">Seven short clips: bringing in a job, picking a crew, the calendar, messages, the optimizer and Riley. No training call needed.</p><button class="btn tape" data-act="tour">▶ Watch the tour</button></div></section>`;return i>0?h.slice(0,i)+hero+h.slice(i):hero+h;};})();
/* ---------- actions ---------- */
document.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b||b.disabled)return;const a=b.dataset.act,v=b.dataset.v;const m=S.modal;
 switch(a){
 case 'tour':S.tour={on:true,i:0};drawTour();break;
 case 'tournext':S.tour.i++;drawTour();break;case 'tourback':S.tour.i=Math.max(0,S.tour.i-1);drawTour();break;case 'tourgo':S.tour.i=+v;drawTour();break;
 case 'tourskip':tourEnd();break;case 'tourdone':tourEnd();S.view=isAdmin()?'onboard':'queue';render();window.scrollTo(0,0);break;
 case 'rwhy':S.modal={type:'rwhy',id:v};drawLayer();break;
 case 'rwhypick':{const rp=rileyPick(v);S.modal=null;placeJob(v,rp.crew);S.job=v;S.view='board';render();window.scrollTo(0,0);toast(`Riley’s pick placed: ${crewById(rp.crew).name}. Confirm when ready`);break;}
 case 'digestall':S.digestAll=!S.digestAll;render();break;
 case 'optall':S.optAll=v==='1';S.modal={...optimize(),riley:m&&m.riley};drawLayer();break;
 case 'optmargin':S.optMargin=!S.optMargin;S.modal={...optimize(),riley:m&&m.riley};drawLayer();break;
 case 'pairtype':S.pairType=v;render();break;
 case 'datequick':{const d=S.add.draft;if(v==='earliest')d.earliest=1;else d.deadline=Math.min(34,(d.earliest??1)+21);d.src[v]='edited';render();break;}
 case 'colorok':{const job=JOBS[v];job.colorsOk=true;log('Edit',`Colors confirmed for ${job.title}: ${job.colors.map(c=>c[0]).join(', ')}.`,job.title);if(S.modal&&S.modal.type==='hub')S.modal=null;render();
  const ms=colorMsgs(v);if(ms.length)openSend(`Colors confirmed for ${job.title}`,ms,'Colors confirmed.');else toast('Colors confirmed. Not on the calendar yet, so no one to tell');break;}
 case 'pmsend':{const p=S.place[v];if(!p||!p.pm)break;const ms=buildMsgs(v,'confirm').filter(x=>x.role==='pm');openSend(`Handoff to ${PMS[p.pm].name}`,ms,'Handoff sent.');break;}
 case 'msgview':S.msgView=v;render();break;
 case 'tplsel':S.tplSel=v;render();break;case 'tpllang':S.tplLang=v;render();break;
 case 'tpladd':{const id='t'+Date.now();TEMPLATES.push({id,name:'New template',to:'client',text:{en:'Hi {first}, it’s {company}. '}});S.tplSel=id;log('Setting','Added a message template.');render();break;}
 case 'client':S.client=v;S.view='clients';S.cdraft=null;S.ctpl=null;S.clang=null;S.cch=null;S.clientEdit=null;S.modal=null;render();window.scrollTo(0,0);break;
 case 'clientedit':S.clientEdit=clone(CLIENTS.find(x=>x.id===v));render();break;
 case 'clientcancel':S.clientEdit=null;render();break;
 case 'clientsave':{const c=CLIENTS.find(x=>x.id===S.clientEdit.id);const ch=['first','phone','email','channel','lang','addr','notes'].filter(k=>(c[k]||'')!==(S.clientEdit[k]||''));Object.assign(c,S.clientEdit);S.clientEdit=null;log('Edit',`Updated client ${c.name}: ${ch.join(', ')||'no changes'}.${c.sf?' Synced to Salesforce.':''}`);render();toast(c.sf?'Saved and synced to Salesforce (sample)':'Saved');break;}
 case 'sfopen':toast('Opens the account in Salesforce (sample link)');break;
 case 'sfcreate':{const c=CLIENTS.find(x=>x.id===v);c.sf={id:'0015g00000HZ'+Math.random().toString(36).slice(2,6).toUpperCase(),match:'Created from Crew Board'};log('Edit',`Created Salesforce account for ${c.name}.`);render();toast('Salesforce account created (sample)');break;}
 case 'csend':{const c=CLIENTS.find(x=>x.id===v);const t=(document.getElementById('cmsg')||{}).value||'';if(!t.trim()){toast('Write a message first');break;}
  sendAll([{trigger:'followup',role:'client',to:c.name,channel:S.cch||c.channel,lang:S.clang||c.lang,job:c.jobs[0]?JOBS[c.jobs[0]].title:'',text:t.trim()}]);S.cdraft=null;S.ctpl=null;render();toast(`Sent to ${c.first} by ${CHANNELS[S.cch||c.channel]}`);break;}
 case 'cfollow':{const c=CLIENTS.find(x=>x.id===S.client);S.follow.push({cid:c.id,due:Math.min(27,+v),note:'Follow up with '+c.first});log('Edit',`Set a follow-up for ${c.name} on ${dlabel(Math.min(27,+v))}.`);render();toast(`Reminder set for ${dlabel(Math.min(27,+v))}`);break;}
 case 'cfdone':S.follow[+v].done=true;render();break;
 case 'clientadd':S.modal={type:'clientadd'};drawLayer();break;
 case 'clientaddok':case 'clientintake':{const g=k=>(document.getElementById('na-'+k)||{}).value||'';const name=g('name').trim();if(!name){toast('Add a name');break;}
  const id='c'+Date.now();const sf=SF_DIR.find(n=>n.toLowerCase()===name.toLowerCase());const c={id,name,first:name.split(' ')[0],phone:g('phone'),email:g('email'),channel:g('ch')||'text',lang:g('lang')||'en',area:'',addr:g('addr'),sf:sf?{id:'0015g00000HZ'+id.slice(-4),match:'Name'}:null,jobs:[],past:[],notes:''};CLIENTS.unshift(c);
  log('Edit',`Added client ${name}.${sf?' Matched in Salesforce.':' No Salesforce match.'}`);S.modal=null;S.client=id;S.view='clients';
  if(a==='clientintake'){S.ctpl='t-intake';S.clang=c.lang;}render();toast(sf?'Saved. Matched in Salesforce':'Saved. No match in Salesforce yet');break;}
 }},true);
document.addEventListener('change',e=>{const t=e.target;
 if(t.dataset.pm!=null){const p=S.place[t.dataset.pm];if(p){p.pm=t.value||null;log('Edit',`Project manager for ${JOBS[t.dataset.pm].title}: ${t.value?PMS[t.value].name:'none'}.`,JOBS[t.dataset.pm].title);render();}}
 if(t.hasAttribute('data-ctpl')){S.ctpl=t.value||null;S.cdraft=null;render();}
 if(t.hasAttribute('data-cch')){S.cch=t.value;}
 if(t.hasAttribute('data-clang')){S.clang=t.value;S.cdraft=null;render();}
 if(t.dataset.cf&&S.clientEdit){S.clientEdit[t.dataset.cf]=t.value;}
 if(t.dataset.tplname){const x=TEMPLATES.find(y=>y.id===t.dataset.tplname);x.name=t.value;render();}
 if(t.dataset.tpltext){const x=TEMPLATES.find(y=>y.id===t.dataset.tpltext);x.text[t.dataset.l]=t.value;log('Setting',`Edited the “${x.name}” template (${CLANGS[t.dataset.l]}).`);render();}});
document.addEventListener('input',e=>{const t=e.target;if(t.id==='cmsg')S.cdraft=t.value;if(t.hasAttribute&&t.hasAttribute('data-cq')){S.cq=t.value;const pos=t.selectionStart;render();const n=document.querySelector('[data-cq]');if(n){n.focus();n.setSelectionRange(pos,pos);}}});
document.addEventListener('click',e=>{const t=e.target.closest('[data-role]');if(t)setTimeout(()=>{$('#who').textContent=ME();},0);},true);
S.view=isAdmin()?'onboard':'queue';
render();
