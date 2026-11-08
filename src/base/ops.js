/* ============ helpers ============ */
const $=s=>document.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
const money=v=>'$'+Math.round(v).toLocaleString();
const initials=n=>n.replace(/\(.*?\)/g,'').split(/[ .&]/).filter(Boolean).map(x=>x[0]).join('').slice(0,2).toUpperCase();
const plural=(n,w)=>`${n} ${w}${n===1?'':'s'}`;
const clone=o=>JSON.parse(JSON.stringify(o));
const csvq=v=>`"${String(v==null?'':v).replace(/"/g,'""')}"`;
function toast(t){S.toast=t;drawLayer();clearTimeout(toast.h);toast.h=setTimeout(()=>{S.toast=null;drawLayer();},3400);}
function lum(c){if(!/^#/.test(c))return .6;const n=parseInt(c.slice(1),16);return .2126*((n>>16&255)/255)+.7152*((n>>8&255)/255)+.0722*((n&255)/255);}
function loadScript(src){return new Promise((res,rej)=>{const ex=document.querySelector(`script[src="${src}"]`);if(ex){if(ex.dataset.ok)return res();ex.addEventListener('load',()=>res());ex.addEventListener('error',()=>rej(new Error('load')));return;}const s=document.createElement('script');s.src=src;s.onload=()=>{s.dataset.ok=1;res();};s.onerror=()=>rej(new Error('load'));document.head.appendChild(s);});}
function ringSvg(v,color){const r=32,c=2*Math.PI*r;return `<svg viewBox="0 0 76 76" aria-hidden="true"><circle cx="38" cy="38" r="${r}" fill="none" stroke="var(--sunk)" stroke-width="8"/><circle cx="38" cy="38" r="${r}" fill="none" stroke="${color}" stroke-width="8" stroke-linecap="round" stroke-dasharray="${c*v/100} ${c}"/></svg>`;}
const fbBtn=(key,label='Feedback')=>`<button class="fb" data-fb="${key}" title="Leave feedback here">💬 ${label}</button>`;
const crewDot=cid=>`<span class="dot" style="--c:${crewById(cid).c}"></span>`;
const crewBtn=cid=>`<button class="lnk" data-act="crew" data-v="${cid}">${esc(crewById(cid).name)}</button>`;
const ICON={cal:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
 people:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c1.8.8 3 2.6 3.5 5.2"/></svg>',
 clock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
 pay:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/></svg>',
 arrow:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h15M13 6l6 6-6 6"/></svg>',
 cam:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
 spark:'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/></svg>',
 target:'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>',
 lock:'<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>'};
const SRC={ps:['PaintScout','src-ps'],human:['Typed by Dana R.','src-h'],ai:['Read from estimate','src-ai'],guessed:['Guessed','src-g'],missing:['Missing','src-m'],edited:['Edited by you','src-e']};
const srcChip=k=>k&&SRC[k]?`<span class="src-chip ${SRC[k][1]}">${SRC[k][0]}</span>`:'';
/* Riley's avatar */
const riley=(sz=36)=>`<span class="riley" style="width:${sz}px;height:${sz}px" aria-hidden="true"><svg viewBox="0 0 40 40"><defs><linearGradient id="rg${sz}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7AA7F5"/><stop offset="1" stop-color="#2F6BD8"/></linearGradient></defs><circle cx="20" cy="20" r="20" fill="url(#rg${sz})"/><circle cx="14.5" cy="18" r="2.3" fill="#fff"/><circle cx="25.5" cy="18" r="2.3" fill="#fff"/><path d="M13.5 25c3.5 3.2 9.5 3.2 13 0" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M10 11.5 20 7l10 4.5-10 4.2z" fill="#14233F"/><path d="M28 12.2v5" stroke="#14233F" stroke-width="1.6"/><circle cx="28" cy="17.6" r="1.4" fill="#F2B84B"/></svg></span>`;
/* ============ KPIs (Ido’s list) ============ */
function kpiSched(B=bookings()){let pd=0,cap=0;const jobs=new Map();
 B.filter(x=>!x.prop).forEach(x=>{const c=crewById(x.crew);const sz=planSize(c)||1;for(let d=Math.max(0,x.s);d<=Math.min(9,x.e);d++){pd+=sz*(x.half?0.5:1);jobs.set(x.jid||x.id,x.value||0);}});
 activeCrews().filter(c=>c.f.size).forEach(c=>cap+=planSize(c)*10);
 return{pd:Math.round(pd),cap,pct:cap?Math.round(pd/cap*100):0,jobs:jobs.size,val:[...jobs.values()].reduce((a,b)=>a+b,0)};}
function kpiWaiting(){const w=QORDER.filter(j=>S.place[j]?.status!=='scheduled');return{n:w.length,pd:Math.round(w.reduce((a,j)=>a+painterDays(JOBS[j]),0)),val:w.reduce((a,j)=>a+JOBS[j].value,0)};}
function openDays(B=bookings()){let n=0;activeCrews().filter(ready).forEach(c=>{for(let d=0;d<10;d++)n+=1-occ(B,c.id,d);});return n;}
/* ============ optimizer ============ */
function optimize(keep){const F=S.ofb;const savedP=clone(S.place),savedS={...S.shift};
 const before=keep?keep.before:openDays();
 const kept=(keep&&keep.kept)||[];
 kept.forEach(mv=>{if(mv.shift)S.shift[mv.shift.id]=(S.shift[mv.shift.id]||0)+mv.shift.k;S.place[mv.jid]={crew:mv.crew,segs:[[mv.s,mv.e]],status:'draft',half:mv.half,holds:[]};});
 const keptIds=new Set(kept.map(m=>m.jid));
 const todo=QORDER.filter(j=>S.place[j]?.status!=='scheduled'&&!keptIds.has(j));todo.forEach(j=>delete S.place[j]);
 const opts=Object.fromEntries(todo.map(j=>[j,rank(j).filter(x=>x.ok).length]));
 todo.sort((a,b)=>(!!imp(JOBS[b])-!!imp(JOBS[a]))||(opts[a]-opts[b])||(JOBS[a].deadline-JOBS[b].deadline));
 const blocked=(jid,cr,s,e)=>F.block.some(b=>(b.jid?b.jid===jid:b.crew===cr)&&s<=b.e&&e>=b.s);
 const moves=[...kept.map(m=>({...m,kept:true}))],skipped=[];
 todo.forEach(jid=>{const job=JOBS[jid];const R=rank(jid).filter(r=>r.ok&&!(F.reject[jid]||[]).includes(r.crew));if(!R.length){skipped.push(jid);return;}
  const cands=[];
  R.forEach(r=>{const B=bookings(jid);
   for(let s=job.earliest;s<=19;s++){const sp=span(job,r.crew,s,B);if(blocked(jid,r.crew,sp.s,sp.e))continue;
    if(!sp.conf.length&&sp.e<=job.deadline){const fit=(s>0&&busy(B,r.crew,s-1)?1:0)+(busy(B,r.crew,sp.e+1)?1:0)+(sp.half&&occ(B,r.crew,s)===0.5?2:0);
     cands.push({v:fit*6-(s-job.earliest)*2+r.score/10,jid,crew:r.crew,s,e:sp.e,half:sp.half,score:r.score,fit,shift:null});continue;}
    if(sp.half||!(s===job.earliest||busy(B,r.crew,s-1)))continue;
    let g=s;while(g+1<=19&&!busy(B,r.crew,g+1))g++;
    const x=B.find(y=>y.crew===r.crew&&y.s===g+1&&y.fixed);if(!x||x.s<S.lock||S.shift[x.id]||F.noMove[x.id])continue;
    for(let k=1;k<=2;k++){S.shift[x.id]=k;const sp2=span(job,r.crew,s,bookings(jid));const Bx=B.filter(y=>y.id!==x.id);let clash=x.e+k>19;for(let d=x.e+1;d<=x.e+k;d++)if(busy(Bx,r.crew,d))clash=true;delete S.shift[x.id];
     if(!sp2.conf.length&&sp2.e<=job.deadline&&!clash){cands.push({v:12-(s-job.earliest)*2+r.score/10-4,jid,crew:r.crew,s,e:sp2.e,half:null,score:r.score,fit:2,shift:{id:x.id,k,name:`${x.name} ${x.what.toLowerCase()}`,from:x.s}});break;}}}});
  cands.sort((a,b)=>b.v-a.v);const best=cands[0];if(!best){skipped.push(jid);return;}
  best.top=R[0].crew;best.topScore=R[0].score;
  const seen=new Set([best.crew]);best.alts=cands.slice(1).filter(c=>!seen.has(c.crew)&&seen.add(c.crew)).slice(0,3).map(c=>({crew:c.crew,s:c.s,e:c.e,score:c.score,why:c.score<best.score?`Lower match score (${c.score} vs ${best.score})`:c.s>best.s?`Starts later (${dlabel(c.s)})`:c.shift?'Would move a confirmed job':'Leaves more open days around it'}));
  const o1=openDays();if(best.shift)S.shift[best.shift.id]=best.shift.k;S.place[jid]={crew:best.crew,segs:[[best.s,best.e]],status:'draft',half:best.half,holds:[]};best.fill=Math.round((o1-openDays())*10)/10;moves.push(best);});
 const after=openDays();
 for(const k in S.place)delete S.place[k];Object.assign(S.place,savedP);for(const k in S.shift)delete S.shift[k];Object.assign(S.shift,savedS);
 return{type:'opt',run:++S.optRuns,at:stamp(),moves,skipped,before,after,sel:moves.map(()=>'keep'),why:{},constraints:clone({reject:F.reject,noMove:F.noMove,block:F.block}),lock:S.lock};}
function applyMoves(m){const items=m.moves.filter((mv,i)=>m.sel[i]==='keep');
 items.forEach(mv=>{if(mv.shift&&!mv.kept)S.shift[mv.shift.id]=(S.shift[mv.shift.id]||0)+mv.shift.k;});
 items.forEach(mv=>{if(mv.kept&&mv.shift)S.shift[mv.shift.id]=(S.shift[mv.shift.id]||0)+mv.shift.k;S.place[mv.jid]={crew:mv.crew,segs:[[mv.s,mv.e]],status:'draft',half:mv.half,holds:[]};});
 log('Optimizer',`Optimizer run ${m.run}: placed ${plural(items.length,'job')} as drafts${items.some(x=>x.shift)?`, moved ${plural(items.filter(x=>x.shift).length,'confirmed job')}`:''}. Open crew days ${m.before} → ${m.after}. Approved by ${ME()}.`,'',{run:m,ranking:null,ranked:'Optimizer'});
 return items;}
function optCSV(m){const L=[['Crew Board optimizer run',m.run],['Run at',m.at],['Run by',ME()],['No-move window (days)',m.lock],['Open crew days before',m.before],['Open crew days after',m.after],[],['How it works','1. Important jobs first, then jobs with the fewest crews that can do them, then earliest deadline. 2. Each job goes to the eligible crew and day that best fills existing gaps, minus 2 points per day of delay, plus a tenth of the match score. 3. A confirmed job can move 1 or 2 days later only if it starts outside the no-move window and has not been moved before.'],[],
 ['Your feedback used as rules'],...Object.entries(m.constraints.reject).map(([j,cs])=>['Not these crews for '+JOBS[j].title,cs.map(c=>crewById(c).name).join('; ')]),...Object.keys(m.constraints.noMove).map(id=>['Do not move',BOOKS.find(b=>b.id===id).name]),...m.constraints.block.map(b=>['Blocked',(b.jid?JOBS[b.jid].title:crewById(b.crew).name)+` ${dlabel(b.s)} to ${dlabel(b.e)}`]),[],
 ['Job','Crew','Start','End','Match score','Top-ranked crew','Open days filled','Moves a confirmed job','Your decision','Reason','Other options considered']];
 m.moves.forEach((mv,i)=>L.push([JOBS[mv.jid].title,crewById(mv.crew).name,dlabel(mv.s),dlabel(mv.e),mv.score,crewById(mv.top).name+` (${mv.topScore})`,mv.fill,mv.shift?`${mv.shift.name} +${mv.shift.k} day(s)`:'',m.sel[i]==='keep'?'Kept':'Rejected',m.why[i]||'',(mv.alts||[]).map(a=>`${crewById(a.crew).name} ${dlabel(a.s)}: ${a.why}`).join(' | ')]));
 m.skipped.forEach(j=>L.push([JOBS[j].title,'No crew fits the rules and feedback']));
 return L.map(l=>l.map(csvq).join(',')).join('\n');}
/* ============ downloads ============ */
let DLCAP=null;(async()=>{try{if(window.claude&&window.claude.use)DLCAP=await window.claude.use('downloads');}catch(_){}})();
async function saveFile(name,text){if(DLCAP){try{await DLCAP.save({filename:name,data:text});toast('Saved '+name);return;}catch(e){if(e&&e.code==='declined')return;}}
 try{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:'text/csv'}));a.download=name;document.body.appendChild(a);a.click();a.remove();toast('Downloaded '+name);}catch(_){toast('Downloads aren’t available here');}}
/* ============ calendar (Event Calendar, MIT) ============ */
const EC_JS='https://cdn.jsdelivr.net/npm/@event-calendar/build@5.16.0/dist/event-calendar.min.js',EC_CSS='https://cdn.jsdelivr.net/npm/@event-calendar/build@5.16.0/dist/event-calendar.min.css';
let EC=null,ECP=null;
function loadEC(){if(ECP)return ECP;ECP=new Promise((res,rej)=>{const l=document.createElement('link');l.rel='stylesheet';l.href=EC_CSS;document.head.appendChild(l);loadScript(EC_JS).then(res,e=>{ECP=null;rej(e);});});return ECP;}
const d2=(i,h)=>{const x=DL[Math.max(0,Math.min(DL.length-1,i))];return x.iso+(h?' '+h:'');};
const endAfter=i=>{const x=new Date(DL[Math.min(DL.length-1,i)].date);x.setDate(x.getDate()+1);return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`;};
function evOf(x,opts={}){const c=crewById(x.crew);const job=x.jid?JOBS[x.jid]:null;
 const base={resourceIds:[x.crew],extendedProps:{kind:x.jid?'job':'fixed',id:x.jid||x.id,seg:x.seg?x.seg-1:0,draft:!!x.prop,half:x.half,moved:x.moved}};
 const t=x.half?{start:d2(x.s,x.half==='am'?'08:00':'13:00'),end:d2(x.s,x.half==='am'?'12:00':'17:00'),allDay:false}:{start:d2(x.s),end:endAfter(x.e),allDay:true};
 const cls=[x.jid?(x.prop?'ev-draft':'ev-job'):'ev-fixed'];if(opts.focus)cls.push('ev-focus');if(x.moved)cls.push('ev-moved');
 return{id:(x.jid?'job:'+x.jid+':'+(x.seg?x.seg-1:0):'bk:'+x.id),...t,...base,title:x.name,classNames:cls,backgroundColor:opts.focus?'var(--tape)':`color-mix(in srgb, ${c.c} 22%, var(--surface))`,textColor:opts.focus?'var(--tape-ink)':'var(--ink)',editable:true};}
function calResources(list){const mk=c=>({id:c.id,title:c.name,extendedProps:{c}});
 if(S.view==='board')return list.map(mk);
 const R=list.filter(ready),N=list.filter(c=>!ready(c));const out=[];
 if(S.calF.group!=='needs'&&R.length)out.push({id:'g-ready',title:'Ready to match',children:R.map(mk),extendedProps:{group:1}});
 if(S.calF.group!=='ready'&&N.length)out.push({id:'g-needs',title:'Need setup before matching',children:N.map(mk),extendedProps:{group:1}});
 return out;}
function calEvents(){const B=bookings();const F=S.calF;const ev=[];
 if(S.view==='board'){const job=J();const p=S.place[job.id];
  B.forEach(x=>{if(x.jid===job.id)ev.push({...evOf(x,{focus:true}),title:job.title});else if(!S.hideOthers)ev.push({...evOf(x),editable:false});});
  if(!p)rank(job.id).filter(r=>r.ok).forEach((r,i)=>{ev.push({id:'ghost:'+r.crew,resourceIds:[r.crew],start:d2(r.slot.s),end:endAfter(r.slot.e),allDay:true,title:`${r.score} · ${i===0?'Best fit':'Option'}`,classNames:['ev-ghost'],editable:false,extendedProps:{kind:'ghost',crew:r.crew}});});
  return ev;}
 if(F.show!=='none')B.forEach(x=>{if(F.show==='confirmed'&&x.prop)return;if(F.show==='drafts'&&!x.prop)return;ev.push(evOf(x));});
 if(F.open)activeCrews().filter(ready).forEach(c=>{for(let d=0;d<10;d++){const o=occ(B,c.id,d);if(o<1)ev.push({id:`open:${c.id}:${d}`,resourceIds:[c.id],start:d2(d),end:endAfter(d),allDay:true,display:'background',classNames:[o===0.5?'open-half':'open-bg']});}});
 return ev;}
function evContent(info){const e=info.event,x=e.extendedProps;if(e.display==='background')return'';
 if(x.kind==='ghost')return{html:`<div class="evc"><b>${esc(e.title)}</b><span>Click to place</span></div>`};
 if(x.kind==='job'){const job=JOBS[x.id];const p=S.place[x.id];const pd=p?placeDays(x.id).filter(d=>d.k==='work'):[];const segs=p?p.segs:[];
  const sg=segs[x.seg]||segs[0];const inSeg=pd.filter(d=>d.d>=sg[0]&&d.d<=sg[1]);const lab=p&&p.half?`Half day (${p.half==='am'?'morning':'afternoon'})`:inSeg.length?`Day ${inSeg[0].n}${inSeg.length>1?'–'+inSeg[inSeg.length-1].n:''}${segs.length>1?` · visit ${x.seg+1}`:''}`:'';
  return{html:`<div class="evc"><b>${esc(job.title)}</b><span>${x.draft?'Draft · ':''}${lab}</span></div>`};}
 const b=BOOKS.find(y=>y.id===x.id);const n=b.e-b.s+1;
 return{html:`<div class="evc"><b>${esc(b.name)}</b><span>${b.half?(b.half==='am'?'Morning':'Afternoon'):`Day 1–${n}`}${x.moved?' · moved':''}</span></div>`};}
function resContent(info){const r=info.resource,x=r.extendedProps||{};if(x.group)return{html:`<span class="rgrp">${esc(r.title)}</span>`};
 const c=x.c;if(!c)return r.title;const mi=missing(c);const B=bookings();
 return{html:`<button class="rlab" data-act="crew" data-v="${c.id}"><span class="dot" style="--c:${c.c}"></span><span class="rlab-t"><b>${esc(c.name)}</b><small>${c.f.size?sizeText(c):'size missing'} · ${mi.length?'<em>needs setup</em>':util(B,c.id)+'% booked'}</small></span></button>`};}
function mountCal(){const el=document.getElementById('ec');if(EC){try{EventCalendar.destroy(EC);}catch(_){}EC=null;}if(!el)return;
 if(!window.EventCalendar){el.innerHTML='<div class="pad small muted">Loading the calendar…</div>';loadEC().then(()=>{if(document.getElementById('ec'))mountCal();}).catch(()=>{el.innerHTML='<div class="pad small">The calendar library didn’t load. Check your connection and reload.</div>';});return;}
 const list=S.view==='board'?boardCrews():activeCrews();const F=S.calF;const zoom=[40,64,96][F.zoom];
 EC=EventCalendar.create(el,{view:S.view==='board'?'twoWeeks':F.view,date:F.date||DL[0].date,hiddenDays:[0,6],height:'auto',
  headerToolbar:{start:'prev,next today',center:'title',end:''},buttonText:{today:'Today'},
  views:{resourceTimelineDay:{slotDuration:'01:00',slotMinTime:'07:00:00',slotMaxTime:'18:00:00',slotWidth:zoom+24},resourceTimelineWeek:{slotDuration:{days:1},slotWidth:zoom*2},twoWeeks:{type:'resourceTimelineWeek',duration:{weeks:2},slotDuration:{days:1},slotWidth:zoom+20},resourceTimelineMonth:{slotDuration:{days:1},slotWidth:zoom}},
  slotLabelFormat:F.view==='resourceTimelineDay'&&S.view!=='board'?{hour:'numeric'}:{weekday:'short',day:'numeric'},
  resources:calResources(list),events:calEvents(),editable:true,eventDurationEditable:false,eventStartEditable:true,
  eventContent:evContent,resourceLabelContent:resContent,
  eventClick:info=>{const x=info.event.extendedProps;if(x.kind==='ghost'){placeJob(S.job,x.crew);render();toast(`Draft placed on ${crewById(x.crew).name}. Drag to adjust`);return;}if(x.kind==='job'||x.kind==='fixed'){S.modal={type:'hub',id:x.kind==='job'?x.id:x.id};drawLayer();}},
  eventDrop:info=>onDrop(info),
  datesSet:info=>{F.date=info.view.currentStart;}});}
function boardCrews(){const job=J();const R=rank(job.id);const p=S.place[job.id];const ids=new Set(R.filter(r=>r.ok).map(r=>r.crew));if(p)ids.add(p.crew);
 return(S.allCrews?activeCrews():activeCrews().filter(c=>ids.has(c.id))).sort((a,b)=>R.findIndex(r=>r.crew===a.id)-R.findIndex(r=>r.crew===b.id));}
function onDrop(info){const x=info.event.extendedProps;const newIdx=idxOfDate(info.event.start);const newCrew=(info.newResource&&info.newResource.id)||info.event.resourceIds[0];
 if(String(newCrew).startsWith('g-')){info.revert();toast('Drop it on a crew row');return;}
 if(x.kind==='job'){const p=S.place[x.id];const sg=p.segs[x.seg];const d=newIdx-sg[0];
  const apply=()=>{if(p.segs.length>1&&newCrew===p.crew){sg[0]+=d;sg[1]+=d;p.segs.sort((a,b)=>a[0]-b[0]);}else{p.segs=p.segs.map(([a,z])=>[a+d,z+d]);}
   if(newCrew!==p.crew){p.crew=newCrew;}if(p.half&&info.event.start.getHours()>=12)p.half='pm';else if(p.half)p.half='am';};
  if(p.status==='scheduled'){info.revert();S.modal={type:'move',kind:'job',id:x.id,seg:x.seg,d,crew:newCrew,pick:null};drawLayer();return;}
  apply();render();toast(`${JOBS[x.id].title} moved to ${crewById(p.crew).name}, ${dlabel(pS(p))}`);return;}
 if(x.kind==='fixed'){info.revert();const b=BOOKS.find(y=>y.id===x.id);const cur=b.s+(S.shift[b.id]||0);S.modal={type:'move',kind:'fixed',id:x.id,d:newIdx-cur,crew:newCrew,pick:null};drawLayer();}}
function dropUnscheduled(jid,x,y){if(!EC)return;const info=EC.dateFromPoint(x,y);if(!info||!info.resource||String(info.resource.id).startsWith('g-')){toast('Drop it on a crew row');return;}
 const idx=idxOfDate(info.date);const cid=info.resource.id;setPlace(jid,cid,idx,'draft');const fails=hard(JOBS[jid],cid);render();
 toast(fails.length?`Draft on ${crewById(cid).name}, but: ${fails[0]}. Click it to pick another crew`:`Draft on ${crewById(cid).name}, ${dlabel(idx)}. Click it to check or confirm`);}
