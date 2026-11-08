/* ================= v6: weekends + hours, essentials setup, Ido's KPIs ================= */
Object.assign(DAYN.en,{Sat:'Saturday',Sun:'Sunday'});Object.assign(DAYN.es,{Sat:'sábado',Sun:'domingo'});Object.assign(DAYN.ht,{Sat:'samdi',Sun:'dimanch'});Object.assign(DAYN.pt,{Sat:'sábado',Sun:'domingo'});
S.riley.stage=0;S.setupAdv=false;S.googleReviews=false;S.impValue=12000;S.hoursDefault={wk:['08:00','17:00'],sat:null,sun:null};
IMPT[2]=['value',`Job worth ${money(S.impValue)} or more`,j=>j.value>=S.impValue?`${money(j.value)} job`:null];
/* fields: two tiers, recommended defaults on in each */
(()=>{const by=k=>RECOMMENDED.find(f=>f.k===k);const set=(k,o)=>Object.assign(by(k),o);
 set('leadSafe',{tier:'must',rec:true,added:true});set('channel',{tier:'must',rec:true,added:true});set('pay',{tier:'must',rec:true,added:true,why:'Needed for pay per painter day and cost per painter day sold'});
 set('languages',{tier:'nice',rec:true,added:true});['insurance','equipment','maxDrive','maxJobsDay','photo'].forEach(k=>set(k,{tier:'nice',rec:false}));
 RECOMMENDED.splice(3,0,{k:'hours',l:'Working days and hours',why:'Weekday hours, plus Saturday or Sunday if the crew works weekends',use:'rule',added:true,tier:'must',rec:true});})();
const PAYSAMPLE={gian:'Per painter day · $150',tania:'Per painter day · $150','johan-dani':'Per painter day · $160',rigo:'Per painter day · $145'};
CREWS.forEach(c=>{c.f.pay=PAYSAMPLE[c.id]||'';c.rsrc={};});
/* ---------- engine: working days and hours ---------- */
const tH=x=>{const[a,b]=String(x).split(':');return +a+(+b||0)/60;};
function dayCap(cid,d){const c=crewById(cid);if(!c||!DL[d])return 0;const dw=DL[d].dow;const h=c.f.hours||S.hoursDefault;const r=dw==='Sat'?h.sat:dw==='Sun'?h.sun:(h.wk||S.hoursDefault.wk);if(!r)return 0;const len=tH(r[1])-tH(r[0]);return Math.max(0,Math.min(1,(len>6?len-1:len)/8));}
const capAll=(cs,d)=>Math.min(...cs.map(x=>dayCap(x,d)));
function span(job,crew,start,B,extra){const nd=need(job,crew,extra);const cs=crewsOf(crew,extra);
 if(nd.half){const h=freeHalf(B,crew,start);return{s:start,e:start,holds:[],conf:h&&capAll(cs,start)?[]:[start],n:1,half:h||'am'};}
 let c=0,d=start,first=true;const holds=[],conf=[];
 while(c<nd.n-1e-6){if(d>40)break;const cap=capAll(cs,d);if(!cap){d++;continue;}
  if(cs.some(x=>busy(B,x,d)))conf.push(d);
  if(job.ext&&S.rules.weather&&rain(d)&&!(first&&nd.n>=3))holds.push(d);else{c+=cap;first=false;}d++;}
 return{s:start,e:d-1,holds,conf,n:nd.n,half:null};}
function earliestSlot(job,crew,B){for(let s=job.earliest;s<=27;s++){if(!dayCap(crew,s))continue;const sp=span(job,crew,s,B);if(!sp.conf.length)return sp;}return null;}
function util(B,crew,days=28){let n=0,w=0;for(let d=0;d<days;d++){if(!dayCap(crew,d))continue;w++;n+=occ(B,crew,d);}return w?Math.round(n/w*100):0;}
function placeConf(jid){const p=S.place[jid];const B=bookings(jid);const cs=crewsOf(p.crew,p.extra);const out=[];p.segs.forEach(([a,z])=>{for(let d=a;d<=z;d++){if(!capAll(cs,d))continue;if(cs.some(cr=>p.half?halfTaken(B,cr,d,p.half):busy(B,cr,d)))out.push(d);}});return out;}
function placeDays(jid){const p=S.place[jid];const job=JOBS[jid];const cs=crewsOf(p.crew,p.extra);const out=[];let w=0;const n=need(job,p.crew,p.extra).n;
 p.segs.forEach(([a,z],si)=>{if(si>0){for(let d=p.segs[si-1][1]+1;d<a;d++)if(capAll(cs,d))out.push({d,k:'pause'});}
  for(let d=a;d<=z;d++){if(!capAll(cs,d))continue;const h=job.ext&&S.rules.weather&&rain(d)&&!(w===0&&n>=3)&&!p.half;out.push({d,k:h?'rain':'work',n:h?null:++w});}});return out;}
function openDays(B=bookings(),from=0,to=13){let n=0;activeCrews().filter(ready).forEach(c=>{for(let d=from;d<=to;d++){if(!dayCap(c.id,d))continue;n+=1-occ(B,c.id,d);}});return n;}
function kpiSched(B=bookings()){let pd=0,cap=0;const jobs=new Map();
 B.filter(x=>!x.prop).forEach(x=>{const c=crewById(x.crew);const sz=planSize(c)||1;for(let d=Math.max(0,x.s);d<=Math.min(13,x.e);d++){const k=dayCap(x.crew,d);if(!k)continue;pd+=sz*k*(x.half?0.5:1);jobs.set(x.jid||x.id,x.value||0);}});
 activeCrews().filter(c=>c.f.size).forEach(c=>{for(let d=0;d<14;d++)cap+=planSize(c)*dayCap(c.id,d);});
 return{pd:Math.round(pd),cap:Math.round(cap),pct:cap?Math.round(pd/cap*100):0,jobs:jobs.size,val:[...jobs.values()].reduce((a,b)=>a+b,0)};}
const hFmt=r=>{const f=x=>{const v=tH(x);const h=Math.floor(v),m=Math.round((v-h)*60);const hh=h>12?h-12:h;return hh+(m?':'+String(m).padStart(2,'0'):'')+(h>=12?'pm':'am');};return `${f(r[0])}–${f(r[1])}`;};
function wkNote(c){const h=c.f.hours||{};const p=[];if(h.sat)p.push('Sat '+hFmt(h.sat).replace(/am|pm/g,''));if(h.sun)p.push('Sun '+hFmt(h.sun).replace(/am|pm/g,''));return p.length?' · '+p.join(', '):'';}
const hoursText=h=>`Mon–Fri ${hFmt(h.wk||S.hoursDefault.wk)}${h.sat?` · Sat ${hFmt(h.sat)}`:' · Sat off'}${h.sun?` · Sun ${hFmt(h.sun)}`:' · Sun off'}`;
/* mini calendar with weekends */
function miniCal(k,d){const sel=d[k];const B=bookings();const weeks=[];for(let i=0;i<35;i+=7)weeks.push(DL.slice(i,i+7).map((x,j)=>i+j));
 const free=i=>i<28?activeCrews().filter(ready).filter(c=>dayCap(c.id,i)&&occ(B,c.id,i)===0).length:null;
 return `<div class="minical" role="group" aria-label="Pick a date"><div class="mc-h">${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(x=>`<span>${x}</span>`).join('')}</div>
  ${weeks.map(w=>`<div class="mc-r">${w.map(i=>{const f=free(i);const bad=k==='deadline'&&i<d.earliest||k==='earliest'&&i>d.deadline;return `<button class="mc-d ${i===sel?'on':''} ${bad?'dim':''} ${isWkend(i)?'we':''}" data-act="mcpick" data-k="${k}" data-v="${i}" aria-label="${dlabel(i)}${f!=null?', '+f+' ready crews free':''}"><b>${DL[i].n}</b><small>${DL[i].n===1||i===0?DL[i].m:''}</small>${f!=null?`<em class="${f<=1?'lo':''}">${f} free</em>`:''}</button>`;}).join('')}</div>`).join('')}
  <div class="tiny" style="margin-top:6px">“Free” = ready crews working that day with nothing booked.</div></div>`;}
/* ---------- crew profile: hours, whole-number size, admin ratings ---------- */
M.crew=(()=>{const old=M.crew;return m=>{let h=old(m);const c0=crewById(m.id);const ed=S.crewEdit&&S.crewEdit.id===c0.id;const c=ed?S.crewEdit:c0;const H=c.f.hours||S.hoursDefault;
 const day=(k,l)=>{const r=H[k];return `<div class="hrow"><span class="muted" style="width:90px">${l}</span>${k!=='wk'?(ed?`<button class="tog ${r?'on':''}" data-act="cehday" data-v="${k}" role="switch" aria-checked="${!!r}" aria-label="${l}"><i></i></button>`:''):''}${r?(ed?`<input type="time" class="in sm" data-ceh="${k}.0" value="${r[0]}" aria-label="${l} start"><span class="tiny">to</span><input type="time" class="in sm" data-ceh="${k}.1" value="${r[1]}" aria-label="${l} end">`:`<span>${hFmt(r)}</span>`):'<span class="faint">Off</span>'}</div>`;};
 const block=`<h3 class="mh">Working days and hours</h3>${day('wk','Mon–Fri')}${day('sat','Saturday')}${day('sun','Sunday')}<p class="tiny" style="margin:4px 0 0">Weekend days only get booked for crews that work them. Short days count as part of a day.</p>`;
 h=h.replace('<h3 class="mh">Ratings',block+'<h3 class="mh">Ratings');
 if(c0.f.sizeWas)h=h.replace(/(<span class="muted" style="width:150px">Crew size<\/span><span class="grow">)/,`$1<span class="tiny" style="display:block">Sheet said ${c0.f.sizeWas}. Using ${c0.f.size.min}. Confirm.</span>`);
 h=h.replace(/data-ce="f\.size" value="([^"]*)"/,'data-ce="f.size" type="number" min="1" step="1" inputmode="numeric" value="$1"');
 if(RECOMMENDED.find(x=>x.k==='pay').added)h=h.replace('<div class="hr"><span class="muted" style="width:150px">Salesforce name</span>',`<div class="hr"><span class="muted" style="width:150px">Pay model and rate</span><span class="grow">${ed?`<input class="in" data-ce="f.pay" value="${esc(c.f.pay||'')}" placeholder="e.g. Per painter day · $150">`:esc(c.f.pay||'–')}</span></div><div class="hr"><span class="muted" style="width:150px">Salesforce name</span>`);
 return h;};})();
/* ---------- crews tab: export ---------- */
function crewsCSV(){const H=['Name','Status','Crew size','Home base','Region','Email','Phone','Phone 2','Send jobs by','Crew lead language','Languages','Lead-safe','Mon–Fri','Saturday','Sunday','Pay model','Salesforce name','Google Calendar name','Notes',...DIMS.map(d=>d.l)];
 return [H,...CREWS.map(c=>{const h=c.f.hours||S.hoursDefault;return[c.name,c.f.status,c.f.size?c.f.size.min:'',c.f.base,c.f.region,c.f.email,c.f.phone,c.f.phone2,CHANNELS[c.f.channel]||'',CLANGS[c.f.clang]||'',c.f.languages,c.f.leadSafe?'Yes':'',hFmt(h.wk),h.sat?hFmt(h.sat):'Off',h.sun?hFmt(h.sun):'Off',c.f.pay||'',c.f.sfName,c.f.gcal,c.f.notes,...DIMS.map(d=>c.r[d.k]??'')];})].map(l=>l.map(csvq).join(',')).join('\n');}
V.crews=(()=>{const old=V.crews;return()=>old().replace(fbBtn('crews'),`<button class="btn line" data-act="exportcrews">Export crews (CSV)</button>`+fbBtn('crews'));})();
/* ---------- messages: channel up front ---------- */
const CHI={whatsapp:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20l1.3-3.9A8 8 0 1 1 8 19z"/></svg>',text:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="12" rx="2"/><path d="M8 21l3-4"/></svg>',email:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>'};
const chBadge=ch=>`<span class="chb ch-${ch}">${CHI[ch]||''}${CHANNELS[ch]||ch}</span>`;
V.msgs=()=>{const f=S.msgF||'all',fc=S.msgC||'all';const rows=S.comms.filter(m=>(f==='all'||m.trigger===f)&&(fc==='all'||m.channel===fc));
 return `<div class="qhead"><div class="grow"><div class="eyebrow">Outbound only</div><h1>Messages</h1><p class="muted" style="margin:6px 0 0;max-width:640px">Every message Crew Board sent when the calendar changed. Match it against WhatsApp, your texts or your email by the channel on the left.</p></div>${isAdmin()?'<button class="btn line" data-act="obgo" data-v="s7">Message settings</button>':''}${fbBtn('msgs')}</div>
 <div class="row" style="flex-wrap:wrap;margin-bottom:12px"><div class="seg" role="group" aria-label="Channel"><button aria-pressed="${fc==='all'}" data-act="msgc" data-v="all">All channels</button>${Object.entries(CHANNELS).map(([k,l])=>`<button aria-pressed="${fc===k}" data-act="msgc" data-v="${k}">${l}</button>`).join('')}</div>
  <div class="seg" role="group" aria-label="Trigger"><button aria-pressed="${f==='all'}" data-act="msgf" data-v="all">All changes</button>${Object.entries(TRIG).map(([k,l])=>`<button aria-pressed="${f===k}" data-act="msgf" data-v="${k}">${l}</button>`).join('')}</div></div>
 <section class="card">${rows.map(m=>`<div class="lrow">${chBadge(m.channel)}<div class="grow" style="min-width:0"><div><b>${esc(m.to)}</b> <span class="chip">${m.role==='crew'?'Crew lead':m.role==='client'?'Client':'HOA'}</span> <span class="tiny">${CLANGS[m.lang]||m.lang}</span></div><div class="tiny">${m.t} · ${esc(TRIG[m.trigger])} · ${esc(m.job)} · sent by ${esc(m.by)}</div><details><summary>Message</summary><div class="bubble" style="margin-top:6px">${esc(m.text)}</div></details></div><span class="chip good">Sent</span></div>`).join('')||'<p class="pad small muted">No messages match.</p>'}</section>`;};
/* ---------- setup: essentials first, advanced tucked away ---------- */
const _setupV5=V.setup;
function setupSections(){const h=_setupV5();const secs=h.match(/<section[\s\S]*?<\/section>/g)||[];const by=n=>secs.find(x=>new RegExp(`<h3[^>]*>${n}\\.`).test(x))||'';return{rank:by(4),labels:by(6),comm:by(7),integ:by(8)};}
V.setup=()=>{if(!isAdmin())return `<div class="card pad" style="max-width:560px"><h2 style="font-size:22px">Admins only</h2><p class="muted">Setup is for admins. Switch to Admin at the top.</p></div>`;
 const act=activeCrews();const held=act.filter(c=>!ready(c)).length;const cnt=k=>act.filter(c=>missing(c).includes(k)).length;const imp=S.imp;const fld=k=>RECOMMENDED.find(x=>x.k===k);
 const fieldRow=f=>`<div class="hr"><span class="grow"><b>${f.l}</b>${f.rec?' <span class="chip tape">Recommended</span>':''}<span class="tiny" style="display:block">${f.why}</span></span>${f.added?`<span class="chip good">On</span><button class="x0" data-act="rmfield" data-v="${f.k}" aria-label="Remove ${esc(f.l)}" title="Remove this field">×</button>`:`<button class="btn sm line" data-act="addfield" data-v="${f.k}">Add</button>`}</div>`;
 const kpiRow=(n,what,from,ok,fix)=>`<div class="kpirow"><div class="grow"><b>${n}</b><span class="tiny" style="display:block">${what}</span><span class="small" style="display:block;margin-top:2px"><span class="muted">Comes from:</span> ${from}</span></div>${ok?'<span class="chip good">Ready</span>':fix}</div>`;
 const payOn=fld('pay').added;const H=S.hoursDefault;
 const essentials=`
 <section class="card pad" id="s1"><div class="row"><h3 class="grow">1. Crew data</h3><span class="chip good">Imported</span></div>
  <div class="srcbox"><b>${esc(imp.file)}</b><span class="tiny">${imp.when} · ${plural(imp.rows,'crew')} · data now lives in Crew Board</span></div>
  <div class="row" style="flex-wrap:wrap;margin-top:10px"><label class="btn sm tape" for="xlsx">Upload a new spreadsheet</label><input type="file" id="xlsx" accept=".xlsx,.xls,.csv" hidden><button class="btn sm line" data-act="dbconnect">Connect a database</button><button class="btn sm line" data-act="exportcrews">Export crews (CSV)</button></div>
  <details class="how"><summary>What we found in the file</summary>${imp.findings.map(([k,t])=>`<div class="check ${k}"><i>${k==='ok'?'✓':'!'}</i><span>${esc(t)}</span></div>`).join('')}</details>
  <p class="tiny" style="margin:8px 0 0">You can add and edit crews right in Crew Board without touching the spreadsheet.</p></section>
 <section class="card pad" id="s2"><div class="row"><h3 class="grow">2. Crew fields</h3>${held?`<span class="chip warn">${plural(held,'crew')} held back</span>`:'<span class="chip good">All crews ready</span>'}</div>
  <div class="tiers2"><div><div class="tierh must">Must have</div><p class="tiny">Crews aren’t matched until these are filled in.</p>
   ${REQUIRED.map(([k,l])=>{const n=cnt(k);return `<div class="hr"><span class="lockic" title="Always required">${ICON.lock}</span><span class="grow">${l}${k==='size'?' <span class="tiny">(whole number)</span>':''}</span>${n?`<button class="btn sm line" data-act="fixreq" data-v="${k}">${n} missing</button>`:'<span class="small">Done</span>'}</div>`;}).join('')}
   ${RECOMMENDED.filter(f=>f.tier==='must').map(fieldRow).join('')}</div>
  <div><div class="tierh nice">Nice to have</div><p class="tiny">Turn on what helps your team.</p>${RECOMMENDED.filter(f=>f.tier==='nice').sort((a,b)=>(b.rec?1:0)-(a.rec?1:0)).map(fieldRow).join('')}</div></div></section>
 <section class="card pad wide2" id="s3k"><div class="row"><h3 class="grow">3. What Crew Board tracks for you</h3><span class="tiny">From Ido’s KPI list</span></div>
  <div class="kgrid"><div><div class="eyebrow" style="margin-bottom:6px">Scheduling</div>
   ${kpiRow('Painter days scheduled, next 2 weeks','Painter days on the calendar against what crews can work','The calendar × each crew’s size and working days',true)}
   ${kpiRow('Jobs scheduled, next 2 weeks','Number of jobs and their total value','The calendar + sold price from PaintScout',true)}
   ${kpiRow('Jobs waiting to be scheduled','Sold jobs not on the calendar: count, painter days needed, value','Sold estimates from PaintScout',true)}</div>
  <div><div class="eyebrow" style="margin-bottom:6px">Crew profile</div>
   ${kpiRow('5-star reviews','5-star reviews tied to each crew’s jobs','Google reviews, matched to the job’s address and crew',S.googleReviews,'<button class="btn sm line" data-act="greviews">Connect Google reviews</button>')}
   ${kpiRow('Projected vs actual days','Painter days sold against painter days used. Over means money lost on the job','Sold hours in PaintScout vs days the crew actually worked on the calendar',true)}
   ${kpiRow('Pay per actual painter day','What the crew earned: total pay ÷ painter days worked','Pay model field + days worked',payOn,'<button class="btn sm line" data-act="addfield" data-v="pay">Add pay field</button>')}
   ${kpiRow('Cost per painter day sold','What the crew costs you: total pay ÷ painter days sold','Pay model field + painter days sold in PaintScout',payOn,'<button class="btn sm line" data-act="addfield" data-v="pay">Add pay field</button>')}</div></div></section>
 <section class="card pad" id="s4h"><h3>4. Working days and hours</h3><p class="small muted" style="margin:6px 0 10px">Your company default. Each crew can change it on its profile, for example to work Saturdays.</p>
  <div class="hrow"><span class="muted" style="width:90px">Mon–Fri</span><input type="time" class="in sm" data-hd="wk.0" value="${H.wk[0]}" aria-label="Weekday start"><span class="tiny">to</span><input type="time" class="in sm" data-hd="wk.1" value="${H.wk[1]}" aria-label="Weekday end"></div>
  ${['sat','sun'].map(k=>`<div class="hrow"><span class="muted" style="width:90px">${k==='sat'?'Saturday':'Sunday'}</span><button class="tog ${H[k]?'on':''}" data-act="hdday" data-v="${k}" role="switch" aria-checked="${!!H[k]}" aria-label="${k==='sat'?'Saturday':'Sunday'}"><i></i></button>${H[k]?`<input type="time" class="in sm" data-hd="${k}.0" value="${H[k][0]}"><span class="tiny">to</span><input type="time" class="in sm" data-hd="${k}.1" value="${H[k][1]}">`:'<span class="faint">Off</span>'}</div>`).join('')}
  <div class="row" style="margin-top:10px;flex-wrap:wrap"><button class="btn sm line" data-act="hdapply">Apply to all crews</button><span class="tiny">${CREWS.filter(c=>c.f.hours&&c.f.hours.sat).map(c=>c.name).join(' and ')||'No crews'} work Saturdays (set on their profiles).</span></div></section>
 <section class="card pad" id="s3"><h3>5. Rules <span class="chip bad">Pass or fail</span></h3><p class="small muted" style="margin:6px 0 10px">Rules remove crews before ranking.</p>
  <div class="hr"><span class="grow">Crew must work in the job’s region</span><button class="tog ${S.rules.region?'on':''}" data-act="rule" data-v="region" role="switch" aria-checked="${S.rules.region}" aria-label="Region rule"><i></i></button></div>
  <div class="hr"><span class="grow">Minimum job-type rating</span><span class="stepper"><button data-act="rmin" data-v="-0.5" aria-label="Lower">−</button><b class="num">${S.rules.minType}</b><button data-act="rmin" data-v="0.5" aria-label="Raise">+</button></span></div>
  <div class="hr"><span class="grow">Reviews needed before an imported rating counts<span class="tiny" style="display:block">Ratings you enter by hand count right away</span></span><span class="stepper"><button data-act="rrev" data-v="-1" aria-label="Fewer">−</button><b class="num">${S.rules.minReviews}</b><button data-act="rrev" data-v="1" aria-label="More">+</button></span></div>
  ${fld('leadSafe').added?`<div class="hr"><span class="grow">Lead-safe painter for pre-1978 homes</span><button class="tog ${S.rules.lead?'on':''}" data-act="rule" data-v="lead" role="switch" aria-checked="${S.rules.lead}" aria-label="Lead-safe rule"><i></i></button></div>`:''}
  <div class="hr"><span class="grow">Rain days hold exterior body coats</span><button class="tog ${S.rules.weather?'on':''}" data-act="rule" data-v="weather" role="switch" aria-checked="${S.rules.weather}" aria-label="Weather rule"><i></i></button></div>
  <div class="hr"><span class="grow">Furthest drive from home base</span><span class="stepper"><button data-act="rdrive" data-v="-5" aria-label="Shorter">−</button><b class="num">${S.rules.maxDrive} min</b><button data-act="rdrive" data-v="5" aria-label="Longer">+</button></span></div>
  <div class="eyebrow" style="margin:12px 0 6px">Crews that pass, by job type</div>${ruleFunnel().map(([l,n])=>`<div class="hr"><span class="grow">${l}</span><b class="num ${n<2?'warnt':''}">${n}</b></div>`).join('')}</section>
 <section class="card pad" id="s6m"><h3>6. Messages</h3><p class="small muted" style="margin:6px 0 10px">Crew Board messages crew leads and clients when the calendar changes. Outbound only.</p>
  <div class="hr"><span class="grow"><b>Show messages before they go</b><span class="tiny" style="display:block">Like Google Calendar’s “send updates?”: edit, send or don’t send</span></span><button class="tog ${S.comm.review?'on':''}" data-act="commreview" role="switch" aria-checked="${S.comm.review}" aria-label="Review before sending"><i></i></button></div>
  <div class="row" style="margin-top:8px;flex-wrap:wrap;gap:6px"><span class="tiny">Channels:</span>${Object.keys(CHANNELS).map(chBadge).join('')}</div>
  <div class="row" style="margin-top:8px;flex-wrap:wrap;gap:6px"><span class="tiny">Languages:</span>${['en','es','pt','ht'].map(k=>`<span class="chip good">✓ ${CLANGS[k]}</span>`).join('')}</div>
  <button class="lnk" style="margin-top:10px" data-go="msgs">Open the Messages log →</button></section>`;
 let adv='';if(S.setupAdv){const X=setupSections();const strip=s=>s.replace(/(<h3[^>]*>)\d+\.\s*/,'$1').replace(/ id="s\d"/,'');
  const impSec=`<section class="card pad"><h3>What makes a client important</h3><p class="small muted" style="margin:6px 0 10px">Any one of these that’s on and true flags the client (this OR that).</p>
   ${IMPT.map(([k,l])=>`<div class="hr"><span class="grow">${k==='value'?`Job worth at least <input type="number" class="in sm num" data-impv value="${S.impValue}" step="500" min="0" style="width:110px" aria-label="Dollar amount">`:l}</span><button class="tog ${S.impOn[k]?'on':''}" data-act="impt" data-v="${k}" role="switch" aria-checked="${S.impOn[k]}" aria-label="${esc(l)}"><i></i></button></div>`).join('')}</section>`;
  adv=`<div class="setgrid" style="margin-top:14px">${strip(X.rank)}${impSec}${strip(X.labels)}${strip(X.comm).replace('<h3 class="grow">Communication</h3>','<h3 class="grow">Message triggers</h3>')}${strip(X.integ)}</div>`;}
 return `<div class="qhead"><div class="grow"><div class="eyebrow">Admin</div><h1>Setup</h1><p class="muted" style="margin:6px 0 0;max-width:680px">The essentials to get matching. Everything else is under Advanced. <button class="lnk" data-go="onboard">See onboarding milestones →</button></p></div>${fbBtn('setup')}</div>
 <div class="setgrid">${essentials}</div>
 <button class="advbtn" data-act="setupadv" aria-expanded="${S.setupAdv}"><b>${S.setupAdv?'Hide':'Show'} advanced settings</b><span class="tiny">Ranking labels, important clients, job labels, message triggers, integrations</span><span>${S.setupAdv?'▲':'▼'}</span></button>${adv}`;};
/* onboarding text updates */
const _obStatus=obStatus;obStatus=function(){const L=_obStatus();L[3][2]=L[3][2].replace('region, home base and job-type ratings','home base, region, a whole-number crew size and one job-type rating');L[5]=[L[5][0],'Rules and rankings','Set the pass-or-fail rules. Ranking labels come with good defaults and live under Advanced.','Rules','s3'];L[6][4]='s6m';return L;};
/* ---------- actions ---------- */
function hset(obj,path,v){const[k,i]=path.split('.');if(!obj[k])obj[k]=['08:00','17:00'];obj[k][+i]=v;}
document.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b||b.disabled)return;const a=b.dataset.act,v=b.dataset.v;const m=S.modal;
 switch(a){
 case 'exportcrews':saveFile('crew-board-crews.csv',crewsCSV());log('Export','Exported crew data.');break;
 case 'rmfield':{const f=RECOMMENDED.find(x=>x.k===v);f.added=false;if(v==='leadSafe')S.rules.lead=false;log('Setting',`Removed the field “${f.l}”.`);render();toast(`${f.l} removed. You can add it back any time`);break;}
 case 'setupadv':S.setupAdv=!S.setupAdv;render();break;
 case 'greviews':S.googleReviews=true;log('Setting','Connected Google reviews for 5-star review counts.');render();toast('Google reviews connected (sample)');break;
 case 'hdday':S.hoursDefault[v]=S.hoursDefault[v]?null:(v==='sat'?['08:00','14:00']:['09:00','13:00']);render();break;
 case 'hdapply':CREWS.forEach(c=>{c.f.hours=clone(S.hoursDefault);});log('Crew data',`Applied working hours to all crews: ${hoursText(S.hoursDefault)}.`);render();toast('Working hours applied to every crew');break;
 case 'cehday':{const H=S.crewEdit.f.hours||(S.crewEdit.f.hours=clone(S.hoursDefault));H[v]=H[v]?null:(v==='sat'?['08:00','14:00']:['09:00','13:00']);drawLayer();break;}
 case 'msgc':S.msgC=v;render();break;
 }},true);
document.addEventListener('change',e=>{const t=e.target;
 if(t.dataset.ceh&&S.crewEdit){const H=S.crewEdit.f.hours||(S.crewEdit.f.hours=clone(S.hoursDefault));hset(H,t.dataset.ceh,t.value);}
 if(t.dataset.hd){hset(S.hoursDefault,t.dataset.hd,t.value);}
 if(t.hasAttribute('data-impv')){S.impValue=Math.max(0,+t.value||0);IMPT[2][1]=`Job worth ${money(S.impValue)} or more`;log('Setting',`Important-client job value set to ${money(S.impValue)}.`);render();}});
S.view=isAdmin()?'onboard':'queue';
render();
