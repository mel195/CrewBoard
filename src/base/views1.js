/* ============ views ============ */
const V={};
function kpiCards(extra){const k=kpiSched(),w=kpiWaiting();
 return `<div class="kpis ${extra?'k4':'k3'}">
 <div class="card kpi"><span>Painter days scheduled, next 2 weeks</span><b class="num">${k.pd}</b><span>of ${k.cap} available (${k.pct}%)</span></div>
 <div class="card kpi"><span>Jobs scheduled, next 2 weeks</span><b class="num">${k.jobs}</b><span>${money(k.val)} on the calendar</span></div>
 <div class="card kpi"><span>Jobs waiting to be scheduled</span><b class="num">${w.n}</b><span>${w.pd} painter days needed · ${money(w.val)}</span></div>
 ${extra?`<div class="card kpi"><span>Open crew days, next 2 weeks</span><b class="num" style="color:var(--warn)">${openDays()}</b><span>Ready crews only · about ${money(openDays()*1000)} not billed</span></div>`:''}</div>`;}
V.queue=()=>{const waiting=QORDER.filter(j=>!S.place[j]||S.place[j].status!=='scheduled');const nr=activeCrews().filter(c=>!ready(c)).length;
 return `<div class="qhead"><div class="grow"><div class="eyebrow">Sold, deposit in</div><h1>Ready to schedule</h1></div>
  <button class="btn line" data-go="cal">Open the calendar</button><button class="btn line" data-act="planall" ${waiting.length?'':'disabled'}>Plan all ${waiting.length} jobs</button><button class="btn tape" data-go="add">+ Add a job</button>${fbBtn('queue')}</div>
 ${kpiCards()}
 ${nr?`<div class="banner warnb"><b>${plural(nr,'crew')} can’t be matched yet.</b><span class="small grow">They’re missing ratings or setup details. ${isAdmin()?'Fill them in so they show up in rankings.':'Ask your admin to fill them in.'}</span>${isAdmin()?'<button class="btn sm line" data-go="setup">Finish setup</button>':''}</div>`:''}
 <div class="jobs">${QORDER.map(jid=>{const j=JOBS[jid];const p=S.place[jid];const r=rank(jid);const top=r.find(x=>x.ok);const im=imp(j);
  const flags=[`<span class="chip ${j.ext?'tape':''}">${dimL(j.type)}${j.ext?' · weather':''}</span>`,j.built<1978?'<span class="chip warn">Lead-safe</span>':'',im?`<span class="chip bad" title="${esc(im)}">Important client</span>`:'',j.lang!=='en'?`<span class="chip">${LANGS[j.lang]}</span>`:'',...j.labels.map(l=>`<span class="chip">${esc(l)}</span>`)].join('');
  const pc=p?p.crew:top?top.crew:null;const pay=pc?crewPay(j,pc):null;
  const colors=j.colorsOk===true?'<span class="lk good">✓ Colors confirmed</span>':j.colorsOk==='sent'?'<span class="lk warn">Color form sent, waiting on client</span>':`<button class="lk warn" data-act="colors" data-v="${jid}">! Colors not confirmed · text client</button>`;
  return `<article class="card job"><div class="chipband">${j.colors.map(([n,c])=>`<div style="background:${c}"><span style="color:${lum(c)>0.55?'#1A1D21':'#fff'}">${esc(n)}</span></div>`).join('')}</div>
  <div class="bd"><div class="row" style="align-items:flex-start"><div class="grow"><h3>${esc(j.title)}</h3><div class="small muted">${esc(j.client)} · ${esc(j.area)}</div></div>${j.colorsOk===true?'':'<span class="chip warn">Not ready</span>'}</div>
   <div class="chips">${flags}</div>
   <div class="facts f4"><div><b class="num">${money(j.value)}</b><span>Sold</span></div><div><b class="num">${painterDays(j)}</b><span>Painter days sold (${j.hours} hrs)</span></div>
    <div><b class="num">${pay?'~'+money(pay.amt):'n/a'}</b><span>Crew pay estimate${pc?` (${esc(crewById(pc).name)})`:''}</span></div><div><b>${dlabel(j.deadline)}</b><span>Finish by</span></div></div>
   <div class="links">${colors}<button class="lk" data-act="photos" data-v="${jid}">${ICON.cam} ${j.photos||0} photos</button></div>
   <div class="rec">${p?`${crewDot(p.crew)}<span class="grow small"><b>${esc(crewById(p.crew).name)}</b> · ${sdate(pS(p))} to ${sdate(pE(p))}<br><span class="tiny">${p.status==='scheduled'?'Confirmed, everyone notified':'Draft, not confirmed'}</span></span>
     <button class="btn sm ${p.status==='scheduled'?'line':'tape'}" data-act="board" data-v="${jid}">${p.status==='scheduled'?'View':'Review'}</button>`:
    top?`${crewDot(top.crew)}<span class="grow small"><b>${esc(crewById(top.crew).name)}</b> fits best · match ${top.score}<br><span class="tiny">Can start ${dlabel(top.slot.s)}</span></span><button class="btn sm tape" data-act="match" data-v="${jid}">Find a crew</button>`:`<span class="grow small muted">No crew passes the rules yet.</span><button class="btn sm line" data-act="match" data-v="${jid}">See why</button>`}</div></div></article>`;}).join('')}</div>`;};

const REQ_LABEL=job=>{const L=[];
 L.push(['must',`${dimL(job.type)} rated ${S.rules.minType}+`,job.ext?'ext':job.type==='interior'?'int':job.type==='cabinets'?'cab':job.type,'Job type from the estimate']);
 if(job.built<1978)L.push(['must','Lead-safe certified painter on site','lead',`Federal RRP rule, home built ${job.built}`]);
 if(imp(job))L.push(['must',`Quality and client-facing ${S.rules.impBar}+`,'vip','Important client']);
 if(job.ext)L.push(['must','Body coats only on dry days','ext','Rain over 50% turns a day into a rain day']);
 if(job.hoa)L.push(['must','Weekdays 8am to 5pm','hoa','HOA rule']);
 L.push(['must',`Finished by ${dlabel(job.deadline)}`,'due','From the client']);
 job.skills.forEach(k=>L.push(['nice',dimL(k),k,'Skill this job needs, ranks higher']));
 if(job.lang!=='en')L.push(['nice',`Speaks ${LANGS[job.lang]}`,'lang','Client preference']);
 return L;};
function impBox(job){const fired=Object.fromEntries(IMPT.map(([k,,f])=>[k,f(job)]));
 return `<div class="card impbox"><div class="row"><b class="grow">Why this client is marked important</b><button class="btn sm line" data-act="impwhy">Close</button></div>
  <p class="tiny" style="margin:4px 0 8px">Any trigger that’s on and true makes a client important. Important clients only get crews rated ${S.rules.impBar}+ for quality and client-facing, and rank for White glove by default. ${isAdmin()?'You set the triggers in Setup.':'Your admin sets the triggers.'}</p>
  ${IMPT.map(([k,l])=>`<div class="hr"><span class="check ${fired[k]&&S.impOn[k]?'ok':''}" style="padding:0"><i>${fired[k]&&S.impOn[k]?'✓':''}</i></span><span class="grow">${l}${fired[k]?`<span class="tiny" style="display:block">${esc(fired[k])}</span>`:''}</span><span class="tiny">${S.impOn[k]?'On':'Off'}</span></div>`).join('')}</div>`;}
function crewCard(job,r,i){const c=crewById(r.crew);const wl=whyLines(job,r);const col=i===0?'var(--tape)':c.c;const sl=r.slot;const w=weights(job.id);const left=job.deadline-sl.e;const pay=crewPay(job,r.crew);const sz=planSize(c);
 return `<article class="card crew ${i===0?'best':''}"><div class="ring">${ringSvg(r.score,col)}<b class="num">${r.score}</b><small>match</small></div>
  <div style="min-width:0"><div class="row" style="flex-wrap:wrap"><h3 style="font-size:19px">${esc(c.name)}</h3>${i===0?'<span class="chip tape">Best fit</span>':''}${c.f.notes?`<span class="chip">${esc(c.f.notes)}</span>`:''}<span class="grow"></span><button class="btn sm line" data-act="crew" data-v="${c.id}">Crew profile</button></div>
   <div class="lines">
    <div class="ln">${ICON.cal}<span><b>${dlabel(sl.s)}${sl.e!==sl.s?' to '+dlabel(sl.e):sl.half?(sl.half==='am'?', morning':', afternoon'):''}</b></span></div>
    <div class="ln">${ICON.people}<span>${sizeText(c)}${c.f.size&&c.f.size.min!==c.f.size.max?` <small>· planning on ${sz}</small>`:''}</span></div>
    <div class="ln">${ICON.clock}<span>${sl.half?'Half a day':plural(sl.n,'day')} on site${sl.holds.length?`, plus ${plural(sl.holds.length,'rain day')}`:''} <small>· ${left>0?`done ${plural(left,'day')} before the deadline`:'done on the deadline'}</small></span></div>
    <div class="ln">${ICON.pay}<span>About ${money(pay.amt)} crew pay <small>· ${painterDays(job)} painter days × $${pay.rate}, ${pay.src}</small></span></div></div>
   <ul class="why">${wl.plus.map(x=>`<li>${esc(x)}</li>`).join('')}${wl.minus?`<li class="minus">${esc(wl.minus)}</li>`:''}</ul>
   <div class="factors">${Object.keys(w).filter(k=>w[k]>0).sort((a,b)=>w[b]-w[a]).map(k=>`<div class="f"><span>${esc(flabel(k))}</span><span class="bar"><i style="width:${r.f[k]}%;opacity:${0.35+0.65*Math.min(1,w[k]/4)}"></i></span><span class="v num">${r.f[k]}</span></div>`).join('')}</div>
   <div class="row" style="margin-top:14px;flex-wrap:wrap"><button class="btn sm ${i===0?'tape':'line'}" data-act="pick" data-v="${r.crew}">Schedule ${esc(c.name)}</button><button class="btn sm line" data-act="audit" data-v="${r.crew}">How this score was worked out</button></div></div></article>`;}
function closeList(job,R){const rows=activeCrews().filter(c=>c.f.base).map(c=>({c,m:driveMin(c.f.base,job.area),ok:R.find(x=>x.crew===c.id)?.ok})).sort((a,b)=>(b.ok-a.ok)||(a.m-b.m));
 const show=S.closeAll?rows:rows.slice(0,6);const max=Math.max(...rows.map(x=>x.m));
 return show.map(({c,m,ok})=>{const word=bearingWord(c.f.base,job.area);const same=word==='same area';const deg=bearingDeg(c.f.base,job.area);
  return `<div class="near ${ok?'':'off'}"><span class="dot" style="--c:${c.c}"></span><div class="grow"><b>${esc(c.name)}</b>${ok?'':' <span class="tiny">can’t take it</span>'}<div class="tiny">${same?`Based in ${c.f.base}, same area`:`From ${c.f.base}, heading ${word}`}</div><div class="nbar"><i style="width:${Math.max(6,m/max*100)}%;background:${c.c}"></i></div></div><span class="arr" aria-hidden="true" style="${same?'visibility:hidden':`transform:rotate(${-deg}deg)`}">${ICON.arrow}</span><b class="num" style="min-width:52px;text-align:right">${m} min</b></div>`;}).join('')+(rows.length>6?`<button class="btn sm line" style="margin-top:8px" data-act="closeall">${S.closeAll?'Show fewer':`Show all ${rows.length} crews`}</button>`:'');}
function rileyCard(job){const rp=rileyPick(job.id);if(!rp)return'';const st=STAGES[S.riley.stage];
 return `<section class="card rcard">${riley(40)}<div class="grow"><div class="row" style="flex-wrap:wrap;gap:6px"><b>Riley would pick ${esc(crewById(rp.crew).name)}</b><span class="chip tape">In training · ${st[0]}</span></div>
  <div class="small muted">${rp.pattern?`Learned from ${plural(rp.n||1,'past decision')}: ${esc(rp.why)}`:'Agrees with the ranking.'} Riley matches your team’s picks ${rileyPct()}% of the time so far.</div></div><button class="btn sm line" data-go="riley">How Riley learns</button></section>`;}
V.match=()=>{const job=J();const R=rank(job.id);const ok=R.filter(r=>r.ok),out=R.filter(r=>!r.ok);const pr=rankName(job.id);
 const vis=S.vis[job.id]||(S.vis[job.id]={});const iw=impWhy(job);
 const wu=job.writeup.replace(/\[(\w+)\|([^\]]+)\]/g,(m,k,t)=>`<mark data-k="${k}">${t}</mark>`);
 const needR=out.filter(r=>r.needsRating&&r.fails.length===1),otherOut=out.filter(r=>!(r.needsRating&&r.fails.length===1));
 const left=`<div class="lcol">
  <section class="card pad"><div class="row" style="margin-bottom:8px;align-items:flex-start"><div class="src grow" style="margin:0">${esc(job.src||'Added by hand')}</div><button class="btn sm line" data-act="est" aria-expanded="true">Hide estimate</button></div><h3 style="font-size:16px;margin-bottom:8px">Project write-up</h3><p class="writeup" style="margin:0;white-space:pre-line">${wu}</p></section>
  <section class="card pad"><div class="row"><h3 style="font-size:16px" class="grow">What this job needs</h3><button class="btn sm line" data-act="editjob">Edit</button></div>
   <div class="reqs">${REQ_LABEL(job).map(([t,l,k,s])=>`<div class="req ${t}" data-k="${k}"><span class="ic">${t==='must'?'!':'+'}</span><span class="grow">${l}<small>${s}</small></span><span class="tiny">${t==='must'?'Must':'Nice'}</span></div>`).join('')}</div></section>
  <section class="card pad"><div class="row" style="margin-bottom:4px"><h3 style="font-size:16px" class="grow">Who’s close</h3><span class="tiny">Drive to the job</span></div>${closeList(job,R)}</section></div>`;
 const strip=`<section class="card pad estrip"><div class="row" style="flex-wrap:wrap;align-items:flex-start"><div class="grow"><div class="src" style="margin:0 0 6px">${esc(job.src||'')}</div><div class="chips">${REQ_LABEL(job).filter(x=>x[0]==='must').map(x=>`<span class="chip">${x[1]}</span>`).join('')}</div></div><button class="btn sm line" data-act="editjob">Edit</button><button class="btn sm line" data-act="est" aria-expanded="false">Show estimate</button></div></section>`;
 const right=`<div>
  ${rileyCard(job)}
  <div class="prio"><div class="prio-t"><span class="prio-ic" aria-hidden="true">${ICON.target}</span><div class="grow"><div class="eyebrow">Ranking crews by</div><h2>What matters most</h2></div>${isAdmin()?'':'<span class="chip">Set by your admin</span>'}</div>
   <div class="prio-opts">${Object.keys(LABELS).map(p=>`<button class="pill ${!S.w[job.id]&&pr===p?'on':''}" data-act="label" data-v="${esc(p)}" aria-pressed="${!S.w[job.id]&&pr===p}">${esc(p)}</button>`).join('')}${S.w[job.id]?'<span class="pill on">Custom, not saved</span>':''}${isAdmin()?`<button class="btn sm line" data-act="drawer">${S.drawer?'Hide weights':'Tune weights'}</button>`:''}</div>
   <p class="tiny" style="margin:8px 0 0">${S.w[job.id]?'Your own weights for this job. Save them as a new label to reuse.':esc(LABELS[pr]?.d||'')}</p></div>
  ${S.drawer&&isAdmin()?drawer(job):''}
  <div class="sec-h"><h2>${ok.length?'Best crew for this job':'No crew can take it yet'}</h2><span class="tiny">${ok.length} of ${R.length} active crews can take it</span><span class="grow"></span><button class="btn sm line" data-act="manual">Pick a crew yourself</button></div>
  ${ok.length?crewCard(job,ok[0],0):'<div class="card pad" style="margin-bottom:12px">No crew passes the rules. Pick a crew yourself with a reason, or rate more crews in Setup.</div>'}
  ${ok.length>1?`<section class="card pad others"><div class="row" style="flex-wrap:wrap"><b class="grow">Compare with ${plural(ok.length-1,'other crew')}</b>${ok.slice(1).map(r=>`<button class="pill ${vis[r.crew]?'on':''}" data-act="vis" data-v="${r.crew}" aria-pressed="${!!vis[r.crew]}">${crewDot(r.crew)}${esc(crewById(r.crew).name)} · ${r.score}</button>`).join('')}<button class="btn sm line" data-act="visall">${ok.slice(1).every(r=>vis[r.crew])?'Hide all':'Show all'}</button></div></section>`:''}
  ${ok.slice(1).filter(r=>vis[r.crew]).map(r=>crewCard(job,r,ok.indexOf(r))).join('')}
  ${otherOut.length?`<div class="card" style="margin-top:6px"><button class="out" style="width:100%;border:0;background:none;text-align:left" data-act="toggleout" aria-expanded="${S.showOut}"><b class="grow">${plural(otherOut.length,'crew')} can’t take it</b><span class="tiny">${S.showOut?'Hide':'Show why'}</span></button>
   ${S.showOut?otherOut.map(r=>`<div class="out">${crewDot(r.crew)}<div class="grow"><b>${esc(crewById(r.crew).name)}</b><div class="rules">${r.fails.map(f=>`<span class="rule x">${esc(f)}</span>`).join('')}</div></div></div>`).join(''):''}</div>`:''}
  ${needR.length?`<div class="card pad" style="margin-top:10px"><div class="row" style="flex-wrap:wrap"><b class="grow">${plural(needR.length,'crew')} not rated for ${dimL(job.type).toLowerCase()} yet</b>${isAdmin()?`<button class="btn sm line" data-go="crews" data-crewf="needs">Rate them</button>`:'<span class="tiny">Your admin can rate them</span>'}</div><div class="chips" style="margin-top:8px">${needR.map(r=>`<button class="chip" data-act="crew" data-v="${r.crew}" style="border:0">${esc(crewById(r.crew).name)}</button>`).join('')}</div></div>`:''}</div>`;
 return `<button class="back" data-go="queue">← Ready to schedule</button>
 <div class="mhead"><div class="grow"><div class="eyebrow">Find a crew</div><h1>${esc(job.title)}</h1>
  <div class="chips" style="margin-top:8px"><span class="chip">${esc(job.area)}</span><span class="chip num">${money(job.value)}</span><span class="chip num">${painterDays(job)} painter days</span><span class="chip">Finish by ${dlabel(job.deadline)}</span>${iw.length?`<button class="chip bad" style="border:0" data-act="impwhy" aria-expanded="${S.impWhyOpen}">Important client · why?</button>`:''}</div>
  ${S.impWhyOpen&&iw.length?impBox(job):''}</div>${fbBtn('match')}</div>
 ${S.estOpen?`<div class="split">${left}${right}</div>`:strip+right}`;};
function drawer(job){const w=weights(job.id);
 return `<section class="card drawer"><div class="row" style="margin-bottom:8px"><h3 style="font-size:16px" class="grow">Weights for this job</h3><button class="btn sm line" data-act="resetw">Reset</button></div>
 <div class="tiny" style="margin-bottom:8px">Admin only. Rules that remove crews live in Setup.</div>
 <div class="wgrid">${factorList().map(([k,l])=>`<label class="wrow"><span>${esc(l)}</span><input type="range" min="0" max="5" step="1" value="${w[k]||0}" data-w="${k}" id="w-${k}"><b class="num">${w[k]||0}</b></label>`).join('')}</div>
 ${S.w[job.id]?`<div class="savep"><label class="tiny" for="pname">Save as a new label schedulers can choose</label><div class="row" style="margin-top:4px"><input class="in" id="pname" placeholder="e.g. Rainy season" maxlength="28"><button class="btn sm tape" data-act="savelabel">Save label</button></div></div>`:''}</section>`;}

/* ---------- board: scheduling one job ---------- */
V.board=()=>{const job=J();const p=S.place[job.id];
 return `<button class="back" data-go="${p&&p.status==='scheduled'?'queue':'match'}">← ${p&&p.status==='scheduled'?'Ready to schedule':'Crew ranking'}</button>
 <div class="mhead"><div class="grow"><div class="eyebrow">Scheduling</div><h1>${esc(job.title)}</h1><div class="small muted" style="margin-top:4px">${esc(job.client)} · ${esc(job.area)} · ${painterDays(job)} painter days · finish by ${dlabel(job.deadline)}</div></div>
  <div class="seg" role="group" aria-label="Job">${QORDER.map(j=>`<button aria-pressed="${j===S.job}" data-act="setjob" data-v="${j}">${esc(JOBS[j].title.split(' ')[0])}${S.place[j]?.status==='scheduled'?' ✓':''}</button>`).join('')}</div>${fbBtn('board')}</div>
 <div class="banner">${p?`<b>${esc(crewById(p.crew).name)}, ${dlabel(pS(p))} to ${dlabel(pE(p))}.</b><span class="muted small grow">Drag the blue job to another day or crew. ${p.segs.length>1?'Drag either visit on its own.':''}</span>`:
  `<b>Pick a slot.</b><span class="muted small grow">Dashed outlines are each crew’s earliest opening, with its match score. Click one to place a draft.</span>`}
  <span class="filt"><button class="pill ${S.hideOthers?'on':''}" data-act="hideothers" aria-pressed="${S.hideOthers}">Hide other jobs</button><button class="pill ${S.allCrews?'on':''}" data-act="allcrews" aria-pressed="${S.allCrews}">Show all crews</button></span></div>
 <div class="boardwrap"><div class="card ecwrap"><div id="ec"></div></div>${planPanel(job)}</div>`;};
function msgFor(job,p,kind,lang){const c=crewById(p.crew);const s=pS(p),e=pE(p);const first=job.client.split(' ')[0];const names=job.client.replace(/ \w+$/,'');
 const ES_D={Mon:'lunes',Tue:'martes',Wed:'miércoles',Thu:'jueves',Fri:'viernes'},HT_D={Mon:'lendi',Tue:'madi',Wed:'mèkredi',Thu:'jedi',Fri:'vandredi'};const ES_M={Oct:'octubre',Nov:'noviembre',Dec:'diciembre'},HT_M={Oct:'oktòb',Nov:'novanm',Dec:'desanm'};const EN_M={Oct:'October',Nov:'November',Dec:'December'},EN_D={Mon:'Monday',Tue:'Tuesday',Wed:'Wednesday',Thu:'Thursday',Fri:'Friday'};
 const dt=(i,l)=>{const x=DL[i];return l==='es'?`${ES_D[x.dow]} ${x.n} de ${ES_M[x.m]}`:l==='ht'?`${HT_D[x.dow]} ${x.n} ${HT_M[x.m]}`:`${EN_D[x.dow]}, ${EN_M[x.m]} ${x.n}`;};
 const kindES={exterior:'pintura exterior',interior:'pintura interior',cabinets:'pintura de gabinetes',commercial:'pintura',wallpaper:'papel tapiz',decorative:'pintura decorativa'}[job.type];
 const kindHT={exterior:'penti eksteryè',interior:'penti enteryè',cabinets:'penti kabinè',commercial:'penti',wallpaper:'papye pent',decorative:'penti dekoratif'}[job.type];
 const kindEN={exterior:'exterior painting',interior:'interior painting',cabinets:'cabinet painting',commercial:'painting',wallpaper:'wallpaper',decorative:'decorative painting'}[job.type];
 if(kind==='client'){
  if(lang==='es')return `Hola ${names.replace('&','y')}, le saluda ${COMPANY}. Su proyecto de ${kindES} está programado para comenzar el ${dt(s,'es')}, con fecha estimada de finalización el ${dt(e,'es')}. El equipo de ${c.name} llegará a las 8:00 a. m.${job.ext?' Si el clima afecta el calendario, le avisaremos con anticipación.':''} Responda a este mensaje si tiene alguna pregunta. Gracias por confiar en nosotros.`;
  if(lang==='ht')return `Bonjou ${names.replace('&','ak')}, se ${COMPANY}. Travay ${kindHT} ou a pwograme pou kòmanse ${dt(s,'ht')}, epi nou prevwa fini ${dt(e,'ht')}. Ekip ${c.name} ap rive a 8:00 AM.${job.ext?' Si move tan chanje orè a, n ap kontakte w davans.':''} Tanpri reponn mesaj sa a si w gen nenpòt kesyon. Mèsi paske w fè nou konfyans.`;
  return `Hello ${names.replace('&','and')}, this is ${COMPANY}. Your ${kindEN} project is scheduled to begin ${dt(s,'en')}, with completion expected by ${dt(e,'en')}. ${c.name}’s crew will arrive at 8:00 AM.${job.ext?' If weather affects the schedule, we will let you know in advance.':''} Please reply to this message with any questions. Thank you for choosing us.`;}
 const pay=crewPay(job,p.crew);
 if(kind==='crew')return `New job: ${job.title}\n${dlabel(s)} to ${dlabel(e)}${p.half?` (${p.half==='am'?'morning':'afternoon'})`:''}, start 8am\n${job.area}, address and photos in the app\n${job.ext?'Exterior. Wash day 1, body coats on dry days only.':dimL(job.type)+'.'}${job.hoa?' HOA hours 8 to 5.':''}\n${job.built<1978?'Lead-safe setup required.\n':''}Colors: ${job.colors.map(x=>x[0]).join(', ')}\nJob pay: ${money(pay.amt)} (${painterDays(job)} painter days)\nReply YES to accept.`;
 return `Work notice for the ${job.client.split(' ').slice(-1)[0]} residence: exterior painting ${dlabel(s)} to ${dlabel(e)}, weekdays 8am to 5pm. Approved colors on file. ${COMPANY}.`;}
function planPanel(job){const p=S.place[job.id];
 if(!p) return `<aside class="card plan"><h3 style="font-size:17px">Plan</h3><p class="small muted">Click a dashed slot on the calendar, or drag the job from Ready to schedule onto a crew.</p>
  <div class="eyebrow" style="margin-top:14px">Best fit</div>${(()=>{const r=rank(job.id).find(x=>x.ok);return r?`<div class="row" style="margin-top:6px">${crewDot(r.crew)}<b class="grow">${esc(crewById(r.crew).name)}</b><span class="chip tape num">match ${r.score}</span></div><div class="small muted" style="margin-top:4px">${dlabel(r.slot.s)} to ${dlabel(r.slot.e)}</div><button class="btn tape sm" style="margin-top:10px" data-act="place" data-v="${r.crew}">Use this slot</button>`:'<div class="small">No crew fits.</div>';})()}</aside>`;
 const c=crewById(p.crew);const sched=p.status==='scheduled';const fails=hard(job,p.crew);const conf=placeConf(job.id);const days=placeDays(job.id);const work=days.filter(d=>d.k==='work').length;const rd=days.filter(d=>d.k==='rain'),pz=days.filter(d=>d.k==='pause');
 const R=rank(job.id);const best=R.find(x=>x.ok);const lang=S.msgLang[job.id]||job.lang;const pay=crewPay(job,p.crew);
 const checks=[];
 if(!fails.length)checks.push(['ok',`${c.name} passes every rule`]);else fails.forEach(f=>checks.push(['no',f+(best&&best.crew!==p.crew?'':'')]));
 if(conf.length)checks.push(['no',`Overlaps another job on ${conf.map(sdate).join(', ')}`]);
 if(pE(p)>job.deadline)checks.push(['no',`Finishes ${sdate(pE(p))}, after the ${sdate(job.deadline)} deadline`]);else checks.push(['ok',`Finishes ${dlabel(pE(p))}, ${plural(job.deadline-pE(p),'day')} to spare`]);
 rd.forEach(x=>checks.push(['wn',`${dlabel(x.d)}: ${WX[x.d][0]}% chance of rain. Rain day, crew does covered prep`]));
 if(p.segs.length>1)checks.push(['wn',`Split into ${p.segs.length} visits with ${plural(pz.length,'day')} paused. Clients usually prefer one stretch`]);
 if(job.colorsOk!==true)checks.push(['wn',job.colorsOk==='sent'?'Colors not confirmed yet. The color form is with the client':'Colors not confirmed. Text the client before you confirm']);
 if(best&&best.crew!==p.crew)checks.push(['wn',`Not the top-ranked crew (${best.score} is ${crewById(best.crew).name}). You’ll add a reason when you confirm`]);
 const sz=planSize(c);checks.push([work*sz>painterDays(job)*1.15?'wn':'ok',`${sz} painters × ${p.half?'half a day':plural(work,'day')} = ${p.half?sz/2:work*sz} painter days booked. ${painterDays(job)} sold`]);
 const tabs=job.hoa?['crew','client','hoa']:['crew','client'];const mt=tabs.includes(S.msgTab)?S.msgTab:'crew';
 const msg=msgFor(job,p,mt,lang);const canOk=!conf.length&&pE(p)<=job.deadline&&(!fails.length||S.override?.[job.id]);
 return `<aside class="card plan"><div class="row">${crewDot(p.crew)}<h3 style="font-size:17px" class="grow">${esc(c.name)}</h3><span class="chip ${sched?'good':'tape'}">${sched?'Confirmed':'Draft'}</span></div>
 <div class="lines" style="margin:8px 0 6px">
  <div class="ln">${ICON.cal}<span><b>${dlabel(pS(p))}${pE(p)!==pS(p)?' to '+dlabel(pE(p)):''}</b>${p.half?` <small>· ${p.half==='am'?'morning':'afternoon'}</small>`:''}</span></div>
  <div class="ln">${ICON.people}<span>${sizeText(c)}</span></div>
  <div class="ln">${ICON.clock}<span>${p.half?'Half a day':plural(work,'day')} on site${rd.length?`, plus ${plural(rd.length,'rain day')}`:''}${pz.length?`, ${plural(pz.length,'day')} paused`:''}</span></div>
  <div class="ln">${ICON.pay}<span>Job pay ${money(pay.amt)} <small>· estimate, pay model to confirm</small></span></div></div>
 ${!sched&&!p.half&&work>1?`<div class="hr" style="border-top:1px solid var(--line);margin-top:6px"><span class="grow">Split into two visits<span class="tiny" style="display:block">Then drag the second visit on the calendar</span></span><button class="tog ${p.segs.length>1?'on':''}" data-act="split" role="switch" aria-checked="${p.segs.length>1}" aria-label="Split into two visits"><i></i></button></div>`:''}
 <div style="margin-top:8px">${checks.map(([k,t])=>`<div class="check ${k}"><i>${k==='ok'?'✓':k==='wn'?'!':'×'}</i><span>${esc(t)}</span></div>`).join('')}</div>
 <div class="eyebrow" style="margin-top:14px">What goes out on confirm</div>
 <div class="msgtabs" role="group">${tabs.map(t=>`<button aria-pressed="${mt===t}" data-act="msg" data-v="${t}">${{crew:'Crew lead',client:'Client',hoa:'HOA'}[t]}</button>`).join('')}</div>
 ${mt==='client'?`<div class="row" style="margin-bottom:6px"><label class="tiny grow" for="mlang">Client’s preferred language</label><select class="in" id="mlang" data-mlang="${job.id}" style="width:auto">${Object.entries(LANGS).map(([k,l])=>`<option value="${k}" ${lang===k?'selected':''}>${l}</option>`).join('')}</select></div>`:''}
 <div class="tiny" style="margin-bottom:4px">${mt==='crew'?`${esc(c.name)} · WhatsApp`:mt==='client'?`${esc(job.client.split(' ')[0])} · Text${lang!=='en'?' in '+LANGS[lang]:''}`:'HOA office · Email'}</div><div class="bubble">${esc(msg)}</div>
 ${mt==='client'&&lang==='ht'?'<div class="tiny" style="margin-top:4px">Have a native speaker review the Creole template before it goes live.</div>':''}
 <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap">${sched?`<button class="btn line" data-act="unschedule">Unschedule</button>`:`<button class="btn tape" data-act="confirm" ${canOk?'':'disabled'}>Confirm and notify</button><button class="btn line" data-act="clear">Clear</button>`}</div>
 ${!sched&&!canOk?`<div class="tiny" style="margin-top:8px">${fails.length&&!conf.length?'This crew fails a rule. Use “Pick a crew yourself” on the ranking to override with a reason.':'Fix the red checks to confirm.'}</div>`:''}</aside>`;}

/* ---------- crew calendar ---------- */
V.cal=()=>{const F=S.calF;const waiting=QORDER.filter(j=>!S.place[j]);
 return `<div class="qhead"><div class="grow"><div class="eyebrow">All crews</div><h1>Crew calendar</h1></div>
  <button class="btn tape" data-act="optimize">${ICON.spark} Optimizer</button>${fbBtn('cal')}</div>
 ${kpiCards(true)}
 <section class="card pad calf">
  <div class="fgroup"><span class="eyebrow">View</span><div class="seg" role="group" aria-label="Calendar view">${[['resourceTimelineDay','Day'],['resourceTimelineWeek','Week'],['twoWeeks','2 weeks'],['resourceTimelineMonth','Month']].map(([k,l])=>`<button aria-pressed="${F.view===k}" data-act="calview" data-v="${k}">${l}</button>`).join('')}</div>
   <span class="stepper" aria-label="Zoom"><button data-act="zoom" data-v="-1" aria-label="Zoom out">−</button><span class="tiny">Zoom</span><button data-act="zoom" data-v="1" aria-label="Zoom in">+</button></span></div>
  <div class="fgroup"><span class="eyebrow">Show</span><div class="seg" role="group" aria-label="Jobs to show">${[['all','All jobs'],['confirmed','Confirmed'],['drafts','Drafts'],['none','No jobs']].map(([k,l])=>`<button aria-pressed="${F.show===k}" data-act="calshow" data-v="${k}">${l}</button>`).join('')}</div></div>
  <div class="fgroup"><span class="eyebrow">Crews</span><div class="seg" role="group" aria-label="Crews to show">${[['ready','Ready to match'],['all','All active'],['needs','Need setup']].map(([k,l])=>`<button aria-pressed="${F.group===k}" data-act="calgroup" data-v="${k}">${l}</button>`).join('')}</div></div>
  <div class="fgroup"><span class="eyebrow">Open days</span><button class="tog ${F.open?'on':''}" data-act="calopen" role="switch" aria-checked="${F.open}" aria-label="Highlight open days"><i></i></button></div></section>
 <div class="calgrid"><aside class="card pad tray" id="tray"><div class="row"><b class="grow">Not on the calendar</b><span class="chip num">${waiting.length}</span></div><p class="tiny" style="margin:4px 0 10px">Drag a job onto a crew and day. Click it to pick a crew instead.</p>
  ${waiting.map(j=>{const job=JOBS[j];return `<div class="tcard" draggable="true" data-drag="${j}"><b>${esc(job.title)}</b><span class="tiny">${painterDays(job)} painter days · by ${sdate(job.deadline)}</span><button class="lnk" data-act="match" data-v="${j}">Crew selection →</button></div>`;}).join('')||'<p class="small muted">Everything sold is on the calendar.</p>'}
  <button class="btn sm line" data-go="add" style="margin-top:8px;width:100%">+ Add a job</button></aside>
 <div class="card ecwrap"><div id="ec"></div></div></div>
 <div class="legend"><span><i style="background:color-mix(in srgb,var(--tape) 22%,var(--surface));border:1px solid var(--line)"></i>Confirmed</span><span><i style="background:var(--sunk);border:1px dashed var(--faint)"></i>Draft</span><span><i style="background:color-mix(in srgb,var(--warn) 22%,transparent)"></i>Open day (about $1,000 lost)</span><span>Drag to move · click to open</span></div>`;};
