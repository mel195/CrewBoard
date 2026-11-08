/* ============ modals ============ */
const MW=(label,inner,wide)=>`<div class="ov" data-act="closemodal"><div class="card modal ${wide?'wide':''}" role="dialog" aria-modal="true" aria-label="${esc(label)}"><button class="x noprint" data-act="closemodal2" aria-label="Close">×</button>${inner}</div></div>`;
const M={};
const REASONS=['Client asked for this crew','Top crew is needed on another job','Crew knows this home or client','Pairing or training','Schedule or travel reason','Other'];
M.planall=m=>MW('Plan for all jobs',`<div class="eyebrow">Plan all</div><h2 class="mt">${plural(m.items.length,'job')} placed as drafts</h2><p class="small muted">Important jobs first, then jobs with the fewest crews that can do them. Each takes the best crew still free. Nothing is sent until you confirm.</p>
 ${m.items.map(it=>`<div class="row brow">${crewDot(it.crew)}<div class="grow"><b>${esc(JOBS[it.jid].title)}</b><div class="small muted">${esc(crewById(it.crew).name)} · ${dlabel(it.s)}${it.e!==it.s?' to '+dlabel(it.e):''}</div></div><span class="chip tape num">match ${it.score}</span></div>`).join('')}
 ${m.skipped.map(j=>`<div class="row brow"><span class="dot" style="--c:var(--bad)"></span><div class="grow"><b>${esc(JOBS[j].title)}</b><div class="small muted">No crew passes the rules</div></div></div>`).join('')}
 <div class="row" style="margin-top:14px;flex-wrap:wrap"><button class="btn tape" data-act="confirmall">Confirm all and notify</button><button class="btn line" data-act="reviewall">Review on the calendar</button></div>`);
M.audit=m=>{const job=J();const R=rank(job.id);const r=R.find(x=>x.crew===m.crew);const c=crewById(m.crew);const w=weights(job.id);const sw=Object.values(w).reduce((a,b)=>a+b,0);const rc=ruleChecks(job,m.crew,r);
 return MW('Score breakdown',`<div class="eyebrow">Score record</div><h2 class="mt">How ${esc(c.name)} scored ${r.score} for ${esc(job.title)}</h2>
  <div class="tiny">Worked out ${stamp()} · for ${ME()} · label “${esc(rankName(job.id))}” · position ${R.indexOf(r)+1} of ${R.length}</div>
  <h3 class="mh">1. Rules (pass or fail)</h3>${rc.map(([okk,l,why])=>`<div class="check ${okk?'ok':'no'}"><i>${okk?'✓':'×'}</i><span><b>${esc(l)}</b> · <span class="muted">${esc(why)}</span></span></div>`).join('')}
  <h3 class="mh">2. Weighted factors</h3><div class="tscroll"><table class="atable"><tr><th>Factor</th><th>How it’s measured</th><th class="n">Value</th><th class="n">Weight</th><th class="n">Points</th></tr>
  ${Object.keys(w).filter(k=>w[k]>0).map(k=>`<tr><td><b>${esc(flabel(k))}</b></td><td class="muted">${esc(fdesc(k))}</td><td class="n">${r.f[k]}</td><td class="n">${w[k]}</td><td class="n">${(w[k]*r.f[k]/sw).toFixed(1)}</td></tr>`).join('')}
  <tr><td colspan="4"><b>Score</b> (points add up, rounded)</td><td class="n"><b>${r.score}</b></td></tr></table></div>
  <h3 class="mh">3. What’s never used</h3><p class="small muted" style="margin:0">Age, gender, race, ethnicity, national origin, religion, disability or any other personal trait. Language only counts when the client asks for it.</p>
  <h3 class="mh">4. Who decides</h3><p class="small muted" style="margin:0">This is a suggestion. A scheduler confirms the crew, and picking anyone other than the top crew needs a reason, saved in the audit log.</p>
  <div class="row noprint" style="margin-top:16px;flex-wrap:wrap"><button class="btn tape" data-act="exportscore">Download CSV (all crews)</button><button class="btn line" data-act="printit">Print or save as PDF</button></div>`,true);};
M.reason=m=>MW('Reason',`<div class="eyebrow">${m.manual?'Picking a crew yourself':'Picking a different crew'}</div><h2 class="mt">${m.title}</h2><p class="small muted">${m.sub}</p>
 <div class="chips">${REASONS.map(x=>`<button class="pill ${m.pick===x?'on':''}" data-act="reasonpick" data-v="${x}" aria-pressed="${m.pick===x}">${x}</button>`).join('')}</div>
 <label class="tiny" for="rnote" style="display:block;margin-top:12px">Comment ${m.pick==='Other'?'(required)':'(optional)'}</label><textarea class="in" id="rnote" rows="2" style="margin-top:4px;resize:vertical">${esc(m.note||'')}</textarea>
 <p class="tiny">Saved in the audit log. Riley learns from it.</p>
 <div class="row" style="margin-top:10px"><button class="btn tape" data-act="reasonok" ${m.pick?'':'disabled'}>${m.cta}</button><button class="btn line" data-act="closemodal2">Cancel</button></div>`);
M.manual=m=>{const job=J();const R=rank(job.id);
 return MW('Pick a crew yourself',`<div class="eyebrow">Manual override</div><h2 class="mt">Pick a crew yourself</h2><p class="small muted">Any active crew, even one the rules rule out. You’ll add a reason next.</p>
 <div class="mlist2">${R.map(r=>{const c=crewById(r.crew);return `<label class="mopt ${m.sel===r.crew?'on':''}"><input type="radio" name="mpick" value="${r.crew}" data-mpick ${m.sel===r.crew?'checked':''}>${crewDot(r.crew)}<span class="grow"><b>${esc(c.name)}</b> <span class="tiny">${sizeText(c)}</span><span class="tiny" style="display:block">${r.ok?`Passes the rules · match ${r.score}`:esc(r.fails.join(' · '))}</span></span>${r.ok?'<span class="chip good">OK</span>':'<span class="chip bad">Override</span>'}</label>`;}).join('')}</div>
 <div class="row" style="margin-top:12px"><button class="btn tape" data-act="manualnext" ${m.sel?'':'disabled'}>Next: add a reason</button><button class="btn line" data-act="closemodal2">Cancel</button></div>`,true);};
M.move=m=>{const isJob=m.kind==='job';const name=isJob?JOBS[m.id].title:BOOKS.find(b=>b.id===m.id).name;const cur=isJob?pS(S.place[m.id]):BOOKS.find(b=>b.id===m.id).s+(S.shift[m.id]||0);const inLock=cur<S.lock;
 return MW('Move a confirmed job',`<div class="eyebrow">Confirmed job</div><h2 class="mt">Move ${esc(name)}?</h2><p class="small muted">${m.d?`${m.d>0?plural(m.d,'day')+' later':plural(-m.d,'day')+' earlier'}, to ${dlabel(cur+m.d)}`:'Same days'}${m.crew!==(isJob?S.place[m.id].crew:crewOfBooking(BOOKS.find(b=>b.id===m.id)))?`, on ${esc(crewById(m.crew).name)}`:''}. The client and crew lead get a text.</p>
 ${inLock?`<div class="check wn"><i>!</i><span>It starts within your ${S.lock}-day no-move window. Only move it if you have to.</span></div>`:''}
 <div class="chips" style="margin-top:8px">${['Weather','Client asked','Crew asked','Fit in another job','Other'].map(x=>`<button class="pill ${m.pick===x?'on':''}" data-act="movepick" data-v="${x}">${x}</button>`).join('')}</div>
 <div class="row" style="margin-top:14px"><button class="btn tape" data-act="moveok" ${m.pick?'':'disabled'}>Move and text the client</button><button class="btn line" data-act="closemodal2">Cancel</button></div>`);};
M.crew=m=>{const c=crewById(m.id);const h=hist(c.id);const ad=isAdmin();const B=bookings();const up=B.filter(x=>x.crew===c.id).sort((a,b)=>a.s-b.s).slice(0,5);
 const rsel=k=>ad?`<select class="rsel" data-cr="${c.id}" data-rk="${k}" aria-label="${esc(dimL(k))} rating"><option value="">–</option>${[1,1.5,2,2.5,3,3.5,4,4.5,5].map(v=>`<option ${c.r[k]===v?'selected':''}>${v}</option>`).join('')}</select>`:c.r[k]==null?'<span class="faint">–</span>':`<span class="rt r${Math.round(c.r[k])}">${c.r[k]}</span>`;
 const fin=(k,l,v)=>`<div class="hr"><span class="muted" style="width:150px">${l}</span><span class="grow">${ad?`<input class="in" data-cf="${c.id}" data-fk="${k}" value="${esc(v||'')}">`:esc(v||'–')}</span></div>`;
 return MW(c.name,`<div class="mp-h"><span class="av lg" style="--c:${c.c}">${initials(c.name)}</span><div class="grow"><h2 style="font-size:24px">${esc(c.name)}</h2><div class="small muted">${sizeText(c)} · ${esc(c.f.base||'no home base')}${c.f.notes?' · '+esc(c.f.notes):''}</div><div style="margin-top:4px">${readyChip(c)}</div></div>
  ${ad?`<span class="row" style="gap:6px"><span class="tiny">Active</span><button class="tog ${c.f.status==='active'?'on':''}" data-act="crewstatus" data-v="${c.id}" role="switch" aria-checked="${c.f.status==='active'}" aria-label="Active"><i></i></button></span>`:''}</div>
 <h3 class="mh">Crew KPIs</h3>${h?`<div class="stats"><div><b class="num">${h.five}</b><span>5-star reviews</span></div><div><b class="num" style="color:${h.overPct>0?'var(--warn)':'var(--good)'}">${h.overPct>0?'+':''}${h.overPct}%</b><span>Days used vs sold (${h.actual} of ${h.sold})</span></div><div><b class="num">$${h.payAct}</b><span>Pay per painter day worked</span></div><div><b class="num">$${h.costSold}</b><span>Cost per painter day sold</span></div></div><p class="tiny" style="margin:4px 0 0">Sample numbers, last 12 months (${h.jobs} jobs). In the product these come from job history.</p>`:'<p class="small muted" style="margin:0">No job history yet.</p>'}
 <h3 class="mh">Ratings <span class="tiny" style="font-weight:500">1 to 5 · “–” means untested, not low</span></h3>
 <div class="rgrid">${['job','skill','attr'].map(g=>`<div><div class="eyebrow" style="margin-bottom:4px">${g==='job'?'Job types':g==='skill'?'Skills':'Attributes'}</div>${dimsOf(g).map(d=>`<div class="rrow"><span class="grow">${esc(d.l)}</span>${rsel(d.k)}</div>`).join('')}</div>`).join('')}</div>
 <h3 class="mh">Details</h3>
 ${fin('size','Crew size',c.f.size?(c.f.size.min===c.f.size.max?c.f.size.min:`${c.f.size.min}-${c.f.size.max}`):'')}${fin('base','Home base',c.f.base)}
 ${RECOMMENDED.find(x=>x.k==='languages').added?fin('languages','Languages',c.f.languages):''}
 ${RECOMMENDED.find(x=>x.k==='leadSafe').added?`<div class="hr"><span class="muted" style="width:150px">Lead-safe (RRP)</span><span class="grow">${ad?`<button class="tog ${c.f.leadSafe?'on':''}" data-act="crewlead" data-v="${c.id}" role="switch" aria-checked="${!!c.f.leadSafe}" aria-label="Lead-safe certified"><i></i></button>`:c.f.leadSafe?'Certified':'Not on file'}</span></div>`:''}
 ${RECOMMENDED.filter(x=>x.added&&!['languages','leadSafe'].includes(x.k)).map(x=>fin(x.k,x.l,c.f[x.k])).join('')}
 <div class="hr"><span class="muted" style="width:150px">Salesforce name</span><span class="grow">${esc(c.f.sfName)}</span></div><div class="hr"><span class="muted" style="width:150px">Google Calendar</span><span class="grow">${esc(c.f.gcal)}</span></div><div class="hr"><span class="muted" style="width:150px">Email and phone</span><span class="grow">On file</span></div>
 <h3 class="mh">Coming up</h3>${up.length?up.map(x=>`<div class="row brow"><span class="grow">${esc(x.name)}</span><span class="tiny">${dlabel(x.s)}${x.e!==x.s?' to '+dlabel(x.e):''}${x.half?` (${x.half==='am'?'morning':'afternoon'})`:''}</span>${x.prop?'<span class="chip">Draft</span>':''}</div>`).join(''):'<p class="small muted" style="margin:0">Nothing booked in the next 4 weeks.</p>'}`,true);};
M.hub=m=>{const B=bookings();if(JOBS[m.id]){const j=JOBS[m.id];const p=S.place[m.id];const days=p?placeDays(m.id):[];
  return MW(j.title,`<div class="eyebrow">Project</div><h2 class="mt">${esc(j.title)}</h2><div class="small muted">${esc(j.client)} · ${esc(j.area)} · ${money(j.value)} · ${painterDays(j)} painter days</div>
   ${p?`<div class="lines" style="margin-top:12px"><div class="ln">${ICON.people}<span><b>${esc(crewById(p.crew).name)}</b>, ${sizeText(crewById(p.crew))}</span></div><div class="ln">${ICON.cal}<span>${dlabel(pS(p))}${pE(p)!==pS(p)?' to '+dlabel(pE(p)):''} · ${p.status==='scheduled'?'Confirmed, client notified':'Draft, not confirmed'}</span></div></div>
   <div class="daylist">${days.map(x=>`<span class="dchip ${x.k==='rain'?'h':x.k==='pause'?'p':''}"><b>${x.k==='pause'?'Pause':x.k==='rain'?'Rain day':p.half?'Half day':'Day '+x.n}</b>${dlabel(x.d)}</span>`).join('')}</div>`:'<p class="small">Not on the calendar yet.</p>'}
   <div class="links" style="margin-top:12px">${j.colorsOk===true?'<span class="lk good">✓ Colors confirmed</span>':'<span class="lk warn">Colors not confirmed</span>'}<button class="lk" data-act="photos" data-v="${m.id}">${ICON.cam} ${j.photos||0} photos in CompanyCam</button><span class="lk">${esc(j.src||'')}</span></div>
   <div class="row" style="margin-top:16px;flex-wrap:wrap"><button class="btn tape" data-act="match" data-v="${m.id}">Crew selection</button><button class="btn line" data-act="board" data-v="${m.id}">${p?'Plan, split or confirm':'Schedule it'}</button></div>`);}
 const x=B.find(y=>y.id===m.id);const c=crewById(x.crew);
 return MW(x.name,`<div class="eyebrow">Project</div><h2 class="mt">${esc(x.name)}</h2><div class="small muted">${esc(x.what)} · ${money(x.value)} · Confirmed, client notified${x.moved?` · moved ${plural(x.moved,'day')}`:''}</div>
  <div class="lines" style="margin-top:12px"><div class="ln">${ICON.people}<span><b>${esc(c.name)}</b>, ${sizeText(c)}</span></div><div class="ln">${ICON.cal}<span>${dlabel(x.s)}${x.e!==x.s?' to '+dlabel(x.e):''}${x.half?` · ${x.half==='am'?'morning, 8 to 12':'afternoon, 1 to 5'}`:''}</span></div></div>
  <div class="daylist">${Array.from({length:x.e-x.s+1},(_,i)=>`<span class="dchip"><b>${x.half?'Half day':'Day '+(i+1)}</b>${dlabel(x.s+i)}</span>`).join('')}</div>
  <div class="links" style="margin-top:12px"><span class="lk good">✓ Colors confirmed</span><button class="lk" data-act="photos" data-v="${x.id}">${ICON.cam} Photos in CompanyCam</button></div>
  <p class="tiny" style="margin:12px 0 0">Drag it on the calendar to move it. Moving a confirmed job asks for a reason and texts the client.</p>`);};
M.colors=m=>{const j=JOBS[m.id];const first=j.client.split(' ')[0];
 return MW('Text the client',`<div class="eyebrow">Colors not confirmed</div><h2 class="mt">Send ${esc(first)} the color form</h2><p class="small muted">The job stays in the queue and you can still pick a crew.</p>
  <div class="tiny" style="margin-bottom:4px">${esc(first)} · Text</div><div class="bubble">Hello ${esc(first)}, this is ${COMPANY}. We’re ready to schedule your ${esc(j.title.split(' ').slice(1).join(' '))}. Please confirm your color selections here: ppp.co/colors/${m.id}. It takes about two minutes. Thank you.</div>
  <div class="row" style="margin-top:14px"><button class="btn tape" data-act="sendcolors" data-v="${m.id}">Send text</button><button class="btn line" data-act="closemodal2">Not now</button></div>`);};
M.opt=m=>{const nk=m.sel.filter(x=>x==='keep').length,nr=m.sel.filter(x=>x==='reject').length;
 return MW('Optimizer',`<div class="eyebrow">${ICON.spark} Optimizer · run ${m.run}</div><h2 class="mt">Close the gaps</h2>
 <details class="how"><summary>How the optimizer decides</summary><ol class="small"><li>Important jobs first, then jobs with the fewest crews that can do them, then the earliest deadline.</li><li>Each job goes to the eligible crew and day that best fills existing gaps (a job that touches bookings on both sides scores higher), minus 2 points per day of delay, plus a tenth of the match score for the job’s label.</li><li>Half-day jobs go into half-free days first, so a crew can do two small jobs in one day.</li><li>A confirmed job can move 1 or 2 days later only if it starts outside the no-move window and hasn’t been moved before.</li><li>Your rejections become rules for the next run.</li></ol></details>
 <div class="kpis k2"><div class="card kpi"><span>Open crew days now</span><b class="num">${m.before}</b><span>About ${money(m.before*1000)} not billed</span></div><div class="card kpi"><span>After this plan</span><b class="num" style="color:var(--good)">${m.after}</b><span>${m.before-m.after} days filled · about ${money((m.before-m.after)*1000)}</span></div></div>
 <div class="hr"><span class="grow">Don’t move confirmed jobs that start in the next</span><span class="stepper"><button data-act="lock" data-v="-1" aria-label="Fewer days">−</button><b class="num">${plural(S.lock,'day')}</b><button data-act="lock" data-v="1" aria-label="More days">+</button></span></div>
 ${m.moves.map((mv,i)=>{const job=JOBS[mv.jid];const late=mv.s-job.earliest;const rj=m.sel[i]==='reject';return `<div class="mv ${rj?'rej':''}"><div class="grow"><b>${esc(job.title)}</b> <span class="muted">→</span> <b>${esc(crewById(mv.crew).name)}</b>${mv.kept?' <span class="chip">Kept from last run</span>':''}<div class="small muted">${dlabel(mv.s)}${mv.e!==mv.s?' to '+dlabel(mv.e):''}${mv.half?` (${mv.half==='am'?'morning':'afternoon'})`:''}</div>
  <div class="chips" style="margin-top:6px">${mv.fill?`<span class="chip good">Fills ${mv.fill} open day${mv.fill===1?'':'s'}</span>`:''}${mv.crew===mv.top?'<span class="chip good">Top-ranked crew</span>':`<span class="chip warn">Not the top crew (${mv.score} vs ${mv.topScore})</span>`}${late>0?`<span class="chip warn">Starts ${plural(late,'day')} after the first possible day</span>`:'<span class="chip good">Starts the first possible day</span>'}</div>
  ${mv.shift?`<div class="check wn" style="margin-top:6px"><i>!</i><span>Moves a confirmed job: ${esc(mv.shift.name)} shifts ${plural(mv.shift.k,'day')} later, to ${dlabel(mv.shift.from+mv.shift.k)}. That client gets a text.</span></div>`:''}
  ${mv.alts&&mv.alts.length?`<details><summary>Other options it considered</summary>${mv.alts.map(a=>`<div class="tiny">${esc(crewById(a.crew).name)}, ${dlabel(a.s)}: ${esc(a.why)}</div>`).join('')}</details>`:''}
  ${rj?`<div class="chips" style="margin-top:8px">${[['crew','Wrong crew for this job'],['dates','Client needs other dates'],['busy','Crew isn’t available then'],...(mv.shift?[['nomove','Don’t move that confirmed job']]:[])].map(([k,l])=>`<button class="pill ${m.why[i]===l?'on':''}" data-act="optwhy" data-v="${i}" data-k="${k}" data-l="${esc(l)}">${l}</button>`).join('')}</div>`:''}</div>
  <div class="seg" role="group" aria-label="Decision"><button aria-pressed="${!rj}" data-act="optsel" data-v="${i}" data-k="keep">Keep</button><button aria-pressed="${rj}" data-act="optsel" data-v="${i}" data-k="reject">Reject</button></div></div>`;}).join('')||'<p class="small">No moves found. The schedule is already tight.</p>'}
 ${m.skipped.length?`<p class="small muted">Couldn’t place: ${m.skipped.map(j=>esc(JOBS[j].title)).join(', ')} (no crew passes the rules and your feedback).</p>`:''}
 <div class="row" style="margin-top:14px;flex-wrap:wrap"><button class="btn tape" data-act="optapply" ${nk?'':'disabled'}>Apply ${plural(nk,'move')}</button>${nr?`<button class="btn line" data-act="reopt" ${m.moves.every((x,i)=>m.sel[i]!=='reject'||m.why[i])?'':'disabled'}>Re-optimize with my feedback</button>`:''}<button class="btn line" data-act="optcsv">Download how it decided</button><button class="btn line" data-act="closemodal2">Cancel</button></div>
 ${nr&&!m.moves.every((x,i)=>m.sel[i]!=='reject'||m.why[i])?'<p class="tiny">Pick a reason for each rejected move, then re-optimize.</p>':''}`,true);};
M.label=m=>MW('Ranking label',`<div class="eyebrow">Admin · ranking label</div><h2 class="mt">${m.isNew?'New label':esc(m.name)}</h2>
 ${m.isNew?`<label class="tiny" for="lname">Name</label><input class="in" id="lname" value="${esc(m.name)}" maxlength="28" style="margin:4px 0 10px">`:''}
 <label class="tiny" for="ldesc">What it’s for</label><input class="in" id="ldesc" value="${esc(m.d)}" style="margin:4px 0 12px">
 <div class="wgrid">${factorList().map(([k,l])=>`<label class="wrow"><span>${esc(l)}</span><input type="range" min="0" max="5" step="1" value="${m.w[k]||0}" data-lw="${k}" id="lw-${k}"><b class="num">${m.w[k]||0}</b></label>`).join('')}</div>
 <div class="row" style="margin-top:14px"><button class="btn tape" data-act="labelsave">Save label</button>${!m.isNew&&Object.keys(LABELS).length>1?'<button class="btn line" data-act="labeldel">Delete</button>':''}<button class="btn line" data-act="closemodal2">Cancel</button></div>`,true);
M.addcrew=m=>MW('Add a crew',`<div class="eyebrow">Admin</div><h2 class="mt">Add a crew</h2><p class="small muted">Crew Board is the source of truth. Add the basics now and rate them on their profile.</p>
 <label class="tiny" for="ncname">Crew name</label><input class="in" id="ncname" style="margin:4px 0 10px">
 <div class="row"><div class="grow"><label class="tiny" for="ncsize">Crew size (e.g. 3 or 2-3)</label><input class="in" id="ncsize" style="margin-top:4px"></div><div class="grow"><label class="tiny" for="ncbase">Home base</label><select class="in" id="ncbase" style="margin-top:4px"><option value="">Choose…</option>${Object.keys(GEO).map(a=>`<option>${a}</option>`).join('')}</select></div></div>
 <div class="row" style="margin-top:14px"><button class="btn tape" data-act="addcrewok">Add crew</button><button class="btn line" data-act="closemodal2">Cancel</button></div>`);
M.mapping=m=>MW('Map your columns',`<div class="eyebrow">Import · ${esc(m.file)}</div><h2 class="mt">Map your columns</h2><p class="small muted">${plural(m.sheets.length,'sheet')} found: ${m.sheets.map(s=>`${esc(s.name)} (${plural(s.rows.length,'row')}, header on row ${s.h+1})`).join(' · ')}. We matched what we could. Change anything that’s off.</p>
 <div class="tscroll"><table class="atable"><tr><th>Sheet</th><th>Column</th><th>Group</th><th>Example</th><th>Use as</th></tr>
 ${m.cols.map((c,i)=>`<tr><td class="tiny">${esc(c.sheet)}</td><td><b>${esc(c.head)}</b></td><td class="tiny">${esc(c.group||'')}</td><td class="tiny">${esc(c.ex)}</td><td><select class="in" data-mapi="${i}" style="min-width:170px">${MAPOPTS.map(([v,l])=>`<option value="${v}" ${c.as===v?'selected':''}>${l}</option>`).join('')}</select></td></tr>`).join('')}</table></div>
 <div class="row" style="margin-top:14px"><button class="btn tape" data-act="mapok">Import ${plural(m.names.length,'crew')}</button><button class="btn line" data-act="closemodal2">Cancel</button></div>`,true);
/* ============ spreadsheet import ============ */
const XLSX_JS='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
const MAPOPTS=[['ignore','Ignore'],['name','Crew name'],['sfName','Salesforce name'],['email','Email'],['phone','Phone'],['gcal','Calendar name'],['status','Status'],['size','Crew size'],['base','Home base'],['notes','Notes'],['r-job','Rating: job type'],['r-skill','Rating: skill'],['r-attr','Rating: attribute'],['info','Other info']];
const ALIAS=[[/interior/i,'interior'],[/exterior/i,'exterior'],[/cabinet/i,'cabinets'],[/commercial|hoa/i,'commercial'],[/wallpaper/i,'wallpaper'],[/decorat/i,'decorative'],[/drywall|skim/i,'drywall'],[/prep/i,'prep'],[/cut/i,'cutin'],[/spray/i,'spray'],[/color|detail/i,'color'],[/speed/i,'speed'],[/reliab/i,'reliability'],[/quality/i,'quality'],[/communic/i,'communication'],[/care|jobsite/i,'care'],[/independ/i,'independence'],[/client/i,'client']];
const dimKey=l=>{const a=ALIAS.find(([re])=>re.test(l));return a?a[1]:slug(l);};
async function readSheet(file){await loadScript(XLSX_JS);const wb=XLSX.read(await file.arrayBuffer(),{type:'array',cellDates:true});const sheets=[];
 wb.SheetNames.forEach(n=>{const rows=XLSX.utils.sheet_to_json(wb.Sheets[n],{header:1,raw:true,defval:null});let h=-1;
  for(let i=0;i<Math.min(8,rows.length);i++){const r=rows[i]||[];const strs=r.filter(v=>typeof v==='string'&&v.trim()).length;if(strs>=3&&r.some(v=>typeof v==='string'&&/^(crew|name)$/i.test(v.trim()))){h=i;break;}}
  if(h<0)return;const head=rows[h];const gr=h>0?rows[h-1]:[];let g=null;const groups=head.map((_,j)=>{if(gr&&typeof gr[j]==='string'&&gr[j].trim())g=gr[j].trim();return g;});
  const data=rows.slice(h+1).filter(r=>r&&r[head.findIndex(v=>typeof v==='string'&&/^(crew|name)$/i.test(v.trim()))]);sheets.push({name:n,h,head,groups,rows:data});});
 if(!sheets.length)throw new Error('nohead');
 const cols=[];sheets.forEach(s=>s.head.forEach((hd,j)=>{if(hd==null||String(hd).trim()==='')return;const head=String(hd).trim();const grp=s.groups[j]||'';const vals=s.rows.map(r=>r[j]).filter(v=>v!=null&&v!=='');const ex=vals[0] instanceof Date?'(date) '+vals[0].toISOString().slice(5,10):String(vals[0]??'').slice(0,24);
  let as='info';const num=vals.length&&vals.every(v=>typeof v==='number'&&v>=0&&v<=5);
  if(/^(crew|name)$/i.test(head))as='name';else if(/salesforce/i.test(head))as='sfName';else if(/e-?mail/i.test(head))as='email';else if(/phone/i.test(head))as='phone';else if(/calendar/i.test(head))as='gcal';else if(/status/i.test(head))as='status';else if(/size/i.test(head))as='size';else if(/base|location|city|area/i.test(head))as='base';else if(/note/i.test(head))as='notes';
  else if(/job/i.test(grp))as='r-job';else if(/skill/i.test(grp))as='r-skill';else if(/attrib/i.test(grp)||num)as='r-attr';
  cols.push({sheet:s.name,j,head,group:grp,ex,as});}));
 const names=[...new Set(sheets.flatMap(s=>{const ni=s.head.findIndex(v=>typeof v==='string'&&/^(crew|name)$/i.test(v.trim()));return s.rows.map(r=>String(r[ni]).trim());}))];
 return{type:'mapping',file:file.name,sheets,cols,names};}
function sizeFrom(v){if(v instanceof Date)return{s:parseSize(`${v.getMonth()+1}-${v.getDate()}`),fixed:true};if(typeof v==='number'&&v>1000){const d=new Date(Math.round((v-25569)*864e5));return{s:parseSize(`${d.getUTCMonth()+1}-${d.getUTCDate()}`),fixed:true};}return{s:parseSize(v),fixed:false};}
function applyImport(m){const byName={};const fixed=[];const dims=[];
 m.cols.filter(c=>c.as.startsWith('r-')).forEach(c=>{const k=dimKey(c.head);if(!dims.some(d=>d.k===k))dims.push({k,l:c.head,g:c.as.slice(2)});});
 m.names.forEach(n=>byName[n]={name:n,f:{status:'',size:null,base:'',notes:'',sfName:'',gcal:'',email:'',phone:''},r:{}});
 m.sheets.forEach(s=>{const ni=s.head.findIndex(v=>typeof v==='string'&&/^(crew|name)$/i.test(v.trim()));s.rows.forEach(r=>{const cr=byName[String(r[ni]).trim()];
  m.cols.filter(c=>c.sheet===s.name&&c.as!=='ignore'&&c.as!=='name').forEach(c=>{const v=r[c.j];if(v==null||v==='')return;
   if(c.as==='size'){const z=sizeFrom(v);cr.f.size=z.s;if(z.fixed){cr.f.sizeFixed=true;fixed.push(cr.name);}}
   else if(c.as.startsWith('r-')){const n=+v;if(!isNaN(n))cr.r[dimKey(c.head)]=n;}
   else if(c.as==='status')cr.f.status=/inact|no|off/i.test(v)?'inactive':'active';
   else if(c.as==='info'){cr.f[slug(c.head)]=String(v);}else cr.f[c.as]=c.as==='email'||c.as==='phone'?'on file':String(v);});});});
 const old=Object.fromEntries(CREWS.map(c=>[c.name,c]));const blankStatus=Object.values(byName).filter(c=>!c.f.status).length;
 DIMS=dims.length?dims:DIMS;
 CREWS=Object.values(byName).map((c,i)=>{const o=old[c.name];const r={};DIMS.forEach(d=>r[d.k]=c.r[d.k]??null);
  return{id:o?o.id:slug(c.name),name:c.name,c:o?o.c:COLORS[i%COLORS.length],r,f:{...c.f,status:c.f.status||(/test/i.test(c.name)?'inactive':'active'),base:c.f.base||(o?o.f.base:''),baseSample:!c.f.base&&o?o.f.baseSample:false,languages:o?o.f.languages:'',leadSafe:o?o.f.leadSafe:undefined}};});
 const rated=CREWS.filter(c=>dimsOf('job').some(d=>c.r[d.k]!=null)).length;
 S.imp={file:m.file,when:stamp()+' by '+ME().split(' (')[0],rows:CREWS.length,sheets:m.sheets.map(s=>s.name),findings:[
  ['ok',`Merged ${plural(m.sheets.length,'sheet')} on crew name: ${plural(CREWS.length,'crew')}.`],
  ['ok',`Found ${plural(DIMS.length,'rating column')}: ${dimsOf('job').length} job types, ${dimsOf('skill').length} skills, ${dimsOf('attr').length} attributes. Crew Board now ranks on these.`],
  ...(fixed.length?[['wn',`${plural(fixed.length,'crew size')} had been turned into dates by Excel. Fixed and shown as ranges. Please confirm.`]]:[]),
  ...(blankStatus?[['wn',`Status was blank for ${plural(blankStatus,'crew')}. Set to active (test rows inactive).`]]:[]),
  ['wn',`${rated} of ${CREWS.length} crews have job-type ratings. The rest can’t be matched until rated.`]]};
 log('Crew data',`Imported ${m.file}: ${plural(CREWS.length,'crew')}, ${plural(DIMS.length,'rating column')}.${fixed.length?` Fixed ${fixed.length} crew sizes Excel had turned into dates.`:''}`);}
/* ============ render ============ */
function render(){
 if(!isAdmin()&&['setup','audit'].includes(S.view))S.view='queue';
 const tv=['match','add','board'].includes(S.view)?'queue':S.view;
 const tabs=[['queue','Ready to schedule',kpiWaiting().n],['cal','Calendar'],['crews','Crews'],['riley','Riley'],...(isAdmin()?[['audit','Audit log'],['setup','Setup']]:[]),['ideas','Ideas']];
 $('#tabs').innerHTML=tabs.map(([v,l,n])=>`<button data-go="${v}" ${tv===v?'aria-current="page"':''}>${v==='riley'?riley(18):''}${l}${n?`<span class="ct num">${n}</span>`:''}</button>`).join('');
 document.querySelectorAll('[data-role]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.role===S.role));
 $('#who').textContent=ME();
 $('#app').innerHTML=V[S.view]();
 mountCal();drawLayer();}
function drawLayer(){let h='';if(S.modal&&M[S.modal.type])h+=M[S.modal.type](S.modal);if(S.toast)h+=`<div class="toast" role="status">${esc(S.toast)}</div>`;$('#layer').innerHTML=h;}
/* ============ actions ============ */
function placeJob(jid,crew){const r=rank(jid).find(x=>x.crew===crew);const job=JOBS[jid];const sl=r&&r.slot||earliestSlot(job,crew,bookings(jid))||span(job,crew,job.earliest,bookings(jid));setPlace(jid,crew,sl.s,'draft');}
function planAll(){const items=[],skipped=[];const todo=QORDER.filter(j=>S.place[j]?.status!=='scheduled');todo.forEach(j=>delete S.place[j]);
 const opts=Object.fromEntries(todo.map(j=>[j,rank(j).filter(x=>x.ok).length]));todo.sort((a,b)=>(!!imp(JOBS[b])-!!imp(JOBS[a]))||(opts[a]-opts[b])||(JOBS[a].deadline-JOBS[b].deadline));
 todo.forEach(j=>{const r=rank(j).find(x=>x.ok);if(!r){skipped.push(j);return;}setPlace(j,r.crew,r.slot.s,'draft');items.push({jid:j,crew:r.crew,s:r.slot.s,e:r.slot.e,score:r.score});});S.modal={type:'planall',items,skipped};}
function snap(jid){const R=rank(jid);return{ranked:rankName(jid),ranking:R.slice(0,10).map(r=>({crew:crewById(r.crew).name,score:r.score,ok:r.ok,fails:r.fails}))};}
function doConfirm(reason){const job=J();const p=S.place[job.id];const R=rank(job.id);const me=R.find(x=>x.crew===p.crew);const best=R.find(x=>x.ok);const ov=reason||S.override[job.id];
 p.status='scheduled';const agree=rileyLearn(job.id,p.crew,ov);
 log(ov?'Override':'Decision',`Confirmed ${crewById(p.crew).name} for ${job.title}, ${dlabel(pS(p))} to ${dlabel(pE(p))}. ${!ov?`Top-ranked crew, match ${me.score}.`:`Not the top-ranked crew (${me.score} vs ${best?best.score+' for '+crewById(best.crew).name:'none'}). Reason: ${ov}.`}`,job.title,snap(job.id));
 delete S.override[job.id];S.modal=null;render();toast(`Confirmed. ${crewById(p.crew).name}, the client${job.hoa?' and the HOA':''} are notified. ${agree?'Riley agreed.':'Riley noted your pick.'}`);}
S.override={};
document.addEventListener('click',async e=>{const rl=e.target.closest('[data-role]');if(rl){S.role=rl.dataset.role;S.drawer=false;render();toast(S.role==='admin'?'Admin view: setup, audit log, labels and crew data':'Scheduler view: pick from your admin’s labels');return;}
 const th=e.target.closest('[data-theme-set]');if(th){setTheme(th.dataset.themeSet);return;}
 const fb=e.target.closest('[data-fb]');if(fb){feedback(fb);return;}
 const go=e.target.closest('[data-go]');if(go){S.view=go.dataset.go;if(go.dataset.crewf)S.crewF=go.dataset.crewf;S.modal=null;render();window.scrollTo(0,0);return;}
 const b=e.target.closest('[data-act]');if(!b||b.disabled)return;const a=b.dataset.act,v=b.dataset.v;const m=S.modal;
 switch(a){
 case 'match':S.job=v;S.modal=null;S.view='match';render();window.scrollTo(0,0);break;
 case 'board':S.job=v;S.modal=null;S.view='board';render();window.scrollTo(0,0);break;
 case 'setjob':S.job=v;render();break;
 case 'label':delete S.w[S.job];S.label[S.job]=v;render();break;
 case 'drawer':S.drawer=!S.drawer;render();break;
 case 'resetw':delete S.w[S.job];render();break;
 case 'savelabel':{const n=(document.getElementById('pname')||{}).value?.trim();if(!n){toast('Give it a name first');break;}if(LABELS[n]){toast('That name is taken');break;}LABELS[n]={w:{...S.w[S.job]},d:'Saved from '+J().title+'.',by:ME()};delete S.w[S.job];S.label[S.job]=n;log('Setting',`Created the ranking label “${n}”.`);render();toast(`“${n}” is now a label schedulers can pick`);break;}
 case 'impwhy':S.impWhyOpen=!S.impWhyOpen;render();break;
 case 'impt':S.impOn[v]=!S.impOn[v];log('Setting',`${S.impOn[v]?'Turned on':'Turned off'} the important-client trigger: ${IMPT.find(x=>x[0]===v)[1].toLowerCase()}.`);render();break;
 case 'toggleout':S.showOut=!S.showOut;render();break;
 case 'closeall':S.closeAll=!S.closeAll;render();break;
 case 'est':S.estOpen=!S.estOpen;render();break;
 case 'vis':{const vis=S.vis[S.job]||(S.vis[S.job]={});vis[v]=!vis[v];render();break;}
 case 'visall':{const vis=S.vis[S.job]||(S.vis[S.job]={});const ok=rank(S.job).filter(r=>r.ok).slice(1);const all=ok.every(r=>vis[r.crew]);ok.forEach(r=>vis[r.crew]=!all);render();break;}
 case 'audit':S.modal={type:'audit',crew:v};drawLayer();break;
 case 'exportscore':{const job=J();const R=rank(job.id);const w=weights(job.id);const sw=Object.values(w).reduce((a,b)=>a+b,0);const ks=Object.keys(w).filter(k=>w[k]>0);
  const L=[['Crew Board score record'],['Job',job.title],['Run at',stamp()],['Run by',ME()],['Label',rankName(job.id)],[],['Crew','Can take it','Rules failed',...ks.map(k=>flabel(k)+' value'),...ks.map(k=>flabel(k)+' weight'),...ks.map(k=>flabel(k)+' points'),'Score']];
  R.forEach(r=>L.push([crewById(r.crew).name,r.ok?'Yes':'No',r.fails.join('; '),...ks.map(k=>r.f[k]),...ks.map(k=>w[k]),...ks.map(k=>(w[k]*r.f[k]/sw).toFixed(1)),r.score]));
  L.push([],['Inputs used: ratings, certifications, past job results, drive time, availability, client requests. Not used: age, gender, race, ethnicity, national origin, religion, disability or any other personal trait.']);
  saveFile(`crewboard-score-${slug(job.title)}.csv`,L.map(l=>l.map(csvq).join(',')).join('\n'));break;}
 case 'exportlog':{const rows=auditRows();saveFile(`crewboard-audit-${S.audit.range==='custom'?(S.audit.from||'start')+'-to-'+(S.audit.to||'now'):S.audit.range+'days'}.csv`,[['When','Who','Type','Job','What happened','Scores at the time'],...rows.map(e=>[e.t,e.who,e.type,e.job,e.text,e.detail&&e.detail.ranking?e.detail.ranking.map(r=>`${r.crew} ${r.score}${r.ok?'':' (ruled out)'}`).join('; '):''])].map(l=>l.map(csvq).join(',')).join('\n'));log('Export',`Downloaded ${plural(rows.length,'audit entry')}.`);break;}
 case 'runcsv':{const e2=S.log[+v];saveFile(`crewboard-optimizer-run-${e2.detail.run.run}.csv`,optCSV(e2.detail.run));break;}
 case 'printit':window.print();break;
 case 'crew':S.modal={type:'crew',id:v};drawLayer();break;
 case 'crewstatus':{const c=crewById(v);c.f.status=c.f.status==='active'?'inactive':'active';log('Crew data',`Set ${c.name} to ${c.f.status}.`);render();break;}
 case 'crewlead':{const c=crewById(v);c.f.leadSafe=!c.f.leadSafe;log('Crew data',`${c.name}: lead-safe ${c.f.leadSafe?'on file':'removed'}.`);render();break;}
 case 'crewf':S.crewF=v;render();break;
 case 'addcrew':S.modal={type:'addcrew'};drawLayer();break;
 case 'addcrewok':{const n=document.getElementById('ncname').value.trim();if(!n){toast('Add a crew name');break;}const c={id:slug(n)+'-'+Date.now().toString(36).slice(-3),name:n,c:COLORS[CREWS.length%COLORS.length],r:Object.fromEntries(DIMS.map(d=>[d.k,null])),f:{status:'active',size:parseSize(document.getElementById('ncsize').value.trim()),base:document.getElementById('ncbase').value,sfName:'',gcal:'',email:'',phone:'',notes:'',languages:''}};CREWS.push(c);log('Crew data',`Added crew ${n} by hand.`);S.modal={type:'crew',id:c.id};render();toast(`${n} added. Rate them so they can be matched`);break;}
 case 'photos':toast(`Opens the CompanyCam project${JOBS[v]?` (${JOBS[v].photos||0} photos)`:''}`);break;
 case 'colors':S.modal={type:'colors',id:v};drawLayer();break;
 case 'sendcolors':JOBS[v].colorsOk='sent';log('Edit',`Texted ${JOBS[v].client} the color form for ${JOBS[v].title}.`,JOBS[v].title);S.modal=null;render();toast('Color form sent');break;
 case 'editjob':openEdit(S.job);break;
 case 'pick':placeJob(S.job,v);S.view='board';render();window.scrollTo(0,0);toast(`Draft on ${crewById(v).name}. Drag to adjust`);break;
 case 'place':placeJob(S.job,v);render();toast(`Draft on ${crewById(v).name}. Drag to adjust`);break;
 case 'manual':S.modal={type:'manual',sel:null};drawLayer();break;
 case 'manualnext':{const R=rank(S.job);const me=R.find(x=>x.crew===m.sel);const best=R.find(x=>x.ok);S.modal={type:'reason',manual:true,crew:m.sel,pick:null,note:'',title:`Why ${crewById(m.sel).name}?`,sub:me.ok?(best&&best.crew!==m.sel?`${crewById(best.crew).name} ranks first (${best.score}). ${crewById(m.sel).name} scored ${me.score}.`:'They pass the rules.'):`They don’t pass: ${me.fails.join('; ')}.`,cta:'Place this crew'};drawLayer();break;}
 case 'reasonpick':S.modal.note=(document.getElementById('rnote')||{}).value||'';S.modal.pick=v;drawLayer();break;
 case 'reasonok':{const note=((document.getElementById('rnote')||{}).value||'').trim();if(m.pick==='Other'&&!note){toast('Add a comment for “Other”');break;}const reason=m.pick+(note?` (${note})`:'');
  if(m.manual){const job=J();const B=bookings(job.id);const sl=earliestSlot(job,m.crew,B)||span(job,m.crew,job.earliest,B);setPlace(job.id,m.crew,sl.s,'draft');S.override[job.id]=reason;log('Override',`Picked ${crewById(m.crew).name} by hand for ${job.title}. Reason: ${reason}.`,job.title,snap(job.id));S.modal=null;S.view='board';render();window.scrollTo(0,0);toast('Placed. You can confirm when the checks look right');}
  else doConfirm(reason);break;}
 case 'clear':delete S.place[S.job];delete S.override[S.job];render();break;
 case 'unschedule':S.place[S.job].status='draft';log('Decision',`Unscheduled ${J().title}. Back to draft.`,J().title);render();toast('Back to draft. Nobody has been told yet');break;
 case 'confirm':{const p=S.place[S.job];const R=rank(S.job);const best=R.find(x=>x.ok);if(best&&best.crew!==p.crew&&!S.override[S.job]){const me=R.find(x=>x.crew===p.crew);S.modal={type:'reason',crew:p.crew,pick:null,note:'',title:`${crewById(p.crew).name} isn’t the top-ranked crew`,sub:`${crewById(best.crew).name} scored ${best.score}, ${crewById(p.crew).name} scored ${me.score}. That’s fine. Add a reason so the decision is on record.`,cta:'Confirm with this reason'};drawLayer();break;}doConfirm(null);break;}
 case 'msg':S.msgTab=v;render();break;
 case 'split':{const p=S.place[S.job];if(p.segs.length>1){setPlace(S.job,p.crew,pS(p),p.status);}else{const s=pS(p),e=pE(p);const mid=s+Math.ceil((e-s+1)/2)-1;p.segs=[[s,mid],[mid+2,e+1]];}render();toast(p.segs.length>1?'Split. Drag the second visit to where you want it':'Back to one visit');break;}
 case 'planall':planAll();render();break;
 case 'confirmall':{const n=m.items.length;m.items.forEach(it=>{S.place[it.jid].status='scheduled';rileyLearn(it.jid,it.crew);log('Decision',`Confirmed ${crewById(it.crew).name} for ${JOBS[it.jid].title} through Plan all. Top available crew, match ${it.score}.`,JOBS[it.jid].title,snap(it.jid));});S.modal=null;render();toast(`${plural(n,'job')} confirmed. Crews and clients notified`);break;}
 case 'reviewall':S.modal=null;S.view='cal';render();window.scrollTo(0,0);break;
 case 'closemodal':if(e.target===b){S.modal=null;drawLayer();}break;
 case 'closemodal2':S.modal=null;drawLayer();break;
 case 'hideothers':S.hideOthers=!S.hideOthers;render();break;
 case 'allcrews':S.allCrews=!S.allCrews;render();break;
 case 'calview':S.calF.view=v;render();break;
 case 'zoom':S.calF.zoom=Math.max(0,Math.min(2,S.calF.zoom+ +v));render();break;
 case 'calshow':S.calF.show=v;render();break;
 case 'calgroup':S.calF.group=v;render();break;
 case 'calopen':S.calF.open=!S.calF.open;render();break;
 case 'movepick':m.pick=v;drawLayer();break;
 case 'moveok':{if(m.kind==='fixed'){const bk=BOOKS.find(x=>x.id===m.id);S.shift[m.id]=(S.shift[m.id]||0)+m.d;if(m.crew!==crewOfBooking(bk))S.reassign[m.id]=m.crew;log('Decision',`Moved confirmed job ${bk.name} to ${crewById(m.crew).name}, ${dlabel(bk.s+S.shift[m.id])}. Reason: ${m.pick}. Client texted.`,bk.name);}
  else{const p=S.place[m.id];if(p.segs.length>1&&m.crew===p.crew){p.segs[m.seg][0]+=m.d;p.segs[m.seg][1]+=m.d;}else p.segs=p.segs.map(([x,z])=>[x+m.d,z+m.d]);p.crew=m.crew;log('Decision',`Moved confirmed job ${JOBS[m.id].title} to ${crewById(m.crew).name}, ${dlabel(pS(p))}. Reason: ${m.pick}. Client texted.`,JOBS[m.id].title);}
  S.modal=null;render();toast('Moved. The client and crew lead were texted');break;}
 case 'optimize':S.ofb={reject:{},pin:{},noMove:{},block:[]};S.modal=optimize();drawLayer();break;
 case 'lock':S.lock=Math.max(3,Math.min(7,S.lock+ +v));S.modal=optimize();drawLayer();break;
 case 'optsel':m.sel[+v]=b.dataset.k;if(b.dataset.k==='keep')delete m.why[+v];drawLayer();break;
 case 'optwhy':{const i=+v;m.why[i]=b.dataset.l;m.whyk=m.whyk||{};m.whyk[i]=b.dataset.k;drawLayer();break;}
 case 'reopt':{const F=S.ofb;const kept=[];m.moves.forEach((mv,i)=>{if(m.sel[i]==='keep'){kept.push(mv);return;}const k=m.whyk[i];
   if(k==='crew')(F.reject[mv.jid]=F.reject[mv.jid]||[]).push(mv.crew);else if(k==='nomove'&&mv.shift)F.noMove[mv.shift.id]=true;else if(k==='dates')F.block.push({jid:mv.jid,s:mv.s,e:mv.e});else if(k==='busy')F.block.push({crew:mv.crew,s:mv.s,e:mv.e});});
  log('Optimizer',`Rejected ${plural(m.moves.length-kept.length,'move')} in run ${m.run}: ${m.moves.map((mv,i)=>m.sel[i]==='reject'?`${JOBS[mv.jid].title} on ${crewById(mv.crew).name} (${m.why[i]})`:null).filter(Boolean).join('; ')}. Re-optimizing.`);
  m.moves.forEach((mv,i)=>{if(m.sel[i]==='reject')rileyLearn(mv.jid,'__none__',m.why[i]);});
  S.modal=optimize({kept,before:m.before});drawLayer();break;}
 case 'optapply':{const items=applyMoves(m);const sh=items.filter(x=>x.shift).length;S.modal=null;render();toast(`${plural(items.length,'job')} placed as drafts${sh?`. ${plural(sh,'client text')} queued for moved jobs`:''}`);break;}
 case 'optcsv':saveFile(`crewboard-optimizer-run-${m.run}.csv`,optCSV(m));break;
 case 'arange':S.audit.range=v;render();break;
 case 'promote':if(S.riley.stage<3){S.riley.stage++;log('Setting',`Moved Riley to “${STAGES[S.riley.stage][0]}” at ${rileyPct()}% agreement.`);render();toast(`Riley is now ${STAGES[S.riley.stage][0].toLowerCase()}`);}break;
 case 'lkeep':case 'lignore':{const p=S.riley.learned.find(x=>x.id===v);p.status=a==='lkeep'?'kept':'ignored';log('Setting',`${a==='lkeep'?'Kept':'Ignored'} a habit Riley learned: ${p.text}`);render();break;}
 case 'rfrom':{const x=S.riley.from[v];x.on=!x.on;log('Setting',`Riley ${x.on?'learns from':'no longer learns from'} ${v}.`);render();break;}
 case 'fixreq':S.view='crews';S.crewF='needs';render();window.scrollTo(0,0);toast(v==='jobRating'?'Click a crew to rate it':'Click a crew to fill in the missing details');break;
 case 'addfield':{const f=RECOMMENDED.find(x=>x.k===v);f.added=true;log('Setting',`Added the field “${f.l}” to every crew.`);render();toast(`${f.l} added. Fill it in on each crew’s profile`);break;}
 case 'newlabel':S.modal={type:'label',isNew:true,name:'',d:'',w:{...LABELS.Balanced.w}};drawLayer();break;
 case 'editlabel':S.modal={type:'label',isNew:false,name:v,d:LABELS[v].d,w:{...LABELS[v].w}};drawLayer();break;
 case 'labelsave':{const name=m.isNew?(document.getElementById('lname').value||'').trim():m.name;if(!name){toast('Give it a name');break;}if(m.isNew&&LABELS[name]){toast('That name is taken');break;}
  LABELS[name]={w:{...m.w},d:(document.getElementById('ldesc').value||'').trim()||'Custom label.',by:ME()};log('Setting',`${m.isNew?'Created':'Updated'} the ranking label “${name}”.`);S.modal=null;render();toast(`Label “${name}” saved`);break;}
 case 'labeldel':delete LABELS[m.name];Object.keys(S.label).forEach(k=>{if(S.label[k]===m.name)delete S.label[k];});log('Setting',`Deleted the ranking label “${m.name}”.`);S.modal=null;render();break;
 case 'rule':S.rules[v]=!S.rules[v];log('Setting',`Turned ${S.rules[v]?'on':'off'} the rule: ${v}.`);render();break;
 case 'rmin':S.rules.minType=Math.max(1,Math.min(5,S.rules.minType+ +v));log('Setting',`Minimum job-type rating set to ${S.rules.minType}.`);render();break;
 case 'rimp':S.rules.impBar=Math.max(1,Math.min(5,S.rules.impBar+ +v));log('Setting',`Important-client bar set to ${S.rules.impBar}.`);render();break;
 case 'rdrive':S.rules.maxDrive=Math.max(15,Math.min(90,S.rules.maxDrive+ +v));log('Setting',`Furthest drive set to ${S.rules.maxDrive} min.`);render();break;
 case 'rmlabel':JOB_LABELS=JOB_LABELS.filter(x=>x!==v);render();break;
 case 'addjl':{const n=(document.getElementById('newjl').value||'').trim();if(n&&!JOB_LABELS.includes(n)){JOB_LABELS.push(n);log('Setting',`Added the job label “${n}”.`);}render();break;}
 case 'connect':toast(`${v}: in the full product this opens the ${v} sign-in`);break;
 case 'dbconnect':toast('Google Sheets, Airtable, Postgres or SQL Server. In the full product this opens a connection form');break;
 case 'mapok':{applyImport(m);S.modal=null;render();toast('Imported. Crew Board now follows your columns');break;}
 case 'mcopen':S.add.pick=S.add.pick===v?null:v;render();break;
 case 'mcpick':{const d=S.add.draft;d[b.dataset.k]=+v;d.src[b.dataset.k]='edited';S.add.pick=null;render();break;}
 }});
document.addEventListener('change',async e=>{const t=e.target;
 if(t.dataset.rk){const c=crewById(t.dataset.cr);const o=c.r[t.dataset.rk];c.r[t.dataset.rk]=t.value===''?null:+t.value;log('Crew data',`${c.name}: ${dimL(t.dataset.rk)} rating ${o??'–'} → ${c.r[t.dataset.rk]??'–'}.`);render();}
 if(t.dataset.fk){const c=crewById(t.dataset.cf);const k=t.dataset.fk;let v=t.value.trim();if(k==='size')c.f.size=parseSize(v);else{c.f[k]=v;if(k==='base')c.f.baseSample=false;}log('Crew data',`${c.name}: ${k} set to “${v}”.`);render();}
 if(t.dataset.mlang){S.msgLang[t.dataset.mlang]=t.value;render();}
 if(t.hasAttribute('data-pair')){S.pairCrew=t.value;render();}
 if(t.hasAttribute('data-atype')){S.audit.type=t.value;render();}
 if(t.hasAttribute('data-afrom')){S.audit.from=t.value;render();}
 if(t.hasAttribute('data-ato')){S.audit.to=t.value;render();}
 if(t.hasAttribute('data-mpick')){S.modal.sel=t.value;drawLayer();}
 if(t.dataset.mapi!=null){S.modal.cols[+t.dataset.mapi].as=t.value;}
 if(t.id==='xlsx'&&t.files&&t.files[0]){toast('Reading the spreadsheet…');try{S.modal=await readSheet(t.files[0]);drawLayer();}catch(err){toast('Couldn’t read that file. Try .xlsx or .csv with a “Crew” or “Name” column');}}
 if(t.dataset.w){log('Setting',`Set the ${flabel(t.dataset.w).toLowerCase()} weight to ${t.value} for ${J().title}.`,J().title);}});
document.addEventListener('input',e=>{const t=e.target;if(t.dataset.w){const w={...weights(S.job)};w[t.dataset.w]=+t.value;S.w[S.job]=w;render();document.getElementById(t.id)?.focus();}
 if(t.dataset.lw&&S.modal){S.modal.w[t.dataset.lw]=+t.value;t.nextElementSibling.textContent=t.value;}});
document.addEventListener('mouseover',e=>{const r=e.target.closest('.req,.fld,.skc,.hr[data-k]');document.querySelectorAll('.writeup mark').forEach(m=>m.classList.toggle('on',!!r&&m.dataset.k===r.dataset.k));});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&S.modal){S.modal=null;drawLayer();}});
document.addEventListener('dragstart',e=>{const c=e.target.closest&&e.target.closest('[data-drag]');if(c){e.dataTransfer.setData('text/plain',c.dataset.drag);e.dataTransfer.effectAllowed='move';c.classList.add('dragging');}});
document.addEventListener('dragend',e=>{const c=e.target.closest&&e.target.closest('[data-drag]');if(c)c.classList.remove('dragging');});
document.addEventListener('dragover',e=>{if(e.target.closest&&e.target.closest('#ec')&&S.view==='cal'){e.preventDefault();}});
document.addEventListener('drop',e=>{if(e.target.closest&&e.target.closest('#ec')&&S.view==='cal'){e.preventDefault();const jid=e.dataTransfer.getData('text/plain');if(JOBS[jid])dropUnscheduled(jid,e.clientX,e.clientY);}});
/* theme */
function setTheme(t){document.documentElement.dataset.theme=t;try{localStorage.setItem('cb-theme',t);}catch(_){}document.querySelectorAll('[data-theme-set]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.themeSet===t));}
(()=>{let t=null;try{t=localStorage.getItem('cb-theme');}catch(_){}if(!t)t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';setTheme(t);})();
/* feedback via comments */
let COMMENTS=null;
(async()=>{try{if(!window.claude||!window.claude.use)return;COMMENTS=await window.claude.use('comments');if(COMMENTS)document.documentElement.classList.add('has-comments');}catch(_){}})();
async function feedback(btn){if(!COMMENTS)return;const target=btn.dataset.fb==='page'?document.getElementById('app'):(btn.closest('article,section,.card')||document.getElementById('app'));
 try{const r=await COMMENTS.openComposer({element:target});if(!r.opened)toast('Finish the comment you have open first');}catch(err){if(err&&err.code==='unavailable')document.documentElement.classList.remove('has-comments');else toast('Comments aren’t available here');}}
render();
