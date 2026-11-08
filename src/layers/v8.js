/* ================= v8: cut the fat. Work-order summaries, shorter screens ================= */
const WO={
 hernandez:{addr:'7840 SW 112 St, Pinecrest',flags:['Second-story eaves: bring a 28 ft ladder or lift','Done by Nov 12 (client hosting a wedding Nov 14)'],
  colors:[['Body','Repose Gray'],['Trim and fascia','Pure White'],['Front door','Tricorn Black']],
  scope:[['Pressure wash','Whole house'],['Prep','Patch stucco cracks at NE corner, prime patches'],['Body','2 coats elastomeric (Loxon XP), sprayed and back-rolled'],['Trim and fascia','Paint'],['Front door','Paint']]},
 okafor:{addr:'6120 SW 128 St, Pinecrest',flags:['Crisp cut lines at the stucco','Flexible dates, any day before Nov 2'],
  colors:[['Trim and fascia','Extra White'],['Front door','Urbane Bronze']],scope:[['Trim and fascia','Paint, crisp lines at the stucco'],['Front door','Paint']]},
 patel:{addr:'9301 SW 104 Ct, Kendall',flags:['Client is particular about color','Doors sprayed off-site'],
  colors:[['Cabinets','Iron Ore'],['Interiors','Alabaster']],scope:[['Cabinets','24 doors, 9 drawer fronts, boxes'],['Finish','Spray']]},
 gutierrez:{addr:'1420 Sorolla Ave, Coral Gables',flags:['Original plaster','Clean cut lines at the crown'],
  colors:[['Walls','Sea Salt'],['Trim','Accessible Beige']],scope:[['Rooms','Living, dining, two bedrooms'],['Repair','Plaster cracks in the dining room'],['Walls and trim','Paint']]}};
function woOf(j){const w=WO[j.id];if(w)return w;const c=typeof clientByName==='function'?clientByName(j.client):null;
 const txt=String(j.writeup||'').replace(/\[(\w+)\|([^\]]+)\]/g,'$2');const sc=txt.split(/(?<=[.;])\s+/).map(s=>s.replace(/[.;]$/,'').trim()).filter(s=>s&&!/^(Est\.|Built|Year built|Hours|Price|Total|Sold|Client|Customer)/i.test(s)).slice(1,6);
 return{addr:c?c.addr:j.area,flags:[],colors:j.colors.map(([n])=>['',n]),scope:sc.map(s=>['',s])};}
function woFlags(j){const w=woOf(j);const f=[];const im=imp(j);
 if(im)f.push(['bad','Important client',String(im).split(', ')[0]]);
 if(j.built<1978)f.push(['warn','Lead-safe painter required',`Home built ${j.built}`]);
 if(j.hoa)f.push(['','HOA rules','Mon to Fri, 8am to 5pm']);
 if(j.lang&&j.lang!=='en')f.push(['','Speaks '+LANGS[j.lang],'Messages go out in '+LANGS[j.lang]]);
 w.flags.forEach(x=>f.push(['',x,'']));return f;}
function woCard(j,opts={}){const w=woOf(j);const fl=woFlags(j);const ok=j.colorsOk===true;
 return `<section class="card wo"><div class="wo-h"><div class="grow"><div class="eyebrow">Work order</div><div class="wo-cl">${esc(j.client)}</div><div class="small muted">${esc(w.addr||j.area)}</div></div>${opts.edit?'<button class="btn sm line" data-act="editjob">Edit</button>':''}</div>
  <div class="wo-facts"><div><b class="num">${money(j.value)}</b><span>Sold</span></div><div><b class="num">${painterDays(j)}</b><span>Painter days</span></div><div><b>${sdate(j.deadline)}</b><span>Finish by</span></div></div>
  ${fl.length?`<div class="wo-s"><div class="wo-l">Flags</div>${fl.map(([k,t,s])=>`<div class="wo-f ${k}"><b>${esc(t)}</b>${s?` <span>· ${esc(s)}</span>`:''}</div>`).join('')}</div>`:''}
  <div class="wo-s"><div class="wo-l">Colors ${ok?'<span class="chip good">Confirmed</span>':j.colorsOk==='sent'?'<span class="chip warn">Form sent</span>':`<button class="chip warn" data-act="colors" data-v="${j.id}">Not confirmed · text client</button>`}</div>
   ${w.colors.map(([s,n],i)=>{const hex=(j.colors.find(c=>c[0]===n)||j.colors[i]||[])[1]||'#ddd';return `<div class="wo-c"><i style="background:${hex}"></i>${s?`<span class="muted">${esc(s)}</span>`:''}<b>${esc(n)}</b></div>`;}).join('')}</div>
  ${w.scope.length?`<div class="wo-s"><div class="wo-l">Scope</div><ul class="wo-sc">${w.scope.map(([a,b])=>`<li>${a?`<b>${esc(a)}</b> `:''}${esc(b)}</li>`).join('')}</ul></div>`:''}
  ${opts.full?`<details class="wo-full"><summary>Full estimate</summary><p class="writeup" style="white-space:pre-line;margin:8px 0 0">${String(j.writeup||'').replace(/\[(\w+)\|([^\]]+)\]/g,(m,k,t)=>`<mark data-k="${k}">${esc(t)}</mark>`)}</p><div class="tiny" style="margin-top:6px">${esc(j.src||'')}</div></details>`:''}</section>`;}
/* ---------- Ready to schedule: one glance per job ---------- */
V.queue=()=>{const waiting=QORDER.filter(j=>!S.place[j]||S.place[j].status!=='scheduled');const nr=activeCrews().filter(c=>!ready(c)).length;
 return `<div class="qhead"><div class="grow"><h1>Ready to schedule</h1><p class="small muted" style="margin:4px 0 0">${plural(waiting.length,'sold job')} waiting for a crew.</p></div>
  <button class="btn line" data-act="planall" ${waiting.length?'':'disabled'}>Plan all ${waiting.length}</button><button class="btn tape" data-go="add">+ Add a job</button>${fbBtn('queue')}</div>
 ${rileyBrief()}${kpiCards()}
 <div class="jobs">${QORDER.map(jid=>{const j=JOBS[jid];const p=S.place[jid];const r=rank(jid);const top=r.find(x=>x.ok);const all=woFlags(j);const fl=all.slice(0,2);const more=all.length-fl.length;
  const col=j.colorsOk===true?'<span class="qc good">✓ Colors confirmed</span>':j.colorsOk==='sent'?'<span class="qc warn">Colors: form sent</span>':`<button class="qc warn" data-act="colors" data-v="${jid}">! Colors not confirmed</button>`;
  return `<article class="card job q8"><div class="qband">${j.colors.map(([n,c])=>`<i style="background:${c}" title="${esc(n)}"></i>`).join('')}</div>
  <div class="bd"><div><h3>${esc(j.title)}</h3><div class="small muted">${esc(j.client)} · ${esc(j.area)}</div></div>
   <div class="qfacts num">${money(j.value)} · ${painterDays(j)} painter days · by ${sdate(j.deadline)}</div>
   <div class="chips">${fl.map(([k,t])=>`<span class="chip ${k}">${esc(t)}</span>`).join('')}${more?`<span class="chip">+${more} more</span>`:''}</div>
   ${col}
   <div class="rec">${p?`${crewDot(p.crew)}<span class="grow small"><b>${esc(crewById(p.crew).name)}</b> · ${sdate(pS(p))}–${sdate(pE(p))}<br><span class="tiny">${p.status==='scheduled'?'Confirmed':'Draft'}</span></span><button class="btn sm ${p.status==='scheduled'?'line':'tape'}" data-act="board" data-v="${jid}">${p.status==='scheduled'?'View':'Review'}</button>`:
    top?`${crewDot(top.crew)}<span class="grow small"><b>${esc(crewById(top.crew).name)}</b> fits best<br><span class="tiny">Can start ${sdate(top.slot.s)}</span></span><button class="btn sm tape" data-act="match" data-v="${jid}">Find a crew</button>`:`<span class="grow small muted">No crew fits yet</span><button class="btn sm line" data-act="match" data-v="${jid}">See why</button>`}</div></div></article>`;}).join('')}</div>
 ${nr&&isAdmin()?`<p class="tiny" style="margin-top:12px">${plural(nr,'crew')} can’t be matched until they’re set up. <button class="lnk" data-go="setup" style="font-size:12px">Finish setup</button></p>`:''}`;};
/* shorter Riley line on the queue */
const _rb8=rileyBrief;rileyBrief=function(){const R=S.riley;if(R.stage!==0)return _rb8();const qn=R.questions.filter(q=>!q.ans&&(q.to==='scheduler'||isAdmin())).length;
 return `<div class="rline">${riley(26)}<span class="small grow"><b>Riley is watching</b> and learning how you schedule. It books nothing yet. <span class="tiny">Agrees with your team ${rileyPct()}%</span></span>${qn?`<button class="btn sm line" data-go="riley">${plural(qn,'question')}</button>`:''}</div>`;};
/* compact KPI strip */
kpiCards=function(extra){const k=kpiSched(),w=kpiWaiting();const o=openDays();
 const it=[[`${k.pct}%`,'of crew days booked, next 2 weeks',`${k.pd} of ${k.cap} painter days`],[k.jobs,'jobs on the calendar',money(k.val)],[w.n,'jobs waiting',`${w.pd} painter days · ${money(w.val)}`],...(extra?[[o,'open crew days',`about ${money(o*1000)} not billed`]]:[])];
 return `<div class="kstrip">${it.map(([b,l,s],i)=>`<div><b class="num" ${extra&&i===3?'style="color:var(--warn)"':''}>${b}</b><span>${l}</span><small>${s}</small></div>`).join('')}</div>`;};
/* ---------- crew selection: work order on the left, ranking on the right ---------- */
V.match=(()=>{const old=V.match;return()=>{const job=J();const keep=S.estOpen;S.estOpen=true;let h;try{h=old();}finally{S.estOpen=keep;}
 const a=h.indexOf('<div class="split">');const b=h.indexOf('</section></div><div>',a);if(a<0||b<0)return h;
 const head=h.slice(0,a);let right=h.slice(b+'</section></div>'.length);right=right.slice(0,right.lastIndexOf('</div>'));
 const R=rank(job.id);const near=activeCrews().filter(c=>c.f.base).map(c=>({c,m:driveMin(c.f.base,job.area),ok:R.find(x=>x.crew===c.id)?.ok})).filter(x=>x.ok).sort((x,y)=>x.m-y.m).slice(0,3);
 const left=`<div class="lcol">${woCard(job,{edit:true,full:true})}
  ${near.length?`<section class="card pad"><div class="eyebrow" style="margin-bottom:6px">Closest crews that can take it</div>${near.map(({c,m})=>`<div class="hr">${crewDot(c.id)}<span class="grow">${esc(c.name)}</span><b class="num small">${m} min</b></div>`).join('')}</section>`:''}</div>`;
 return head.replace(/<div class="chips" style="margin-top:8px">[\s\S]*?<\/div>\s*(?=(<div class="card impbox|<\/div>))/,m=>m.replace(/<span class="chip num">[^<]*<\/span>|<span class="chip">Finish by[^<]*<\/span>/g,''))+`<div class="split m8">${left}${right}</div>`;};})();
/* ---------- Get started: what's left, not what's done ---------- */
V.onboard=()=>{const L=obStatus();const done=L.filter(x=>x[0]==='done');const left=L.filter(x=>x[0]!=='done');const now=left[0];
 const row=([st,t,d,cta,go],i)=>`<div class="ob8 ${st}"><span class="obn">${L.indexOf(L.find(x=>x[1]===t))+1}</span><div class="grow"><b>${t}</b><div class="small muted">${esc(d)}</div></div>${cta?`<button class="btn sm ${st==='now'?'tape':'line'}" data-act="obgo" data-v="${go}">${cta}</button>`:''}</div>`;
 return `<section class="card ob8h"><div class="grow"><div class="eyebrow">Setup · about an hour</div><h1 style="font-size:26px;margin-top:4px">${done.length} of ${L.length} done</h1><div class="meter" style="max-width:340px;margin-top:10px"><i style="width:${Math.round(done.length/L.length*100)}%"></i></div></div>
  <button class="btn line" data-act="tour">▶ 2-minute tour</button>${fbBtn('onboard')}</section>
 ${now?`<div class="eyebrow" style="margin:18px 0 8px">Next up</div><div class="card">${row(now)}</div>`:''}
 ${left.length>1?`<div class="eyebrow" style="margin:18px 0 8px">After that</div><div class="card">${left.slice(1).map(row).join('')}</div>`:''}
 <details class="card ob8d"><summary><b>Done</b> <span class="tiny">${done.map(x=>x[1]).join(' · ')}</span></summary>${done.map(row).join('')}</details>`;};
render();
