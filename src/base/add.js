/* ============ add a job: bring in, read, check ============ */
const KNOWN={'Repose Gray':'#CCC9C0','Agreeable Gray':'#D1CBC1','Extra White':'#F1F0EC','Pure White':'#F2F0EA','Naval':'#2F3B4C','Sea Salt':'#CDD5CA','Iron Ore':'#434341','Alabaster':'#EDEAE0','Tricorn Black':'#2F2F30','Urbane Bronze':'#54504A','Accessible Beige':'#D1C7B8','Snowbound':'#EFEDE8','Mindful Gray':'#BCB7AD','Dover White':'#F0EADC','Swiss Coffee':'#EEE9DF','Chantilly Lace':'#F4F4F0','Hale Navy':'#434C56','Revere Pewter':'#CCC7B9'};
const hashColor=n=>{let h=0;for(const c of n)h=(h*31+c.charCodeAt(0))%360;return `hsl(${h} 18% 72%)`;};
const MARK={client:'client',area:'area',built:'lead',hours:'hours',deadline:'due',earliest:'start',value:'value',hoa:'hoa',lang:'lang',important:'vip',drywall:'drywall',prep:'prep',cutin:'cutin',spray:'spray',color:'color',type:'type'};
const SAMPLES={
 morales:{file:'Morales_Proposal_4188.pdf',kind:'file',text:`${COMPANY.toUpperCase()} PROPOSAL #4188
Client: Luis & Carmen Morales
Property: 6410 SW 58 Pl, South Miami, FL
Prepared by: Dana R. | Date: Oct 21, 2026 | Status: SOLD, deposit received Oct 23
Home: two-story CBS/stucco, built 1968, approx. 2,400 sq ft
SCOPE OF WORK, EXTERIOR
1. Pressure wash all stucco, soffits and driveway pavers.
2. Repair hairline stucco cracks; fill and texture-match at garage corner.
3. Body: 2 coats elastomeric, sprayed and back-rolled, Agreeable Gray SW 7029.
4. Trim, fascia, garage door: 2 coats SW Duration, Extra White SW 7006.
5. Front door: Naval SW 6244, semi-gloss.
Labor: 96 hrs | Materials: $2,140 | Total: $11,350
NOTES: Owners speak Spanish at home; Carmen prefers WhatsApp in Spanish. Earliest start Nov 2 (paint on order). Must be finished by Nov 20, family arriving for Thanksgiving. Dogs in backyard, keep side gate closed.`},
 nguyen:{file:'Nguyen_Estimate_4191.docx',kind:'file',text:`Estimate 4191, Nguyen Residence
Customer: Thao Nguyen, 1120 Alhambra Cir, Coral Gables
Sold Oct 22, 2026. Deposit paid.
Year built: 1951 (plaster walls)
INTERIOR SCOPE
- Living room, dining room, hallway, 3 bedrooms: walls 2 coats, ceilings 1 coat
- Repair plaster cracks in hallway and dining room ceiling
- All trim and 9 doors: sand, prime, 2 coats semi-gloss
- Kitchen cabinets NOT included
Colors: walls Sea Salt SW 6204, ceilings Pure White, trim Extra White
Customer is very particular about cut lines. Works from home, needs crew out by 4pm daily.
Hours: 72 | Price: $10,900
Needs to be completed by Nov 13.`},
 feld:{file:'PaintScout #4195',kind:'ps',ps:{client:'Marcy Feld',area:'Kendall',value:7600,sold:'Oct 24'},human:{hours:44,earliest:'2026-11-02',by:'Dana R.'},text:`Proposal #4195, Feld Kitchen
Client: Marcy Feld, 9030 SW 92 Ave, Kendall. Built 1999.
Cabinets: 30 doors, 12 drawer fronts, boxes and crown. Degrease, scuff sand, bonding primer, spray 2 coats Emerald Urethane, color Iron Ore. Doors sprayed in shop.
Fine color and detail work expected, client is an interior designer and refers a lot of work.
Labor 44 hrs. Total $7,600. Start any time after Nov 2. Wants it done by Nov 13.`}};
SAMPLES.morales2={...SAMPLES.morales,file:'PaintScout #4188',kind:'ps',ps:{client:'Luis & Carmen Morales',area:'South Miami',value:11350,sold:'Oct 23'},human:{hours:96,earliest:'2026-11-02',by:'Dana R.'}};
SAMPLES.nguyen2={...SAMPLES.nguyen,file:'PaintScout #4191',kind:'ps',ps:{client:'Thao Nguyen',area:'Coral Gables',value:10900,sold:'Oct 22'},human:{hours:72,by:'Dana R.'}};
GEO['South Miami']=GEO['South Miami'];
const freshAdd=()=>({tab:'upload',stage:'pick',steps:[],method:null,text:'',file:null,err:null,draft:null,paste:'',pick:null,ps:null,human:null});
S.add=freshAdd();
let SAMPLER=null;(async()=>{try{if(window.claude&&window.claude.use)SAMPLER=await window.claude.use('sample');}catch(_){}})();
async function readPdf(file){await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');const lib=window.pdfjsLib;lib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
 const pdf=await lib.getDocument({data:await file.arrayBuffer()}).promise;let out='';for(let p=1;p<=Math.min(pdf.numPages,12);p++){const tc=await (await pdf.getPage(p)).getTextContent();out+=tc.items.map(i=>i.str+(i.hasEOL?'\n':' ')).join('')+'\n';}return out;}
async function readDocx(file){await loadScript('https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js');return (await window.mammoth.extractRawText({arrayBuffer:await file.arrayBuffer()})).value;}
function ruleRead(text){const t=text.replace(/\r/g,'');const ev={},o={};const m=(re,k)=>{const r=t.match(re);if(r&&k&&!ev[k])ev[k]=r[0].trim();return r;};
 let r=m(/(?:Client|Customer)\s*:\s*([^\n,|]+)/i,'client');o.client=r?r[1].trim():((t.match(/([A-Z][a-z]+)\s+[Rr]esidence/)||[])[1]||null);
 o.area=AREAS.concat(['South Miami','Westchester','Homestead','Miami Beach','Pompano Beach']).find(a=>new RegExp(a,'i').test(t))||null;if(o.area)m(new RegExp(o.area,'i'),'area');
 const cab=/cabinet/i.test(t)&&!/cabinets?\s+not\s+included/i.test(t);
 o.type=cab?'cabinets':/wallpaper/i.test(t)?'wallpaper':/\b(HOA common|condo|office|commercial)\b/i.test(t)?'commercial':/venetian|faux|decorative/i.test(t)?'decorative':/exterior|stucco|fascia|soffit|siding/i.test(t)?'exterior':'interior';
 r=m(/(?:built|year built)\s*:?\s*(?:in\s*)?(\d{4})/i,'built');o.built=r?+r[1]:null;
 r=m(/(\d{2,4})\s*(?:labor\s*)?(?:hrs|hours)\b/i,'hours')||m(/(?:labor|hours)\s*:?\s*(\d{2,4})/i,'hours');o.hours=r?+r[1]:null;
 r=m(/(?:total|price)\s*:?\s*\$\s?([\d,]+)/i,'value');o.value=r?+r[1].replace(/,/g,''):null;
 const mon={oct:'10',nov:'11',dec:'12'};
 r=m(/(?:by|before)\s+(Oct|Nov|Dec)[a-z]*\.?\s+(\d{1,2})/i,'deadline');o.deadline=r?`2026-${mon[r[1].toLowerCase()]}-${r[2].padStart(2,'0')}`:null;
 r=m(/(?:earliest start|start any time after|start after|starting)\s*:?\s*(Oct|Nov|Dec)[a-z]*\.?\s+(\d{1,2})/i,'earliest');o.earliest=r?`2026-${mon[r[1].toLowerCase()]}-${r[2].padStart(2,'0')}`:null;
 const sk={drywall:/plaster|drywall|skim|crack/i,prep:/pressure[- ]wash|patch|prep|degrease|sand\b|repair/i,cutin:/cut lines|cut-in|crisp/i,spray:/\bspray/i,color:/color and detail|color match|particular|designer|fine finish/i};
 o.skills=Object.keys(sk).filter(k=>m(sk[k],k));
 o.lang=/creole|kreyòl/i.test(t)?'ht':/spanish/i.test(t)?'es':'en';if(o.lang!=='en')m(/spanish|creole/i,'lang');
 o.hoa=!!m(/\bHOA\b/i,'hoa');
 r=m(/\brefer\w*[^.\n]*|\bVIP\b[^.\n]*|returning client[^.\n]*|repeat client[^.\n]*/i,'important');o.important=r?r[0].trim():null;
 o.colors=Object.keys(KNOWN).filter(n=>new RegExp(n,'i').test(t)).map(n=>({name:n}));
 const ln=(o.client||'New').split(/[ &]/).filter(Boolean).pop();o.title=`${ln} ${o.type==='cabinets'?'cabinets':o.type}`;o.evidence=ev;return o;}
async function aiRead(text,image){const prompt=`You read painting contractor estimates for a crew scheduling tool. Today is Sunday Oct 25, 2026.
Reply with only one JSON object like this example:
{"title":"Morales exterior","client":"Luis & Carmen Morales","area":"South Miami","type":"exterior","built":1968,"hours":96,"value":11350,"earliest":"2026-11-02","deadline":"2026-11-20","colors":[{"name":"Agreeable Gray"}],"skills":["prep","spray"],"lang":"es","hoa":false,"important":null,"evidence":{"client":"quote","built":"quote","hours":"quote","deadline":"quote","prep":"quote"}${image?',"sourceText":"full text you read"':''}}
Rules: type is one of ${dimsOf('job').map(d=>d.k).join(', ')}. skills uses only ${dimsOf('skill').map(d=>`${d.k} (${d.l})`).join(', ')}. lang is en, es or ht (Haitian Creole). hours = labor hours. value = total sold price. Dates YYYY-MM-DD in 2026, null if not stated. important = short reason if repeat, referral source, VIP or designer, else null. evidence: exact 2 to 12 word quotes from the estimate for each field you found.
${image?'The estimate is in the attached image.':'ESTIMATE:\n"""\n'+text.slice(0,12000)+'\n"""'}`;
 return await SAMPLER.json(prompt,{modelTier:'quick',...(image?{images:[image]}:{})});}
function toDraft(o,text,method,smp){const rr=ruleRead(text||'');const pick=k=>o&&o[k]!=null&&o[k]!==''?o[k]:rr[k];const ev={...(rr.evidence||{}),...((o&&o.evidence)||{})};const src={};
 const d={title:pick('title')||'New job',client:pick('client')||'',area:pick('area')||'',type:dimsOf('job').some(x=>x.k===pick('type'))?pick('type'):'interior',built:pick('built'),hours:pick('hours'),value:pick('value'),
  earliest:isoToIdx(pick('earliest'),19),deadline:isoToIdx(pick('deadline'),27),colors:(pick('colors')||[]).map(c=>[c.name||String(c),KNOWN[c.name]||hashColor(c.name||String(c))]).slice(0,4),
  skills:(pick('skills')||[]).filter(k=>dimsOf('skill').some(x=>x.k===k)),lang:['en','es','ht'].includes(pick('lang'))?pick('lang'):'en',hoa:!!pick('hoa'),impOn:!!pick('important'),important:pick('important')||'',labels:[],ev,method,sig0:{}};
 const has=k=>!!ev[k];const aiOr=(k,v)=>v!=null&&v!==''?(has(k)?'ai':'guessed'):'missing';
 ['client','area','built','hours','value','earliest','deadline'].forEach(k=>src[k]=aiOr(k,d[k]));src.type=has('type')?'ai':'guessed';src.lang=d.lang!=='en'?'ai':'guessed';
 if(smp&&smp.ps){Object.entries(smp.ps).forEach(([k,v])=>{if(k in d){d[k]=v;src[k]='ps';}});}
 if(smp&&smp.human){Object.entries(smp.human).forEach(([k,v])=>{if(k==='by')return;d[k]=k==='earliest'||k==='deadline'?isoToIdx(v,27):v;src[k]='human';});}
 if(d.earliest==null)d.earliest=2;if(d.deadline==null)d.deadline=Math.min(27,d.earliest+15);if(d.hoa)d.labels.push('HOA');
 d.src=src;return d;}
function markText(text,ev){const t=text.replace(/\[/g,'(').replace(/\]/g,')').slice(0,3000);
 const spans=Object.entries(ev||{}).map(([k,q])=>[MARK[k]||k,String(q||'').replace(/\[/g,'(').replace(/\]/g,')')]).filter(([k,q])=>k&&q).map(([k,q])=>[k,q,t.indexOf(q)]).filter(x=>x[2]>=0).sort((a,b)=>a[2]-b[2]);
 let out='',pos=0;spans.forEach(([k,q,i])=>{if(i<pos)return;out+=t.slice(pos,i)+`[${k}|${q}]`;pos=i+q.length;});return out+t.slice(pos);}
function jobFromDraft(d,id){return{id,title:d.title||'New job',client:d.client||'New client',area:d.area||'Miami',type:d.type,ext:d.type==='exterior',built:+d.built||2000,hours:Math.max(4,+d.hours||8),value:+d.value||0,
 earliest:+d.earliest,deadline:+d.deadline,lang:d.lang,hoa:!!d.hoa,skills:d.skills.slice(),labels:d.labels.slice(),sig:{...(d.sig0||{}),manual:d.impOn?(d.important||'Flagged as important'):null},
 colors:d.colors.length?d.colors:[['Color TBD','#D9D9D4']],colorsOk:d.colors.length>0,photos:0,past:null,srcs:{...d.src},
 writeup:S.add.marked||markText(S.add.text,d.ev),src:`${S.add.file||'Estimate'} · added ${stamp()} · ${d.method==='claude'?'read by Riley':'read with built-in rules'}`};}
async function ingest(src){const A=S.add;A.stage='reading';A.err=null;A.method=null;
 A.steps=[['Reading the file','run'],[SAMPLER?'Riley is pulling out scope, dates and rules':'Pulling out scope, dates and rules','wait'],['Checking which crews can do it','wait']];render();
 let text='',image=null,smp=null;
 try{if(src.sample){smp=SAMPLES[src.sample];text=smp.text;A.file=smp.file;await new Promise(r=>setTimeout(r,450));}
  else if(src.paste){text=src.paste;A.file='Pasted text';}
  else{const f=src.file;A.file=f.name;const n=f.name.toLowerCase();if(n.endsWith('.pdf'))text=await readPdf(f);else if(n.endsWith('.docx'))text=await readDocx(f);else if(/^image\//.test(f.type))image=f;else text=await f.text();}
  if(!image&&text.trim().length<20)throw{code:'empty'};}
 catch(e){A.steps[0][1]='fail';A.err=e&&e.code==='empty'?'We couldn’t find any text in that file. If it’s a scan, upload a photo or paste the text.':'We couldn’t open that file. Try a PDF, Word file or text, or paste the text.';render();return;}
 A.steps[0][1]='done';A.steps[1][1]='run';render();let o=null;
 if(SAMPLER){try{const lim=image?await SAMPLER.limits().catch(()=>null):null;if(image&&!(lim&&lim.images))throw{code:'img'};o=await aiRead(text,image);if(image&&o&&o.sourceText)text=String(o.sourceText);A.method='claude';}
  catch(e){o=null;if(image){A.steps[1][1]='fail';A.err='Reading photos needs Claude, which isn’t available here. Upload a PDF or paste the text.';render();return;}}}
 else if(image){A.steps[1][1]='fail';A.err='Reading photos needs Claude, which isn’t available here. Upload a PDF or paste the text.';render();return;}
 if(!o)A.method='rules';A.text=text;A.ps=smp&&smp.ps||null;A.human=smp&&smp.human||null;A.draft=toDraft(o,text,A.method,smp);A.steps[1][1]='done';A.steps[2][1]='run';render();
 await new Promise(r=>setTimeout(r,300));A.steps[2][1]='done';A.stage='review';render();window.scrollTo(0,0);}
function draftPreview(){const d=S.add.draft;JOBS.__draft=jobFromDraft(d,'__draft');let r=[];try{r=rank('__draft');}finally{delete JOBS.__draft;}return r;}
function miniCal(k,d){const sel=d[k];const B=bookings();const weeks=[];for(let i=0;i<25;i+=5)weeks.push(DL.slice(i,i+5).map((x,j)=>i+j));
 const free=i=>i<20?activeCrews().filter(ready).filter(c=>occ(B,c.id,i)===0).length:null;
 return `<div class="minical" role="group" aria-label="Pick a date"><div class="mc-h"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span></div>
  ${weeks.map(w=>`<div class="mc-r">${w.map(i=>{const f=free(i);const bad=k==='deadline'&&i<d.earliest||k==='earliest'&&i>d.deadline;return `<button class="mc-d ${i===sel?'on':''} ${bad?'dim':''}" data-act="mcpick" data-k="${k}" data-v="${i}" aria-label="${dlabel(i)}${f!=null?', '+f+' ready crews free':''}"><b>${DL[i].n}</b><small>${DL[i].n<=5||i===0?DL[i].m:''}</small>${f!=null?`<em class="${f<=1?'lo':''}">${f} free</em>`:''}</button>`;}).join('')}</div>`).join('')}
  <div class="tiny" style="margin-top:6px">“Free” = ready crews with an open day. Weekends hidden.</div></div>`;}
V.add=()=>{const A=S.add;const ed=!!A.editId;
 const head=`<button class="back" data-go="${ed?'match':'queue'}">← ${ed?'Back to crew ranking':'Ready to schedule'}</button>
 <div class="mhead"><div class="grow"><div class="eyebrow">${ed?'Edit job':'Add a job'}</div><h1>${ed?'Edit job details':A.stage==='review'?'Check what we found':'Bring in the estimate'}</h1>
  ${ed?'':`<div class="steps">${['Bring it in','Read it','Check it'].map((s,i)=>{const cur=A.stage==='pick'?0:A.stage==='reading'?1:2;return `<span class="stp ${i<cur?'done':i===cur?'on':''}"><i>${i<cur?'✓':i+1}</i>${s}</span>`;}).join('')}</div>`}</div>${fbBtn('add')}</div>`;
 if(A.stage==='pick'){const tabs=[['upload','Upload a file'],['paste','Paste text'],['paintscout','From PaintScout'],['email','Email it in']];let body='';
  if(A.tab==='upload')body=`<label class="drop" id="drop" for="file"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--tape)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/></svg>
   <b>Drop the estimate here, or choose a file</b><span class="small muted">PDF or Word export, a text file, or a photo of a paper estimate</span><span class="tiny">.pdf · .docx · .txt · .jpg · .png</span></label><input type="file" id="file" accept=".pdf,.docx,.txt,.md,.csv,image/png,image/jpeg,image/webp" hidden>
   <div class="row" style="margin-top:14px;flex-wrap:wrap"><span class="small muted">No file handy? Try one:</span>${['morales','nguyen'].map(k=>`<button class="btn sm line" data-ax="sample" data-v="${k}">${SAMPLES[k].file}</button>`).join('')}</div>`;
  if(A.tab==='paste')body=`<label class="small muted" for="paste">Paste the estimate or write-up</label><textarea id="paste" class="in" rows="10" style="margin-top:6px;resize:vertical" placeholder="Client, address, scope, hours, price, dates, notes…">${esc(A.paste)}</textarea><div class="row" style="margin-top:12px"><button class="btn tape" data-ax="paste">Read it</button></div>`;
  if(A.tab==='paintscout')body=`<div class="row" style="margin-bottom:10px"><span class="chip good">Connected</span><span class="small muted grow">Sold estimates from the last 7 days. Fields people typed in PaintScout come along and are marked.</span></div>
   ${[['morales2','#4188','Morales exterior','South Miami','$11,350','Sold Oct 23'],['nguyen2','#4191','Nguyen interior','Coral Gables','$10,900','Sold Oct 22'],['feld','#4195','Feld kitchen cabinets','Kendall','$7,600','Sold Oct 24']].map(([k,n,t,a,v,s])=>`<div class="row" style="padding:10px 0;border-top:1px solid var(--line)"><span class="tiny num" style="width:46px">${n}</span><div class="grow"><b>${t}</b><div class="small muted">${a} · ${v} · ${s}</div></div><button class="btn sm line" data-ax="sample" data-v="${k}">Import</button></div>`).join('')}`;
  if(A.tab==='email')body=`<p class="small muted" style="margin-top:0">Forward the sold estimate to this address. It lands in Ready to schedule within a minute, already read.</p><div class="row" style="background:var(--sunk);border-radius:10px;padding:12px 14px"><code id="addr" style="font-size:14.5px;user-select:all" class="grow">estimates@ppp.crewboard.app</code><button class="btn sm line" data-ax="copy">Copy</button></div>`;
  return head+`<section class="card pad" style="max-width:760px"><div class="seg" role="group" aria-label="Source" style="margin-bottom:16px">${tabs.map(([k,l])=>`<button aria-pressed="${A.tab===k}" data-ax="tab" data-v="${k}">${l}</button>`).join('')}</div>${body}</section>
   <section class="card pad" style="max-width:760px;margin-top:14px"><h3 style="font-size:16px;margin-bottom:6px">What we pull out</h3><div class="chips">${['Client and area','Job type','Year built (lead-safe)','Crew hours and painter days','Sold price','Start and finish dates','Skills needed','Colors','Client’s language','HOA rules','Important client'].map(x=>`<span class="chip">${x}</span>`).join('')}</div>
   <p class="tiny" style="margin:10px 0 0">Every field shows where it came from: PaintScout, typed by a person, or read from the estimate. ${SAMPLER?'Riley reads the estimate.':'Read with built-in rules here. In claude.ai, Riley reads it, including photos.'}</p></section>`;}
 if(A.stage==='reading')return head+`<section class="card pad" style="max-width:620px"><div class="row" style="margin-bottom:12px"><span class="chip">${esc(A.file||'')}</span></div><ol class="prog">${A.steps.map(([l,s])=>`<li class="${s}"><i>${s==='done'?'✓':s==='fail'?'×':''}</i>${l}</li>`).join('')}</ol>
  ${A.err?`<div class="check no" style="margin-top:10px"><i>×</i><span>${A.err}</span></div><div class="row" style="margin-top:12px"><button class="btn line sm" data-ax="restart">Try another file</button><button class="btn line sm" data-ax="topaste">Paste the text instead</button></div>`:''}</section>`;
 const d=A.draft;const R=draftPreview();const ok=R.filter(r=>r.ok);const wu=esc(A.marked||markText(A.text,d.ev)).replace(/\[(\w+)\|([^\]]+)\]/g,(m,k,t)=>`<mark data-k="${k}">${t}</mark>`);
 const fld=(k,label,input,mk)=>`<div class="fld" data-k="${mk||MARK[k]||k}"><span class="small muted">${label}</span><span>${input}</span>${srcChip(d.src[k])||'<span></span>'}</div>`;
 const missing=!d.hours||!d.area;const auto=impWhy({sig:d.sig0||{},value:+d.value||0});
 const dateFld=(k,label)=>fld(k,label,`<button class="in datebtn" data-act="mcopen" data-v="${k}" aria-expanded="${A.pick===k}">${ICON.cal}<span>${dlabel(d[k])}</span></button>${A.pick===k?miniCal(k,d):''}`,k==='deadline'?'due':'start');
 return head+`<div class="split addsplit">
 <div class="lcol">${A.ps||A.human?`<section class="card pad"><h3 style="font-size:16px;margin-bottom:6px">From PaintScout</h3>
  ${A.ps?`<div class="hr"><span class="src-chip src-ps">PaintScout</span><span class="small grow">Client, area, sold price${A.ps.sold?`, sold ${A.ps.sold}`:''}</span></div>`:''}
  ${A.human?`<div class="hr"><span class="src-chip src-h">Typed by ${esc(A.human.by)}</span><span class="small grow">${Object.keys(A.human).filter(k=>k!=='by').map(k=>k==='hours'?`Crew hours: ${A.human.hours}`:k==='earliest'?`Start window: after ${dlabel(isoToIdx(A.human.earliest))}`:k).join(' · ')}</span></div>`:''}
  <p class="tiny" style="margin:6px 0 0">People’s entries win over what’s read from the estimate text.</p></section>`:''}
 <section class="card pad"><div class="src">${esc(A.file||'')} · ${A.method==='claude'?'read by Riley':'read with built-in rules'}</div><h3 style="font-size:16px;margin-bottom:8px">The estimate</h3>
  <p class="writeup" style="margin:0;white-space:pre-line">${wu}</p><p class="tiny" style="margin:10px 0 0">Underlined text is where each field came from. Hover a field to find it.</p></section></div>
 <div style="display:flex;flex-direction:column;gap:14px">
 <section class="card pad"><div class="row"><h3 style="font-size:16px" class="grow">The job</h3><span class="srclegend">${['ps','human','ai','guessed','missing'].map(srcChip).join('')}</span></div>
  ${fld('title','Job name',`<input class="in" data-dk="title" value="${esc(d.title)}" id="d-title">`,'type')}
  ${fld('client','Client',`<input class="in" data-dk="client" value="${esc(d.client)}" id="d-client">`)}
  ${fld('area','Area',`<select class="in" data-dk="area" id="d-area"><option value="">Choose…</option>${Object.keys(GEO).map(a=>`<option ${d.area===a?'selected':''}>${a}</option>`).join('')}</select>`)}
  ${fld('type','Job type',`<select class="in" data-dk="type" id="d-type">${dimsOf('job').map(x=>`<option value="${x.k}" ${d.type===x.k?'selected':''}>${x.l}</option>`).join('')}</select>`,'ext')}
  ${fld('built','Year built',`<input class="in num" type="number" data-dk="built" value="${d.built||''}" id="d-built" placeholder="e.g. 1974">${+d.built&&+d.built<1978?'<span class="tiny" style="display:block;margin-top:3px">Before 1978: lead-safe painter required</span>':''}`)}
  ${fld('hours','Crew hours',`<input class="in num" type="number" data-dk="hours" value="${d.hours||''}" id="d-hours" placeholder="Needed to schedule">${d.hours?`<span class="tiny" style="display:block;margin-top:3px">${Math.round(d.hours/8*10)/10} painter days</span>`:''}`)}
  ${fld('value','Sold price',`<input class="in num" type="number" data-dk="value" value="${d.value||''}" id="d-value" placeholder="$">`)}
  ${dateFld('earliest','Earliest start')}${dateFld('deadline','Finish by')}
  ${fld('lang','Client’s language',`<select class="in" data-dk="lang" id="d-lang">${Object.entries(LANGS).map(([k,l])=>`<option value="${k}" ${d.lang===k?'selected':''}>${l}</option>`).join('')}</select>`,'lang')}</section>
 <section class="card pad"><div class="row"><h3 style="font-size:16px" class="grow">Skills this job needs</h3><span class="tiny">Tap to turn on or off</span></div>
  <div class="chips" style="margin-top:10px">${dimsOf('skill').map(x=>`<button class="skc ${d.skills.includes(x.k)?'must':''}" data-ax="sk" data-v="${x.k}" data-k="${x.k}" aria-pressed="${d.skills.includes(x.k)}">${d.skills.includes(x.k)?'✓ ':''}${x.l}</button>`).join('')}</div>
  <div class="row" style="margin-top:14px"><h3 style="font-size:16px" class="grow">Labels</h3><span class="tiny">From your admin’s list</span></div>
  <div class="chips" style="margin-top:8px">${JOB_LABELS.map(l=>`<button class="skc ${d.labels.includes(l)?'nice':''}" data-ax="jl" data-v="${esc(l)}" aria-pressed="${d.labels.includes(l)}">${esc(l)}</button>`).join('')}</div>
  <div class="hr" style="margin-top:8px" data-k="hoa"><span class="grow">HOA work-hour rules</span><button class="tog ${d.hoa?'on':''}" data-ax="flag" data-v="hoa" role="switch" aria-checked="${d.hoa}" aria-label="HOA rules"><i></i></button></div>
  <div class="hr" data-k="vip"><span class="grow">${ed?'Flag as important':'Important client'}${auto.length?`<span class="tiny" style="display:block">Already important: ${esc(auto.join(', '))}</span>`:''}${d.impOn?`<input class="in" data-dk="important" id="d-imp" value="${esc(d.important)}" placeholder="Why it matters" style="margin-top:6px">`:''}</span><button class="tog ${d.impOn?'on':''}" data-ax="flag" data-v="impOn" role="switch" aria-checked="${d.impOn}" aria-label="Important client"><i></i></button></div>
  ${d.colors.length?`<div class="row" style="margin-top:10px;flex-wrap:wrap">${d.colors.map(([n,c])=>`<span class="chip" style="background:var(--sunk)"><span style="width:12px;height:12px;border-radius:3px;background:${c};border:1px solid var(--line)"></span>${esc(n)}</span>`).join('')}</div>`:''}</section>
 <section class="card pad" style="border:2px solid var(--tape)"><div class="row"><h3 style="font-size:16px" class="grow">Crews that could take it</h3><span class="tiny">Match score out of 100</span></div>
  ${ok.slice(0,3).map(r=>`<div class="row" style="padding:7px 0;border-top:1px solid var(--line);margin-top:6px">${crewDot(r.crew)}<b class="grow">${esc(crewById(r.crew).name)}</b><span class="small muted">starts ${dlabel(r.slot.s)}</span><span class="chip tape num" title="Match score">match ${r.score}</span></div>`).join('')||'<div class="small muted" style="margin-top:8px">No crew passes the rules yet. Check the job type and dates.</div>'}
  <div class="tiny" style="margin-top:6px">${R.filter(r=>r.needsRating).length} more crews aren’t rated for ${dimL(d.type).toLowerCase()} yet.</div>
  <div class="row" style="margin-top:14px;flex-wrap:wrap">${ed?`<button class="btn tape" data-ax="savejob" ${missing?'disabled':''}>Save changes</button><button class="btn line" data-ax="canceledit">Cancel</button>`:`<button class="btn tape" data-ax="addjob" ${missing?'disabled':''}>Add to queue and find a crew</button><button class="btn line" data-ax="restart">Start over</button>`}</div>
  ${missing?'<div class="tiny" style="margin-top:8px">Add the crew hours and area to continue.</div>':''}</section></div></div>`;};
function jobToDraft(j){const src={...(j.srcs||{})};['client','area','built','hours','value','earliest','deadline','type','lang'].forEach(k=>{if(!src[k])src[k]='ai';});const {manual,...sig0}=j.sig||{};
 return{title:j.title,client:j.client,area:j.area,type:j.type,built:j.built,hours:j.hours,value:j.value,earliest:j.earliest,deadline:j.deadline,colors:j.colors.map(c=>c.slice()),skills:j.skills.slice(),labels:j.labels.slice(),lang:j.lang,hoa:!!j.hoa,impOn:!!manual,important:manual||'',sig0,ev:{},src,method:'claude'};}
function openEdit(jid){const j=JOBS[jid];S.add={...freshAdd(),stage:'review',method:'claude',text:j.writeup.replace(/\[(\w+)\|([^\]]+)\]/g,'$2'),marked:j.writeup,file:j.src,draft:jobToDraft(j),editId:jid};S.view='add';render();window.scrollTo(0,0);}
document.addEventListener('click',async e=>{const b=e.target.closest('[data-ax]');if(!b||b.disabled)return;const a=b.dataset.ax,v=b.dataset.v;const A=S.add;
 switch(a){
 case 'tab':A.tab=v;render();break;
 case 'sample':ingest({sample:v});break;
 case 'paste':{const t=(document.getElementById('paste')||{}).value||'';A.paste=t;if(t.trim().length<20){toast('Paste a bit more of the estimate first');break;}ingest({paste:t});break;}
 case 'copy':try{await navigator.clipboard.writeText('estimates@ppp.crewboard.app');toast('Address copied');}catch(_){toast('Select the address and copy it with your keyboard');}break;
 case 'restart':S.add={...freshAdd(),tab:A.tab};render();break;
 case 'topaste':S.add={...freshAdd(),tab:'paste'};render();break;
 case 'sk':{const d=A.draft;d.skills=d.skills.includes(v)?d.skills.filter(x=>x!==v):[...d.skills,v];render();break;}
 case 'jl':{const d=A.draft;d.labels=d.labels.includes(v)?d.labels.filter(x=>x!==v):[...d.labels,v];render();break;}
 case 'flag':A.draft[v]=!A.draft[v];render();break;
 case 'savejob':{const d=A.draft;const id=A.editId;const old=JOBS[id];const nj=jobFromDraft(d,id);
  const fmt=(k,x)=>k==='earliest'||k==='deadline'?dlabel(x):k==='value'?money(x):k==='type'?dimL(x):k==='lang'?LANGS[x]:x;const ch=[];
  [['title','Job name'],['client','Client'],['area','Area'],['type','Job type'],['hours','Hours'],['value','Price'],['built','Year built'],['earliest','Earliest start'],['deadline','Finish by'],['lang','Language']].forEach(([k,l])=>{if(String(old[k])!==String(nj[k]))ch.push(`${l} ${fmt(k,old[k])} → ${fmt(k,nj[k])}`);});
  if(old.skills.join()!==nj.skills.join())ch.push(`skills now ${nj.skills.map(dimL).join(', ')||'none'}`);if(old.labels.join()!==nj.labels.join())ch.push(`labels now ${nj.labels.join(', ')||'none'}`);
  if(!!old.hoa!==nj.hoa)ch.push(nj.hoa?'HOA rules on':'HOA rules off');if((old.sig.manual||null)!==(nj.sig.manual||null))ch.push(nj.sig.manual?`flagged important: ${nj.sig.manual}`:'removed the important flag');
  JOBS[id]={...nj,past:old.past,writeup:old.writeup,src:old.src,photos:old.photos,colorsOk:old.colorsOk};
  if(S.place[id]){const p=S.place[id];setPlace(id,p.crew,pS(p),p.status,true);}
  if(ch.length)log('Edit',`Edited ${nj.title}: ${ch.join('; ')}.`,nj.title);
  S.add=freshAdd();S.job=id;S.view='match';render();window.scrollTo(0,0);toast(ch.length?`${plural(ch.length,'change')} saved. Crews re-ranked`:'No changes');break;}
 case 'canceledit':{const id=A.editId;S.add=freshAdd();S.job=id;S.view='match';render();break;}
 case 'addjob':{const d=A.draft;const id='j'+Date.now().toString(36);JOBS[id]=jobFromDraft(d,id);QORDER.unshift(id);
  log('Import',`${JOBS[id].title} added from ${A.file||'an estimate'}, ${A.method==='claude'?'read by Riley':'read with built-in rules'} and checked by ${ME()}.`,JOBS[id].title);
  S.add=freshAdd();S.job=id;S.view='match';render();window.scrollTo(0,0);toast(`${JOBS[id].title} added to the queue`);break;}
 }});
document.addEventListener('input',e=>{const t=e.target;if(t.dataset.dk&&S.add.draft){const k=t.dataset.dk;let v=t.value;if(['built','hours','value'].includes(k))v=v===''?null:+v;const d=S.add.draft;d[k]=v;
  if(d.src&&k in d.src)d.src[k]=S.add.editId?'edited':(v!=null&&v!==''?'edited':'missing');
  if(t.tagName==='SELECT'||['built','hours','area'].includes(k)){const id=t.id;render();const el=document.getElementById(id);if(el&&t.tagName!=='SELECT'){el.focus();const L=el.value.length;try{el.setSelectionRange(L,L);}catch(_){}}}}
 if(t.id==='paste')S.add.paste=t.value;});
document.addEventListener('change',e=>{const t=e.target;if(t.id==='file'&&t.files&&t.files[0])ingest({file:t.files[0]});});
document.addEventListener('dragover',e=>{const d=e.target.closest&&e.target.closest('#drop');if(d){e.preventDefault();d.classList.add('over');}});
document.addEventListener('dragleave',e=>{const d=e.target.closest&&e.target.closest('#drop');if(d)d.classList.remove('over');});
document.addEventListener('drop',e=>{const d=e.target.closest&&e.target.closest('#drop');if(d){e.preventDefault();d.classList.remove('over');const f=e.dataTransfer.files[0];if(f)ingest({file:f});}});
