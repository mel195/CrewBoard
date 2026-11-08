/* ================= v9: saved workspace, members, usage + feedback tracking ================= */
/* ---------- one scheduler in the sample history: Carla (no invented names) ---------- */
delete PEOPLE.scheduler2;
const RTESTS=Object.fromEntries((S.riley.learned||[]).map(l=>[l.id,l.test]));
function reTest(){(S.riley.learned||[]).forEach(l=>{if(typeof l.test!=='function')l.test=RTESTS[l.id]||(()=>false);});}
(()=>{const fix=o=>JSON.parse(JSON.stringify(o).replace(/Jessie T\./g,'Carla M.').replace(/\bJessie\b/g,'Carla'));
 S.riley=fix(S.riley);S.log=fix(S.log);S.act=fix(S.act);reTest();})();
/* ---------- workspace members ---------- */
const WS={members:[{id:'m_ido',name:'Ido D.',role:'admin'},{id:'m_carla',name:'Carla M.',role:'scheduler'}],name:'Precision Painting Plus'};
S.member='m_ido';
const memberById=id=>WS.members.find(m=>m.id===id)||WS.members[0];
const roleL=r=>r==='admin'?'Admin':'Scheduler';
function useMember(id){const m=memberById(id);S.member=m.id;S.role=m.role;PEOPLE[m.role]=`${m.name} (${roleL(m.role)})`;}
function drawMemberSwitch(){const seg=document.querySelector('.seg.role');if(!seg)return;seg.setAttribute('aria-label','Viewing as');
 seg.innerHTML=`<span class="vas">Viewing as</span>`+WS.members.map(m=>`<button data-member="${m.id}" aria-pressed="${S.member===m.id}">${esc(m.name.split(' ')[0])} · ${roleL(m.role)}</button>`).join('');}
useMember('m_ido');
window.addEventListener('click',e=>{const b=e.target.closest('[data-member]');if(!b)return;e.stopPropagation();e.preventDefault();useMember(b.dataset.member);S.drawer=false;
 T.feat('switch-view-as');render();toast(`Viewing as ${memberById(b.dataset.member).name}, ${roleL(S.role).toLowerCase()} view`);},true);
/* ---------- capabilities ---------- */
let DB=null,USER=null,UID=null,WKEY=null,OWNER=false,CANW=null,SID='s'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const SAVE={state:'local',last:{},timer:null,busy:false,loaded:false,ro:false};
/* what gets saved, by part */
const PARTS={
 crews:()=>({CREWS,MEMBERS,CONTACTS,REVIEWS}),
 jobs:()=>({JOBS:Object.fromEntries(Object.entries(JOBS).filter(([k])=>!k.startsWith('__'))),QORDER,BOOKS,CLIENTS}),
 board:()=>({place:S.place,shift:S.shift,reassign:S.reassign,override:S.override,follow:S.follow,ofb:S.ofb,msgEdit:S.msgEdit}),
 settings:()=>({rules:S.rules,impOn:S.impOn,impValue:S.impValue,hoursDefault:S.hoursDefault,comm:S.comm,label:S.label,w:S.w,LABELS,DIMS,RECOMMENDED:RECOMMENDED.map(f=>({k:f.k,added:!!f.added})),TEMPLATES,PMS,googleReviews:S.googleReviews,optMargin:S.optMargin,calViews:S.calViews,imp:S.imp,WS}),
 riley:()=>({riley:S.riley}),
 history:()=>({log:S.log.slice(0,400),comms:S.comms.slice(0,400),act:S.act.slice(0,200)})};
function setArr(a,b){if(!Array.isArray(b))return;a.length=0;b.forEach(x=>a.push(x));}
function setObj(a,b){if(!b||typeof b!=='object')return;Object.keys(a).forEach(k=>delete a[k]);Object.assign(a,b);}
function applyPart(k,d){if(!d)return;
 if(k==='crews'){setArr(CREWS,d.CREWS);setObj(MEMBERS,d.MEMBERS);setObj(CONTACTS,d.CONTACTS);setObj(REVIEWS,d.REVIEWS);}
 if(k==='jobs'){setObj(JOBS,d.JOBS);setArr(QORDER,d.QORDER);setArr(BOOKS,d.BOOKS);setArr(CLIENTS,d.CLIENTS);}
 if(k==='board'){['place','shift','reassign','override','follow','ofb','msgEdit'].forEach(x=>{if(d[x]!==undefined)S[x]=d[x];});}
 if(k==='settings'){['rules','impOn','impValue','hoursDefault','comm','label','w','googleReviews','optMargin','calViews','imp'].forEach(x=>{if(d[x]!==undefined)S[x]=d[x];});
  if(d.LABELS)setObj(LABELS,d.LABELS);if(d.DIMS)setArr(DIMS,d.DIMS);if(d.TEMPLATES)setArr(TEMPLATES,d.TEMPLATES);if(d.PMS)setObj(PMS,d.PMS);
  (d.RECOMMENDED||[]).forEach(r=>{const f=RECOMMENDED.find(x=>x.k===r.k);if(f)f.added=r.added;});
  if(d.WS&&Array.isArray(d.WS.members)&&d.WS.members.length){WS.members=d.WS.members;if(d.WS.name)WS.name=d.WS.name;}
  IMPT[2][1]=`Job worth ${money(S.impValue)} or more`;}
 if(k==='riley'&&d.riley){S.riley=d.riley;reTest();}
 if(k==='history'){if(d.log)S.log=d.log;if(d.comms)S.comms=d.comms;if(d.act)S.act=d.act;}}
const partJSON=k=>JSON.stringify(PARTS[k]());
function markSave(st){SAVE.state=st;const el=document.getElementById('savest');if(!el)return;
 const L={local:['Sample data · changes not saved','muted'],saving:['Saving…',''],saved:['Saved','good'],error:['Couldn’t save · retrying','warn'],ro:['View only','muted'],full:['Storage full','warn']}[st]||['',''];
 el.textContent=L[0];el.className='savest '+L[1];}
function scheduleSave(){if(!DB||SAVE.ro||!SAVE.loaded)return;clearTimeout(SAVE.timer);SAVE.timer=setTimeout(saveNow,1200);}
async function saveNow(){if(!DB||SAVE.busy){if(SAVE.busy)scheduleSave();return;}SAVE.busy=true;let wrote=false;
 try{for(const k of Object.keys(PARTS)){const j=partJSON(k);if(j===SAVE.last[k])continue;if(!wrote){markSave('saving');wrote=true;}
   await DB.doc('ws/'+k).set({v:1,data:JSON.parse(j),by:S.member,sid:SID,at:Date.now()});SAVE.last[k]=j;}
  if(wrote){await DB.doc('ws/meta').set({v:1,at:Date.now(),by:S.member,sid:SID,members:WS.members.length});markSave('saved');}
 }catch(e){const c=e&&e.code;if(c==='invalid_argument'&&CANW!==true){SAVE.ro=true;markSave('ro');}else if(c==='quota_exceeded'){markSave('full');toast('Crew Board storage is full. Export a backup and clear old history');}else if(c==='revoked'){SAVE.ro=true;markSave('ro');}else{markSave('error');setTimeout(scheduleSave,4000);}}
 finally{SAVE.busy=false;}}
['click','change','input','pointerup','drop','keyup'].forEach(ev=>document.addEventListener(ev,()=>scheduleSave(),true));
async function loadWorkspace(){const snaps=await Promise.all(Object.keys(PARTS).map(k=>DB.doc('ws/'+k).get().then(s=>[k,s]).catch(()=>[k,null])));
 let any=false;snaps.forEach(([k,s])=>{if(s&&s.exists){const d=s.data();applyPart(k,d.data);SAVE.last[k]=JSON.stringify(d.data);any=true;}});
 Object.keys(PARTS).forEach(k=>{if(!(k in SAVE.last))SAVE.last[k]=partJSON(k);});
 /* re-baseline on our own serialization so we don't rewrite unchanged parts */
 Object.keys(PARTS).forEach(k=>{if(any)SAVE.last[k]=partJSON(k);});
 if(!WS.members.some(m=>m.id===S.member))S.member=WS.members[0].id;useMember(S.member);
 SAVE.loaded=true;markSave(SAVE.ro?'ro':any?'saved':'local');return any;}
function watchWorkspace(){Object.keys(PARTS).forEach(k=>{DB.doc('ws/'+k).onSnapshot(s=>{if(!s.exists||s.metadata.hasPendingWrites)return;const d=s.data();if(d.sid===SID)return;
  const j=JSON.stringify(d.data);if(j===SAVE.last[k])return;applyPart(k,d.data);SAVE.last[k]=partJSON(k);if(!S.modal&&!S.crewEdit&&!S.clientEdit)render();},()=>{});});}
/* ---------- usage tracking ---------- */
const PAGEN={onboard:'Get started',queue:'Ready to schedule',match:'Crew selection',board:'Plan and confirm',add:'Add a job',riley:'Riley',cal:'Calendar',crews:'Crews',clients:'Clients',msgs:'Messages',audit:'Audit log',setup:'Setup',ideas:'Ideas',usage:'Usage'};
const FEAT_SKIP=new Set(['tconsent','fb8send','closemodal','closemodal2','uref','ufilter','fbdone','tournext','tourback','tourgo','tourskip','tourdone','x','mcpick']);
const FEATN={pick:'Schedule a crew',drawer:'Tune ranking weights',label:'Change ranking label',msgtab:'Preview a message',match:'Open crew selection',board:'Open plan',confirm:'Confirm a job',optimize:'Run optimizer',optapply:'Apply optimizer moves',split:'Split into visits',planall:'Plan all jobs',rwhy:'Riley: why this crew',raccept:'Use Riley’s pick',colors:'Send color form',colorok:'Mark colors confirmed',pmsend:'Send PM handoff',csend:'Message a client',client:'Open a client',crew:'Open crew profile',ceedit:'Edit a crew',cesave:'Save a crew',exportcrews:'Export crews',tour:'Watch the tour',addfield:'Add a crew field',rmfield:'Remove a crew field',lkeep:'Keep a Riley habit',lignore:'Ignore a Riley habit',sendok:'Send messages',tplsel:'Open a template',datequick:'Quick-pick a date',editjob:'Edit a job',calview:'Change calendar view','switch-view-as':'Switch admin / scheduler view','cal-drag':'Drag a job on the calendar',feedback:'Send feedback'};
const T={on:false,cur:null,since:0,pages:{},feats:{},dirty:false,start:Date.now(),viewAs:{},
 tick(){const now=Date.now();if(this.cur&&!document.hidden){const ms=now-this.since;this.pages[this.cur]=(this.pages[this.cur]||0)+ms;const r=S.role;this.viewAs[r]=(this.viewAs[r]||0)+ms;if(ms>500)this.dirty=true;}this.since=now;},
 page(p){if(p===this.cur)return;this.tick();this.cur=p;},
 feat(a){if(!a)return;this.feats[a]=(this.feats[a]||0)+1;this.dirty=true;}};
document.addEventListener('visibilitychange',()=>{T.tick();if(document.hidden)flushT();});
window.addEventListener('pagehide',()=>{T.tick();flushT();});
document.addEventListener('click',e=>{const b=e.target.closest('[data-act],[data-go]');if(!b)return;if(b.dataset.act)T.feat(b.dataset.act);else T.feat('go:'+b.dataset.go);},true);
document.addEventListener('pointerup',e=>{if(e.target.closest&&e.target.closest('.ec-event'))T.feat('cal-drag');},true);
async function flushT(){if(!DB||!WKEY||!T.on||!T.dirty)return;T.tick();T.dirty=false;const ref=DB.doc('telemetry/'+WKEY);
 const rec={start:T.start,end:Date.now(),pages:{...T.pages},feats:{...T.feats},viewAs:{...T.viewAs},owner:OWNER};
 try{await ref.update({sessions:{[SID]:rec},last:Date.now()});}catch(e){if(e&&e.code==='invalid_argument'){try{await ref.set({sessions:{[SID]:rec},last:Date.now(),first:Date.now()});}catch(_){}}}}
setInterval(()=>{T.tick();flushT();},20000);
/* ---------- feedback tied to the page ---------- */
function pageContext(){const v=S.view;const c={page:v,pageName:PAGEN[v]||v,viewAs:S.member,role:S.role};
 if(['match','board'].includes(v)&&JOBS[S.job])c.job=JOBS[S.job].title;
 if(v==='add'&&S.add)c.step=S.add.stage||'';
 if(v==='clients'&&S.client){const cl=CLIENTS.find(x=>x.id===S.client);if(cl)c.client=cl.name;}
 if(S.modal&&S.modal.type){c.panel=S.modal.type;if(S.modal.type==='crew'&&S.modal.id){const cr=crewById(S.modal.id);if(cr)c.crew=cr.name;}}
 if(v==='cal')c.calView=(S.calF||{}).view;return c;}
const ctxLine=c=>[c.pageName,c.step?`step: ${c.step}`:'',c.job,c.client,c.crew?`crew: ${c.crew}`:'',c.panel&&!c.crew?`panel: ${c.panel}`:''].filter(Boolean).join(' · ');
window.addEventListener('click',e=>{const b=e.target.closest('[data-fb]');if(!b)return;e.stopPropagation();e.preventDefault();
 const sec=b.closest('section,article,.card');const h=sec&&sec.querySelector('h1,h2,h3');
 S.fbCtx={...pageContext(),section:h?h.textContent.trim().slice(0,80):'',area:b.dataset.fb};S.fbModalReturn=S.modal;S.modal={type:'fb8'};drawLayer();setTimeout(()=>{const t=document.getElementById('fb8t');if(t)t.focus();},30);},true);
M.fb8=m=>{const c=S.fbCtx||pageContext();return MW('Feedback',`<div class="eyebrow">Feedback</div><h2 class="mt">What should change?</h2>
 <div class="fbctx"><span class="tiny">This note is attached to</span><b>${esc(ctxLine(c))}</b>${c.section?`<span class="small muted">Section: ${esc(c.section)}</span>`:''}<span class="tiny">Viewing as ${esc(memberById(c.viewAs).name)}, ${roleL(c.role).toLowerCase()} view</span></div>
 <textarea class="in" id="fb8t" rows="5" maxlength="2000" placeholder="What’s confusing, missing or wrong here?" style="margin-top:12px"></textarea>
 <div class="row" style="margin-top:10px;flex-wrap:wrap;gap:6px">${[['idea','Idea'],['bug','Something’s broken'],['confusing','Confusing'],['love','Love this']].map(([k,l],i)=>`<label class="pill"><input type="radio" name="fbk" value="${k}" ${i===0?'checked':''} style="margin:0 4px 0 0">${l}</label>`).join('')}</div>
 <div class="row" style="margin-top:14px;flex-wrap:wrap"><button class="btn tape" data-act="fb8send">Send feedback</button>${COMMENTS?'<button class="btn line" data-act="fb8pin">Pin a comment on the screen instead</button>':''}<button class="btn line" data-act="closemodal2">Cancel</button></div>
 ${DB&&WKEY?'':'<p class="tiny" style="margin-top:10px">Feedback can’t be saved in this view. Open Crew Board from your claude.ai link to send it.</p>'}`);};
async function sendFeedback(){const t=(document.getElementById('fb8t')||{}).value||'';if(!t.trim()){toast('Write a note first');return;}
 const kind=(document.querySelector('input[name=fbk]:checked')||{}).value||'idea';const c=S.fbCtx||pageContext();
 const id='f'+Date.now().toString(36);const item={...c,kind,text:t.trim().slice(0,2000),ts:Date.now(),sid:SID,status:'new',owner:OWNER};
 if(!DB||!WKEY){toast('Feedback can’t be saved in this view');return;}
 const ref=DB.doc('feedback/'+WKEY);
 try{try{await ref.update({items:{[id]:item},last:Date.now()});}catch(e){if(e&&e.code==='invalid_argument')await ref.set({items:{[id]:item},last:Date.now()});else throw e;}
  T.feat('feedback');S.modal=S.fbModalReturn||null;drawLayer();toast(`Thanks. Sent with the page: ${c.pageName}`);}
 catch(e){toast('Couldn’t send feedback. Try again in a moment');}}
document.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b)return;const a=b.dataset.act;
 if(a==='fb8send'){sendFeedback();}
 if(a==='fb8pin'){S.modal=null;drawLayer();const el=document.querySelector('#app .pgw')||document.getElementById('app');if(COMMENTS)COMMENTS.openComposer({element:el}).catch(()=>{});}
 if(a==='tconsent'){T.on=v8yes(b.dataset.v==='1');}
 if(a==='uref'){loadUsage();}
 if(a==='ufilter'){S.uMine=!S.uMine;render();}
 if(a==='fbdone'){markFb(b.dataset.u,b.dataset.v,b.dataset.s);}
 if(a==='wsexport'){exportWs();}
 if(a==='wsreset'){S.modal={type:'wsreset'};drawLayer();}
 if(a==='wsresetok'){resetWs();}
 if(a==='madd'){const n=(document.getElementById('mname')||{}).value||'';const r=(document.getElementById('mrole')||{}).value||'scheduler';if(!n.trim()){toast('Add a name');return;}WS.members.push({id:'m_'+Date.now().toString(36),name:n.trim(),role:r});log('Setting',`Added workspace member ${n.trim()} (${roleL(r)}).`);drawMemberSwitch();render();}
 if(a==='mrm'){const m=memberById(b.dataset.v);if(WS.members.length<2||m.id===S.member){toast('You can’t remove the member you’re viewing as');return;}WS.members=WS.members.filter(x=>x.id!==m.id);log('Setting',`Removed workspace member ${m.name}.`);drawMemberSwitch();render();}
 if(a==='mrole'){const m=memberById(b.dataset.v);m.role=m.role==='admin'?'scheduler':'admin';if(m.id===S.member)useMember(m.id);drawMemberSwitch();render();}
},true);
document.addEventListener('change',e=>{const t=e.target;if(t.dataset&&t.dataset.mname){const m=memberById(t.dataset.mname);m.name=t.value.trim()||m.name;if(m.id===S.member)useMember(m.id);drawMemberSwitch();render();}if(t.id==='wsimport'&&t.files&&t.files[0])importWs(t.files[0]);});
/* consent banner (per person, remembered privately) */
function v8yes(on){T.on=on;S.tAsked=true;const el=document.getElementById('tbanner');if(el)el.remove();try{localStorage.setItem('cb-telemetry',on?'1':'0');}catch(_){}if(DB&&UID)DB.doc('data/users/'+UID+'/prefs').set({telemetry:on,at:Date.now()}).catch(()=>{});toast(on?'Thanks. Usage sharing is on':'Usage sharing is off');if(on){T.dirty=true;flushT();}return on;}
function showConsent(){if(document.getElementById('tbanner'))return;const d=document.createElement('div');d.id='tbanner';d.className='tbanner';
 d.innerHTML=`<div class="grow"><b>Help us improve Crew Board</b><div class="small">Share which pages and features you use and how long you spend on each. No client names, phone numbers or prices are sent. You can change this in Setup.</div></div><button class="btn sm tape" data-act="tconsent" data-v="1">Share usage</button><button class="btn sm line" data-act="tconsent" data-v="0">No thanks</button>`;document.body.appendChild(d);}
/* ---------- export / import / reset ---------- */
function wsBundle(){const o={app:'crewboard',v:1,exported:new Date().toISOString(),parts:{}};Object.keys(PARTS).forEach(k=>o.parts[k]=JSON.parse(partJSON(k)));return o;}
async function exportWs(){const data=JSON.stringify(wsBundle(),null,1);const fn=`crewboard-${(WS.name||'workspace').toLowerCase().replace(/[^a-z0-9]+/g,'-')}-${new Date().toISOString().slice(0,10)}.json`;
 try{const dl=await window.claude.use('downloads');if(dl){await dl.save({filename:fn,data});return;}}catch(_){}
 try{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([data],{type:'application/json'}));a.download=fn;a.click();}catch(_){toast('Download isn’t available here');}}
function importWs(file){const r=new FileReader();r.onload=()=>{try{const o=JSON.parse(r.result);if(o.app!=='crewboard'||!o.parts)throw 0;Object.keys(PARTS).forEach(k=>applyPart(k,o.parts[k]));useMember(S.member);log('Setting','Imported workspace data from a backup file.');drawMemberSwitch();render();scheduleSave();toast('Backup loaded');}catch(_){toast('That file isn’t a Crew Board backup');}};r.readAsText(file);}
M.wsreset=()=>MW('Reset workspace',`<div class="eyebrow">Workspace data</div><h2 class="mt">Go back to the sample data?</h2><p class="small muted">This deletes the saved crews, jobs, calendar and settings for everyone in this workspace. Usage data and feedback are kept. Export a backup first if you might want it back.</p>
 <div class="row" style="margin-top:14px;flex-wrap:wrap"><button class="btn line" data-act="wsexport">Export a backup</button><button class="btn" style="background:var(--bad);color:#fff" data-act="wsresetok">Delete saved data</button><button class="btn line" data-act="closemodal2">Cancel</button></div>`);
async function resetWs(){if(!DB)return;try{for(const k of Object.keys(PARTS))await DB.doc('ws/'+k).delete();await DB.doc('ws/meta').delete();}catch(_){toast('Couldn’t reset. Try again');return;}SAVE.loaded=false;toast('Saved data deleted. Reloading sample data');setTimeout(()=>location.reload(),600);}
/* ---------- Setup: members + workspace data ---------- */
V.setup=(()=>{const old=V.setup;return(...a)=>{let h=old(...a);if(!isAdmin())return h;
 const card=`<section class="card pad wide2 wsdata"><div class="row" style="flex-wrap:wrap"><h3 class="grow">Workspace and members</h3><span id="savest2" class="savest ${SAVE.state==='saved'?'good':''}">${DB?(SAVE.ro?'View only':SAVE.state==='saved'?'Saved':'Sample data until the first change'):'Not saved in this view'}</span></div>
  <p class="small muted" style="margin:6px 0 10px">Everyone in ${esc(WS.name)} works off the same saved crews, jobs, calendar and settings. Members are the people Crew Board schedules as. Use “Viewing as” at the top to see the app the way each one does.</p>
  ${WS.members.map(m=>`<div class="hr"><input class="in sm" data-mname="${m.id}" value="${esc(m.name)}" aria-label="Member name" style="max-width:200px"><button class="pill ${m.role==='admin'?'on':''}" data-act="mrole" data-v="${m.id}">${roleL(m.role)}</button><span class="grow tiny">${m.role==='admin'?'Setup, audit log, labels, crew data':'Schedules jobs, picks from admin labels'}</span>${S.member===m.id?'<span class="chip tape">Viewing as</span>':`<button class="x0" data-act="mrm" data-v="${m.id}" aria-label="Remove ${esc(m.name)}">×</button>`}</div>`).join('')}
  <div class="row" style="margin-top:8px;flex-wrap:wrap;gap:6px"><input class="in sm" id="mname" placeholder="Name" style="max-width:200px" aria-label="New member name"><select class="in sm" id="mrole" style="width:auto" aria-label="Role"><option value="scheduler">Scheduler</option><option value="admin">Admin</option></select><button class="btn sm line" data-act="madd">+ Add member</button></div>
  <div class="row" style="margin-top:14px;flex-wrap:wrap;gap:8px;border-top:1px solid var(--line);padding-top:12px"><button class="btn sm line" data-act="wsexport">Export a backup (JSON)</button><label class="btn sm line" for="wsimport">Load a backup</label><input type="file" id="wsimport" accept=".json,application/json" hidden><button class="btn sm line" data-act="wsreset">Reset to sample data</button>
   <span class="grow"></span><span class="tiny">Usage sharing: <b>${T.on?'on':'off'}</b> <button class="lnk" data-act="tconsent" data-v="${T.on?'0':'1'}" style="font-size:12px">${T.on?'Turn off':'Turn on'}</button></span></div></section>`;
 const i=h.indexOf('<div class="setgrid">');return i<0?h+card:h.slice(0,i+'<div class="setgrid">'.length)+card+h.slice(i+'<div class="setgrid">'.length);};})();
Object.keys(V).forEach(k=>{const f=V[k];if(typeof f!=='function'||f.__w)return;const g=(...a)=>`<div id="pg-${k}" class="pgw">${f(...a)}</div>`;g.__w=1;V[k]=g;});
/* ---------- Usage (owner only) ---------- */
S.uMine=true;S.usage=null;
const fmtMin=ms=>{const m=Math.round(ms/60000);return m<1?'<1 min':m<60?m+' min':`${Math.floor(m/60)} h ${m%60} min`;};
const fmtD=ts=>new Date(ts).toLocaleString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});
async function loadUsage(){if(!DB||!OWNER)return;S.usage={loading:true};render();
 try{const[t,f]=await Promise.all([DB.collection('telemetry').get(),DB.collection('feedback').get()]);
  const sessions=[];t.docs.forEach(d=>{const x=d.data()||{};Object.entries(x.sessions||{}).forEach(([sid,s])=>sessions.push({uid:d.id,sid,...s}));});
  const fb=[];f.docs.forEach(d=>{const x=d.data()||{};Object.entries(x.items||{}).forEach(([id,it])=>fb.push({uid:d.id,id,...it}));});
  sessions.sort((a,b)=>b.end-a.end);fb.sort((a,b)=>b.ts-a.ts);S.usage={sessions,fb,at:Date.now()};}catch(e){S.usage={err:true};}render();}
async function markFb(uid,id,st){if(!DB)return;try{await DB.doc('feedback/'+uid).update({items:{[id]:{status:st}}});const it=S.usage.fb.find(x=>x.uid===uid&&x.id===id);if(it)it.status=st;render();}catch(_){toast('Couldn’t update');}}
V.usage=()=>{if(!OWNER)return '<div class="card pad">Only the owner sees usage.</div>';const U=S.usage;
 if(!U||U.loading)return `<div class="qhead"><div class="grow"><div class="eyebrow">Owner only</div><h1>Usage and feedback</h1></div></div><div class="card pad muted">Loading…</div>`;
 if(U.err)return `<div class="qhead"><div class="grow"><h1>Usage and feedback</h1></div><button class="btn line" data-act="uref">Try again</button></div><div class="card pad">Couldn’t load usage data.</div>`;
 const ss=U.sessions.filter(s=>!S.uMine||!s.owner);const tot={};const fe={};let time=0;const va={};
 ss.forEach(s=>{Object.entries(s.pages||{}).forEach(([p,ms])=>{tot[p]=(tot[p]||0)+ms;time+=ms;});Object.entries(s.feats||{}).forEach(([a,n])=>{if(!a.startsWith('go:')&&!FEAT_SKIP.has(a))fe[a]=(fe[a]||0)+n;});Object.entries(s.viewAs||{}).forEach(([r,ms])=>va[r]=(va[r]||0)+ms);});
 const pages=Object.entries(tot).sort((a,b)=>b[1]-a[1]);const mx=pages[0]?pages[0][1]:1;const feats=Object.entries(fe).sort((a,b)=>b[1]-a[1]).slice(0,15);const fmx=feats[0]?feats[0][1]:1;
 const fb=U.fb.filter(x=>!S.uMine||!x.owner);const people=new Set(ss.map(s=>s.uid)).size;
 const kindL={idea:'Idea',bug:'Broken',confusing:'Confusing',love:'Love'};
 return `<div class="qhead"><div class="grow"><div class="eyebrow">Owner only · Ido doesn’t see this tab</div><h1>Usage and feedback</h1><p class="small muted" style="margin:4px 0 0">Updated ${fmtD(U.at)}. Sessions report every 20 seconds while Crew Board is open.</p></div>
  <button class="btn line" data-act="ufilter">${S.uMine?'Include my own sessions':'Hide my own sessions'}</button><button class="btn line" data-act="uref">Refresh</button></div>
 <div class="kstrip"><div><b class="num">${ss.length}</b><span>sessions</span><small>${plural(people,'person','people')}</small></div><div><b class="num">${fmtMin(time)}</b><span>time in Crew Board</span><small>${ss[0]?'last active '+fmtD(ss[0].end):'no activity yet'}</small></div><div><b class="num">${fmtMin(va.admin||0)} / ${fmtMin(va.scheduler||0)}</b><span>admin view / scheduler view</span><small>time viewing as each</small></div><div><b class="num">${fb.length}</b><span>feedback notes</span><small>${fb.filter(x=>x.status!=='done').length} open</small></div></div>
 <div class="split2 ugrid"><section class="card pad"><h3 style="font-size:17px">Time by page</h3>${pages.map(([p,ms])=>`<div class="ubar"><span>${esc(PAGEN[p]||p)}</span><i><em style="width:${Math.max(3,ms/mx*100)}%"></em></i><b class="num">${fmtMin(ms)}</b></div>`).join('')||'<p class="small muted">No sessions yet.</p>'}</section>
 <section class="card pad"><h3 style="font-size:17px">Features used</h3>${feats.map(([a,n])=>`<div class="ubar"><span>${esc(FEATN[a]||a)}</span><i><em style="width:${Math.max(3,n/fmx*100)}%;background:var(--good)"></em></i><b class="num">${n}</b></div>`).join('')||'<p class="small muted">Nothing used yet.</p>'}</section></div>
 <section class="card" style="margin-top:14px"><div class="pad" style="padding-bottom:4px"><h3 style="font-size:17px">Feedback, with the page it was left on</h3></div>${fb.map(x=>`<div class="lrow ${x.status==='done'?'fbdone':''}"><span class="chip ${x.kind==='bug'?'bad':x.kind==='love'?'good':x.kind==='confusing'?'warn':'tape'}">${kindL[x.kind]||'Note'}</span><div class="grow" style="min-width:0"><div><b>${esc(ctxLine(x))}</b>${x.section?` <span class="tiny">· ${esc(x.section)}</span>`:''}</div><div class="small" style="margin-top:3px;white-space:pre-line">${esc(x.text)}</div><div class="tiny" style="margin-top:3px">${fmtD(x.ts)} · viewing as ${esc((WS.members.find(m=>m.id===x.viewAs)||{}).name||x.viewAs)}, ${roleL(x.role)}</div></div><button class="btn sm line" data-act="fbdone" data-u="${x.uid}" data-v="${x.id}" data-s="${x.status==='done'?'new':'done'}">${x.status==='done'?'Reopen':'Done'}</button></div>`).join('')||'<p class="pad small muted">No feedback yet.</p>'}</section>
 <section class="card pad" style="margin-top:14px"><h3 style="font-size:17px">Recent sessions</h3>${ss.slice(0,20).map(s=>{const top=Object.entries(s.pages||{}).sort((a,b)=>b[1]-a[1])[0];const dur=Object.values(s.pages||{}).reduce((a,b)=>a+b,0);return `<div class="hr"><span class="grow small">${fmtD(s.start)}${s.owner?' <span class="chip">you</span>':''}</span><span class="small muted">${top?'mostly '+esc(PAGEN[top[0]]||top[0]):''}</span><b class="num small" style="min-width:70px;text-align:right">${fmtMin(dur)}</b></div>`;}).join('')||'<p class="small muted">No sessions yet.</p>'}</section>`;};
V.usage.__w=0;{const f=V.usage;const g=(...a)=>`<div id="pg-usage" class="pgw">${f(...a)}</div>`;g.__w=1;V.usage=g;}
PAGEN.usage='Usage';
/* ---------- render hook: tabs, page timer, save status ---------- */
const _render9=render;render=function(){_render9();drawMemberSwitch();
 if(OWNER&&isAdmin()){const tb=document.getElementById('tabs');if(tb&&!tb.querySelector('[data-go=usage]')){const b=document.createElement('button');b.dataset.go='usage';b.textContent='Usage';if(S.view==='usage')b.setAttribute('aria-current','page');tb.appendChild(b);}}
 T.page(S.view);
 if(!document.getElementById('savest')){const w=document.getElementById('who');if(w){const s=document.createElement('span');s.id='savest';s.className='savest';w.after(s);}}markSave(SAVE.state);};
document.addEventListener('click',e=>{const g=e.target.closest('[data-go=usage]');if(g){S.view='usage';loadUsage();}},true);
/* ---------- start ---------- */
(async()=>{try{if(!window.claude||!window.claude.use)return;
 const[db,user]=await Promise.all([window.claude.use('db'),window.claude.use('user')]);DB=db;USER=user;
 if(USER){UID=await USER.id();OWNER=await USER.isOwner();CANW=await USER.can('data.write');}
 if(CANW===false)SAVE.ro=true;
 if(DB){await loadWorkspace();watchWorkspace();
  let anon=null;try{anon=localStorage.getItem('cb-anon');if(!anon){anon='a'+Date.now().toString(36)+Math.random().toString(36).slice(2,8);localStorage.setItem('cb-anon',anon);}}catch(_){}
  WKEY=UID||anon||SID;document.documentElement.classList.add('has-fb');
  let pref=null;if(UID){try{const p=await DB.doc('data/users/'+UID+'/prefs').get();if(p.exists)pref=p.data();}catch(_){}}
  if(!pref){try{const l=localStorage.getItem('cb-telemetry');if(l)pref={telemetry:l==='1'};}catch(_){}}
  if(pref&&typeof pref.telemetry==='boolean')T.on=pref.telemetry;else if(OWNER)T.on=true;else showConsent();}
 else markSave('local');
 render();}catch(_){markSave('local');}})();
render();
