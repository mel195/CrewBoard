
/* ============ dates ============ */
const DOW=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const DL=[];(()=>{const d=new Date(2026,9,26);while(DL.length<42){const w=d.getDay();if(true)DL.push({dow:DOW[w],m:d.toLocaleString('en-US',{month:'short'}),n:d.getDate(),mi:d.getMonth(),date:new Date(d),iso:`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`});d.setDate(d.getDate()+1);}})();
const DAYS=DL.slice(0,28);
const w2c=i=>i+2*Math.floor(i/5);
const isWkend=i=>DL[i]&&(DL[i].dow==='Sat'||DL[i].dow==='Sun');
const dlabel=i=>DL[i]?`${DL[i].dow} ${DL[i].m} ${DL[i].n}`:'later';
const sdate=i=>DL[i]?`${DL[i].m} ${DL[i].n}`:'later';
const idxOfDate=dt=>{const t=new Date(dt.getFullYear(),dt.getMonth(),dt.getDate()).getTime();let i=DL.findIndex(x=>x.date.getTime()>=t);return i<0?DL.length-1:i;};
const isoToIdx=(iso,cap=34)=>{if(!iso)return null;const t=new Date(iso+'T12:00:00');if(isNaN(t))return null;return Math.min(cap,idxOfDate(t));};
const WX=[[0,'sun'],[10,'sun'],[20,'cloud'],[70,'rain'],[60,'rain'],[0,'sun'],[10,'sun'],[20,'cloud'],[55,'rain'],[10,'sun'],[0,'sun'],[10,'sun'],[30,'cloud'],[25,'cloud'],[50,'rain'],[0,'sun'],[10,'sun'],[20,'cloud'],[10,'sun'],[60,'rain']];
(()=>{const wk=WX.slice();WX.length=0;const extra=[[10,'sun'],[30,'cloud'],[65,'rain'],[20,'cloud'],[0,'sun'],[40,'cloud'],[10,'sun'],[15,'sun']];let e=0;for(let i=0;i<28;i++){if(isWkend(i))WX.push(extra[e++]);else WX.push(wk[i-2*Math.floor(i/7)]);}})();
const rain=i=>i<28&&WX[i][0]>=50;
const COMPANY='Precision Painting Plus';
/* ============ rating dimensions (from the crew sheet) ============ */
let DIMS=[
 {k:'interior',l:'Interior repaint',g:'job'},{k:'exterior',l:'Exterior repaint',g:'job'},{k:'cabinets',l:'Cabinets',g:'job'},{k:'commercial',l:'Commercial / HOA',g:'job'},{k:'wallpaper',l:'Wallpaper',g:'job'},{k:'decorative',l:'Decorative',g:'job'},
 {k:'drywall',l:'Drywall / skim',g:'skill'},{k:'prep',l:'Prep & repairs',g:'skill'},{k:'cutin',l:'Cut-in & finish',g:'skill'},{k:'spray',l:'Spraying',g:'skill'},{k:'color',l:'Color & detail',g:'skill'},
 {k:'speed',l:'Speed',g:'attr'},{k:'reliability',l:'Reliability',g:'attr'},{k:'quality',l:'Quality',g:'attr'},{k:'communication',l:'Communication',g:'attr'},{k:'care',l:'Jobsite care',g:'attr'},{k:'independence',l:'Independence',g:'attr'},{k:'client',l:'Client-facing',g:'attr'}];
const dimL=k=>(DIMS.find(d=>d.k===k)||{l:k}).l;
const dimsOf=g=>DIMS.filter(d=>d.g===g);
/* ============ crews (imported from crews-with-ratings.xlsx) ============ */
const RAW=[
 ['Gian','LC Gian NEW Painting MIA','Giancarlos Florida Painter','3',[5,5,5,5,null,2,3,5,5,5,5,4,5,5,5,5,5,5],'Best Crew'],
 ['Tania','Tania Painting MIA','Tania Painting Florida','6',[3.5,4,4,5,null,null,4,4,4,4,3,4,5,4,3,3,2,4],''],
 ['Johan & Dani','LC Johan Danny FL','Johan Miami','3',[4,4,null,5,null,3,1,4,4,5,5,4,5,4,5,5,5,5],''],
 ['Rigo','LC Rigoberto Cabezas FL','Rigo South Florida','2-3',[4,5,null,5,null,null,3,4,4,4,5,5,5,4,5,5,5,5],''],
 ['Paulo','LC Paulo Da Costa FL','Paolo Florida','2-4'],['Marvin','Marvin Umanzor FL','Marvin Umazor Painting','1-2'],['Cristhian','LC Cristhian Painting MIA','Cristian Miami','1-2'],
 ['Jose','LC Finish Line MIA','Jose Finish Line MIA','1-2'],['Frank','Frank MIA','Frank Painter Miami','1-2'],['Elias','LC Elias Remez MIA','Elias South Florida','2-3'],
 ['Alejandro','LC NEW Alejandro Mori MIA','Alejandro Mori NJ','2-3'],['Marcia (wallpaper)','Marcia Voto FL','Marcia Voto Wallpaper','1'],['Wonder Painting','LC Wonderpainting','Joao Wonderpainting Pompano','1-2'],
 ['Alfonso','Alfonso Skim Coat MIA','Alfonso Drywall MIA','1-2'],['Maria','LC Maria Antonio FL','Antonio Ft. Lauderdale','2-3'],['Cabinet Canvas','LC Cabinet Canvas','Cabinet Canvas','1'],
 ['Ali & Luis','LC NZ Corp Luis FL','Ali Ocampo Miami','1-2'],['Luis Venpro','LC Luis Venpro MIA','Luis Venpro Miami','1-3'],['Fabian','TBD','Fabian Painter Miami','1-2'],['Vanderlay','LC Vanderlei MIA','Wanderlay MIA','2-4'],
 ['Ido Test','Lc Ido Dotan','Unknown','']];
const SAMPLE_BASE={Gian:'Kendall',Tania:'Hialeah','Johan & Dani':'Westchester',Rigo:'Homestead',Paulo:'Fort Lauderdale',Marvin:'Miami',Cristhian:'Doral',Jose:'Miami',Frank:'Miami',Elias:'Hialeah',Alejandro:'Kendall','Marcia (wallpaper)':'Miami Beach','Wonder Painting':'Pompano Beach',Alfonso:'Miami',Maria:'Fort Lauderdale','Cabinet Canvas':'Fort Lauderdale','Ali & Luis':'Miami','Luis Venpro':'Doral',Vanderlay:'Pompano Beach'};
const COLORS=['#2F6BD8','#1F8A7A','#B8457A','#C46A2E','#7A5CC0','#6B7A2E','#2E7FA8','#A8452E','#4E6B9A','#8A6D1F','#3E8A4E','#9A4E7A','#5B6470','#A85E2E','#2E8A8A','#7A3EA8','#6A8A2E','#A82E5B','#3E5BA8','#8A4E2E','#777'];
const slug=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
function parseSize(v){if(v==null||v==='')return null;const m=String(v).match(/^(\d+)(?:\s*(?:-|to)\s*(\d+))?$/);if(!m)return null;const a=+m[1],b=m[2]?+m[2]:a;return{min:Math.min(a,b),max:Math.max(a,b)};}
let CREWS=RAW.map(([name,sf,gcal,size,r,notes],i)=>{const ratings={};DIMS.forEach((d,j)=>{ratings[d.k]=r&&r[j]!=null?r[j]:null;});
 return{id:slug(name),name,c:COLORS[i%COLORS.length],f:{sfName:sf,gcal,email:'on file',phone:'on file',status:name==='Ido Test'?'inactive':'active',size:parseSize(size),sizeFixed:/-/.test(size),base:name==='Fabian'?'':(SAMPLE_BASE[name]||''),baseSample:!!SAMPLE_BASE[name],notes:notes||'',
  languages:{Gian:'English, Spanish',Tania:'Spanish','Johan & Dani':'Spanish, Portuguese',Rigo:'Spanish'}[name]||'',leadSafe:{Gian:true,Tania:false,'Johan & Dani':false,Rigo:true}[name]},r:ratings,added:false};});
const crewById=id=>CREWS.find(c=>c.id===id);
const planSize=c=>c.f.size?c.f.size.min:null;
const sizeText=c=>!c.f.size?'Size not set':c.f.size.min===c.f.size.max?`${c.f.size.min} painter${c.f.size.min>1?'s':''}`:`${c.f.size.min} to ${c.f.size.max} painters`;
/* sample job history for crew KPIs (from Salesforce in the real product) */
const HIST={gian:{five:23,sold:410,actual:396,pay:61500,jobs:31},tania:{five:12,sold:520,actual:562,pay:78000,jobs:28},'johan-dani':{five:15,sold:300,actual:309,pay:48000,jobs:22},rigo:{five:18,sold:350,actual:343,pay:50750,jobs:25},
 paulo:{five:6,sold:180,actual:196,pay:26800,jobs:11},marvin:{five:9,sold:120,actual:118,pay:17400,jobs:14},'wonder-painting':{five:4,sold:210,actual:231,pay:30500,jobs:9},maria:{five:7,sold:150,actual:149,pay:22000,jobs:10}};
const AVG_COST=152;
/* ============ fields: required, recommended ============ */
const REQUIRED=[['status','Active or inactive'],['size','Crew size'],['base','Home base (for drive time)'],['jobRating','At least one job-type rating']];
let RECOMMENDED=[
 {k:'languages',l:'Languages',why:'Match clients who prefer Spanish or Creole',use:'factor',added:true},
 {k:'leadSafe',l:'Lead-safe (RRP) certified',why:'Required by law on homes built before 1978',use:'rule',added:true},
 {k:'pay',l:'Pay model and rate',why:'Suggest crew pay and track cost per painter day',use:'info',added:false},
 {k:'insurance',l:'Insurance expiry',why:'Stop booking crews with lapsed insurance',use:'rule',added:false},
 {k:'equipment',l:'Equipment (lift, sprayer rig)',why:'Two-story and spray jobs',use:'rule',added:false},
 {k:'maxDrive',l:'Furthest they will drive',why:'Respect each crew’s service area',use:'rule',added:false},
 {k:'maxJobsDay',l:'Jobs per day they can take',why:'Small jobs and touch-ups across the day',use:'rule',added:false}];
/* ============ places ============ */
const GEO={'Pinecrest':[25.665,-80.308],'Coral Gables':[25.721,-80.268],'Kendall':[25.687,-80.390],'South Miami':[25.707,-80.293],'Westchester':[25.748,-80.327],'Hialeah':[25.857,-80.278],'Homestead':[25.468,-80.477],'Fort Lauderdale':[26.122,-80.137],'Pompano Beach':[26.238,-80.125],'Doral':[25.819,-80.355],'Miami':[25.774,-80.193],'Miami Beach':[25.790,-80.130]};
const AREAS=['Pinecrest','Coral Gables','Kendall','South Miami','Miami','Doral','Hialeah','Fort Lauderdale'];
function driveMin(from,to){const a=GEO[from],b=GEO[to];if(!a||!b)return null;const dy=(b[0]-a[0])*111,dx=(b[1]-a[1])*100;return Math.round(Math.hypot(dx,dy)*1.3+6);}
function bearingWord(from,to){const a=GEO[from],b=GEO[to];if(!a||!b)return'';const dy=b[0]-a[0],dx=(b[1]-a[1])*0.9;if(Math.hypot(dx,dy)<0.01)return'same area';const deg=Math.atan2(dy,dx)*180/Math.PI;return ['east','northeast','north','northwest','west','southwest','south','southeast'][((Math.round(deg/45)%8)+8)%8];}
function bearingDeg(from,to){const a=GEO[from],b=GEO[to];if(!a||!b)return 0;return Math.atan2(b[0]-a[0],(b[1]-a[1])*0.9)*180/Math.PI;}
/* ============ confirmed bookings already on the calendar ============ */
let BOOKS=[
 ['gian','Delgado','Exterior',0,2,9800],['gian','Brightwater HOA, phase 2','Commercial',11,15,21000],['gian','Lopez','Interior',17,19,6200],
 ['tania','Brickell Bay condo halls','Commercial',0,4,18500],['tania','Simmons','Exterior',7,9,8900],['tania','Watts','Interior',14,16,7100],
 ['johan-dani','Chen','Interior',0,1,4100],['johan-dani','Navarro','Exterior',2,4,9400],['johan-dani','Kim','Interior',11,13,6800],
 ['rigo','Alvarez','Exterior',0,3,8800],['rigo','Ruiz','Exterior',6,9,9900],['rigo','Ortega','Exterior',12,16,11200],
 ['paulo','Weston townhomes','Exterior',2,8,16400],['marvin','Lee touch-up','Interior',1,1,600,'am'],['marvin','Ortega front door','Exterior',1,1,450,'pm'],['marvin','Castillo','Interior',5,7,5200],
 ['cristhian','Baker','Interior',0,2,4300],['cristhian','Reyes bath','Interior',9,10,1900],['jose','Gomez trim','Exterior',3,4,2600],['jose','Diaz','Interior',12,14,5100],
 ['frank','Coral Way offices','Commercial',0,5,12800],['elias','Hialeah duplex','Exterior',6,9,7600],['alejandro','Morris','Interior',1,3,3900],
 ['marcia-wallpaper','Levin powder room','Wallpaper',4,4,1200],['marcia-wallpaper','Stein dining room','Wallpaper',10,11,2400],['wonder-painting','Pompano HOA, phase 1','Commercial',0,9,24000],
 ['alfonso','Patton skim coat','Interior',2,3,2100],['alfonso','Rossi drywall patch','Interior',8,8,700,'am'],['maria','Las Olas condo','Interior',5,9,9800],['cabinet-canvas','Wu kitchen','Cabinets',3,5,5600],
 ['ali-luis','Grant','Exterior',0,1,3300],['ali-luis','Nguyen fence','Exterior',7,9,2900],['luis-venpro','Doral office','Commercial',11,15,13500],['vanderlay','Deerfield','Exterior',4,8,10200]
].map((x,i)=>({id:'b'+i,crew:x[0],name:x[1],what:x[2],s:x[3],e:x[4],value:x[5],half:x[6]||null}));
/* ============ sold jobs waiting (from PaintScout) ============ */
const JOBS={
 hernandez:{id:'hernandez',title:'Hernandez exterior',client:'Rosa & Daniel Hernandez',area:'Pinecrest',type:'exterior',ext:true,built:1974,hours:120,value:14800,earliest:5,deadline:13,lang:'es',hoa:true,
  skills:['prep','spray'],labels:['HOA','Repeat client'],colors:[['Repose Gray','#CCC9C0'],['Pure White','#F2F0EA'],['Tricorn Black','#2F2F30']],colorsOk:true,photos:14,sig:{returning:'2019 interior',referrals:5},past:'tania',
  src:'PaintScout #4127 · sold Oct 16 by Dana R.',srcs:{client:'ps',area:'ps',value:'ps',built:'ai',hours:'human',earliest:'human',deadline:'ai'},
  writeup:'Hernandez residence, Pinecrest. [ext|Two-story CBS/stucco home], [lead|built 1974]. Scope: [prep|pressure wash, patch stucco cracks at NE corner, prime patches]; [spray|two coats elastomeric on body] (Loxon XP, Repose Gray); trim and fascia in Pure White; front door Tricorn Black. Second-story eaves need a 28 ft ladder or lift. Colors HOA-approved Oct 16; [hoa|HOA allows work Mon to Fri, 8am to 5pm only]. [lang|Mrs. Hernandez prefers updates in Spanish]. [due|Hosting a wedding Nov 14, wants everything done by Nov 12]. [hours|Est. 120 labor hours]. [vip|Returning client (2019 interior), has referred 5 jobs].'},
 okafor:{id:'okafor',title:'Okafor trim & door',client:'James Okafor',area:'Pinecrest',type:'exterior',ext:true,built:1988,hours:18,value:2400,earliest:1,deadline:6,lang:'en',hoa:false,skills:['cutin','color'],labels:[],
  colors:[['Urbane Bronze','#54504A'],['Extra White','#F1F0EC']],colorsOk:true,photos:6,sig:{},src:'PaintScout #4133 · sold Oct 20 by Dana R.',srcs:{client:'ps',area:'ps',value:'ps',built:'ps',hours:'ps',earliest:'human',deadline:'ai'},
  writeup:'Okafor residence, Pinecrest. [ext|Exterior trim, fascia and front door only]. Built 1988. [cutin|Crisp cut lines at the stucco], [color|door in Urbane Bronze]. [hours|Est. 18 labor hours, one day]. Flexible on dates, [due|any day before Nov 2].'},
 patel:{id:'patel',title:'Patel kitchen cabinets',client:'Priya Patel',area:'Kendall',type:'cabinets',ext:false,built:2004,hours:40,value:6400,earliest:1,deadline:9,lang:'en',hoa:false,skills:['spray','color'],labels:['Occupied home'],
  colors:[['Iron Ore','#434341'],['Alabaster','#EDEAE0']],colorsOk:false,photos:9,sig:{},src:'PaintScout #4140 · sold Oct 21 by Luis P.',srcs:{client:'ps',area:'ps',value:'ps',built:'ai',hours:'ps',earliest:'ai',deadline:'ai'},
  writeup:'Patel residence, Kendall. [cab|Kitchen cabinets: 24 doors, 9 drawer fronts, boxes]. [spray|Spray finish], doors sprayed off-site. [color|Fine finish, client is particular about color]. [hours|Est. 40 labor hours]. [due|Before Nov 6].'},
 gutierrez:{id:'gutierrez',title:'Gutierrez interior',client:'Ana Gutierrez',area:'Coral Gables',type:'interior',ext:false,built:1955,hours:48,value:7200,earliest:2,deadline:9,lang:'ht',hoa:false,skills:['drywall','cutin'],labels:[],
  colors:[['Sea Salt','#CDD5CA'],['Accessible Beige','#D1C7B8']],colorsOk:true,photos:11,sig:{},src:'PaintScout #4142 · sold Oct 22 by Dana R.',srcs:{client:'ps',area:'ps',value:'ps',built:'ai',hours:'ps',earliest:'human',deadline:'ai'},
  writeup:'Gutierrez residence, Coral Gables. [int|Interior: living, dining, two bedrooms]. [lead|Built 1955, original plaster]. [drywall|Plaster crack repair in dining room]. [cutin|Clean cut lines at the crown]. [hours|Est. 48 labor hours]. [lang|Ms. Gutierrez prefers Haitian Creole]. [due|Before Nov 6].'}};
let QORDER=['hernandez','okafor','patel','gutierrez'];
/* ============ ranking labels (admin-owned) ============ */
const OPS=[['jobType','Job type rating'],['skills','Skills this job needs'],['record','Days used vs sold'],['cost','Cost per painter day'],['distance','Drive time'],['timing','Start date'],['balance','Workload balance'],['language','Speaks the client’s language']];
const factorList=()=>[...OPS.slice(0,2),...dimsOf('attr').map(d=>[d.k,d.l]),...OPS.slice(2)];
const LABELS={
 'Balanced':{w:{jobType:3,skills:3,quality:2,reliability:2,timing:2},d:'Job fit first, then quality, reliability and start date.',by:'Ido D. (Admin)'},
 'Protect margin':{w:{record:4,cost:4,jobType:2,skills:2,speed:2},d:'Crews that finish within the sold days at a good cost.',by:'Ido D. (Admin)'},
 'Fastest start':{w:{timing:5,jobType:2,reliability:2,skills:1,distance:1},d:'Whoever can start soonest and show up.',by:'Ido D. (Admin)'},
 'White glove':{w:{quality:4,client:4,care:3,jobType:3,skills:3},d:'Best quality and client manner. Default for important clients.',by:'Ido D. (Admin)'}};
const IMPT=[
 ['returning','Returning client',j=>j.sig.returning?`Returning client (${j.sig.returning})`:null],
 ['referrals','Has referred 2 or more jobs',j=>(j.sig.referrals||0)>=2?`Has referred ${j.sig.referrals} jobs`:null],
 ['value','Job worth $12,000 or more',j=>j.value>=12000?`${money(j.value)} job`:null],
 ['crm','Tagged VIP in the CRM',j=>j.sig.crm?'Tagged VIP in the CRM':null],
 ['trade','Designer, realtor or property manager',j=>j.sig.trade||null],
 ['manual','Flagged by the estimator',j=>j.sig.manual?`Estimator note: ${j.sig.manual}`:null]];
let JOB_LABELS=['HOA','Repeat client','Occupied home','Rush','Commercial','Pets on site','Gated community'];
const LANGS={en:'English',es:'Spanish',ht:'Haitian Creole'};

/* ============ v5: contacts, regions, channels, review counts, members ============ */
const CONTACTS={"Gian": ["giancarlobenavides4@gmail.com", "(786) 865-3762", ""], "Tania": ["taniablanco2021@gmail.com", "(786) 663-3198", ""], "Johan & Dani": ["prorenovationshome275@gmail.com", "(941) 387-5048", "(754) 330-5136"], "Rigo": ["rigoallin1llc@gmail.com", "(786) 597-6548", ""], "Paulo": ["lara_davidgo@hotmail.com", "(754) 779-5049", ""], "Marvin": ["premierpaintingsfl@gmail.com", "(786) 848-2987", ""], "Cristhian": ["cruzzavalac@gmail.com", "(786) 443-5280", ""], "Jose": ["finishlinepainter@gmail.com", "(305) 807-0338", ""], "Frank": ["info@142llc.pro", "(786) 925-0657", ""], "Elias": ["eliasreme@gmail.com", "(646) 353-1599", ""], "Alejandro": ["alejandromori90@gmail.com", "(786) 593-5560", ""], "Marcia (wallpaper)": ["votollc@yahoo.com", "(973) 508-6166", ""], "Wonder Painting": ["wonderpaintingservicesllc@gmail.com", "(954) 832-2115", ""], "Alfonso": ["baltazasolis@gmail.com", "(561) 900-8113", ""], "Maria": ["antonioflorez30@gmail.com", "(954) 295-7825", ""], "Cabinet Canvas": ["cabinetcanvasinfo@gmail.com", "(954) 588-4910", ""], "Ali & Luis": ["nzcorpusa@gmail.com", "(786) 709-0234", ""], "Luis Venpro": ["info@simpleconstruction-design.com", "(407) 435-7268", ""], "Fabian": ["fabiancairojobss@gmail.com", "(786) 665-9595", ""], "Vanderlay": ["vanderlie26usa@gmail.com", "(754) 332-6754", ""], "Ido Test": ["ido@PrecisionPaintingPlus.net", "(786) 676-0451", ""]};
const REGION_OF={'Kendall':'Miami-Dade, FL','Hialeah':'Miami-Dade, FL','Westchester':'Miami-Dade, FL','Homestead':'Miami-Dade, FL','Miami':'Miami-Dade, FL','Doral':'Miami-Dade, FL','Miami Beach':'Miami-Dade, FL','Pinecrest':'Miami-Dade, FL','Coral Gables':'Miami-Dade, FL','South Miami':'Miami-Dade, FL','Fort Lauderdale':'Broward, FL','Pompano Beach':'Broward, FL','Newark':'New Jersey'};
GEO['Newark']=[40.735,-74.172];
const REGIONS=['Miami-Dade, FL','Broward, FL','New Jersey'];
const CHANNELS={whatsapp:'WhatsApp',text:'Text',email:'Email'};
const CLANGS={en:'English',es:'Spanish',pt:'Portuguese',ht:'Haitian Creole'};
const REVIEWS={gian:{interior:9,exterior:14,cabinets:6,commercial:5,decorative:1,drywall:4,prep:12,cutin:11,spray:9,color:10},tania:{interior:2,exterior:7,cabinets:4,commercial:9,drywall:3,prep:6,cutin:5,spray:5,color:3},'johan-dani':{interior:6,exterior:5,commercial:4,decorative:2,drywall:2,prep:5,cutin:5,spray:4,color:4},rigo:{interior:3,exterior:11,commercial:6,drywall:2,prep:7,cutin:6,spray:5,color:5}};
const MEMBERS={gian:[['Gian','Crew lead','English, Spanish',true,'11 years. Handles HOA walkthroughs.'],['Luis','Painter, sprayer','Spanish',false,'Runs the spray rig.'],['Marco','Painter','Spanish',false,'Prep and patching.']],
 tania:[['Tania','Crew lead','Spanish',false,'Runs big commercial jobs.'],['Yuli','Painter','Spanish',false,''],['Carlos','Painter','Spanish',false,''],['Ana','Painter','Spanish',false,'Cut-in specialist.'],['Pedro','Painter','Spanish',false,''],['Dayana','Painter','Spanish',false,'']],
 'johan-dani':[['Johan','Crew lead','Spanish, Portuguese',false,''],['Dani','Painter','Spanish',false,'Detail and color work.'],['Bruno','Helper','Portuguese',false,'']],
 rigo:[['Rigo','Crew lead','Spanish',true,'Lift operator.'],['Andrés','Painter','Spanish',false,'Joins on bigger jobs.']]};
CREWS.forEach(c=>{const k=CONTACTS[c.name]||['','',''];c.f.email=k[0];c.f.phone=k[1];c.f.phone2=k[2];
 c.f.region=c.name==='Alejandro'?'New Jersey':REGION_OF[c.f.base]||'';c.f.regionNote=c.name==='Alejandro'?'From calendar name “Alejandro Mori NJ”. Confirm.':'';if(c.name==='Alejandro'){c.f.base='Newark';c.f.baseSample=true;}
 c.f.channel=c.name==='Rigo'?'text':c.name==='Marcia (wallpaper)'?'email':'whatsapp';c.f.clang=/Gian/.test(c.name)?'es':'es';c.f.clangSet=['gian','tania','johan-dani','rigo'].includes(c.id);
 c.rc=REVIEWS[c.id]||{};c.members=(MEMBERS[c.id]||[]).map(([n,role,langs,lead,note])=>({n,role,langs,lead,note,phone:''}));});
Object.values(JOBS).forEach(j=>j.region=REGION_OF[j.area]||'Miami-Dade, FL');

/* ============ v6: calendar days incl. weekends, whole-number sizes, hours ============ */
BOOKS.forEach(b=>{b.s=w2c(b.s);b.e=w2c(b.e);});
Object.values(JOBS).forEach(j=>{j.earliest=w2c(j.earliest);j.deadline=w2c(j.deadline);});
CREWS.forEach(c=>{if(c.f.size&&c.f.size.min!==c.f.size.max){c.f.sizeWas=`${c.f.size.min}-${c.f.size.max}`;c.f.size={min:c.f.size.min,max:c.f.size.min};}
 c.f.hours={wk:['08:00','17:00'],sat:c.id==='tania'?['08:00','14:00']:c.id==='rigo'?['08:00','12:00']:null,sun:null};});

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
 {ts:NOW-0.1*864e5,t:'Oct 25, 2:05 PM',who:'Ido D. (Admin)',type:'Crew data',text:'Imported crews-with-ratings.xlsx: 21 rows (20 crews and a test row), 18 rating columns. Fixed 15 crew sizes Excel had turned into dates. Set status for all crews.'},
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
 Object.entries(S.place).forEach(([jid,p])=>{if(jid===except||!JOBS[jid])return;crewsOf(p.crew,p.extra).forEach(cr=>p.segs.forEach(([a,z],i)=>b.push({id:'job:'+jid+':'+i+':'+cr,crew:cr,extraCrew:cr!==p.crew,name:JOBS[jid].title,what:p.status==='scheduled'?'Confirmed':'Draft',s:a,e:z,jid,seg:p.segs.length>1?i+1:0,prop:p.status!=='scheduled',half:p.half||null,value:cr===p.crew?JOBS[jid].value:0})));});return b;}
function occ(B,crew,d){let full=0,h=new Set();B.forEach(x=>{if(x.crew===crew&&d>=x.s&&d<=x.e){if(x.half)h.add(x.half);else full=1;}});return full?1:h.size>=2?1:h.size?0.5:0;}
function freeHalf(B,crew,d){const used=new Set(B.filter(x=>x.crew===crew&&x.half&&d>=x.s&&d<=x.e).map(x=>x.half));return occ(B,crew,d)===1?null:!used.has('am')?'am':!used.has('pm')?'pm':null;}
const busy=(B,crew,d)=>occ(B,crew,d)>0;
const painterDays=j=>Math.round(j.hours/8*10)/10;
const crewsOf=(crew,extra)=>[crew,...(extra||[]).filter(x=>x&&x!==crew)];
const comboSize=(crew,extra)=>crewsOf(crew,extra).reduce((a,c)=>a+(planSize(crewById(c))||1),0);
function need(job,crew,extra){const sz=comboSize(crew,extra);const days=job.hours/8/sz;return days<=0.5?{n:1,half:true}:{n:Math.ceil(days),half:false};}
function span(job,crew,start,B,extra){const nd=need(job,crew,extra);const cs=crewsOf(crew,extra);
 if(nd.half){const h=freeHalf(B,crew,start);return{s:start,e:start,holds:[],conf:h?[]:[start],n:1,half:h||'am'};}
 let c=0,d=start;const holds=[],conf=[];
 while(c<nd.n){if(d>27)break;if(cs.some(x=>busy(B,x,d)))conf.push(d);
  if(job.ext&&S.rules.weather&&rain(d)&&!(c===0&&nd.n>=3))holds.push(d);else c++;d++;}
 return{s:start,e:d-1,holds,conf,n:nd.n,half:null};}
function earliestSlot(job,crew,B){for(let s=job.earliest;s<=19;s++){const sp=span(job,crew,s,B);if(!sp.conf.length)return sp;}return null;}
function setPlace(jid,crew,s,status,keepSegs,extra){const job=JOBS[jid];const old=S.place[jid];if(extra===undefined)extra=old&&old.extra?old.extra.filter(x=>x!==crew):[];const sp=span(job,crew,s,bookings(jid),extra);
 let segs=[[sp.s,sp.e]];if(keepSegs&&old&&old.segs.length>1){const d=s-old.segs[0][0];segs=old.segs.map(([a,z])=>[a+d,z+d]);}
 S.place[jid]={crew,extra,segs,status:status||'draft',half:sp.half,holds:sp.holds};return S.place[jid];}
const pS=p=>p.segs[0][0],pE=p=>p.segs[p.segs.length-1][1];
const halfTaken=(B,crew,d,h)=>B.some(x=>x.crew===crew&&d>=x.s&&d<=x.e&&(!x.half||x.half===h));
function placeConf(jid){const p=S.place[jid];const B=bookings(jid);const out=[];p.segs.forEach(([a,z])=>{for(let d=a;d<=z;d++){if(crewsOf(p.crew,p.extra).some(cr=>p.half?halfTaken(B,cr,d,p.half):busy(B,cr,d)))out.push(d);}});return out;}
function placeDays(jid){const p=S.place[jid];const job=JOBS[jid];const out=[];let w=0;p.segs.forEach(([a,z],si)=>{if(si>0){for(let d=p.segs[si-1][1]+1;d<a;d++)out.push({d,k:'pause'});}for(let d=a;d<=z;d++){const h=job.ext&&S.rules.weather&&rain(d)&&!(w===0&&need(job,p.crew,p.extra).n>=3)&&!p.half;out.push({d,k:h?'rain':'work',n:h?null:++w});}});return out;}
/* ============ rules ============ */
function hard(job,cid){const c=crewById(cid);const out=[];
 if(c.f.status!=='active'){out.push('Inactive');return out;}
 const mi=missing(c).filter(x=>x!=='jobRating');if(mi.length)out.push(`Missing setup: ${mi.map(x=>x==='size'?'crew size':x==='base'?'home base':x).join(', ')}`);
 const r=c.r[job.type];if(r==null){if(!S.rules.untested)out.push(`Not rated for ${dimL(job.type).toLowerCase()} yet`);}else if(r<S.rules.minType)out.push(`Rated ${r} for ${dimL(job.type).toLowerCase()}, minimum is ${S.rules.minType}`);
 if(S.rules.lead&&job.built<1978&&leadTracked()){if(c.f.leadSafe!==true)out.push(`No lead-safe certification on file (home built ${job.built})`);}
 if(S.rules.imp&&imp(job)){const q=c.r.quality,cf=c.r.client;if(q==null||cf==null||q<S.rules.impBar||cf<S.rules.impBar)out.push(`Important client: needs quality and client-facing ${S.rules.impBar}+`);}
 if(S.rules.region&&c.f.region&&job.region&&c.f.region!==job.region)out.push(`Works in ${c.f.region}, job is in ${job.region}`);
 const dm=driveMin(c.f.base,job.area);if(dm!=null&&dm>S.rules.maxDrive&&!(S.rules.region&&c.f.region!==job.region))out.push(`${dm} min away, limit is ${S.rules.maxDrive}`);
 if(S.rules.minReviews>1&&r!=null&&(c.rc[job.type]||0)<S.rules.minReviews&&!(c.rsrc&&c.rsrc[job.type]==='admin'))out.push(`${dimL(job.type)} rating is based on ${plural(c.rc[job.type]||0,'review')}, needs ${S.rules.minReviews}`);
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
const STAGES=[['Training','Watches and learns while your schedulers work as usual. Shows its pick, books nothing.'],['Suggesting','Its pick shows first. A scheduler still confirms every job.'],['Booking small jobs','Books jobs under $2,500 on its own. Every booking is logged and can be undone.'],['Booking with approval','Plans the whole queue. A scheduler approves the plan.']];

/* ============ v5 state ============ */
Object.assign(S.rules,{region:true,minReviews:3});
Object.assign(S,{comms:[],calViews:[{name:'Exteriors this week',view:'resourceTimelineWeek',show:'all',group:'ready',region:'all',groupBy:'ready'}],optWin:{range:'2w',from:0,to:13},crewEdit:null,memberOpen:null});
Object.assign(S.calF,{region:'all',groupBy:'ready',size:'normal'});
S.riley.model={base:'Crew Board base model (0.5B parameters)',tuned:'Fine-tuned on Precision Painting Plus decisions',last:'Sun Oct 25, 2:00 AM',next:'Tonight, 2:00 AM',cadence:'Nightly',need:50};
S.riley.autoBooked=[];
S.riley.questions=[
 {id:'q1',to:'admin',kind:'bias',text:'Carla picked Tania over a higher-ranked crew on 3 of the last 4 HOA jobs, with no reason given. Should HOA jobs prefer Tania?',opts:['Yes, make it a habit','No, treat it as chance','Ask Carla for a reason'],ans:null},
 {id:'q2',to:'admin',kind:'rule',text:'Gutierrez prefers Haitian Creole, and no ready crew lists Creole. Should the client’s language be a must-have or nice to have?',opts:['Must-have','Nice to have'],ans:null},
 {id:'q3',to:'scheduler',kind:'learn',text:'You moved Okafor to Johan & Dani after the optimizer suggested Gian. Was that about drive time, cost or something else?',opts:['Drive time','Cost','Keep Gian free for bigger jobs','Something else'],ans:null}];
S.riley.trainLog=[
 ['Oct 24, 3:12 PM','Carla M.','Ortega exterior','Rigo','Rigo','',true],['Oct 23, 10:40 AM','Jessie T.','Brickell Bay condo halls','Gian','Tania','Top crew is needed on another job',true],
 ['Oct 22, 4:05 PM','Carla M.','Simmons exterior','Tania','Tania','',true],['Oct 22, 11:20 AM','Carla M.','Navarro exterior','Gian','Johan & Dani','',true],
 ['Oct 21, 9:15 AM','Jessie T.','Kim interior','Johan & Dani','Johan & Dani','',true],['Oct 20, 2:48 PM','Carla M.','Ruiz exterior','Rigo','Rigo','',true],
 ['Oct 20, 10:02 AM','Carla M.','Brightwater HOA, phase 2','Gian','Gian','',true],['Oct 19, 3:30 PM','Jessie T.','Alvarez exterior','Gian','Rigo','Crew knows this home or client',true],
 ['Oct 17, 1:10 PM','Carla M.','Watts interior','Tania','Tania','',true],['Oct 16, 9:40 AM','Jessie T.','Delgado exterior','Gian','Gian','',false]].map(([t,who,job,rp,pick,reason,used])=>({t,who,job,rp,pick,reason,used,agree:rp===pick}));
const _rileyLearn=rileyLearn;
rileyLearn=function(jid,crew,reason){const rp=rileyPick(jid);const a=_rileyLearn(jid,crew,reason);S.riley.trainLog.unshift({t:stamp(),who:ME().split(' (')[0],job:JOBS[jid].title,rp:rp?crewById(rp.crew).name:'none',pick:crewById(crew)?crewById(crew).name:crew,reason:reason||'',used:!!(S.riley.from[ME().split(' (')[0]]||{on:true}).on,agree:a});return a;};
function ruleFunnel(){return dimsOf('job').map(d=>{const fake={type:d.k,ext:d.k==='exterior',built:1990,value:5000,sig:{},skills:[],area:'Kendall',region:'Miami-Dade, FL',lang:'en'};return[d.l,activeCrews().filter(c=>!hard(fake,c.id).length).length];});}

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
function openDays(B=bookings(),from=0,to=9){let n=0;activeCrews().filter(ready).forEach(c=>{for(let d=from;d<=to;d++)n+=1-occ(B,c.id,d);});return n;}
const owin=()=>[S.optWin.from,S.optWin.to];
/* ============ optimizer ============ */
function optimize(keep){const F=S.ofb;const savedP=clone(S.place),savedS={...S.shift};
 const W=owin();const before=keep?keep.before:openDays(bookings(),...W);
 const kept=(keep&&keep.kept)||[];
 kept.forEach(mv=>{if(mv.shift)S.shift[mv.shift.id]=(S.shift[mv.shift.id]||0)+mv.shift.k;S.place[mv.jid]={crew:mv.crew,segs:[[mv.s,mv.e]],status:'draft',half:mv.half,holds:[]};});
 const keptIds=new Set(kept.map(m=>m.jid));
 const todo=QORDER.filter(j=>S.place[j]?.status!=='scheduled'&&!keptIds.has(j)&&JOBS[j].earliest<=W[1]);todo.forEach(j=>delete S.place[j]);
 const opts=Object.fromEntries(todo.map(j=>[j,rank(j).filter(x=>x.ok||optAllOk(x)).length]));
 todo.sort((a,b)=>(!!imp(JOBS[b])-!!imp(JOBS[a]))||(opts[a]-opts[b])||(JOBS[a].deadline-JOBS[b].deadline));
 const blocked=(jid,cr,s,e)=>F.block.some(b=>(b.jid?b.jid===jid:b.crew===cr)&&s<=b.e&&e>=b.s);
 const moves=[...kept.map(m=>({...m,kept:true}))],skipped=[];
 todo.forEach(jid=>{const job=JOBS[jid];const R=rank(jid).filter(r=>(r.ok||optAllOk(r))&&!(F.reject[jid]||[]).includes(r.crew));if(!R.length){skipped.push(jid);return;}
  const cands=[];
  R.forEach(r=>{const B=bookings(jid);
   for(let s=Math.max(job.earliest,W[0]);s<=Math.min(27,W[1]);s++){if(!dayCap(r.crew,s))continue;const sp=span(job,r.crew,s,B);if(blocked(jid,r.crew,sp.s,sp.e))continue;
    if(!sp.conf.length&&sp.e<=job.deadline){const fit=(s>0&&busy(B,r.crew,s-1)?1:0)+(busy(B,r.crew,sp.e+1)?1:0)+(sp.half&&occ(B,r.crew,s)===0.5?2:0);
     cands.push({v:fit*6-(s-job.earliest)*2+r.score/10+mgScore(jid,r.crew),mg:margin(jid,r.crew),notReady:!r.ok,jid,crew:r.crew,s,e:sp.e,half:sp.half,score:r.score,fit,shift:null});continue;}
    if(sp.half||!(s===job.earliest||busy(B,r.crew,s-1)))continue;
    let g=s;while(g+1<=27&&!busy(B,r.crew,g+1))g++;
    const x=B.find(y=>y.crew===r.crew&&y.s===g+1&&y.fixed);if(!x||x.s<S.lock||S.shift[x.id]||F.noMove[x.id])continue;
    for(let k=1;k<=2;k++){S.shift[x.id]=k;const sp2=span(job,r.crew,s,bookings(jid));const Bx=B.filter(y=>y.id!==x.id);let clash=x.e+k>27;for(let d=x.e+1;d<=x.e+k;d++)if(busy(Bx,r.crew,d))clash=true;delete S.shift[x.id];
     if(!sp2.conf.length&&sp2.e<=job.deadline&&!clash){cands.push({v:12-(s-job.earliest)*2+r.score/10-4+mgScore(jid,r.crew),mg:margin(jid,r.crew),notReady:!r.ok,jid,crew:r.crew,s,e:sp2.e,half:null,score:r.score,fit:2,shift:{id:x.id,k,name:`${x.name} ${x.what.toLowerCase()}`,from:x.s}});break;}}}});
  cands.sort((a,b)=>b.v-a.v);const best=cands[0];if(!best){skipped.push(jid);return;}
  best.top=R[0].crew;best.topScore=R[0].score;
  const seen=new Set([best.crew]);best.alts=cands.slice(1).filter(c=>!seen.has(c.crew)&&seen.add(c.crew)).slice(0,3).map(c=>({crew:c.crew,s:c.s,e:c.e,score:c.score,why:c.score<best.score?`Lower match score (${c.score} vs ${best.score})`:c.s>best.s?`Starts later (${dlabel(c.s)})`:c.shift?'Would move a confirmed job':'Leaves more open days around it'}));
  const o1=openDays(bookings(),...W);if(best.shift)S.shift[best.shift.id]=best.shift.k;S.place[jid]={crew:best.crew,segs:[[best.s,best.e]],status:'draft',half:best.half,holds:[]};best.fill=Math.round((o1-openDays(bookings(),...W))*10)/10;moves.push(best);});
 const after=openDays(bookings(),...W);
 for(const k in S.place)delete S.place[k];Object.assign(S.place,savedP);for(const k in S.shift)delete S.shift[k];Object.assign(S.shift,savedS);
 return{win:W.slice(),type:'opt',run:++S.optRuns,at:stamp(),moves,skipped,before,after,sel:moves.map(()=>'keep'),why:{},constraints:clone({reject:F.reject,noMove:F.noMove,block:F.block}),lock:S.lock};}
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
function loadEC(){if(window.EventCalendar)return Promise.resolve();if(ECP)return ECP;ECP=new Promise((res,rej)=>{const l=document.createElement('link');l.rel='stylesheet';l.href=EC_CSS;document.head.appendChild(l);loadScript(EC_JS).then(res,e=>{ECP=null;rej(e);});});return ECP;}
const d2=(i,h)=>{const x=DL[Math.max(0,Math.min(DL.length-1,i))];return x.iso+(h?' '+h:'');};
const endAfter=i=>{const x=new Date(DL[Math.min(DL.length-1,i)].date);x.setDate(x.getDate()+1);return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`;};
function evOf(x,opts={}){const c=crewById(x.crew);const job=x.jid?JOBS[x.jid]:null;
 const base={resourceIds:[x.crew],extendedProps:{crew:x.crew,extraCrew:!!x.extraCrew,kind:x.jid?'job':'fixed',id:x.jid||x.id,seg:x.seg?x.seg-1:0,draft:!!x.prop,half:x.half,moved:x.moved}};
 const t=x.half?{start:d2(x.s,x.half==='am'?'08:00':'13:00'),end:d2(x.s,x.half==='am'?'12:00':'17:00'),allDay:false}:{start:d2(x.s),end:endAfter(x.e),allDay:true};
 const cls=[x.jid?(x.prop?'ev-draft':'ev-job'):'ev-fixed'];if(opts.focus)cls.push('ev-focus');if(x.moved)cls.push('ev-moved');
 return{id:(x.jid?'job:'+x.jid+':'+(x.seg?x.seg-1:0)+':'+x.crew:'bk:'+x.id),...t,...base,title:x.name,classNames:cls,backgroundColor:opts.focus?'var(--tape)':`color-mix(in srgb, ${c.c} 22%, var(--surface))`,textColor:opts.focus?'var(--tape-ink)':'var(--ink)',editable:true};}
function calResources(list){const mk=c=>({id:c.id,title:c.name,extendedProps:{c}});
 if(S.view==='board')return list.map(mk);
 if(S.calF.groupBy==='region'){const out=[];REGIONS.forEach(rg=>{const L=list.filter(c=>c.f.region===rg&&(S.calF.group==='all'||(S.calF.group==='ready')===ready(c)));if(L.length)out.push({id:'g-'+slug(rg),title:rg,children:L.map(mk),extendedProps:{group:1}});});return out;}
 const R=list.filter(ready),N=list.filter(c=>!ready(c));const out=[];
 if(S.calF.group!=='needs'&&R.length)out.push({id:'g-ready',title:'Ready to match',children:R.map(mk),extendedProps:{group:1}});
 if(S.calF.group!=='ready'&&N.length)out.push({id:'g-needs',title:'Need setup before matching',children:N.map(mk),extendedProps:{group:1}});
 return out;}
function calEvents(){const B=bookings();const F=S.calF;const ev=[];
 if(S.view==='board'){const job=J();const p=S.place[job.id];
  B.forEach(x=>{if(x.jid===job.id)ev.push(...runsOf(x,{focus:true}).map(e=>({...e,title:job.title})));else if(!S.hideOthers)ev.push(...runsOf(x).map(e=>({...e,editable:false,durationEditable:false})));});
  if(!p)rank(job.id).filter(r=>r.ok).forEach((r,i)=>{ev.push({id:'ghost:'+r.crew,resourceIds:[r.crew],start:d2(r.slot.s),end:endAfter(r.slot.e),allDay:true,title:`${r.score} · ${i===0?'Best fit':'Option'}`,classNames:['ev-ghost'],editable:false,extendedProps:{kind:'ghost',crew:r.crew}});});
  boardCrews().forEach(c=>{for(let d=0;d<42;d++)if(!dayCap(c.id,d))ev.push({id:`off:${c.id}:${d}`,resourceIds:[c.id],start:d2(d),end:endAfter(d),allDay:true,display:'background',classNames:['off-bg']});});
  return ev;}
 if(F.show!=='none')B.forEach(x=>{if(F.show==='confirmed'&&x.prop)return;if(F.show==='drafts'&&!x.prop)return;ev.push(...runsOf(x));});
 activeCrews().forEach(c=>{for(let d=0;d<42;d++)if(!dayCap(c.id,d))ev.push({id:`off:${c.id}:${d}`,resourceIds:[c.id],start:d2(d),end:endAfter(d),allDay:true,display:'background',classNames:['off-bg']});});
 if(F.open)activeCrews().filter(ready).forEach(c=>{for(let d=0;d<14;d++){if(!dayCap(c.id,d))continue;const o=occ(B,c.id,d);if(o<1)ev.push({id:`open:${c.id}:${d}`,resourceIds:[c.id],start:d2(d),end:endAfter(d),allDay:true,display:'background',classNames:[o===0.5?'open-half':'open-bg']});}});
 return ev;}
function evContent(info){const e=info.event,x=e.extendedProps;if(e.display==='background')return'';
 if(x.kind==='ghost')return{html:`<div class="evc"><b>${esc(e.title)}</b><span>Click to place</span></div>`};
 if(x.kind==='job'){const job=JOBS[x.id];const p=S.place[x.id];const pd=p?placeDays(x.id).filter(d=>d.k==='work'):[];const segs=p?p.segs:[];
  const sg=segs[x.seg]||segs[0];const rg=x.run||sg;const inSeg=pd.filter(d=>d.d>=rg[0]&&d.d<=rg[1]);const lab=x.extraCrew?'Second crew':p&&p.half?`Half day (${p.half==='am'?'morning':'afternoon'})`:inSeg.length?`Day ${inSeg[0].n}${inSeg.length>1?'–'+inSeg[inSeg.length-1].n:''}${segs.length>1?` · visit ${x.seg+1}`:''}`:'';
  return{html:`<div class="evc"><b>${esc(job.title)}</b><span>${x.draft?'Draft · ':''}${lab}</span></div>`};}
 const b=BOOKS.find(y=>y.id===x.id);const k0=S.shift[b.id]||0;const cr=crewOfBooking(b);const wd=Array.from({length:b.e-b.s+1},(_,i)=>b.s+k0+i).filter(d=>dayCap(cr,d)>0);const n=wd.length||1;const rr=x.run?wd.filter(d=>d>=x.run[0]&&d<=x.run[1]):wd;const a1=wd.indexOf(rr[0])+1,a2=wd.indexOf(rr[rr.length-1])+1;
 return{html:`<div class="evc"><b>${esc(b.name)}</b><span>${b.half?(b.half==='am'?'Morning':'Afternoon'):(a1===a2?`Day ${a1}`:`Day ${a1}–${a2}`)}${x.moved?' · moved':''}</span></div>`};}
function resContent(info){const r=info.resource,x=r.extendedProps||{};if(x.group)return{html:`<span class="rgrp">${esc(r.title)}</span>`};
 const c=x.c;if(!c)return r.title;const mi=missing(c);const B=bookings();
 return{html:`<button class="rlab" data-act="crew" data-v="${c.id}"><span class="dot" style="--c:${c.c}"></span><span class="rlab-t"><b>${esc(c.name)}</b><small>${c.f.size?sizeText(c):'size missing'} · ${mi.length?'<em>needs setup</em>':util(B,c.id)+'% booked'}${wkNote(c)}</small></span></button>`};}
function mountCal(){const el=document.getElementById('ec');if(EC){try{EventCalendar.destroy(EC);}catch(_){}EC=null;}if(!el)return;
 if(!window.EventCalendar){el.innerHTML='<div class="pad small muted">Loading the calendar…</div>';loadEC().then(()=>{if(document.getElementById('ec'))mountCal();}).catch(()=>{el.innerHTML='<div class="pad small">The calendar library didn’t load. Check your connection and reload.</div>';});return;}
 const F=S.calF;const list=(S.view==='board'?boardCrews():activeCrews()).filter(c=>F.region==='all'||S.view==='board'||c.f.region===F.region);const zoom=[40,64,96][F.zoom];
 el.innerHTML='';EC=EventCalendar.create(el,{firstDay:1,view:S.view==='board'?'twoWeeks':F.view,date:S.view==='board'?DL[Math.max(0,(S.place[S.job]?pS(S.place[S.job]):J().earliest)-3)].date:(F.date||DL[0].date),hiddenDays:[],height:'auto',
  headerToolbar:{start:'prev,next today',center:'title',end:''},buttonText:{today:'Today'},
  views:{resourceTimelineDay:{slotDuration:'01:00',slotMinTime:'07:00:00',slotMaxTime:'18:00:00',slotWidth:zoom+24},resourceTimelineWeek:{slotDuration:{days:1},slotWidth:zoom*2},twoWeeks:{type:'resourceTimelineWeek',duration:{weeks:2},slotDuration:{days:1},slotWidth:zoom+20},resourceTimelineMonth:{slotDuration:{days:1},slotWidth:zoom}},
  dayHeaderFormat:wxHeader,slotLabelFormat:F.view==='resourceTimelineDay'&&S.view!=='board'?{hour:'numeric'}:{weekday:'short',day:'numeric'},
  resources:calResources(list),events:calEvents(),editable:true,eventDurationEditable:true,eventStartEditable:true,eventResize:info=>onResize(info),
  eventContent:evContent,resourceLabelContent:resContent,
  eventClick:info=>{const x=info.event.extendedProps;if(x.kind==='ghost'){placeJob(S.job,x.crew);render();toast(`Draft placed on ${crewById(x.crew).name}. Drag to adjust`);return;}if(x.kind==='job'||x.kind==='fixed'){S.modal={type:'hub',id:x.kind==='job'?x.id:x.id};drawLayer();}},
  eventDrop:info=>onDrop(info),
  datesSet:info=>{if(S.view!=='board')F.date=info.view.currentStart;}});}
function boardCrews(){const job=J();const R=rank(job.id);const p=S.place[job.id];const ids=new Set(R.filter(r=>r.ok).map(r=>r.crew));if(p){ids.add(p.crew);(p.extra||[]).forEach(x=>ids.add(x));}
 return(S.allCrews?activeCrews():activeCrews().filter(c=>ids.has(c.id))).sort((a,b)=>R.findIndex(r=>r.crew===a.id)-R.findIndex(r=>r.crew===b.id));}
function onDrop(info){const x=info.event.extendedProps;const newIdx=idxOfDate(info.event.start);const newCrew=(info.newResource&&info.newResource.id)||info.event.resourceIds[0];
 if(String(newCrew).startsWith('g-')){info.revert();toast('Drop it on a crew row');return;}
 if(x.kind==='job'){const p=S.place[x.id];const sg=p.segs[x.seg];const d=newIdx-(x.run?x.run[0]:sg[0]);if(!dayCap(newCrew,newIdx)){info.revert();toast(`${crewById(newCrew).name} doesn’t work ${DAYN.en[DL[newIdx].dow]}s. Pick a working day`);return;}
  const apply=()=>{if(p.segs.length>1&&newCrew===p.crew){sg[0]+=d;sg[1]+=d;p.segs.sort((a,b)=>a[0]-b[0]);}else{p.segs=p.segs.map(([a,z])=>[a+d,z+d]);}
   if(x.extraCrew){p.extra=(p.extra||[]).map(c=>c===x.crew?newCrew:c).filter(c=>c!==p.crew);}else if(newCrew!==p.crew){p.crew=newCrew;p.extra=(p.extra||[]).filter(c=>c!==newCrew);}if(p.half&&info.event.start.getHours()>=12)p.half='pm';else if(p.half)p.half='am';};
  if(p.status==='scheduled'){info.revert();S.modal={type:'move',kind:'job',id:x.id,seg:x.seg,d,crew:newCrew,pick:null};drawLayer();return;}
  apply();render();toast(`${JOBS[x.id].title} moved to ${crewById(p.crew).name}, ${dlabel(pS(p))}`);return;}
 if(x.kind==='fixed'){info.revert();const b=BOOKS.find(y=>y.id===x.id);const cur=x.run?x.run[0]:b.s+(S.shift[b.id]||0);if(!dayCap(newCrew,newIdx)){toast(`${crewById(newCrew).name} doesn’t work ${DAYN.en[DL[newIdx].dow]}s. Pick a working day`);return;}S.modal={type:'move',kind:'fixed',id:x.id,d:newIdx-cur,crew:newCrew,pick:null};drawLayer();}}
function dropUnscheduled(jid,x,y){if(!EC)return;const info=EC.dateFromPoint(x,y);if(!info||!info.resource||String(info.resource.id).startsWith('g-')){toast('Drop it on a crew row');return;}
 const idx=idxOfDate(info.date);const cid=info.resource.id;if(!dayCap(cid,idx)){toast(`${crewById(cid).name} doesn’t work ${DAYN.en[DL[idx].dow]}s. Drop it on a working day`);return;}setPlace(jid,cid,idx,'draft');const fails=hard(JOBS[jid],cid);render();
 toast(fails.length?`Draft on ${crewById(cid).name}, but: ${fails[0]}. Click it to pick another crew`:`Draft on ${crewById(cid).name}, ${dlabel(idx)}. Click it to check or confirm`);}

function wxHeader(date){const iso=`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;const i=DL.findIndex(d=>d.iso===iso);
 const lab=`${DOW[date.getDay()]} ${date.getMonth()+1}/${date.getDate()}`;if(i<0||i>=20)return{html:`<span class="dh">${lab}</span>`};const [p,t]=WX[i];
 return{html:`<span class="dh">${lab}<span class="wxs ${p>=50?'wet':''}" title="${t==='rain'?'Rain':t==='cloud'?'Cloudy':'Sunny'}, ${p}% chance of rain">${t==='rain'?'🌧':t==='cloud'?'☁':'☀'} ${p}%</span></span>`};}

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

/* ---------- crews ---------- */
const PAIRS={gian:[['tania',6,-2],['rigo',3,1]],tania:[['gian',6,-2],['wonder-painting',4,5],['johan-dani',2,0]],'johan-dani':[['rigo',5,-1],['tania',2,0]],rigo:[['johan-dani',5,-1],['gian',3,1],['elias',2,4]],
 paulo:[['vanderlay',3,6]],'wonder-painting':[['tania',4,5],['vanderlay',2,3]],frank:[['luis-venpro',3,2]],maria:[['paulo',2,1]]};
function readyChip(c){if(c.f.status!=='active')return'<span class="chip">Inactive</span>';const m=missing(c);if(!m.length)return'<span class="chip good">Ready to match</span>';
 return `<span class="chip warn">${m.includes('jobRating')?'Needs ratings':'Missing '+m.map(x=>x==='base'?'home base':x==='size'?'crew size':x).join(', ')}</span>`;}
V.crews=()=>{const F=S.crewF;const list=CREWS.filter(c=>F==='all'||(F==='ready'&&ready(c))||(F==='needs'&&c.f.status==='active'&&!ready(c))||(F==='inactive'&&c.f.status!=='active'));
 const jd=dimsOf('job'),pc=crewById(S.pairCrew)||CREWS[0];const prs=PAIRS[pc.id]||[];
 return `<div class="qhead"><div class="grow"><div class="eyebrow">Crew Board is the source of truth for crew data</div><h1>Crews</h1><p class="muted small" style="margin:6px 0 0">${isAdmin()?'Click a crew to see its profile, edit ratings and details.':'Click a crew to see its profile. Your admin keeps this data up to date.'}</p></div>${isAdmin()?'<button class="btn tape" data-act="addcrew">+ Add a crew</button>':''}${fbBtn('crews')}</div>
 <section class="card pad usedfor"><h3 style="font-size:16px;margin-bottom:8px">What’s stored and how it’s used</h3>
  <div class="ugrid"><div><span class="chip bad">Rules</span><p class="small">Active · ${dimsOf('job').length} job-type ratings (${S.rules.minType}+ to qualify) · Lead-safe certified · Quality and client-facing for important clients · Drive time from home base</p></div>
  <div><span class="chip tape">Ranking factors</span><p class="small">${dimsOf('skill').length} skill ratings · ${dimsOf('attr').length} attribute ratings · Days used vs sold · Cost per painter day · Languages · Workload · Start date</p></div>
  <div><span class="chip">Info only</span><p class="small">Salesforce name · Google Calendar name · Email and phone · Notes</p></div></div></section>
 <div class="row" style="margin:16px 0 10px;flex-wrap:wrap"><div class="seg" role="group" aria-label="Filter crews">${[['all','All'],['ready','Ready to match'],['needs','Need setup'],['inactive','Inactive']].map(([k,l])=>`<button aria-pressed="${F===k}" data-act="crewf" data-v="${k}">${l} <span class="tiny">${CREWS.filter(c=>k==='all'||(k==='ready'&&ready(c))||(k==='needs'&&c.f.status==='active'&&!ready(c))||(k==='inactive'&&c.f.status!=='active')).length}</span></button>`).join('')}</div></div>
 <div class="card tscroll"><table class="ctable"><thead><tr><th>Crew</th><th>Status</th><th>Size</th><th>Home base</th>${jd.map(d=>`<th class="n" title="${d.l}">${d.l.split(/[ /]/)[0]}</th>`).join('')}<th class="n">5★ reviews</th><th class="n">Days vs sold</th></tr></thead><tbody>
 ${list.map(c=>{const h=hist(c.id);return `<tr><td><button class="lnk" data-act="crew" data-v="${c.id}">${crewDot(c.id)} <b>${esc(c.name)}</b></button><div>${readyChip(c)}</div></td><td>${c.f.status==='active'?'Active':'Inactive'}</td><td>${c.f.size?sizeText(c):'<span class="warnt">Missing</span>'}${c.f.sizeFixed?'<span class="tiny" style="display:block">fixed from date</span>':''}</td><td>${c.f.base?esc(c.f.base)+(c.f.baseSample?'<span class="tiny" style="display:block">sample</span>':''):'<span class="warnt">Missing</span>'}</td>
  ${jd.map(d=>`<td class="n">${c.r[d.k]==null?'<span class="faint">–</span>':`<span class="rt r${Math.round(c.r[d.k])}">${c.r[d.k]}</span>`}</td>`).join('')}<td class="n">${h?h.five:'<span class="faint">–</span>'}</td><td class="n">${h?`<span style="color:${h.overPct>0?'var(--warn)':'var(--good)'}">${h.overPct>0?'+':''}${h.overPct}%</span>`:'<span class="faint">–</span>'}</td></tr>`;}).join('')}</tbody></table></div>
 <p class="tiny">“–” means not rated yet. Blank is untested, not a low score.</p>
 <section class="card pad" style="margin-top:16px"><div class="row" style="margin-bottom:10px;flex-wrap:wrap"><div class="grow"><h3 style="font-size:17px">Who works well together</h3><div class="small muted">Crews that have shared big jobs (HOA, commercial, rush). Pick a crew to see its best partners.</div></div>
  <label class="tiny" for="paircrew">Crew</label><select class="in" id="paircrew" data-pair style="width:auto">${activeCrews().map(c=>`<option value="${c.id}" ${c.id===pc.id?'selected':''}>${esc(c.name)}</option>`).join('')}</select>${fbBtn('pairs')}</div>
  <div class="pairhead">${crewDot(pc.id)}<b>${esc(pc.name)}</b><span class="tiny">${sizeText(pc)} · ${esc(pc.f.base||'no base')}</span></div>
  ${prs.length?prs.map(([id,n,ov])=>{const o=crewById(id);return `<div class="prow">${crewDot(id)}<button class="lnk grow" data-act="crew" data-v="${id}"><b>${esc(o.name)}</b></button><span class="pbar"><i style="width:${n*14}%;background:${o.c}"></i></span><span class="small num">${plural(n,'shared job')}</span><span class="chip ${ov>0?'warn':'good'}">${ov>0?'+':''}${ov}% days vs sold together</span></div>`;}).join(''):'<p class="small muted">No shared jobs on record yet.</p>'}
  <p class="tiny" style="margin:10px 0 0">Sample data. In the product this comes from jobs where two crews were on the same calendar event.</p></section>`;};

/* ---------- Riley ---------- */
V.riley=()=>{const R=S.riley;const pct=rileyPct();const st=R.stage;const goal=85;
 return `<div class="rhero card"><div class="row" style="gap:16px;align-items:center;flex-wrap:wrap">${riley(72)}<div class="grow"><div class="eyebrow">Crew scheduling assistant</div><h1 style="font-size:30px">Riley <span class="chip tape" style="vertical-align:middle">In training</span></h1>
  <p class="muted" style="margin:6px 0 0;max-width:640px">Riley watches how your schedulers pick crews and learns your company’s habits. It learns from every scheduler equally, and only from job, crew and client-request data, never personal traits.</p></div>${fbBtn('riley')}</div></div>
 <div class="stages">${STAGES.map(([n,d],i)=>`<div class="stage ${i<st?'done':i===st?'on':''}"><i>${i<st?'✓':i+1}</i><b>${n}</b><span class="tiny">${d}</span></div>`).join('')}</div>
 <div class="kpis k3" style="margin-top:14px"><div class="card kpi"><span>Decisions watched</span><b class="num">${R.observed}</b><span>Every confirm, override and optimizer review</span></div>
  <div class="card kpi"><span>Agrees with your team</span><b class="num">${pct}%</b><div class="meter"><i style="width:${pct}%"></i><em style="left:${goal}%"></em></div><span>Needs ${goal}% over the last 50 to move up</span></div>
  <div class="card kpi"><span>Next step</span><b style="font-size:20px">${STAGES[Math.min(3,st+1)][0]}</b><span>${pct>=goal?'Ready. Your admin approves it.':`${goal-pct} points to go`}</span>${isAdmin()&&st<3?`<button class="btn sm ${pct>=goal?'tape':'line'}" data-act="promote" style="margin-top:8px" ${pct>=goal?'':'title="Riley isn’t at 85% yet. You can still move it up."'}>Move Riley to ${STAGES[st+1][0]}</button>`:''}</div></div>
 <div class="split2">
 <section class="card pad"><h3 style="font-size:17px">What Riley has learned</h3><p class="tiny" style="margin:4px 0 10px">${isAdmin()?'Keep a habit to use it in Riley’s picks, or ignore it.':'Your admin decides which habits Riley keeps.'}</p>
  ${R.learned.map(p=>`<div class="lrn ${p.status}"><div class="grow"><div>${esc(p.text)}</div><div class="tiny">Seen in ${plural(p.n,'decision')} · ${p.status==='kept'?'Kept':p.status==='ignored'?'Ignored':'New, waiting for review'}</div></div>${isAdmin()?`<span class="row" style="gap:6px"><button class="btn sm ${p.status==='kept'?'tape':'line'}" data-act="lkeep" data-v="${p.id}">Keep</button><button class="btn sm line" data-act="lignore" data-v="${p.id}">Ignore</button></span>`:''}</div>`).join('')}</section>
 <div style="display:flex;flex-direction:column;gap:14px">
 <section class="card pad"><h3 style="font-size:17px">By job type</h3>${Object.entries(R.byType).map(([t,[n,a]])=>`<div class="hr"><span class="grow">${dimL(t)}</span><span class="pbar" style="width:120px"><i style="width:${Math.round(a/n*100)}%;background:var(--tape)"></i></span><span class="small num" style="min-width:90px;text-align:right">${a} of ${n} (${Math.round(a/n*100)}%)</span></div>`).join('')}</section>
 <section class="card pad"><h3 style="font-size:17px">Who Riley learns from</h3><p class="tiny" style="margin:4px 0 6px">Every scheduler counts the same. ${isAdmin()?'You can leave someone out, for example while they’re still training.':''}</p>
  ${Object.entries(R.from).map(([n,x])=>`<div class="hr"><span class="grow"><b>${esc(n)}</b> <span class="tiny">${plural(x.n,'decision')}</span></span>${isAdmin()?`<button class="tog ${x.on?'on':''}" data-act="rfrom" data-v="${esc(n)}" role="switch" aria-checked="${x.on}" aria-label="Learn from ${esc(n)}"><i></i></button>`:`<span class="tiny">${x.on?'Included':'Left out'}</span>`}</div>`).join('')}</section></div></div>`;};

/* ---------- audit log (admin) ---------- */
function auditRows(){const A=S.audit;let from=0,to=Infinity;const day=864e5;const base=Math.max(Date.now(),NOW);
 if(A.range==='7')from=base-7*day;else if(A.range==='30')from=base-30*day;else if(A.range==='custom'){if(A.from)from=new Date(A.from+'T00:00').getTime();if(A.to)to=new Date(A.to+'T23:59').getTime();}
 return S.log.filter(e=>e.ts>=from&&e.ts<=to&&(A.type==='all'||e.type===A.type));}
V.audit=()=>{if(!isAdmin())return `<div class="card pad" style="max-width:560px"><h2 style="font-size:22px">Admins only</h2><p class="muted">The audit log and its exports are for admins. Switch to Admin at the top to see it.</p></div>`;
 const A=S.audit;const rows=auditRows();const types=['all',...new Set(S.log.map(e=>e.type))];
 return `<div class="qhead"><div class="grow"><div class="eyebrow">Every decision, explained</div><h1>Audit log</h1><p class="muted" style="margin:6px 0 0;max-width:640px">Who picked which crew, the scores at the time, optimizer runs, overrides and their reasons, and changes to crew data and rules.</p></div>${fbBtn('audit')}</div>
 <section class="card pad safe"><div><b>Only job-related inputs</b><p class="small muted">Ratings, certifications, past job results, drive time, availability and what the client asked for. Never age, gender, race, national origin, religion or disability.</p></div>
  <div><b>A person makes the call</b><p class="small muted">Crew Board and Riley suggest. A scheduler confirms every assignment, and picking anyone other than the top crew needs a reason.</p></div>
  <div><b>Every score can be explained</b><p class="small muted">Each score and optimizer run is saved with its inputs and can be exported for review.</p></div></section>
 <section class="card pad afilt"><div class="fgroup"><span class="eyebrow">Time frame</span><div class="seg" role="group">${[['7','Last 7 days'],['30','Last 30 days'],['all','All time'],['custom','Custom']].map(([k,l])=>`<button aria-pressed="${A.range===k}" data-act="arange" data-v="${k}">${l}</button>`).join('')}</div>
  ${A.range==='custom'?`<label class="tiny" for="afrom">From</label><input type="date" class="in" id="afrom" data-afrom value="${A.from}" style="width:auto"><label class="tiny" for="ato">To</label><input type="date" class="in" id="ato" data-ato value="${A.to}" style="width:auto">`:''}</div>
  <div class="fgroup"><label class="eyebrow" for="atype">Type</label><select class="in" id="atype" data-atype style="width:auto">${types.map(t=>`<option value="${t}" ${A.type===t?'selected':''}>${t==='all'?'All types':t}</option>`).join('')}</select></div>
  <span class="grow"></span><button class="btn tape" data-act="exportlog">Download ${plural(rows.length,'entry')} (CSV)</button></section>
 <section class="card" style="margin-top:14px">${rows.map(e=>`<div class="lrow"><span class="chip ${e.type==='Decision'?'tape':e.type==='Optimizer'?'good':e.type==='Override'?'bad':e.type==='Edit'||e.type==='Crew data'?'warn':''}" style="min-width:84px;justify-content:center">${e.type}</span><div class="grow" style="min-width:0"><div>${esc(e.text)}</div><div class="tiny">${e.t} · ${esc(e.who)}${e.job?' · '+esc(e.job):''}</div>
  ${e.detail&&e.detail.ranking?`<details><summary>Scores at the time (${esc(e.detail.ranked)})</summary><div class="tscroll"><table class="atable"><tr><th>Crew</th><th>Score</th><th>Result</th></tr>${e.detail.ranking.slice(0,8).map(r=>`<tr><td>${esc(r.crew)}</td><td class="n">${r.score}</td><td>${r.ok?'Could take it':esc(r.fails.join('; '))}</td></tr>`).join('')}</table></div></details>`:''}
  ${e.detail&&e.detail.run?`<button class="lnk" data-act="runcsv" data-v="${S.log.indexOf(e)}">Download the optimizer run record</button>`:''}</div></div>`).join('')||'<p class="pad small muted">Nothing in this time frame.</p>'}</section>`;};

/* ---------- setup (admin) ---------- */
V.setup=()=>{if(!isAdmin())return `<div class="card pad" style="max-width:560px"><h2 style="font-size:22px">Admins only</h2><p class="muted">Setup is for admins. Switch to Admin at the top.</p></div>`;
 const act=activeCrews();const cnt=k=>act.filter(c=>missing(c).includes(k)).length;const held=act.filter(c=>!ready(c)).length;const imp=S.imp;
 return `<div class="qhead"><div class="grow"><div class="eyebrow">Admin</div><h1>Setup</h1><p class="muted" style="margin:6px 0 0;max-width:680px">Bring in your crew data, choose what Crew Board tracks, and set the rules and labels schedulers work with. Crew Board conforms to your data.</p></div>${fbBtn('setup')}</div>
 <div class="setgrid">
 <section class="card pad"><div class="row"><h3 class="grow">1. Crew data</h3><span class="chip good">Imported</span></div>
  <div class="srcbox"><b>${esc(imp.file)}</b><span class="tiny">${imp.when} · ${plural(imp.rows,'crew')} · ${imp.sheets.join(' + ')} merged on crew name · ${plural(DIMS.length,'rating column')}</span></div>
  <div class="row" style="flex-wrap:wrap;margin-top:10px"><label class="btn sm tape" for="xlsx">Upload a new spreadsheet</label><input type="file" id="xlsx" accept=".xlsx,.xls,.csv" hidden><button class="btn sm line" data-act="dbconnect">Connect a database</button></div>
  <h4 class="mh">What we found in the file</h4>${imp.findings.map(([k,t])=>`<div class="check ${k}"><i>${k==='ok'?'✓':'!'}</i><span>${esc(t)}</span></div>`).join('')}</section>
 <section class="card pad ${held?'needfix':''}"><div class="row"><h3 class="grow">2. Needed before matching</h3>${held?`<span class="chip warn">${plural(held,'crew')} held back</span>`:'<span class="chip good">All set</span>'}</div>
  <p class="small muted" style="margin:6px 0 10px">Crew Board won’t match a crew until these are filled in. You can always add crews and scores by hand.</p>
  ${REQUIRED.map(([k,l])=>{const n=cnt(k);return `<div class="hr"><span class="check ${n?'':'ok'}" style="padding:0"><i>${n?'!':'✓'}</i></span><span class="grow">${l}</span><span class="small ${n?'warnt':''}">${n?plural(n,'crew')+' missing':'Done'}</span>${n?`<button class="btn sm line" data-act="fixreq" data-v="${k}">Fix</button>`:''}</div>`;}).join('')}</section>
 <section class="card pad"><h3>3. Recommended fields</h3><p class="small muted" style="margin:6px 0 10px">Not in your file yet. Add the ones that matter to you and they show up on every crew.</p>
  ${RECOMMENDED.map(f=>`<div class="hr"><span class="grow"><b>${f.l}</b> <span class="chip">${f.use==='rule'?'Rule':f.use==='factor'?'Ranking factor':'Info'}</span><span class="tiny" style="display:block">${f.why}</span></span>${f.added?'<span class="chip good">Added</span>':`<button class="btn sm line" data-act="addfield" data-v="${f.k}">Add</button>`}</div>`).join('')}</section>
 <section class="card pad"><div class="row"><h3 class="grow">4. Ranking labels</h3><button class="btn sm tape" data-act="newlabel">+ New label</button></div><p class="small muted" style="margin:6px 0 10px">Schedulers can only pick from these. Only admins create or change them.</p>
  ${Object.entries(LABELS).map(([n,L])=>`<div class="lblrow"><div class="grow"><b>${esc(n)}</b><span class="tiny" style="display:block">${esc(L.d)} · top weights: ${Object.entries(L.w).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([k,v])=>`${flabel(k)} ${v}`).join(', ')}</span></div><button class="btn sm line" data-act="editlabel" data-v="${esc(n)}">Edit weights</button></div>`).join('')}</section>
 <section class="card pad"><h3>5. Rules</h3><p class="small muted" style="margin:6px 0 10px">Rules remove crews before ranking.</p>
  <div class="hr"><span class="grow">Minimum job-type rating</span><span class="stepper"><button data-act="rmin" data-v="-0.5" aria-label="Lower">−</button><b class="num">${S.rules.minType}</b><button data-act="rmin" data-v="0.5" aria-label="Raise">+</button></span></div>
  <div class="hr"><span class="grow">Let schedulers use crews not rated for the job type</span><button class="tog ${S.rules.untested?'on':''}" data-act="rule" data-v="untested" role="switch" aria-checked="${S.rules.untested}" aria-label="Allow untested crews"><i></i></button></div>
  <div class="hr"><span class="grow">Lead-safe painter for pre-1978 homes</span><button class="tog ${S.rules.lead?'on':''}" data-act="rule" data-v="lead" role="switch" aria-checked="${S.rules.lead}" aria-label="Lead-safe rule"><i></i></button></div>
  <div class="hr"><span class="grow">Important clients: quality and client-facing at least</span><span class="stepper"><button data-act="rimp" data-v="-1" aria-label="Lower">−</button><b class="num">${S.rules.impBar}</b><button data-act="rimp" data-v="1" aria-label="Raise">+</button></span></div>
  <div class="hr"><span class="grow">Furthest drive from home base</span><span class="stepper"><button data-act="rdrive" data-v="-5" aria-label="Shorter">−</button><b class="num">${S.rules.maxDrive} min</b><button data-act="rdrive" data-v="5" aria-label="Longer">+</button></span></div>
  <div class="hr"><span class="grow">Rain days hold exterior body coats</span><button class="tog ${S.rules.weather?'on':''}" data-act="rule" data-v="weather" role="switch" aria-checked="${S.rules.weather}" aria-label="Weather rule"><i></i></button></div></section>
 <section class="card pad"><h3>6. What makes a client important</h3><p class="small muted" style="margin:6px 0 10px">Set once during onboarding. Any trigger that’s on and true flags the client.</p>
  ${IMPT.map(([k,l])=>`<div class="hr"><span class="grow">${l}</span><button class="tog ${S.impOn[k]?'on':''}" data-act="impt" data-v="${k}" role="switch" aria-checked="${S.impOn[k]}" aria-label="${l}"><i></i></button></div>`).join('')}</section>
 <section class="card pad"><h3>7. Job labels on intake</h3><p class="small muted" style="margin:6px 0 10px">The only labels schedulers can put on a job.</p>
  <div class="chips">${JOB_LABELS.map(l=>`<span class="chip">${esc(l)} <button class="x0" data-act="rmlabel" data-v="${esc(l)}" aria-label="Remove ${esc(l)}">×</button></span>`).join('')}</div>
  <div class="row" style="margin-top:10px"><input class="in" id="newjl" placeholder="New label" maxlength="24"><button class="btn sm line" data-act="addjl">Add</button></div></section>
 <section class="card pad"><h3>8. Integrations</h3><p class="small muted" style="margin:6px 0 10px">Ready out of the box.</p>
  ${[['PaintScout','Sold estimates come in on their own. Write-back needs read-write API access.','Connected','good'],['CompanyCam','Project photos on every job.','Connected','good'],['Salesforce','Crew names already mapped from your file.','Connect','line'],['HubSpot','Clients, VIP tags and referral counts.','Connect','line'],['ServiceTitan','For HVAC and plumbing clients: read and write jobs and techs.','Connect','line'],['Google Calendar','20 crew calendars matched by name.','Connect','line']].map(([n,d,s,k])=>`<div class="hr"><span class="intlogo">${n[0]}</span><span class="grow"><b>${n}</b><span class="tiny" style="display:block">${d}</span></span>${k==='good'?`<span class="chip good">${s}</span>`:`<button class="btn sm line" data-act="connect" data-v="${n}">${s}</button>`}</div>`).join('')}</section>
 <section class="card pad"><h3>9. Client messages</h3><p class="small muted" style="margin:6px 0 10px">Languages schedulers can send in.</p>${Object.values(LANGS).map(l=>`<span class="chip good" style="margin-right:6px">✓ ${l}</span>`).join('')}</section>
 </div>`;};

/* ---------- ideas ---------- */
const IDEAS=[
 ['Priority: Otter (HVAC, plumbing, electrical)',[['Revenue per technician','Who sells the most on site, for on-demand service lines. A ranking factor and a KPI on every tech’s profile, so high sellers get the calls with the most upside.'],['HVAC day board','Several jobs per tech per day in the day view, matched on job type, distance and equipment. Built on the same calendar, crew rows become tech rows.'],['Stocked-van dispatch','For on-demand calls: the tech quotes and does the work on site, so matching also checks what’s on the van.']]],
 ['In this prototype',[['Admin and scheduler roles','Admins own crew data, rules, labels and the audit log. Schedulers pick from the labels admins create.'],['Riley, in training','An assistant that learns from every scheduler’s picks and overrides, and moves up only with admin approval.'],['Crew data that conforms','Upload any crew spreadsheet. Crew Board maps the columns, fixes Excel date mix-ups, and holds back crews missing what matching needs.'],['Optimizer with feedback','Keep or reject each move with a reason, then re-run. Every run is saved and exportable.'],['Open-source calendar','Event Calendar (MIT): crew rows, day, week and month views, drag and drop, split visits.'],['Ido’s KPIs','Painter days and jobs scheduled, jobs waiting, and per-crew reviews, days vs sold and pay per painter day.']]],
 ['Next',[['Write back to PaintScout','Dates and crew on the job record once read-write access is in place.'],['Learn ratings from results','Suggest rating changes when a crew keeps beating or missing its sold days.'],['Jobs running over','Flag a job that’s running long and push what comes next, with a manual override.'],['High-rise and building hours','Restricted hours from PaintScout flow into the schedule.']]]];
V.ideas=()=>`<div class="qhead"><div class="grow"><div class="eyebrow">Idea bank</div><h1>Where this could go</h1></div></div>${IDEAS.map(([cat,list])=>`<h2 class="icat">${cat}</h2><div class="igrid">${list.map(([t,d])=>`<article class="card idea"><div class="row"><span class="chip ${cat.startsWith('Priority')?'bad':cat==='Next'?'good':'tape'}">${cat.startsWith('Priority')?'Priority · Otter':cat}</span><span class="grow"></span>${fbBtn('idea','')}</div><h3>${t}</h3><p>${d}</p></article>`).join('')}</div>`).join('')}`;
S.imp={file:'crews-with-ratings.xlsx',when:'Oct 25 by Ido D.',rows:21,sheets:['Crew','Crew Ratings'],findings:[
 ['ok','Merged the Crew and Crew Ratings sheets on crew name. 20 matched. “Ido Test” is only in Crew, so it was set to inactive.'],
 ['ok','Found 18 rating columns in 3 groups: 6 job types, 5 skills, 7 attributes. They’re now the ratings Crew Board ranks on.'],
 ['wn','15 crew sizes were turned into dates by Excel (for example “2-3” became Feb 3). Fixed and shown as ranges. Please confirm.'],
 ['wn','Status was blank for every crew. Set all to active except Ido Test.'],
 ['wn','Home base isn’t in the file. Sample bases were added so drive times work. Please confirm, and add one for Fabian.'],
 ['wn','Only 4 of 20 crews have ratings. Blank means untested, so the other 16 can’t be matched until rated.'],
 ['ok','Emails, phones, Salesforce and Google Calendar names stored as info only.']]};

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
 o.typeEv=(t.match(/cabinet|wallpaper|HOA common|condo|office|commercial|venetian|faux|decorative|exterior|stucco|fascia|soffit|siding|interior/i)||[])[0]||null;if(o.typeEv)m(new RegExp(o.typeEv,'i'),'type');
 o.type=cab?'cabinets':/wallpaper/i.test(t)?'wallpaper':/\b(HOA common|condo|office|commercial)\b/i.test(t)?'commercial':/venetian|faux|decorative/i.test(t)?'decorative':/exterior|stucco|fascia|soffit|siding/i.test(t)?'exterior':'interior';
 r=m(/(?:built|year built)\s*:?\s*(?:in\s*)?(\d{4})/i,'built');o.built=r?+r[1]:null;
 r=m(/(\d{2,4})\s*(?:labor\s*)?(?:hrs|hours)\b/i,'hours')||m(/(?:labor|hours)\s*:?\s*(\d{2,4})/i,'hours');o.hours=r?+r[1]:null;
 r=m(/(?:total|price)\s*:?\s*\$\s?([\d,]+)/i,'value');o.value=r?+r[1].replace(/,/g,''):null;
 const mon={oct:'10',nov:'11',dec:'12'};
 r=m(/(?:by|before)\s+(Oct|Nov|Dec)[a-z]*\.?\s+(\d{1,2})/i,'deadline');o.deadline=r?`2026-${mon[r[1].toLowerCase()]}-${r[2].padStart(2,'0')}`:null;
 r=m(/(?:earliest start|start any time after|start after|starting)\s*:?\s*(Oct|Nov|Dec)[a-z]*\.?\s+(\d{1,2})/i,'earliest');o.earliest=r?`2026-${mon[r[1].toLowerCase()]}-${r[2].padStart(2,'0')}`:null;
 const sk={drywall:/plaster|drywall|skim|crack/i,prep:/pressure[- ]wash|patch|prep|degrease|sand\b|repair/i,cutin:/cut lines|cut-in|crisp/i,spray:/\bspray/i,color:/color and detail|color match|particular|designer|fine finish/i};
 o.skills=Object.keys(sk).filter(k=>m(sk[k],k));
 o.lang=/creole|kreyòl/i.test(t)?'ht':/spanish/i.test(t)?'es':/english/i.test(t)?'en':null;if(o.lang!=='en')m(/spanish|creole/i,'lang');
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
  earliest:isoToIdx(pick('earliest'),27),deadline:isoToIdx(pick('deadline'),34),colors:(pick('colors')||[]).map(c=>[c.name||String(c),KNOWN[c.name]||hashColor(c.name||String(c))]).slice(0,4),
  skills:(pick('skills')||[]).filter(k=>dimsOf('skill').some(x=>x.k===k)),lang:['en','es','ht'].includes(pick('lang'))?pick('lang'):'',hoa:!!pick('hoa'),impOn:!!pick('important'),important:pick('important')||'',labels:[],ev,method,sig0:{}};
 const has=k=>!!ev[k];const aiOr=(k,v)=>v!=null&&v!==''?(has(k)?'ai':'guessed'):'missing';
 ['client','area','built','hours','value','earliest','deadline'].forEach(k=>src[k]=aiOr(k,d[k]));src.type=has('type')?'ai':'missing';src.lang=d.lang?'ai':'missing';
 if(smp&&smp.ps){Object.entries(smp.ps).forEach(([k,v])=>{if(k in d){d[k]=v;src[k]='ps';}});}
 if(smp&&smp.human){Object.entries(smp.human).forEach(([k,v])=>{if(k==='by')return;d[k]=k==='earliest'||k==='deadline'?isoToIdx(v,27):v;src[k]='human';});}
 clientHistoryFill(d,src);if(d.hoa)d.labels.push('HOA');
 d.src=src;return d;}
function markText(text,ev){const t=text.replace(/\[/g,'(').replace(/\]/g,')').slice(0,3000);
 const spans=Object.entries(ev||{}).map(([k,q])=>[MARK[k]||k,String(q||'').replace(/\[/g,'(').replace(/\]/g,')')]).filter(([k,q])=>k&&q).map(([k,q])=>[k,q,t.indexOf(q)]).filter(x=>x[2]>=0).sort((a,b)=>a[2]-b[2]);
 let out='',pos=0;spans.forEach(([k,q,i])=>{if(i<pos)return;out+=t.slice(pos,i)+`[${k}|${q}]`;pos=i+q.length;});return out+t.slice(pos);}
function jobFromDraft(d,id){return{id,title:d.title||'New job',client:d.client||'New client',area:d.area||'Miami',type:d.type,ext:d.type==='exterior',built:+d.built||2000,hours:Math.max(4,+d.hours||8),value:+d.value||0,
 earliest:+d.earliest,deadline:+d.deadline,lang:d.lang||'en',hoa:!!d.hoa,skills:d.skills.slice(),labels:d.labels.slice(),sig:{...(d.sig0||{}),manual:d.impOn?(d.important||'Flagged as important'):null},
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
function draftPreview(){const d=S.add.draft;JOBS.__draft=jobFromDraft({...d,earliest:d.earliest??1,deadline:d.deadline??34},'__draft');let r=[];try{r=rank('__draft');}finally{delete JOBS.__draft;}return r;}
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
 const missing=!d.hours||!d.area||d.earliest==null||d.deadline==null;const auto=impWhy({sig:d.sig0||{},value:+d.value||0});
 const dateFld=(k,label)=>fld(k,label,`<button class="in datebtn" data-act="mcopen" data-v="${k}" aria-expanded="${A.pick===k}">${ICON.cal}<span>${d[k]==null?'<em class="faint">Not in the estimate · pick a date</em>':dlabel(d[k])}</span></button>${d[k]==null?`<button class="lnk" style="margin-left:8px" data-act="datequick" data-v="${k}">${k==='earliest'?'As soon as possible':'In 3 weeks'}</button>`:''}${A.pick===k?miniCal(k,d):''}`,k==='deadline'?'due':'start');
 return head+`<div class="split addsplit">
 <div class="lcol">${A.ps||A.human?`<section class="card pad"><h3 style="font-size:16px;margin-bottom:6px">From PaintScout</h3>
  ${A.ps?`<div class="hr"><span class="src-chip src-ps">PaintScout</span><span class="small grow">Client, area, sold price${A.ps.sold?`, sold ${A.ps.sold}`:''}</span></div>`:''}
  ${A.human?`<div class="hr"><span class="src-chip src-h">Typed by ${esc(A.human.by)}</span><span class="small grow">${Object.keys(A.human).filter(k=>k!=='by').map(k=>k==='hours'?`Crew hours: ${A.human.hours}`:k==='earliest'?`Start window: after ${dlabel(isoToIdx(A.human.earliest))}`:k).join(' · ')}</span></div>`:''}
  <p class="tiny" style="margin:6px 0 0">People’s entries win over what’s read from the estimate text.</p></section>`:''}
 <section class="card pad"><div class="src">${esc(A.file||'')} · ${A.method==='claude'?'read by Riley':'read with built-in rules'}</div><h3 style="font-size:16px;margin-bottom:8px">The estimate</h3>
  <p class="writeup" style="margin:0;white-space:pre-line">${wu}</p><p class="tiny" style="margin:10px 0 0">Underlined text is where each field came from. Hover a field to find it.</p></section></div>
 <div style="display:flex;flex-direction:column;gap:14px">
 <section class="card pad"><div class="row"><h3 style="font-size:16px" class="grow">The job</h3><span class="srclegend">${['ps','human','ai','history','missing'].map(srcChip).join('')}</span></div>
  ${fld('title','Job name',`<input class="in" data-dk="title" value="${esc(d.title)}" id="d-title">`,'type')}
  ${fld('client','Client',`<input class="in" data-dk="client" value="${esc(d.client)}" id="d-client">`)}
  ${fld('area','Area',`<select class="in" data-dk="area" id="d-area"><option value="">Choose…</option>${Object.keys(GEO).map(a=>`<option ${d.area===a?'selected':''}>${a}</option>`).join('')}</select>`)}
  ${fld('type','Job type',`<select class="in" data-dk="type" id="d-type">${dimsOf('job').map(x=>`<option value="${x.k}" ${d.type===x.k?'selected':''}>${x.l}</option>`).join('')}</select>`,'ext')}
  ${fld('built','Year built',`<input class="in num" type="number" data-dk="built" value="${d.built||''}" id="d-built" placeholder="e.g. 1974">${+d.built&&+d.built<1978?'<span class="tiny" style="display:block;margin-top:3px">Before 1978: lead-safe painter required</span>':''}`)}
  ${fld('hours','Crew hours',`<input class="in num" type="number" data-dk="hours" value="${d.hours||''}" id="d-hours" placeholder="Needed to schedule">${d.hours?`<span class="tiny" style="display:block;margin-top:3px">${Math.round(d.hours/8*10)/10} painter days</span>`:''}`)}
  ${fld('value','Sold price',`<input class="in num" type="number" data-dk="value" value="${d.value||''}" id="d-value" placeholder="$">`)}
  ${dateFld('earliest','Earliest start')}${dateFld('deadline','Finish by')}
  ${fld('lang','Client’s language',`<select class="in" data-dk="lang" id="d-lang">${d.lang?'':'<option value="" selected>Not in the estimate</option>'}${Object.entries(LANGS).map(([k,l])=>`<option value="${k}" ${d.lang===k?'selected':''}>${l}</option>`).join('')}</select>`,'lang')}</section>
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
  ${missing?`<div class="tiny" style="margin-top:8px">Add ${[!d.hours&&'crew hours',!d.area&&'area',d.earliest==null&&'earliest start',d.deadline==null&&'finish-by date'].filter(Boolean).join(', ')} to continue. We only fill in what the estimate says.</div>`:''}</section></div></div>`;};
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

/* ============ modals ============ */
const MW=(label,inner,wide)=>`<div class="ov" data-act="closemodal"><div class="card modal ${wide?'wide':''}" role="dialog" aria-modal="true" aria-label="${esc(label)}"><button class="x noprint" data-act="closemodal2" aria-label="Close">×</button>${inner}</div></div>`;
const M={};
const REASONS=['Riley recommended','Optimizer recommended','Client asked for this crew','Top crew is needed on another job','Crew knows this home or client','Pairing or training','Schedule or travel reason','Other'];
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
  let best=0;for(let i=0;i<Math.min(8,rows.length);i++){const r=rows[i]||[];const strs=r.filter(v=>typeof v==='string'&&v.trim()).length;if(strs>=3&&strs>best&&r.some(v=>typeof v==='string'&&/^(crew|name)$/i.test(v.trim()))){h=i;best=strs;}}
  if(h<0)return;const head=rows[h];const gr=h>0?rows[h-1]:[];let g=null;const groups=head.map((_,j)=>{if(gr&&typeof gr[j]==='string'&&gr[j].trim())g=gr[j].trim();return g;});
  const data=rows.slice(h+1).filter(r=>r&&r[head.findIndex(v=>typeof v==='string'&&/^(crew|name)$/i.test(v.trim()))]);sheets.push({name:n,h,head,groups,rows:data});});
 if(!sheets.length)throw new Error('nohead');
 const cols=[];sheets.forEach(s=>s.head.forEach((hd,j)=>{if(hd==null||String(hd).trim()==='')return;const head=String(hd).trim();const grp=s.groups[j]||'';const vals=s.rows.map(r=>r[j]).filter(v=>v!=null&&v!=='');const ex=vals[0] instanceof Date?'(date) '+vals[0].toISOString().slice(5,10):String(vals[0]??'').slice(0,24);
  let as='info';const num=vals.length&&vals.every(v=>typeof v==='number'&&v>=0&&v<=5);
  if(/^(crew|name)$/i.test(head))as='name';else if(/salesforce/i.test(head))as='sfName';else if(/e-?mail/i.test(head))as='email';else if(/phone/i.test(head))as='phone';else if(/calendar/i.test(head))as='gcal';else if(/status/i.test(head))as='status';else if(/size/i.test(head))as='size';else if(/base|location|city|area/i.test(head))as='base';else if(/note/i.test(head))as='notes';
  else if(/job/i.test(grp))as='r-job';else if(/skill/i.test(grp))as='r-skill';else if(/attrib/i.test(grp)||num)as='r-attr';
  if(as.startsWith('r-')){const kd=DIMS.find(d=>d.k===dimKey(head));if(kd)as='r-'+kd.g;}
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
 case 'unschedule':{const ms=buildMsgs(S.job,'cancel');S.place[S.job].status='draft';log('Decision',`Unscheduled ${J().title}. Back to draft.`,J().title);render();openSend(`${J().title} is unscheduled`,ms,'Back to draft.');break;}
 case 'confirm':{const p=S.place[S.job];const R=rank(S.job);const best=R.find(x=>x.ok);if(best&&best.crew!==p.crew&&!S.override[S.job]&&!autoReason(S.job)){const me=R.find(x=>x.crew===p.crew);S.modal={type:'reason',crew:p.crew,pick:null,note:'',title:`${crewById(p.crew).name} isn’t the top-ranked crew`,sub:`${crewById(best.crew).name} scored ${best.score}, ${crewById(p.crew).name} scored ${me.score}. That’s fine. Add a reason so the decision is on record.`,cta:'Confirm with this reason'};drawLayer();break;}doConfirm(best&&best.crew!==p.crew?(S.override[S.job]||autoReason(S.job)):null);break;}
 case 'msg':S.msgTab=v;render();break;
 case 'split':{const p=S.place[S.job];if(p.segs.length>1){setPlace(S.job,p.crew,pS(p),p.status);}else{splitVisits(S.job);}render();toast(p.segs.length>1?'Split. Drag the second visit to where you want it':'Back to one visit');break;}
 case 'planall':planAll();render();break;
 case 'confirmall':{const n=m.items.length;m.items.forEach(it=>{S.place[it.jid].status='scheduled';rileyLearn(it.jid,it.crew);log('Decision',`Confirmed ${crewById(it.crew).name} for ${JOBS[it.jid].title} through Plan all. Top available crew, match ${it.score}.`,JOBS[it.jid].title,snap(it.jid));});S.modal=null;render();toast(`${plural(n,'job')} confirmed. Crews and clients notified`);break;}
 case 'reviewall':S.modal=null;S.view='cal';render();window.scrollTo(0,0);break;
 case 'closemodal':if(e.target===b){S.modal=null;drawLayer();}break;
 case 'closemodal2':S.modal=null;drawLayer();break;
 case 'hideothers':S.hideOthers=!S.hideOthers;render();break;
 case 'allcrews':S.allCrews=!S.allCrews;render();break;
 case 'calview':S.calF.view=v;S.calF.date=null;render();break;
 case 'zoom':S.calF.zoom=Math.max(0,Math.min(2,S.calF.zoom+ +v));render();break;
 case 'calshow':S.calF.show=v;render();break;
 case 'calgroup':S.calF.group=v;render();break;
 case 'calopen':S.calF.open=!S.calF.open;render();break;
 case 'movepick':m.pick=v;drawLayer();break;
 case 'moveok':{if(m.kind==='fixed'){const bk=BOOKS.find(x=>x.id===m.id);S.shift[m.id]=(S.shift[m.id]||0)+m.d;if(m.crew!==crewOfBooking(bk))S.reassign[m.id]=m.crew;log('Decision',`Moved confirmed job ${bk.name} to ${crewById(m.crew).name}, ${dlabel(bk.s+S.shift[m.id])}. Reason: ${m.pick}. Client texted.`,bk.name);}
  else{const p=S.place[m.id];if(p.segs.length>1&&m.crew===p.crew){p.segs[m.seg][0]+=m.d;p.segs[m.seg][1]+=m.d;}else p.segs=p.segs.map(([x,z])=>[x+m.d,z+m.d]);p.crew=m.crew;log('Decision',`Moved confirmed job ${JOBS[m.id].title} to ${crewById(m.crew).name}, ${dlabel(pS(p))}. Reason: ${m.pick}. Client texted.`,JOBS[m.id].title);}
  S.modal=null;render();openSend('Schedule change',m.kind==='fixed'?buildFixedMsgs(BOOKS.find(x=>x.id===m.id),'move'):buildMsgs(m.id,'move'),'Moved.');break;}
 case 'optimize':S.ofb={reject:{},pin:{},noMove:{},block:[]};S.modal=optimize();drawLayer();break;
 case 'lock':S.lock=Math.max(3,Math.min(7,S.lock+ +v));S.modal=optimize();drawLayer();break;
 case 'optsel':m.sel[+v]=b.dataset.k;if(b.dataset.k==='keep')delete m.why[+v];drawLayer();break;
 case 'optwhy':{const i=+v;m.why[i]=b.dataset.l;m.whyk=m.whyk||{};m.whyk[i]=b.dataset.k;drawLayer();break;}
 case 'reopt':{const F=S.ofb;const kept=[];m.moves.forEach((mv,i)=>{if(m.sel[i]==='keep'){kept.push(mv);return;}const k=m.whyk[i];
   if(k==='crew')(F.reject[mv.jid]=F.reject[mv.jid]||[]).push(mv.crew);else if(k==='nomove'&&mv.shift)F.noMove[mv.shift.id]=true;else if(k==='dates')F.block.push({jid:mv.jid,s:mv.s,e:mv.e});else if(k==='busy')F.block.push({crew:mv.crew,s:mv.s,e:mv.e});});
  log('Optimizer',`Rejected ${plural(m.moves.length-kept.length,'move')} in run ${m.run}: ${m.moves.map((mv,i)=>m.sel[i]==='reject'?`${JOBS[mv.jid].title} on ${crewById(mv.crew).name} (${m.why[i]})`:null).filter(Boolean).join('; ')}. Re-optimizing.`);
  S.riley.observed+=m.moves.filter((x,i)=>m.sel[i]==='reject').length;
  S.modal=optimize({kept,before:m.before});drawLayer();break;}
 case 'optapply':{const items=applyMoves(m);const ms=items.filter(x=>x.shift).flatMap(x=>buildFixedMsgs(BOOKS.find(b=>b.id===x.shift.id),'move'));S.modal=null;render();openSend('Confirmed jobs the optimizer moved',ms,`${plural(items.length,'job')} placed as drafts.`);break;}
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

/* ================= v5 additions ================= */
REQUIRED.splice(3,0,['region','Region (county or state)']);
const _missing=missing;missing=function(c){const m=_missing(c);if(!c.f.region&&!m.includes('region'))m.splice(m.length&&m[m.length-1]==='jobRating'?m.length-1:m.length,0,'region');return m;};
RECOMMENDED.forEach(f=>f.tier=['languages','leadSafe','pay','insurance'].includes(f.k)?'rec':'nice');
RECOMMENDED.splice(2,0,{k:'channel',l:'How to reach the crew lead',why:'WhatsApp, text or email, and their language',use:'info',added:true,tier:'rec'});
RECOMMENDED.push({k:'photo',l:'Crew photo',why:'Helps clients recognize who’s at the door',use:'info',added:false,tier:'nice'});
S.comm={review:true,triggers:{confirm:{crew:true,client:true,hoa:true},move:{crew:true,client:true,hoa:false},cancel:{crew:true,client:true,hoa:false},reminder:{crew:true,client:true,hoa:false},rain:{crew:true,client:true,hoa:false}}};
const TRIG={confirm:'Job confirmed',move:'Job moved',cancel:'Job unscheduled',reminder:'Day-before reminder',rain:'Rain delay'};
S.msgEdit={};S.msgTo={};S.msgCh={};
S.comms=[
 {ts:NOW-0.9*864e5,t:'Oct 24, 3:14 PM',trigger:'confirm',role:'crew',to:'Rigo (crew lead)',channel:'text',lang:'es',job:'Ortega exterior',by:'Carla M. (Scheduler)',text:'Nuevo trabajo: Ortega exterior\nmié 11 nov a mar 17 nov, empieza 8am\nResponda SÍ para aceptar.'},
 {ts:NOW-0.9*864e5,t:'Oct 24, 3:14 PM',trigger:'confirm',role:'client',to:'Ortega family',channel:'text',lang:'en',job:'Ortega exterior',by:'Carla M. (Scheduler)',text:`Hello, this is ${COMPANY}. Your exterior painting project is scheduled to begin Wednesday, November 11. Please reply with any questions. Thank you.`}];
/* ---------- messages in four languages ---------- */
const DAYN={en:{Mon:'Monday',Tue:'Tuesday',Wed:'Wednesday',Thu:'Thursday',Fri:'Friday'},es:{Mon:'lunes',Tue:'martes',Wed:'miércoles',Thu:'jueves',Fri:'viernes'},ht:{Mon:'lendi',Tue:'madi',Wed:'mèkredi',Thu:'jedi',Fri:'vandredi'},pt:{Mon:'segunda',Tue:'terça',Wed:'quarta',Thu:'quinta',Fri:'sexta'}};
const MONN={en:{Oct:'October',Nov:'November',Dec:'December'},es:{Oct:'octubre',Nov:'noviembre',Dec:'diciembre'},ht:{Oct:'oktòb',Nov:'novanm',Dec:'desanm'},pt:{Oct:'outubro',Nov:'novembro',Dec:'dezembro'}};
const dtL=(i,l)=>{const x=DL[Math.min(DL.length-1,i)];return l==='en'?`${DAYN.en[x.dow]}, ${MONN.en[x.m]} ${x.n}`:l==='es'?`${DAYN.es[x.dow]} ${x.n} de ${MONN.es[x.m]}`:l==='pt'?`${DAYN.pt[x.dow]}, ${x.n} de ${MONN.pt[x.m]}`:`${DAYN.ht[x.dow]} ${x.n} ${MONN.ht[x.m]}`;};
const KIND={en:{exterior:'exterior painting',interior:'interior painting',cabinets:'cabinet painting',commercial:'painting',wallpaper:'wallpaper',decorative:'decorative painting'},es:{exterior:'pintura exterior',interior:'pintura interior',cabinets:'pintura de gabinetes',commercial:'pintura',wallpaper:'papel tapiz',decorative:'pintura decorativa'},ht:{exterior:'penti eksteryè',interior:'penti enteryè',cabinets:'penti kabinè',commercial:'penti',wallpaper:'papye pent',decorative:'penti dekoratif'}};
function clientMsg(lang,trig,names,kind,s,e,crewName,ext){const k=(KIND[lang]||KIND.en)[kind]||kind;
 if(lang==='es'){if(trig==='move')return `Hola ${names.replace('&','y')}, le saluda ${COMPANY}. Hemos reprogramado su proyecto de ${k}: ahora comienza el ${dtL(s,'es')} y terminará el ${dtL(e,'es')}. Disculpe las molestias. Responda a este mensaje si tiene alguna pregunta.`;
  if(trig==='cancel')return `Hola ${names.replace('&','y')}, le saluda ${COMPANY}. Necesitamos ajustar la fecha de inicio de su proyecto de ${k}. Nuestro equipo le contactará pronto con una nueva fecha. Gracias por su paciencia.`;
  return `Hola ${names.replace('&','y')}, le saluda ${COMPANY}. Su proyecto de ${k} está programado para comenzar el ${dtL(s,'es')}, con fecha estimada de finalización el ${dtL(e,'es')}. El equipo de ${crewName} llegará a las 8:00 a. m.${ext?' Si el clima afecta el calendario, le avisaremos con anticipación.':''} Responda a este mensaje si tiene alguna pregunta. Gracias por confiar en nosotros.`;}
 if(lang==='ht'){if(trig==='move')return `Bonjou ${names.replace('&','ak')}, se ${COMPANY}. Nou chanje dat travay ${k} ou a: kounye a li kòmanse ${dtL(s,'ht')} epi l ap fini ${dtL(e,'ht')}. Eskize nou pou deranjman an. Tanpri reponn mesaj sa a si w gen kesyon.`;
  if(trig==='cancel')return `Bonjou ${names.replace('&','ak')}, se ${COMPANY}. Nou bezwen chanje dat kòmansman travay ${k} ou a. Ekip nou an ap kontakte w byento ak yon nouvo dat. Mèsi pou pasyans ou.`;
  return `Bonjou ${names.replace('&','ak')}, se ${COMPANY}. Travay ${k} ou a pwograme pou kòmanse ${dtL(s,'ht')}, epi nou prevwa fini ${dtL(e,'ht')}. Ekip ${crewName} ap rive a 8:00 AM.${ext?' Si move tan chanje orè a, n ap kontakte w davans.':''} Tanpri reponn mesaj sa a si w gen nenpòt kesyon. Mèsi paske w fè nou konfyans.`;}
 if(trig==='move')return `Hello ${names.replace('&','and')}, this is ${COMPANY}. Your ${k} project has been rescheduled to begin ${dtL(s,'en')}, with completion expected by ${dtL(e,'en')}. We apologize for any inconvenience. Please reply with any questions.`;
 if(trig==='cancel')return `Hello ${names.replace('&','and')}, this is ${COMPANY}. We need to adjust the start date for your ${k} project. Our team will contact you shortly with a new date. Thank you for your patience.`;
 return `Hello ${names.replace('&','and')}, this is ${COMPANY}. Your ${k} project is scheduled to begin ${dtL(s,'en')}, with completion expected by ${dtL(e,'en')}. ${crewName}’s crew will arrive at 8:00 AM.${ext?' If weather affects the schedule, we will let you know in advance.':''} Please reply to this message with any questions. Thank you for choosing us.`;}
function crewMsg(lang,trig,title,s,e,area,ext,hoa,lead,colors,pay,pd,second){const ds=`${dtL(s,lang)}${e!==s?' – '+dtL(e,lang):''}`;
 const L={en:{n:'New job',m:'Schedule change',c:'Cancelled',start:'start 8am',addr:'address and photos in the app',ext:'Exterior. Wash day 1, body coats on dry days only.',hoa:'HOA hours 8 to 5.',lead:'Lead-safe setup required.',col:'Colors',pay:'Job pay',pdw:'painter days',yes:'Reply YES to accept.',off:'is off your schedule for now. We’ll send a new date.',now:'now',sec:'You’re sharing this job with another crew.'},
  es:{n:'Nuevo trabajo',m:'Cambio de horario',c:'Cancelado',start:'empieza 8am',addr:'dirección y fotos en la app',ext:'Exterior. Lavado el día 1, capas solo en días secos.',hoa:'Horario HOA de 8 a 5.',lead:'Requiere trabajo seguro con plomo.',col:'Colores',pay:'Pago',pdw:'días-pintor',yes:'Responda SÍ para aceptar.',off:'sale de su calendario por ahora. Le enviaremos una nueva fecha.',now:'ahora',sec:'Comparte este trabajo con otro equipo.'},
  pt:{n:'Novo trabalho',m:'Mudança de agenda',c:'Cancelado',start:'começa 8h',addr:'endereço e fotos no app',ext:'Exterior. Lavar no dia 1, demãos só em dias secos.',hoa:'Horário do HOA das 8 às 17.',lead:'Exige trabalho seguro com chumbo.',col:'Cores',pay:'Pagamento',pdw:'dias-pintor',yes:'Responda SIM para aceitar.',off:'saiu da sua agenda por enquanto. Enviaremos uma nova data.',now:'agora',sec:'Você divide este trabalho com outra equipe.'},
  ht:{n:'Nouvo travay',m:'Chanjman orè',c:'Anile',start:'kòmanse 8am',addr:'adrès ak foto nan app la',ext:'Eksteryè. Lave jou 1, kouch yo sèlman jou ki sèk.',hoa:'Lè HOA 8 a 5.',lead:'Fòk yo travay san danje ak plon.',col:'Koulè',pay:'Peman',pdw:'jou-pent',yes:'Reponn WI pou aksepte.',off:'pa nan orè ou pou kounye a. N ap voye yon nouvo dat.',now:'kounye a',sec:'Ou pataje travay sa a ak yon lòt ekip.'}}[lang]||{};
 if(trig==='cancel')return `${L.c}: ${title} (${ds}) ${L.off}`;
 if(trig==='move')return `${L.m}: ${title}\n${L.now} ${ds}, ${L.start}\n${L.yes}`;
 return `${L.n}: ${title}\n${ds}, ${L.start}\n${area}, ${L.addr}\n${ext?L.ext:''}${hoa?' '+L.hoa:''}\n${lead?L.lead+'\n':''}${L.col}: ${colors}\n${L.pay}: ${money(pay)} (${pd} ${L.pdw})${second?'\n'+L.sec:''}\n${L.yes}`.replace(/\n\n/g,'\n');}
function buildMsgs(jid,trig){const job=JOBS[jid];const p=S.place[jid];const T=S.comm.triggers[trig]||{};const out=[];if(!p)return out;const s=pS(p),e=pE(p);const cs=crewsOf(p.crew,p.extra);const names=job.client.replace(/ \w+$/,'');
 if(T.crew)cs.forEach((cid,i)=>{const c=crewById(cid);const share=cs.length>1?Math.round(painterDays(job)*(planSize(c)||1)/comboSize(p.crew,p.extra)*10)/10:painterDays(job);const pay=Math.round(share*(hist(cid)?hist(cid).costSold:AVG_COST)/10)*10;const lang=c.f.clang||'es';
  out.push({key:'crew:'+cid,role:'crew',to:`${c.name} (crew lead)`,channel:c.f.channel||'whatsapp',lang,langs:['en','es','pt','ht'],job:job.title,trigger:trig,gen:l=>crewMsg(l,trig,job.title,s,e,job.area,job.ext,job.hoa,job.built<1978,job.colors.map(x=>x[0]).join(', '),pay,share,cs.length>1&&i>0)});});
 if(T.client)out.push({key:'client',role:'client',to:job.client,channel:'text',lang:S.msgLang[jid]||job.lang,langs:['en','es','ht'],job:job.title,trigger:trig,gen:l=>clientMsg(l,trig,names,job.type,s,e,crewById(p.crew).name,job.ext)});
 if(T.hoa&&job.hoa)out.push({key:'hoa',role:'hoa',to:'HOA office',channel:'email',lang:'en',langs:['en'],job:job.title,trigger:trig,gen:()=>`Work notice for the ${job.client.split(' ').slice(-1)[0]} residence: exterior painting ${dtL(s,'en')} to ${dtL(e,'en')}, weekdays 8am to 5pm. Approved colors on file. ${COMPANY}.`});
 out.forEach(m=>{const ek=jid+':'+m.key;m.lang=S.msgTo[ek+':lang']||m.lang;m.channel=S.msgCh[ek]||m.channel;m.text=S.msgEdit[ek]!=null?S.msgEdit[ek]:m.gen(m.lang);m.edited=S.msgEdit[ek]!=null;m.ek=ek;});return out;}
function buildFixedMsgs(b,trig){const c=crewById(crewOfBooking(b));const s=b.s+(S.shift[b.id]||0),e=b.e+(S.shift[b.id]||0);const T=S.comm.triggers[trig]||{};const out=[];
 if(T.crew)out.push({key:'crew',role:'crew',to:`${c.name} (crew lead)`,channel:c.f.channel||'whatsapp',lang:c.f.clang||'es',langs:['en','es','pt','ht'],job:b.name,trigger:trig,gen:l=>crewMsg(l,trig,b.name,s,e,'',false,false,false,'',0,0)});
 if(T.client)out.push({key:'client',role:'client',to:`${b.name} client`,channel:'text',lang:'en',langs:['en','es','ht'],job:b.name,trigger:trig,gen:l=>clientMsg(l,trig,'',b.what.toLowerCase(),s,e,c.name,b.what==='Exterior').replace(/ ,/,',').replace('Hello ,','Hello,').replace('Hola ,','Hola,').replace('Bonjou ,','Bonjou,')});
 out.forEach(m=>{m.text=m.gen(m.lang);m.ek='bk:'+b.id+':'+m.key;});return out;}
function openSend(title,msgs,toastAfter){if(!msgs.length){if(toastAfter)toast(toastAfter);return;}
 if(!S.comm.review){sendAll(msgs);toast((toastAfter||'')+` ${plural(msgs.length,'message')} sent`);return;}
 S.modal={type:'send',title,msgs,toastAfter};drawLayer();}
function sendAll(msgs){msgs.forEach(m=>S.comms.unshift({ts:Date.now(),t:stamp(),trigger:m.trigger,role:m.role,to:m.to,channel:m.channel,lang:m.lang,job:m.job,by:ME(),text:m.text}));
 log('Message',`Sent ${plural(msgs.length,'message')} (${TRIG[msgs[0].trigger].toLowerCase()}) for ${msgs[0].job}: ${msgs.map(m=>`${m.to} by ${CHANNELS[m.channel]}`).join('; ')}.`,msgs[0].job);}
M.send=m=>MW('Messages going out',`<div class="eyebrow">${esc(TRIG[m.msgs[0].trigger])} · outbound only</div><h2 class="mt">${esc(m.title)}</h2><p class="small muted">Check and edit before they go. Every message is saved in the Messages log.</p>
 ${m.msgs.map((x,i)=>`<div class="sendcard"><div class="row" style="flex-wrap:wrap"><b class="grow">${esc(x.to)}</b>
  <select class="in sm" data-sendch="${i}" aria-label="Channel">${Object.entries(CHANNELS).map(([k,l])=>`<option value="${k}" ${x.channel===k?'selected':''}>${l}</option>`).join('')}</select>
  <select class="in sm" data-sendlang="${i}" aria-label="Language">${x.langs.map(k=>`<option value="${k}" ${x.lang===k?'selected':''}>${CLANGS[k]}</option>`).join('')}</select></div>
  <textarea class="in" rows="${Math.min(8,x.text.split('\n').length+2)}" data-sendtext="${i}" style="margin-top:8px;resize:vertical">${esc(x.text)}</textarea></div>`).join('')}
 <div class="row" style="margin-top:12px;flex-wrap:wrap"><button class="btn tape" data-act="sendok">Send ${plural(m.msgs.length,'message')}</button><button class="btn line" data-act="sendskip">Don’t send</button></div>`,true);
/* ---------- queue with Riley up front ---------- */
function rileyBrief(){const R=S.riley;const st=R.stage;const qn=R.questions.filter(q=>!q.ans&&(q.to==='scheduler'||isAdmin())).length;const waiting=QORDER.filter(j=>!S.place[j]);
 const picks=waiting.map(j=>[j,rileyPick(j)]).filter(([,r])=>r);
 let body='';
 if(st===0)body=`<p class="small muted" style="margin:6px 0 0">Riley is watching how you schedule. It shows what it would pick on each job but books nothing.</p>`;
 if(st===1)body=picks.length?`<div class="rpicks">${picks.map(([j,r])=>`<div class="rpick"><b>${esc(JOBS[j].title)}</b><span class="small">→ ${esc(crewById(r.crew).name)} <button class="lnk" data-act="rwhy" data-v="${j}">why?</button>${(()=>{const x=rank(j).find(y=>y.crew===r.crew);return x&&x.slot?' · '+dlabel(x.slot.s):'';})()}</span><button class="btn sm tape" data-act="raccept" data-v="${j}">Accept</button><button class="btn sm line" data-act="match" data-v="${j}">Review</button></div>`).join('')}</div>`:'<p class="small muted">Nothing waiting. Riley will suggest crews as jobs come in.</p>';
 if(st===2)body=`<div class="rpicks">${R.autoBooked.length?R.autoBooked.map(j=>`<div class="rpick"><span class="chip good">Booked by Riley</span><b>${esc(JOBS[j].title)}</b><span class="small">→ ${esc(crewById(S.place[j]?.crew||'gian').name)} · ${S.place[j]?dlabel(pS(S.place[j])):''}</span><button class="btn sm line" data-act="rundo" data-v="${j}">Undo</button></div>`).join(''):'<p class="small muted">No small jobs to book right now.</p>'}</div><p class="tiny">Riley books jobs under $2,500 on its own. Bigger jobs still wait for a scheduler.</p>`;
 if(st===3)body=`<div class="row" style="margin-top:8px;flex-wrap:wrap"><span class="small grow">Riley drafted a plan for ${plural(waiting.length,'waiting job')} over the next 2 weeks.</span><button class="btn sm tape" data-act="rplan">Review Riley’s plan</button></div>`;
 return `<section class="card rbrief">${riley(52)}<div class="grow" style="min-width:0"><div class="row" style="flex-wrap:wrap;gap:8px"><b style="font-size:17px">Riley</b><span class="chip tape">In training · ${STAGES[st][0]}</span><span class="tiny">Agrees with your team ${rileyPct()}% of the time</span><span class="grow"></span>${qn?`<button class="btn sm line" data-go="riley">${plural(qn,'question')} for you</button>`:''}</div>${body}</div></section>`;}
V.queue=(()=>{const old=V.queue;return()=>{let h=old();const i=h.indexOf('<div class="kpis');return h.slice(0,i)+rileyBrief()+h.slice(i);};})();
/* stage-aware Riley card on the ranking */
function rileyCard(job){const rp=rileyPick(job.id);if(!rp)return'';const st=S.riley.stage;const c=crewById(rp.crew);
 if(st===0)return `<div class="rquiet">${riley(22)}<span class="small muted">Riley is watching. It would pick <b>${esc(c.name)}</b>.</span><button class="lnk" data-act="rwhy" data-v="${job.id}">Why ${esc(c.name)}?</button></div>`;
 return `<section class="card rcard">${riley(44)}<div class="grow" style="min-width:0"><div class="row" style="flex-wrap:wrap;gap:6px"><b>Riley suggests ${esc(c.name)}</b><span class="chip tape">In training · ${STAGES[st][0]}</span></div>
  <div class="small muted">${rp.pattern?`Learned from ${plural(rp.n||1,'past decision')}: ${esc(rp.why)}`:'Agrees with the ranking.'}</div></div>
  <div class="row" style="gap:6px"><button class="btn sm tape" data-act="pick" data-v="${rp.crew}">Accept Riley’s pick</button><button class="btn sm line" data-act="rwhy" data-v="${job.id}">Why</button></div></section>`;}
/* ---------- plan panel: multi-crew, editable messages ---------- */
function planPanel(job){const p=S.place[job.id];
 if(!p) return `<aside class="card plan"><h3 style="font-size:17px">Plan</h3><p class="small muted">Click a dashed slot on the calendar, or drag the job from the calendar tray onto a crew.</p>
  <div class="eyebrow" style="margin-top:14px">Best fit</div>${(()=>{const r=rank(job.id).find(x=>x.ok);return r?`<div class="row" style="margin-top:6px">${crewDot(r.crew)}<b class="grow">${esc(crewById(r.crew).name)}</b><span class="chip tape num">match ${r.score}</span></div><div class="small muted" style="margin-top:4px">${dlabel(r.slot.s)} to ${dlabel(r.slot.e)}</div><button class="btn tape sm" style="margin-top:10px" data-act="place" data-v="${r.crew}">Use this slot</button>`:'<div class="small">No crew fits.</div>';})()}</aside>`;
 const c=crewById(p.crew);const cs=crewsOf(p.crew,p.extra);const sched=p.status==='scheduled';const fails=hard(job,p.crew);const conf=placeConf(job.id);const days=placeDays(job.id);const work=days.filter(d=>d.k==='work').length;const rd=days.filter(d=>d.k==='rain'),pz=days.filter(d=>d.k==='pause');
 const R=rank(job.id);const best=R.find(x=>x.ok);const tot=comboSize(p.crew,p.extra);
 const checks=[];
 if(!fails.length)checks.push(['ok',`${c.name} passes every rule`]);else fails.forEach(f=>checks.push(['no',f]));
 (p.extra||[]).forEach(x=>{const f=hard(job,x);if(f.length)checks.push(['wn',`${crewById(x).name}: ${f[0]}`]);});
 if(conf.length)checks.push(['no',`Overlaps another job on ${conf.map(sdate).join(', ')}`]);
 if(pE(p)>job.deadline)checks.push(['no',`Finishes ${sdate(pE(p))}, after the ${sdate(job.deadline)} deadline`]);else checks.push(['ok',`Finishes ${dlabel(pE(p))}, ${plural(job.deadline-pE(p),'day')} to spare`]);
 rd.forEach(x=>checks.push(['wn',`${dlabel(x.d)}: ${WX[x.d][0]}% chance of rain. Rain day, crew does covered prep`]));
 if(p.segs.length>1)checks.push(['wn',`Split into ${p.segs.length} visits with ${plural(pz.length,'day')} paused`]);
 if(job.colorsOk!==true)checks.push(['wn',job.colorsOk==='sent'?'Colors not confirmed yet. The color form is with the client':'Colors not confirmed. Text the client before you confirm']);
 if(best&&best.crew!==p.crew)checks.push(['wn',`Not the top-ranked crew (${crewById(best.crew).name} scored ${best.score}). You’ll add a reason when you confirm`]);
 checks.push([work*tot>painterDays(job)*1.15?'wn':'ok',`${tot} painters × ${p.half?'half a day':plural(work,'day')} = ${p.half?tot/2:work*tot} painter days booked. ${painterDays(job)} sold`]);
 const msgs=buildMsgs(job.id,'confirm');const sel=msgs.find(m=>m.key===S.msgTab)||msgs[0];
 const canOk=!conf.length&&pE(p)<=job.deadline&&(!fails.length||S.override?.[job.id]);
 const Bj=bookings(job.id);const addable=rank(job.id).filter(r=>{if(cs.includes(r.crew)||hard(job,r.crew).some(f=>/Not rated|Inactive|Missing|Works in/.test(f)))return false;for(let d=pS(p);d<=pE(p);d++)if(busy(Bj,r.crew,d))return false;return true;}).slice(0,8);
 return `<aside class="card plan"><div class="row">${crewDot(p.crew)}<h3 style="font-size:17px" class="grow">${cs.map(x=>esc(crewById(x).name)).join(' + ')}</h3><span class="chip ${sched?'good':'tape'}">${sched?'Confirmed':'Draft'}</span></div>
 <div class="lines" style="margin:8px 0 6px">
  <div class="ln">${ICON.cal}<span><b>${dlabel(pS(p))}${pE(p)!==pS(p)?' to '+dlabel(pE(p)):''}</b>${p.half?` <small>· ${p.half==='am'?'morning':'afternoon'}</small>`:''}</span></div>
  <div class="ln">${ICON.people}<span>${tot} painters${cs.length>1?` across ${cs.length} crews`:`, ${sizeText(c).replace(/ painters?/,'')} on the crew`}</span></div>
  <div class="ln">${ICON.clock}<span>${p.half?'Half a day':plural(work,'day')} on site${rd.length?`, plus ${plural(rd.length,'rain day')}`:''}${pz.length?`, ${plural(pz.length,'day')} paused`:''}</span></div>
  <div class="ln">${ICON.pay}<span>Job pay ${money(crewPay(job,p.crew).amt)} <small>· estimate, pay model to confirm</small></span></div></div>
 ${!sched?`<div class="hr" style="border-top:1px solid var(--line)"><span class="grow"><b>Crews on this job</b><span class="tiny" style="display:block">Add a second crew for big jobs. Days shrink to fit.</span></span></div>
  <div class="chips" style="margin:6px 0">${cs.map((x,i)=>`<span class="chip">${crewDot(x)} ${esc(crewById(x).name)}${i>0?` <button class="x0" data-act="rmcrew" data-v="${x}" aria-label="Remove ${esc(crewById(x).name)}">×</button>`:''}</span>`).join('')}</div>
  ${addable.length?`<select class="in sm" data-addcrew aria-label="Add a crew"><option value="">+ Add a crew…</option>${addable.map(r=>`<option value="${r.crew}">${esc(crewById(r.crew).name)} · ${sizeText(crewById(r.crew))}${pairNote(p.crew,r.crew,job.type)}</option>`).join('')}</select>`:''}`:''}
 ${!sched&&!p.half&&work>1?`<div class="hr" style="border-top:1px solid var(--line);margin-top:8px"><span class="grow">Split into two visits<span class="tiny" style="display:block">Then drag the second visit on the calendar</span></span><button class="tog ${p.segs.length>1?'on':''}" data-act="split" role="switch" aria-checked="${p.segs.length>1}" aria-label="Split into two visits"><i></i></button></div>`:''}
 <div style="margin-top:8px">${checks.map(([k,t])=>`<div class="check ${k}"><i>${k==='ok'?'✓':k==='wn'?'!':'×'}</i><span>${esc(t)}</span></div>`).join('')}</div>
 ${colorRow(job)}${pmRow(job,p)}
 <div class="eyebrow" style="margin-top:14px">${sched?'Messages':'What goes out on confirm'}</div>
 <div class="msgtabs" role="group">${msgs.map(m=>`<button aria-pressed="${m===sel}" data-act="msg" data-v="${m.key}">${m.role==='crew'?esc(m.to.replace(' (crew lead)','')):m.role==='client'?'Client':m.role==='pm'?'PM':'HOA'}</button>`).join('')}</div>
 ${sel?`<div class="row" style="margin-bottom:6px;flex-wrap:wrap"><span class="tiny grow">${esc(sel.to)}</span><select class="in sm" data-pch="${sel.ek}" aria-label="Channel">${Object.entries(CHANNELS).map(([k,l])=>`<option value="${k}" ${sel.channel===k?'selected':''}>${l}</option>`).join('')}</select><select class="in sm" data-plang="${sel.ek}" aria-label="Language">${sel.langs.map(k=>`<option value="${k}" ${sel.lang===k?'selected':''}>${CLANGS[k]}</option>`).join('')}</select></div>
 <textarea class="in" rows="7" data-pedit="${sel.ek}" style="resize:vertical">${esc(sel.text)}</textarea>${sel.edited?`<button class="lnk" data-act="msgreset" data-v="${sel.ek}">Reset to the template</button>`:''}
 ${sel.lang==='ht'?'<div class="tiny" style="margin-top:4px">Have a native speaker review the Creole template before it goes live.</div>':''}`:'<p class="tiny">No messages for this trigger. Change it in Setup → Communication.</p>'}
 <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap">${sched?`<button class="btn line" data-act="unschedule">Unschedule</button>`:`<button class="btn tape" data-act="confirm" ${canOk?'':'disabled'}>Confirm and notify</button><button class="btn line" data-act="clear">Clear</button>`}</div>
 ${!sched&&!canOk?`<div class="tiny" style="margin-top:8px">${fails.length&&!conf.length?'This crew fails a rule. Use “Pick a crew yourself” on the ranking to override with a reason.':'Fix the red checks to confirm.'}</div>`:''}</aside>`;}
function doConfirm(reason){const job=J();const p=S.place[job.id];const R=rank(job.id);const me=R.find(x=>x.crew===p.crew);const best=R.find(x=>x.ok);const ov=reason||S.override[job.id];
 p.status='scheduled';const agree=rileyLearn(job.id,p.crew,ov);
 log(ov?'Override':'Decision',`Confirmed ${crewsOf(p.crew,p.extra).map(x=>crewById(x).name).join(' + ')} for ${job.title}, ${dlabel(pS(p))} to ${dlabel(pE(p))}. ${!ov?`Top-ranked crew, match ${me.score}.`:`Not the top-ranked crew (${me.score} vs ${best?best.score+' for '+crewById(best.crew).name:'none'}). Reason: ${ov}.`}`,job.title,snap(job.id));
 delete S.override[job.id];S.modal=null;render();openSend(`${job.title} is confirmed`,buildMsgs(job.id,'confirm'),agree?'Confirmed. Riley agreed.':'Confirmed. Riley noted your pick.');}
/* ---------- calendar view ---------- */
V.cal=()=>{const F=S.calF;const waiting=QORDER.filter(j=>!S.place[j]);const big=F.size==='expanded',mini=F.size==='min';
 const filters=`<section class="card pad calf">
  <div class="fgroup"><span class="eyebrow">View</span><div class="seg" role="group" aria-label="Calendar view">${[['resourceTimelineDay','Day'],['resourceTimelineWeek','Week'],['twoWeeks','2 weeks'],['resourceTimelineMonth','Month']].map(([k,l])=>`<button aria-pressed="${F.view===k}" data-act="calview" data-v="${k}">${l}</button>`).join('')}</div>
   <span class="stepper" aria-label="Zoom"><button data-act="zoom" data-v="-1" aria-label="Zoom out">−</button><span class="tiny">Zoom</span><button data-act="zoom" data-v="1" aria-label="Zoom in">+</button></span></div>
  <div class="fgroup"><span class="eyebrow">Show</span><div class="seg" role="group" aria-label="Jobs to show">${[['all','All jobs'],['confirmed','Confirmed'],['drafts','Drafts'],['none','No jobs']].map(([k,l])=>`<button aria-pressed="${F.show===k}" data-act="calshow" data-v="${k}">${l}</button>`).join('')}</div></div>
  <div class="fgroup"><span class="eyebrow">Crews</span><div class="seg" role="group" aria-label="Crews to show">${[['ready','Ready to match'],['all','All active'],['needs','Need setup']].map(([k,l])=>`<button aria-pressed="${F.group===k}" data-act="calgroup" data-v="${k}">${l}</button>`).join('')}</div></div>
  <div class="fgroup"><label class="eyebrow" for="calregion">Region</label><select class="in sm" id="calregion" data-calregion style="width:auto"><option value="all">All regions</option>${REGIONS.map(r=>`<option ${F.region===r?'selected':''}>${r}</option>`).join('')}</select>
</div>
  <div class="fgroup"><span class="eyebrow">Open days</span><button class="tog ${F.open?'on':''}" data-act="calopen" role="switch" aria-checked="${F.open}" aria-label="Highlight open days"><i></i></button></div>
  <div class="fgroup savedv"><span class="eyebrow">My views</span>${S.calViews.map((v,i)=>`<span class="pill">${`<button class="lnk" data-act="loadview" data-v="${i}">${esc(v.name)}</button>`}<button class="x0" data-act="rmview" data-v="${i}" aria-label="Remove view">×</button></span>`).join('')}<button class="btn sm line" data-act="saveview">+ Save this view</button></div></section>`;
 const cal=`<div class="card ecwrap ${mini?'mini':''}"><div class="calbar"><b class="grow">${mini?'Calendar minimized':'Crew calendar'}</b>${mini?'':`<span class="tiny">${F.region==='all'?'All regions':esc(F.region)}</span>`}
  <button class="btn sm line" data-act="calsize" data-v="${big?'normal':'expanded'}">${big?'Exit full width':'Expand'}</button><button class="btn sm line" data-act="calsize" data-v="${mini?'normal':'min'}">${mini?'Show calendar':'Minimize'}</button></div>${mini?'':'<div id="ec"></div>'}</div>`;
 return `<div class="qhead"><div class="grow"><div class="eyebrow">All crews</div><h1>Crew calendar</h1></div><button class="btn tape" data-act="optimize">${ICON.spark} Optimizer</button>${fbBtn('cal')}</div>
 ${big?'':kpiCards(true)}${big?'':filters}
 <div class="calgrid ${big?'big':''}">${big?'':`<aside class="card pad tray" id="tray"><div class="row"><b class="grow">Not on the calendar</b><span class="chip num">${waiting.length}</span></div><p class="tiny" style="margin:4px 0 10px">Drag a job onto a crew and day. Click it to pick a crew instead.</p>
  ${waiting.map(j=>{const job=JOBS[j];return `<div class="tcard" draggable="true" data-drag="${j}"><b>${esc(job.title)}</b><span class="tiny">${painterDays(job)} painter days · by ${sdate(job.deadline)} · ${esc(job.region)}</span><button class="lnk" data-act="match" data-v="${j}">Crew selection →</button></div>`;}).join('')||'<p class="small muted">Everything sold is on the calendar.</p>'}
  <button class="btn sm line" data-go="add" style="margin-top:8px;width:100%">+ Add a job</button></aside>`}${cal}</div>
 <div class="legend"><span><i style="background:color-mix(in srgb,var(--tape) 22%,var(--surface));border:1px solid var(--line)"></i>Confirmed</span><span><i style="background:var(--sunk);border:1px dashed var(--faint)"></i>Draft</span><span><i class="lg-open"></i>Open day, ready to fill (about $1,000 lost)</span><span>☀ 🌧 Forecast in the day headers</span><span>Drag to move · click to open</span></div>`;};
/* ---------- crews tab ---------- */
V.crews=(()=>{const old=V.crews;return()=>{let h=old();
 h=h.replace('<th>Home base</th>','<th>Home base</th><th>Region</th><th>Contact</th>');
 CREWS.forEach(c=>{const re=new RegExp(`(data-v="${c.id}">[\\s\\S]*?</td><td>[^<]*</td><td>[\\s\\S]*?</td><td>[\\s\\S]*?</td>)`);h=h.replace(re,`$1<td>${c.f.region?esc(c.f.region):'<span class="warnt">Missing</span>'}${c.f.regionNote?'<span class="tiny" style="display:block">confirm</span>':''}</td><td class="small">${c.f.phone?`<a href="tel:${c.f.phone.replace(/\D/g,'')}">${esc(c.f.phone)}</a>`:'–'}<span class="tiny" style="display:block">${CHANNELS[c.f.channel]||''}</span></td>`);});
 return h.replace('<div class="row" style="margin:16px 0 10px;flex-wrap:wrap">','<div class="row" style="margin:16px 0 10px;flex-wrap:wrap"><select class="in sm" data-crewregion style="width:auto" aria-label="Region"><option value="all">All regions</option>'+REGIONS.map(r=>`<option ${S.crewRegion===r?'selected':''}>${r}</option>`).join('')+'</select>');};})();
S.crewRegion='all';
const _ready=ready;
/* ---------- crew profile with edit + Save ---------- */
M.crew=m=>{const c0=crewById(m.id);const ed=S.crewEdit&&S.crewEdit.id===c0.id;const c=ed?S.crewEdit:c0;const h=hist(c0.id);const ad=isAdmin();const B=bookings();const up=B.filter(x=>x.crew===c0.id).sort((a,b)=>a.s-b.s).slice(0,5);
 const rsel=k=>ed?`<select class="rsel" data-ce="r.${k}" aria-label="${esc(dimL(k))} rating"><option value="">–</option>${[1,1.5,2,2.5,3,3.5,4,4.5,5].map(v=>`<option ${c.r[k]===v?'selected':''}>${v}</option>`).join('')}</select>`:c.r[k]==null?'<span class="faint">–</span>':`<span class="rt r${Math.round(c.r[k])}">${c.r[k]}</span>`;
 const rv=k=>c.r[k]==null?'':(c0.rsrc&&c0.rsrc[k]==='admin')?'<span class="rvc adm" title="Entered by an admin, counts right away">admin</span>':`<span class="rvc ${(c0.rc[k]||0)<S.rules.minReviews?'low':''}" title="${c0.rc[k]||0} reviews">${c0.rc[k]||0}</span>`;
 const row=(l,v,k,type)=>`<div class="hr"><span class="muted" style="width:150px">${l}</span><span class="grow">${ed&&k?(type==='sel-ch'?`<select class="in sm" data-ce="f.${k}">${Object.entries(CHANNELS).map(([a,b])=>`<option value="${a}" ${c.f[k]===a?'selected':''}>${b}</option>`).join('')}</select>`:type==='sel-lang'?`<select class="in sm" data-ce="f.${k}">${Object.entries(CLANGS).map(([a,b])=>`<option value="${a}" ${c.f[k]===a?'selected':''}>${b}</option>`).join('')}</select>`:type==='sel-region'?`<select class="in sm" data-ce="f.${k}"><option value="">Choose…</option>${REGIONS.map(r=>`<option ${c.f[k]===r?'selected':''}>${r}</option>`).join('')}</select>`:type==='tog-status'?`<button class="tog ${c.f.status==='active'?'on':''}" data-act="cetogst" role="switch" aria-checked="${c.f.status==='active'}" aria-label="Active"><i></i></button>`:type==='tog'?`<button class="tog ${c.f[k]?'on':''}" data-act="cetog" data-v="${k}" role="switch" aria-checked="${!!c.f[k]}" aria-label="${l}"><i></i></button>`:`<input class="in" data-ce="f.${k}" value="${esc(k==='size'?(c.f.size?(c.f.size.min===c.f.size.max?c.f.size.min:c.f.size.min+'-'+c.f.size.max):''):c.f[k]||'')}">`):v}</span></div>`;
 return MW(c0.name,`<div class="mp-h"><span class="av lg" style="--c:${c0.c}">${initials(c0.name)}</span><div class="grow"><h2 style="font-size:24px">${esc(c0.name)}</h2><div class="small muted">${sizeText(c0)} · ${esc(c0.f.base||'no home base')} · ${esc(c0.f.region||'no region')}${c0.f.notes?' · '+esc(c0.f.notes):''}</div><div style="margin-top:4px">${readyChip(c0)}${c0.savedAt?` <span class="tiny">Saved ${c0.savedAt}</span>`:''}</div></div>
  ${ad?(ed?`<span class="row" style="gap:6px"><button class="btn sm tape" data-act="cesave">Save</button><button class="btn sm line" data-act="cecancel">Cancel</button></span>`:`<button class="btn sm line" data-act="ceedit">Edit crew</button>`):''}</div>
 ${ed?'<div class="editbar">Editing. Nothing changes until you save. Saving updates matching everywhere.</div>':''}
 <h3 class="mh">Crew KPIs</h3>${h?`<div class="stats"><div><b class="num">${h.five}</b><span>5-star reviews</span></div><div><b class="num" style="color:${h.overPct>0?'var(--warn)':'var(--good)'}">${h.overPct>0?'+':''}${h.overPct}%</b><span>Days used vs sold (${h.actual} of ${h.sold})</span></div><div><b class="num">$${h.payAct}</b><span>Pay per painter day worked</span></div><div><b class="num">$${h.costSold}</b><span>Cost per painter day sold</span></div></div><p class="tiny" style="margin:4px 0 0">Sample numbers, last 12 months (${h.jobs} jobs).</p>`:'<p class="small muted" style="margin:0">No job history yet.</p>'}
 <h3 class="mh">Contact and messages</h3>
 ${row('Email',c.f.email?`<a href="mailto:${esc(c.f.email)}">${esc(c.f.email)}</a>`:'–','email')}${row('Phone',c.f.phone?`<a href="tel:${c.f.phone.replace(/\D/g,'')}">${esc(c.f.phone)}</a>${c.f.phone2?` · <a href="tel:${c.f.phone2.replace(/\D/g,'')}">${esc(c.f.phone2)}</a>`:''}`:'–','phone')}
 ${row('Send jobs by',CHANNELS[c.f.channel]||'–','channel','sel-ch')}${row('Crew lead’s language',(CLANGS[c.f.clang]||'–')+(c.f.clangSet?'':' <span class="tiny">(default, confirm)</span>'),'clang','sel-lang')}
 <h3 class="mh">Ratings <span class="tiny" style="font-weight:500">1 to 5 · small number = reviews behind it · red means fewer than ${S.rules.minReviews}, so it isn’t used</span></h3>
 <div class="rgrid">${['job','skill','attr'].map(g=>`<div><div class="eyebrow" style="margin-bottom:4px">${g==='job'?'Job types':g==='skill'?'Skills':'Attributes'}</div>${dimsOf(g).map(d=>`<div class="rrow"><span class="grow">${esc(d.l)}</span>${g!=='attr'?rv(d.k):''}${rsel(d.k)}</div>`).join('')}</div>`).join('')}</div>
 <h3 class="mh">Details</h3>
 ${row('Status',c.f.status==='active'?'Active':'Inactive','status','tog-status')}${row('Crew size',sizeText(c0),'size')}${row('Home base',esc(c.f.base||'–'),'base')}${row('Region',esc(c.f.region||'–')+(c0.f.regionNote?` <span class="tiny">${esc(c0.f.regionNote)}</span>`:''),'region','sel-region')}
 ${row('Languages',esc(c.f.languages||'–'),'languages')}${row('Lead-safe (RRP)',c.f.leadSafe?'Certified':'Not on file','leadSafe','tog')}
 <div class="hr"><span class="muted" style="width:150px">Salesforce name</span><span class="grow">${esc(c.f.sfName)}</span></div><div class="hr"><span class="muted" style="width:150px">Google Calendar</span><span class="grow">${esc(c.f.gcal)}</span></div>
 <h3 class="mh">People on this crew <span class="tiny" style="font-weight:500">Matching is crew-level. These profiles are for reference.</span></h3>
 ${c0.members.length?c0.members.map((p,i)=>`<div class="mem"><button class="memh" data-act="memtoggle" data-v="${i}" aria-expanded="${S.memberOpen===c0.id+':'+i}"><span class="av" style="--c:${c0.c}">${initials(p.n)}</span><b class="grow">${esc(p.n)}</b><span class="tiny">${esc(p.role)}${p.lead?' · lead-safe':''}</span><span class="tiny">${S.memberOpen===c0.id+':'+i?'▲':'▼'}</span></button>
  ${S.memberOpen===c0.id+':'+i?`<div class="memb"><div class="hr"><span class="muted" style="width:120px">Role</span><span>${esc(p.role)}</span></div><div class="hr"><span class="muted" style="width:120px">Languages</span><span>${esc(p.langs)}</span></div><div class="hr"><span class="muted" style="width:120px">Certifications</span><span>${p.lead?'<span class="chip good">Lead-safe RRP</span>':'None on file'}</span></div><div class="hr"><span class="muted" style="width:120px">Notes</span><span>${esc(p.note||'–')}</span></div></div>`:''}</div>`).join(''):'<p class="small muted" style="margin:0">No people added yet.</p>'}
 ${ad?`<div class="row" style="margin-top:8px"><input class="in" id="newmem" placeholder="Name"><input class="in" id="newmemrole" placeholder="Role, e.g. Painter"><button class="btn sm line" data-act="addmem">Add person</button></div>`:''}
 <h3 class="mh">Coming up</h3>${up.length?up.map(x=>`<div class="row brow"><span class="grow">${esc(x.name)}</span><span class="tiny">${dlabel(x.s)}${x.e!==x.s?' to '+dlabel(x.e):''}</span>${x.prop?'<span class="chip">Draft</span>':''}</div>`).join(''):'<p class="small muted" style="margin:0">Nothing booked in the next 4 weeks.</p>'}`,true);};
/* ---------- label editor: top 5 + delete factors ---------- */
M.label=m=>{const active=factorList().filter(([k])=>(m.w[k]||0)>0);const off=factorList().filter(([k])=>!(m.w[k]||0));const many=active.length>5;
 return MW('Ranking label',`<div class="eyebrow">Admin · ranking label</div><h2 class="mt">${m.isNew?'New label':esc(m.name)}</h2>
 ${m.isNew?`<label class="tiny" for="lname">Name</label><input class="in" id="lname" value="${esc(m.name)}" maxlength="28" style="margin:4px 0 10px">`:''}
 <label class="tiny" for="ldesc">What it’s for</label><input class="in" id="ldesc" value="${esc(m.d)}" style="margin:4px 0 12px">
 <p class="small muted" style="margin:0 0 8px">Weights are relative: what matters is how they compare, not the total. Pick your top 5. More than that and nothing stands out.</p>
 ${many?`<div class="check wn"><i>!</i><span>${active.length} factors are on. Rankings get muddy past 5. <button class="lnk" data-act="top5">Keep my top 5</button></span></div>`:''}
 <div class="wgrid">${active.sort((a,b)=>m.w[b[0]]-m.w[a[0]]).map(([k,l],i)=>`<div class="wrow2 ${i<5?'top':''}"><span>${i<5?`<em>${i+1}</em>`:''}${esc(l)}</span><input type="range" min="1" max="5" step="1" value="${m.w[k]}" data-lw="${k}" id="lw-${k}" aria-label="${esc(l)} weight"><b class="num">${m.w[k]}</b><button class="x0" data-act="lwdel" data-v="${k}" aria-label="Remove ${esc(l)}">×</button></div>`).join('')}</div>
 ${off.length?`<select class="in sm" data-lwadd style="margin-top:8px;width:auto"><option value="">+ Add a factor…</option>${off.map(([k,l])=>`<option value="${k}">${esc(l)}</option>`).join('')}</select>`:''}
 <div class="row" style="margin-top:14px;flex-wrap:wrap"><button class="btn tape" data-act="labelsave">Save label</button>${!m.isNew&&Object.keys(LABELS).length>1?'<button class="btn line" data-act="labeldel">Delete label</button>':''}<button class="btn line" data-act="closemodal2">Cancel</button></div>`,true);};
/* ---------- optimizer: time frame + sample board ---------- */
function optBoard(m){const W=m.win;const kept=m.moves.filter((x,i)=>m.sel[i]==='keep');const crews=[...new Set([...kept.map(x=>x.crew),...kept.filter(x=>x.shift).map(x=>BOOKS.find(b=>b.id===x.shift.id).crew)])];if(!crews.length)return'';
 const savedP=clone(S.place),savedS={...S.shift};kept.forEach(mv=>{if(mv.shift)S.shift[mv.shift.id]=(S.shift[mv.shift.id]||0)+mv.shift.k;S.place[mv.jid]={crew:mv.crew,segs:[[mv.s,mv.e]],status:'draft',half:mv.half,holds:[]};});
 const B=bookings();for(const k in S.place)delete S.place[k];Object.assign(S.place,savedP);for(const k in S.shift)delete S.shift[k];Object.assign(S.shift,savedS);
 const n=W[1]-W[0]+1;const newIds=new Set(kept.map(x=>x.jid)),shIds=new Set(kept.filter(x=>x.shift).map(x=>x.shift.id));
 const bar=(x,cls,lab)=>{const a=Math.max(W[0],x.s),z=Math.min(W[1],x.e);if(z<a)return'';return `<div class="ob ${cls}" style="left:${(a-W[0])/n*100}%;width:${(z-a+1)/n*100}%"><span>${esc(lab)}</span></div>`;};
 return `<h3 class="mh">What the calendar will look like</h3><div class="oboard"><div class="obh" style="--n:${n}"><span></span>${DL.slice(W[0],W[1]+1).map((d,i)=>`<span class="${rain(W[0]+i)?'wet':''}">${d.dow.slice(0,2)} ${d.n}</span>`).join('')}</div>
  ${crews.map(cr=>`<div class="obr"><span class="obl">${crewDot(cr)} ${esc(crewById(cr).name)}</span><div class="obt">${B.filter(x=>x.crew===cr).map(x=>x.jid&&newIds.has(x.jid)?bar(x,'new',JOBS[x.jid].title):x.fixed&&shIds.has(x.id)?bar(x,'shift',x.name+' (moved)'):bar(x,'old',x.name)).join('')}</div></div>`).join('')}
  <div class="legend" style="margin-top:6px"><span><i style="background:var(--tape)"></i>New from this plan</span><span><i style="background:var(--warn)"></i>Confirmed job moved</span><span><i style="background:var(--line)"></i>Already booked</span></div></div>`;}
M.opt=(()=>{const old=M.opt;return m=>{let h=old(m);const W=m.win;if(m.riley)h=h.replace('Close the gaps','Riley’s plan').replace('Optimizer · run','Riley · plan');
 const tf=`<div class="hr"><span class="grow"><b>Time frame</b></span><div class="seg" role="group" aria-label="Time frame">${[['1w','This week',0,6],['2w','2 weeks',0,13],['4w','4 weeks',0,27]].map(([k,l])=>`<button aria-pressed="${S.optWin.range===k}" data-act="owin" data-v="${k}">${l}</button>`).join('')}<button aria-pressed="${S.optWin.range==='custom'}" data-act="owin" data-v="custom">Custom</button></div></div>
 ${S.optWin.range==='custom'?`<div class="row" style="margin:6px 0"><label class="tiny" for="owf">From</label><select class="in sm" id="owf" data-owf>${DAYS.map((d,i)=>`<option value="${i}" ${i===W[0]?'selected':''}>${dlabel(i)}</option>`).join('')}</select><label class="tiny" for="owt">To</label><select class="in sm" id="owt" data-owt>${DAYS.map((d,i)=>`<option value="${i}" ${i===W[1]?'selected':''}>${dlabel(i)}</option>`).join('')}</select></div>`:''}`;
 h=h.replace('<div class="kpis k2">',tf+`<p class="tiny" style="margin:2px 0 10px">Looking at ${dlabel(W[0])} to ${dlabel(W[1])}.</p><div class="kpis k2">`);
 h=h.replace('Open crew days, next 2 weeks','Open crew days').replace('<span>Open crew days now</span>','<span>Open crew days in this time frame</span>');
 const i=h.indexOf('<div class="hr"><span class="grow">Don’t move');return h.slice(0,i)+optBoard(m)+h.slice(i);};})();
/* ---------- Riley page ---------- */
const STAGE_UI=['Schedulers work as usual. Riley’s pick shows as a quiet line on each job, and override reasons teach it.','Riley’s pick sits at the top of every job with an Accept button. Ready to schedule lists its picks.','Small jobs (under $2,500) are booked by Riley and listed with Undo. Bigger jobs wait for you.','Riley drafts the plan for every waiting job. You approve or change it.'];
const STAGE_NEED=['Turned on at setup with the base model','80% of its picks accepted over the last 50 jobs + admin approval','80% over the last 50 + admin approval','90% over the last 100 + admin approval'];
V.riley=()=>{const R=S.riley;const pct=rileyPct();const st=R.stage;const qs=R.questions.filter(q=>q.to==='scheduler'||isAdmin());const people=Object.keys(R.from);const pf=S.rileyWho||'all';
 const tl=R.trainLog.filter(x=>pf==='all'||x.who===pf);
 return `<div class="rhero card"><div class="row" style="gap:16px;align-items:center;flex-wrap:wrap">${riley(72)}<div class="grow"><div class="eyebrow">Crew scheduling assistant</div><h1 style="font-size:30px">Riley <span class="chip tape" style="vertical-align:middle">In training · ${STAGES[st][0]}</span></h1>
  <p class="muted" style="margin:6px 0 0;max-width:680px">Riley learns from how your schedulers pick crews, so you don’t have to write every rule up front. It learns from every scheduler equally, only from job, crew and client-request data, and flags patterns that look like bias for an admin to check.</p></div>${fbBtn('riley')}</div></div>
 <section class="card pad" style="margin-top:14px"><div class="row"><h3 class="grow" style="font-size:18px">Milestones</h3><span class="tiny">New clients start in Training: Riley watches and learns while you schedule</span></div>
  <div class="mtrack">${STAGES.map(([n,d],i)=>`<div class="ms ${i<st?'done':i===st?'on':''}"><div class="msdot">${i<st?'✓':i+1}</div><b>${n}</b><span class="small">${d}</span><span class="tiny"><b>Gets here:</b> ${STAGE_NEED[i]}</span><span class="tiny"><b>On screen:</b> ${STAGE_UI[i]}</span>${isAdmin()?`<button class="btn sm ${i===st?'tape':'line'}" data-act="rstage" data-v="${i}" ${i===st?'disabled':''}>${i===st?'Current':'Preview this stage'}</button>`:''}</div>`).join('')}</div>
  <div class="row" style="margin-top:12px;flex-wrap:wrap;gap:16px"><span class="small">Agrees with your team <b>${pct}%</b> (${R.agreed} of ${R.observed})</span><div class="meter grow" style="max-width:360px"><i style="width:${pct}%"></i><em style="left:80%"></em></div><span class="tiny">At 80% you can consider letting Riley take on more</span></div></section>
 <div class="split2">
 <section class="card pad"><div class="row"><h3 class="grow" style="font-size:17px">Riley’s questions</h3><span class="chip">${qs.filter(q=>!q.ans).length+' open'}</span></div>
  ${qs.map(q=>`<div class="rq ${q.ans?'done':''}"><div class="row" style="gap:6px">${q.kind==='bias'?'<span class="chip bad">Possible bias</span>':q.kind==='rule'?'<span class="chip tape">Rule</span>':'<span class="chip">Learning</span>'}<span class="tiny">For ${q.to==='admin'?'admins':'schedulers'}</span></div><p style="margin:6px 0">${esc(q.text)}</p>
   ${q.ans?`<div class="small"><b>Answered:</b> ${esc(q.ans)}</div>`:`<div class="chips">${q.opts.map(o=>`<button class="pill" data-act="rans" data-v="${q.id}" data-o="${esc(o)}">${esc(o)}</button>`).join('')}</div>`}</div>`).join('')}</section>
 <section class="card pad"><h3 style="font-size:17px">The model</h3>
  <div class="hr"><span class="muted grow">Starts from</span><span class="small">${esc(R.model.base)}</span></div><div class="hr"><span class="muted grow">Tuned on</span><span class="small">${esc(R.model.tuned)}</span></div>
  <div class="hr"><span class="muted grow">Updates</span><span class="small">${R.model.cadence}, from decisions and the habits you keep</span></div><div class="hr"><span class="muted grow">Last updated</span><span class="small">${R.model.last}</span></div><div class="hr"><span class="muted grow">Next update</span><span class="small">${R.model.next}</span></div>
  <div class="hr"><span class="muted grow">Decisions to learn from</span><span class="small">${R.observed} (about ${R.model.need} needed for a solid first model)</span></div>
  ${isAdmin()?'<button class="btn sm line" data-act="retrain" style="margin-top:8px">Update Riley</button>':''}</section></div>
 <div class="split2">
 <section class="card pad"><h3 style="font-size:17px">What Riley has learned</h3><p class="tiny" style="margin:4px 0 10px">${isAdmin()?'Keep a habit to use it in Riley’s picks, or ignore it.':'Your admin decides which habits Riley keeps.'}</p>
  ${learnedList(R)}</section>
 <section class="card pad"><h3 style="font-size:17px">Who Riley learns from</h3><p class="tiny" style="margin:4px 0 6px">Every scheduler counts the same.${isAdmin()?' Leave someone out while they’re still training.':''}</p>
  ${people.map(n=>{const L=R.trainLog.filter(x=>x.who===n);const ag=L.filter(x=>x.agree).length;const ov=L.filter(x=>!x.agree).length;const x=R.from[n];return `<div class="hr"><span class="grow"><b>${esc(n)}</b> <span class="tiny">${plural(x.n,'decision')} · agrees with Riley ${L.length?Math.round(ag/L.length*100):0}% · ${plural(ov,'override')}</span></span>${isAdmin()?`<button class="tog ${x.on?'on':''}" data-act="rfrom" data-v="${esc(n)}" role="switch" aria-checked="${x.on}" aria-label="Learn from ${esc(n)}"><i></i></button>`:`<span class="tiny">${x.on?'Included':'Left out'}</span>`}</div>`;}).join('')}
  <h4 class="mh">How often Riley agreed, by job type</h4><p class="tiny" style="margin:0 0 4px">Riley is only watching. Each row is jobs a scheduler booked, and how many matched the crew Riley would have picked.</p>${Object.entries(R.byType).map(([t,[n,a]])=>`<div class="hr"><span class="grow">${dimL(t)}</span><span class="small">Agreed on <b class="num">${a}</b> of ${n} jobs it watched <span class="tiny">(${Math.round(a/n*100)}%)</span></span></div>`).join('')}</section></div>
 <section class="card pad" style="margin-top:14px"><div class="row" style="flex-wrap:wrap"><div class="grow"><h3 style="font-size:17px">Learning log</h3><p class="tiny" style="margin:2px 0 0">Every decision Riley learned from: who made it, what Riley would have picked, and whether it went into training.</p></div>
  <select class="in sm" data-rwho style="width:auto" aria-label="Scheduler"><option value="all">All schedulers</option>${people.map(n=>`<option ${pf===n?'selected':''}>${esc(n)}</option>`).join('')}</select>${isAdmin()?'<button class="btn sm line" data-act="rlogcsv">Download CSV</button>':''}</div>
  <div class="tscroll"><table class="atable"><tr><th>When</th><th>Scheduler</th><th>Job</th><th>Riley would pick</th><th>Picked</th><th>Reason</th><th>Used in training</th></tr>${tl.map(x=>`<tr><td class="tiny">${esc(x.t)}</td><td>${esc(x.who)}</td><td>${esc(x.job)}</td><td>${esc(x.rp)}</td><td>${x.agree?'':'<span class="chip warn">'}${esc(x.pick)}${x.agree?'':'</span>'}</td><td class="small">${esc(x.reason||'–')}</td><td>${x.used?'Yes':'<span class="faint">No (left out)</span>'}</td></tr>`).join('')}</table></div></section>`;};
/* ---------- onboarding ---------- */
function obStatus(){const act=activeCrews();const held=act.filter(c=>!ready(c)).length;const rec=RECOMMENDED.filter(f=>f.added).length;
 return[['done','Kickoff','What you’ll need: your crew list (any spreadsheet), PaintScout and CompanyCam logins, and who your schedulers are.','',''],
  ['done','Connect your tools','PaintScout and CompanyCam connected. CRM (HubSpot or Salesforce) and ServiceTitan for HVAC are optional.','Integrations','s8'],
  ['done','Bring in your crews',`${S.imp.file} imported: ${plural(S.imp.rows,'row')}. Upload a new file or connect a database any time.`,'Crew data','s1'],
  [held?'now':'done','Fill the must-haves',held?`${plural(held,'crew')} held back from matching until they have a region, home base and job-type ratings.`:'Every active crew can be matched.','Fix crews','s2'],
  [rec>=3?'done':'now','Pick recommended fields',`${rec} of ${RECOMMENDED.length} added. Languages, lead-safe and how to reach each crew are on.`,'Fields','s2'],
  ['next','Rules and rankings','Set the pass-or-fail rules, then choose the top 5 factors for each ranking label.','Rules','s3'],
  ['next','Messages','Choose which calendar changes send messages, to whom, by WhatsApp, text or email, and in which language.','Communication','s7'],
  ['next','Meet Riley','Riley starts in Training: it watches and learns from your schedulers, and updates nightly.','Riley','riley'],
  ['next','Invite schedulers and go live','Add your schedulers. Admins keep setup, labels and the audit log.','','']];}
V.onboard=()=>{const L=obStatus();const done=L.filter(x=>x[0]==='done').length;
 return `<div class="obhero card"><div class="grow"><div class="eyebrow">Welcome, ${COMPANY}</div><h1 style="font-size:32px">Get set up with Crew Board</h1><p class="muted" style="max-width:640px;margin:8px 0 0">About an hour with your crew list in hand. You can stop and come back any time.</p>
  <div class="vals"><div><b>Pick the right crew in seconds</b><span class="small muted">Ranked by your own ratings and rules, with the reasons shown.</span></div><div><b>Fill every crew day</b><span class="small muted">See open days and let the optimizer close the gaps.</span></div><div><b>Riley learns your way</b><span class="small muted">An assistant that learns from your schedulers and asks when it isn’t sure.</span></div></div></div>
  <div class="obprog"><b class="num">${done}/${L.length}</b><span class="tiny">milestones done</span><div class="meter"><i style="width:${done/L.length*100}%"></i></div></div></div>
 <div class="obtrack">${L.map(([st,t,d,cta,go],i)=>`<div class="obm ${st}"><div class="obdot">${st==='done'?'✓':i+1}</div><div class="grow"><div class="row" style="flex-wrap:wrap;gap:8px"><b>${t}</b>${st==='done'?'<span class="chip good">Done</span>':st==='now'?'<span class="chip warn">In progress</span>':'<span class="chip">Up next</span>'}</div><p class="small muted" style="margin:4px 0 0">${esc(d)}</p></div>${cta?`<button class="btn sm ${st==='now'?'tape':'line'}" data-act="obgo" data-v="${go}">${cta}</button>`:''}</div>`).join('')}</div>`;};
/* ---------- messages log ---------- */
V.msgs=()=>{const f=S.msgF||'all';const rows=S.comms.filter(m=>f==='all'||m.trigger===f);
 return `<div class="qhead"><div class="grow"><div class="eyebrow">Outbound only</div><h1>Messages</h1><p class="muted" style="margin:6px 0 0;max-width:640px">Every message Crew Board sent when the calendar changed: to whom, how, in which language, and who triggered it.</p></div>${isAdmin()?'<button class="btn line" data-act="obgo" data-v="s7">Message settings</button>':''}${fbBtn('msgs')}</div>
 <div class="seg" role="group" aria-label="Filter" style="margin-bottom:12px"><button aria-pressed="${f==='all'}" data-act="msgf" data-v="all">All</button>${Object.entries(TRIG).map(([k,l])=>`<button aria-pressed="${f===k}" data-act="msgf" data-v="${k}">${l}</button>`).join('')}</div>
 <section class="card">${rows.map(m=>`<div class="lrow"><span class="chip ${m.role==='client'?'tape':m.role==='crew'?'good':''}" style="min-width:70px;justify-content:center">${m.role==='crew'?'Crew lead':m.role==='client'?'Client':'HOA'}</span><div class="grow" style="min-width:0"><div><b>${esc(m.to)}</b> · ${CHANNELS[m.channel]} · ${CLANGS[m.lang]||m.lang}</div><div class="tiny">${m.t} · ${esc(TRIG[m.trigger])} · ${esc(m.job)} · sent by ${esc(m.by)}</div><details><summary>Message</summary><div class="bubble" style="margin-top:6px">${esc(m.text)}</div></details></div><span class="chip good">Sent</span></div>`).join('')||'<p class="pad small muted">No messages yet.</p>'}</section>`;};
/* ---------- setup ---------- */
function reorderSetup(h){const st=h.indexOf('<div class="setgrid">')+21;const en=h.lastIndexOf('</div>');const secs=h.slice(st,en).match(/<section[\s\S]*?<\/section>/g)||[];const num=x=>{const mm=x.match(/<h3[^>]*>(\d+)\./);return mm?+mm[1]:99;};secs.sort((a,b)=>num(a)-num(b));return h.slice(0,st)+secs.join('')+h.slice(en);}
V.setup=(()=>{const old=V.setup;return()=>{if(!isAdmin())return old();let h=old();
 const act=activeCrews();const cnt=k=>act.filter(c=>missing(c).includes(k)).length;
 const tier=t=>RECOMMENDED.filter(f=>f.tier===t).map(f=>`<div class="hr"><span class="grow"><b>${f.l}</b> <span class="chip">${f.use==='rule'?'Rule':f.use==='factor'?'Ranking factor':'Info'}</span><span class="tiny" style="display:block">${f.why}</span></span>${f.added?'<span class="chip good">Added</span>':`<button class="btn sm line" data-act="addfield" data-v="${f.k}">Add</button>`}</div>`).join('');
 const fields=`<section class="card pad wide2" id="s2"><div class="row"><h3 class="grow">2. Crew fields</h3>${act.filter(c=>!ready(c)).length?`<span class="chip warn">${plural(act.filter(c=>!ready(c)).length,'crew')} held back</span>`:''}</div>
  <div class="tiers"><div><div class="tierh must">Must have</div><p class="tiny">Crew Board won’t match a crew without these.</p>${REQUIRED.map(([k,l])=>{const n=cnt(k);return `<div class="hr"><span class="check ${n?'':'ok'}" style="padding:0"><i>${n?'!':'✓'}</i></span><span class="grow">${l}</span>${n?`<button class="btn sm line" data-act="fixreq" data-v="${k}">${n} missing</button>`:'<span class="small">Done</span>'}</div>`;}).join('')}<div class="hr"><span class="check ok" style="padding:0"><i>✓</i></span><span class="grow">Ratings need ${S.rules.minReviews}+ reviews to count</span></div></div>
  <div><div class="tierh rec">Recommended</div><p class="tiny">Most companies use these.</p>${tier('rec')}</div>
  <div><div class="tierh nice">Nice to have</div><p class="tiny">Add when you’re ready.</p>${tier('nice')}</div></div></section>`;
 const a=h.indexOf('<section class="card pad ');const b2=h.indexOf('<section class="card pad">',h.indexOf('2. Needed before matching'));const b3=h.indexOf('<section class="card pad">',h.indexOf('3. Recommended fields'));
 h=h.slice(0,h.indexOf('<section class="card pad',h.indexOf('2. Needed')-120))+fields+h.slice(h.indexOf('<section class="card pad"><div class="row"><h3 class="grow">4. Ranking labels'));
 const fun=ruleFunnel();
 const rulesSec=`<section class="card pad" id="s3"><h3>3. Rules <span class="chip bad">Pass or fail</span></h3><p class="small muted" style="margin:6px 0 10px">Rules remove crews before ranking. Every rule you add narrows the pool.</p>`;
 h=h.replace(/<section class="card pad"><h3>5\. Rules<\/h3><p class="small muted" style="margin:6px 0 10px">Rules remove crews before ranking\.<\/p>/,rulesSec+`<div class="hr"><span class="grow">Crew must work in the job’s region</span><button class="tog ${S.rules.region?'on':''}" data-act="rule" data-v="region" role="switch" aria-checked="${S.rules.region}" aria-label="Region rule"><i></i></button></div><div class="hr"><span class="grow">Reviews needed before a rating counts</span><span class="stepper"><button data-act="rrev" data-v="-1" aria-label="Fewer">−</button><b class="num">${S.rules.minReviews}</b><button data-act="rrev" data-v="1" aria-label="More">+</button></span></div>`);
 h=h.replace('<div class="hr"><span class="grow">Rain days hold exterior body coats</span>',`<div class="hr"><span class="grow">Rain days hold exterior body coats</span>`);
 const funnel=`<div class="funnel"><div class="eyebrow" style="margin:12px 0 6px">Crews that pass every rule, by job type</div>${fun.map(([l,n])=>`<div class="hr"><span class="grow">${l}</span><span class="pbar" style="width:120px"><i style="width:${Math.min(100,n*10)}%;background:${n<2?'var(--bad)':'var(--tape)'}"></i></span><b class="num ${n<2?'warnt':''}" style="min-width:24px;text-align:right">${n}</b></div>`).join('')}${fun.some(x=>x[1]<2)?'<div class="check wn"><i>!</i><span>Some job types have fewer than 2 crews that pass. Rate more crews or loosen a rule.</span></div>':''}</div></section>`;
 h=h.replace(/(<button class="tog [^"]*" data-act="rule" data-v="weather"[^>]*><i><\/i><\/button><\/div>)<\/section>/,'$1'+funnel);
 h=h.replace('<h3 class="grow">4. Ranking labels</h3>','<h3 class="grow">4. Rankings <span class="chip tape">Preferences</span></h3>').replace('Schedulers can only pick from these. Only admins create or change them.','Rankings order the crews that pass the rules. Weights are relative. Schedulers can only pick from these labels.');
 h=h.replace(/<div class="lblrow"><div class="grow"><b>([^<]*)<\/b><span class="tiny" style="display:block">[^<]*<\/span><\/div><button class="btn sm line" data-act="editlabel" data-v="([^"]*)">Edit weights<\/button><\/div>/g,(m0,n,v)=>{const L=LABELS[v.replace(/&quot;/g,'"').replace(/&amp;/g,'&')];if(!L)return m0;const top=Object.entries(L.w).filter(([,w])=>w>0).sort((a,b)=>b[1]-a[1]);
  return `<div class="lblrow"><div class="grow"><b>${n}</b><span class="tiny" style="display:block">${esc(L.d)}</span><div class="chips" style="margin-top:6px">${top.map(([k,w],i)=>`<span class="chip ${i<5?'tape':''}">${esc(flabel(k))} ${w}<button class="x0" data-act="lfdel" data-v="${v}" data-k="${k}" aria-label="Remove ${esc(flabel(k))}">×</button></span>`).join('')}</div>${top.length>5?`<div class="tiny warnt" style="margin-top:4px">${top.length} factors on. Keep it to your top 5.</div>`:''}</div><div class="row" style="gap:6px"><button class="btn sm line" data-act="editlabel" data-v="${v}">Edit</button><button class="btn sm line" data-act="dellabel" data-v="${v}" aria-label="Delete ${n}">Delete</button></div></div>`;});
 h=h.replace('<section class="card pad"><h3>6. What makes a client important</h3>','<section class="card pad" id="s5"><h3>5. What makes a client important</h3>').replace('<h3>7. Job labels on intake</h3>','<h3>6. Job labels on intake</h3>');
 const comm=`<section class="card pad wide2" id="s7"><div class="row"><h3 class="grow">7. Communication</h3><span class="chip">Outbound only</span><button class="btn sm line" data-go="msgs">Messages log</button></div>
  <p class="small muted" style="margin:6px 0 10px">Which calendar changes send messages, and to whom. Each crew’s channel (WhatsApp, text or email) and language live on its profile. Clients get English, Spanish or Haitian Creole.</p>
  <div class="hr"><span class="grow"><b>Show messages before they go</b><span class="tiny" style="display:block">Schedulers can edit text, channel and language. Turn off to send straight away.</span></span><button class="tog ${S.comm.review?'on':''}" data-act="commreview" role="switch" aria-checked="${S.comm.review}" aria-label="Review before sending"><i></i></button></div>
  <div class="tscroll"><table class="atable trig"><tr><th>When</th><th>Crew lead</th><th>Client</th><th>HOA</th></tr>${Object.entries(TRIG).map(([k,l])=>`<tr><td><b>${l}</b></td>${['crew','client','hoa'].map(r=>`<td><button class="tog ${S.comm.triggers[k][r]?'on':''}" data-act="commtrig" data-v="${k}" data-k="${r}" role="switch" aria-checked="${!!S.comm.triggers[k][r]}" aria-label="${l}: ${r}"><i></i></button></td>`).join('')}</tr>`).join('')}</table></div>
  <div class="row" style="margin-top:10px;flex-wrap:wrap;gap:6px"><span class="tiny">Crew lead languages:</span>${['en','es','pt','ht'].map(k=>`<span class="chip good">✓ ${CLANGS[k]}</span>`).join('')}<span class="tiny" style="margin-left:8px">Client languages:</span>${['en','es','ht'].map(k=>`<span class="chip good">✓ ${CLANGS[k]}</span>`).join('')}</div></section>`;
 h=h.replace(/<section class="card pad"><h3>9\. Client messages<\/h3>[\s\S]*?<\/section>/,comm);
 h=h.replace('<section class="card pad"><h3>8. Integrations</h3>','<section class="card pad" id="s8"><h3>8. Integrations</h3>');
 h=h.replace("['Google Calendar',","['ServiceTitan','For HVAC and plumbing clients: read and write jobs and techs.','Connect','line'],['Google Calendar',");
 h=h.replace('<section class="card pad"><div class="row"><h3 class="grow">1. Crew data</h3>','<section class="card pad" id="s1"><div class="row"><h3 class="grow">1. Crew data</h3>');
 h=h.replace('<div class="qhead"><div class="grow"><div class="eyebrow">Admin</div><h1>Setup</h1>','<div class="qhead"><div class="grow"><div class="eyebrow">Admin</div><h1>Setup</h1>').replace('</h1><p class="muted" style="margin:6px 0 0;max-width:680px">','</h1><p class="muted" style="margin:6px 0 0;max-width:680px"><button class="lnk" data-go="onboard">See onboarding milestones →</button><br>');
 return reorderSetup(h);};})();
/* integrations list patch (ServiceTitan) handled above */
/* ---------- render with new tabs ---------- */
function render(){
 if(!isAdmin()&&['setup','audit','onboard'].includes(S.view))S.view='queue';
 const tv=['match','add','board'].includes(S.view)?'queue':S.view;
 const tabs=[...(isAdmin()?[['onboard','Get started']]:[]),['queue','Ready to schedule',kpiWaiting().n],['riley','Riley'],['cal','Calendar'],['crews','Crews'],['clients','Clients'],['msgs','Messages'],...(isAdmin()?[['audit','Audit log'],['setup','Setup']]:[]),['ideas','Ideas']];
 $('#tabs').innerHTML=tabs.map(([v,l,n])=>`<button data-go="${v}" ${tv===v?'aria-current="page"':''}>${v==='riley'?riley(18):''}${l}${n?`<span class="ct num">${n}</span>`:''}</button>`).join('');
 document.querySelectorAll('[data-role]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.role===S.role));
 $('#who').textContent=ME();$('#app').innerHTML=V[S.view]();mountCal();drawLayer();}
/* ---------- v5 actions ---------- */
function ceSet(path,v){const [a,k]=path.split('.');const d=S.crewEdit;if(a==='r')d.r[k]=v===''?null:+v;else if(k==='size')d.f.size=parseSize(v);else d.f[k]=v;}
document.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b||b.disabled)return;const a=b.dataset.act,v=b.dataset.v;const m=S.modal;
 switch(a){
 case 'raccept':{const rp=rileyPick(v);placeJob(v,rp.crew);S.job=v;S.view='board';render();window.scrollTo(0,0);toast(`Riley’s pick placed: ${crewById(rp.crew).name}. Confirm when ready`);break;}
 case 'rundo':{delete S.place[v];S.riley.autoBooked=S.riley.autoBooked.filter(x=>x!==v);log('Riley',`Undid Riley’s booking of ${JOBS[v].title}.`,JOBS[v].title);render();openSend(`${JOBS[v].title} is off the calendar`,[],'Undone');break;}
 case 'rplan':{S.optWin={range:'2w',from:0,to:13};S.modal={...optimize(),riley:true};drawLayer();break;}
 case 'rstage':{if(S.riley.stage===2&&+v!==2){S.riley.autoBooked.forEach(j=>delete S.place[j]);S.riley.autoBooked=[];}S.riley.stage=+v;log('Setting',`Moved Riley to “${STAGES[+v][0]}”.`);if(+v===2){const plan=optimize();plan.moves.filter(mv=>JOBS[mv.jid].value<2500&&!S.place[mv.jid]).forEach(mv=>{S.place[mv.jid]={crew:mv.crew,extra:[],segs:[[mv.s,mv.e]],status:'scheduled',half:mv.half,holds:[]};S.riley.autoBooked.push(mv.jid);log('Riley',`Riley booked ${JOBS[mv.jid].title} on ${crewById(mv.crew).name}, ${dlabel(mv.s)} (under $2,500).`,JOBS[mv.jid].title);});}
  render();toast(`Riley is now at ${STAGES[+v][0]}. Check Ready to schedule to see what changed`);break;}
 case 'rans':{const q=S.riley.questions.find(x=>x.id===v);q.ans=b.dataset.o;log('Riley',`Answered Riley: “${q.text}” → ${q.ans}.`);if(/habit|Must-have|Nice/.test(q.ans))S.riley.learned.unshift({id:'p'+Date.now(),text:`From your answer: ${q.ans}. (${q.text.split('.')[0]}.)`,crew:null,test:()=>false,n:1,status:'kept'});render();toast('Thanks. Riley will use that');break;}
 case 'retrain':S.riley.model.last=stamp();log('Riley','Updated Riley with '+S.riley.observed+' decisions.');render();toast('Riley updated with your latest decisions');break;
 case 'rlogcsv':saveFile('riley-learning-log.csv',[['When','Scheduler','Job','Riley would pick','Picked','Reason','Used in training'],...S.riley.trainLog.map(x=>[x.t,x.who,x.job,x.rp,x.pick,x.reason,x.used?'Yes':'No'])].map(l=>l.map(csvq).join(',')).join('\n'));break;
 case 'obgo':if(v==='riley'){S.view='riley';render();window.scrollTo(0,0);break;}S.view='setup';render();setTimeout(()=>document.getElementById(v)?.scrollIntoView({behavior:'smooth',block:'start'}),50);break;
 case 'msgf':S.msgF=v;render();break;
 case 'sendok':{document.querySelectorAll('[data-sendtext]').forEach(t=>m.msgs[+t.dataset.sendtext].text=t.value);sendAll(m.msgs);const ta=m.toastAfter;S.modal=null;render();toast(`${ta?ta+' ':''}${plural(m.msgs.length,'message')} sent`);break;}
 case 'sendskip':{const ta=m.toastAfter;S.modal=null;drawLayer();toast((ta?ta+' ':'')+'No messages sent');break;}
 case 'msgreset':delete S.msgEdit[v];render();break;
 case 'rmcrew':{const p=S.place[S.job];setPlace(S.job,p.crew,pS(p),p.status,false,(p.extra||[]).filter(x=>x!==v));render();break;}
 case 'calsize':S.calF.size=v;render();break;
 case 'calgroupby':S.calF.groupBy=v;render();break;
 case 'saveview':{const n=prompt?null:null;S.modal={type:'saveview'};drawLayer();break;}
 case 'saveviewok':{const n=(document.getElementById('vname').value||'').trim();if(!n){toast('Name the view');break;}const F=S.calF;S.calViews.push({name:n,view:F.view,show:F.show,group:F.group,region:F.region,groupBy:F.groupBy});S.modal=null;render();toast(`View “${n}” saved`);break;}
 case 'loadview':{const x=S.calViews[+v];Object.assign(S.calF,{view:x.view,show:x.show,group:x.group,region:x.region,groupBy:x.groupBy,date:null});render();break;}
 case 'rmview':S.calViews.splice(+v,1);render();break;
 case 'owin':{const r={'1w':[0,6],'2w':[0,13],'4w':[0,27]}[v];S.optWin.range=v;if(r){S.optWin.from=r[0];S.optWin.to=r[1];}const rl=m&&m.riley;S.modal={...optimize(),riley:rl};drawLayer();break;}
 case 'ceedit':S.crewEdit=clone(crewById(m.id));S.crewEdit.id=m.id;drawLayer();break;
 case 'cecancel':S.crewEdit=null;drawLayer();break;
 case 'cetog':S.crewEdit.f[v]=!S.crewEdit.f[v];drawLayer();break;
 case 'cetogst':S.crewEdit.f.status=S.crewEdit.f.status==='active'?'inactive':'active';drawLayer();break;
 case 'cesave':{const c=crewById(m.id);const d=S.crewEdit;const ch=[];
  Object.keys(d.r).forEach(k=>{if(c.r[k]!==d.r[k])ch.push(`${dimL(k)} ${c.r[k]??'–'} → ${d.r[k]??'–'}`);});
  ['email','phone','channel','clang','base','region','languages','leadSafe','status'].forEach(k=>{if(String(c.f[k]??'')!==String(d.f[k]??''))ch.push(`${k==='clang'?'language':k} → ${k==='channel'?CHANNELS[d.f[k]]:k==='clang'?CLANGS[d.f[k]]:d.f[k]}`);});
  if(JSON.stringify(c.f.size)!==JSON.stringify(d.f.size))ch.push(`size → ${sizeText(d)}`);
  const bch=d.f.base!==c.f.base;c.r={...d.r};Object.assign(c.f,d.f);if(bch)c.f.baseSample=false;if(ch.some(x=>x.startsWith('language')))c.f.clangSet=true;c.savedAt=stamp();S.crewEdit=null;
  if(ch.length)log('Crew data',`${c.name}: ${ch.join('; ')}.`);render();toast(ch.length?`Saved ${plural(ch.length,'change')}. Matching updated everywhere`:'No changes to save');break;}
 case 'memtoggle':{const k=m.id+':'+v;S.memberOpen=S.memberOpen===k?null:k;drawLayer();break;}
 case 'addmem':{const n=(document.getElementById('newmem').value||'').trim();if(!n)break;crewById(m.id).members.push({n,role:(document.getElementById('newmemrole').value||'Painter').trim(),langs:'',lead:false,note:''});log('Crew data',`Added ${n} to ${crewById(m.id).name}.`);drawLayer();break;}
 case 'top5':{const act=Object.entries(m.w).filter(([,w])=>w>0).sort((a,b)=>b[1]-a[1]);act.slice(5).forEach(([k])=>delete m.w[k]);drawLayer();break;}
 case 'lwdel':delete m.w[v];drawLayer();break;
 case 'lfdel':{const L=LABELS[v];if(L){delete L.w[b.dataset.k];log('Setting',`Removed “${flabel(b.dataset.k)}” from the label “${v}”.`);render();}break;}
 case 'dellabel':{if(Object.keys(LABELS).length<2){toast('Keep at least one label');break;}delete LABELS[v];Object.keys(S.label).forEach(k=>{if(S.label[k]===v)delete S.label[k];});log('Setting',`Deleted the ranking label “${v}”.`);render();toast(`Deleted “${v}”`);break;}
 case 'rrev':S.rules.minReviews=Math.max(1,Math.min(10,S.rules.minReviews+ +v));log('Setting',`Ratings now need ${S.rules.minReviews} reviews to count.`);render();break;
 case 'commreview':S.comm.review=!S.comm.review;render();break;
 case 'commtrig':{const t=S.comm.triggers[v];t[b.dataset.k]=!t[b.dataset.k];log('Setting',`${TRIG[v]}: ${b.dataset.k==='crew'?'crew lead':b.dataset.k} messages ${t[b.dataset.k]?'on':'off'}.`);render();break;}
 }},true);
document.addEventListener('change',e=>{const t=e.target;
 if(t.dataset.ce&&S.crewEdit){ceSet(t.dataset.ce,t.value);}
 if(t.hasAttribute('data-addcrew')&&t.value){const p=S.place[S.job];setPlace(S.job,p.crew,pS(p),p.status,false,[...(p.extra||[]),t.value]);log('Decision',`Added ${crewById(t.value).name} as a second crew on ${J().title}.`,J().title);render();toast('Second crew added. Days updated');}
 if(t.dataset.pch){S.msgCh[t.dataset.pch]=t.value;render();}
 if(t.dataset.plang){S.msgTo[t.dataset.plang+':lang']=t.value;delete S.msgEdit[t.dataset.plang];if(t.dataset.plang.endsWith(':client'))S.msgLang[S.job]=t.value;render();}
 if(t.dataset.sendch!=null){S.modal.msgs[+t.dataset.sendch].channel=t.value;}
 if(t.dataset.sendlang!=null){const x=S.modal.msgs[+t.dataset.sendlang];x.lang=t.value;x.text=x.gen(t.value);drawLayer();}
 if(t.hasAttribute('data-calregion')){S.calF.region=t.value;render();}
 if(t.hasAttribute('data-crewregion')){S.crewRegion=t.value;render();}
 if(t.hasAttribute('data-rwho')){S.rileyWho=t.value;render();}
 if(t.hasAttribute('data-owf')||t.hasAttribute('data-owt')){const f=+document.getElementById('owf').value,to=+document.getElementById('owt').value;S.optWin={range:'custom',from:Math.min(f,to),to:Math.max(f,to)};S.modal={...optimize(),riley:S.modal&&S.modal.riley};drawLayer();}
 if(t.hasAttribute('data-lwadd')&&t.value&&S.modal){S.modal.w[t.value]=3;drawLayer();}});
document.addEventListener('input',e=>{const t=e.target;if(t.dataset.pedit){S.msgEdit[t.dataset.pedit]=t.value;}});
M.saveview=()=>MW('Save view',`<div class="eyebrow">Calendar</div><h2 class="mt">Save this view</h2><p class="small muted">Saves the view, filters, region and grouping you have now.</p><label class="tiny" for="vname">Name</label><input class="in" id="vname" placeholder="e.g. Broward this week" maxlength="30" style="margin-top:4px"><div class="row" style="margin-top:12px"><button class="btn tape" data-act="saveviewok">Save view</button><button class="btn line" data-act="closemodal2">Cancel</button></div>`);
/* crew filter honors region */
V.crews=(()=>{const old=V.crews;return()=>{if(S.crewRegion==='all')return old();const keep=CREWS;CREWS=CREWS.filter(c=>c.f.region===S.crewRegion);try{return old();}finally{CREWS=keep;}};})();
S.view=isAdmin()?'onboard':'queue';
render();

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
function tH(x){const[a,b]=String(x).split(':');return +a+(+b||0)/60;}
function dayCap(cid,d){const c=crewById(cid);if(!c||!DL[d])return 0;const dw=DL[d].dow;const h=c.f.hours||S.hoursDefault;const r=dw==='Sat'?h.sat:dw==='Sun'?h.sun:(h.wk||S.hoursDefault.wk);if(!r)return 0;const len=tH(r[1])-tH(r[0]);return Math.max(0,Math.min(1,(len>6?len-1:len)/8));}
function capAll(cs,d){return Math.min(...cs.map(x=>dayCap(x,d)));}
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
function hFmt(r){const f=x=>{const v=tH(x);const h=Math.floor(v),m=Math.round((v-h)*60);const hh=h>12?h-12:h;return hh+(m?':'+String(m).padStart(2,'0'):'')+(h>=12?'pm':'am');};return `${f(r[0])}–${f(r[1])}`;}
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
 return `<div class="qhead"><div class="grow"><div class="eyebrow">Outbound only</div><h1>Messages</h1><p class="muted" style="margin:6px 0 0;max-width:640px">Every message Crew Board sent when the calendar changed. Match it against WhatsApp, your texts or your email by the channel on the left.</p></div>${isAdmin()?'<button class="btn line" data-act="obgo" data-v="s6m">Message settings</button>':''}${fbBtn('msgs')}</div>
 <div class="row" style="flex-wrap:wrap;margin-bottom:12px"><div class="seg" role="group" aria-label="Channel"><button aria-pressed="${fc==='all'}" data-act="msgc" data-v="all">All channels</button>${Object.entries(CHANNELS).map(([k,l])=>`<button aria-pressed="${fc===k}" data-act="msgc" data-v="${k}">${l}</button>`).join('')}</div>
  <div class="seg" role="group" aria-label="Trigger"><button aria-pressed="${f==='all'}" data-act="msgf" data-v="all">All changes</button>${Object.entries(TRIG).map(([k,l])=>`<button aria-pressed="${f===k}" data-act="msgf" data-v="${k}">${l}</button>`).join('')}</div></div>
 <section class="card">${rows.map(m=>`<div class="lrow">${chBadge(m.channel)}<div class="grow" style="min-width:0"><div><b>${esc(m.to)}</b> <span class="chip">${m.role==='crew'?'Crew lead':m.role==='client'?'Client':m.role==='pm'?'Project manager':'HOA'}</span> <span class="tiny">${CLANGS[m.lang]||m.lang}</span></div><div class="tiny">${m.t} · ${esc(TRIG[m.trigger])} · ${esc(m.job)} · sent by ${esc(m.by)}</div><details><summary>Message</summary><div class="bubble" style="margin-top:6px">${esc(m.text)}</div></details></div><span class="chip good">Sent</span></div>`).join('')||'<p class="pad small muted">No messages match.</p>'}</section>`;};
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
 <section class="card pad" id="s4h"><h3>2. Working days and hours</h3><p class="small muted" style="margin:6px 0 10px">Your company default. Each crew can change it on its profile, for example to work Saturdays.</p>
  <div class="hrow"><span class="muted" style="width:90px">Mon–Fri</span><input type="time" class="in sm" data-hd="wk.0" value="${H.wk[0]}" aria-label="Weekday start"><span class="tiny">to</span><input type="time" class="in sm" data-hd="wk.1" value="${H.wk[1]}" aria-label="Weekday end"></div>
  ${['sat','sun'].map(k=>`<div class="hrow"><span class="muted" style="width:90px">${k==='sat'?'Saturday':'Sunday'}</span><button class="tog ${H[k]?'on':''}" data-act="hdday" data-v="${k}" role="switch" aria-checked="${!!H[k]}" aria-label="${k==='sat'?'Saturday':'Sunday'}"><i></i></button>${H[k]?`<input type="time" class="in sm" data-hd="${k}.0" value="${H[k][0]}"><span class="tiny">to</span><input type="time" class="in sm" data-hd="${k}.1" value="${H[k][1]}">`:'<span class="faint">Off</span>'}</div>`).join('')}
  <div class="row" style="margin-top:10px;flex-wrap:wrap"><button class="btn sm line" data-act="hdapply">Apply to all crews</button><span class="tiny">${CREWS.filter(c=>c.f.hours&&c.f.hours.sat).map(c=>c.name).join(' and ')||'No crews'} work Saturdays (set on their profiles).</span></div></section>
 <section class="card pad wide2" id="s2"><div class="row"><h3 class="grow">3. Crew fields</h3>${held?`<span class="chip warn">${plural(held,'crew')} held back</span>`:'<span class="chip good">All crews ready</span>'}</div>
  <div class="tiers2"><div><div class="tierh must">Must have</div><p class="tiny">Crews aren’t matched until these are filled in.</p>
   ${REQUIRED.map(([k,l])=>{const n=cnt(k);return `<div class="hr"><span class="lockic" title="Always required">${ICON.lock}</span><span class="grow">${l}${k==='size'?' <span class="tiny">(whole number)</span>':''}</span>${n?`<button class="btn sm line" data-act="fixreq" data-v="${k}">${n} missing</button>`:'<span class="small">Done</span>'}</div>`;}).join('')}
   ${RECOMMENDED.filter(f=>f.tier==='must').map(fieldRow).join('')}</div>
  <div><div class="tierh nice">Nice to have</div><p class="tiny">Turn on what helps your team.</p>${RECOMMENDED.filter(f=>f.tier==='nice').sort((a,b)=>(b.rec?1:0)-(a.rec?1:0)).map(fieldRow).join('')}</div></div></section>
 <section class="card pad wide2" id="s3k"><div class="row"><h3 class="grow">4. What Crew Board tracks for you</h3><span class="tiny">From Ido’s KPI list</span></div>
  <div class="kgrid"><div><div class="eyebrow" style="margin-bottom:6px">Scheduling</div>
   ${kpiRow('Painter days scheduled, next 2 weeks','Painter days on the calendar against what crews can work','The calendar × each crew’s size and working days',true)}
   ${kpiRow('Jobs scheduled, next 2 weeks','Number of jobs and their total value','The calendar + sold price from PaintScout',true)}
   ${kpiRow('Jobs waiting to be scheduled','Sold jobs not on the calendar: count, painter days needed, value','Sold estimates from PaintScout',true)}</div>
  <div><div class="eyebrow" style="margin-bottom:6px">Crew profile</div>
   ${kpiRow('5-star reviews','5-star reviews tied to each crew’s jobs','Google reviews, matched to the job’s address and crew',S.googleReviews,'<button class="btn sm line" data-act="greviews">Connect Google reviews</button>')}
   ${kpiRow('Projected vs actual days','Painter days sold against painter days used. Over means money lost on the job','Sold hours in PaintScout vs days the crew actually worked on the calendar',true)}
   ${kpiRow('Pay per actual painter day','What the crew earned: total pay ÷ painter days worked','Pay model field + days worked',payOn,'<button class="btn sm line" data-act="addfield" data-v="pay">Add pay field</button>')}
   ${kpiRow('Cost per painter day sold','What the crew costs you: total pay ÷ painter days sold','Pay model field + painter days sold in PaintScout',payOn,'<button class="btn sm line" data-act="addfield" data-v="pay">Add pay field</button>')}</div></div></section>
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
 let adv='';if(S.setupAdv){const X=setupSections();const strip=s=>s.replace(/(<h3[^>]*>)\d+\.\s*/,'$1');
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
 case 'obgo':if(['s4','s6','s7','s8'].includes(v)&&!S.setupAdv){S.setupAdv=true;setTimeout(()=>{render();document.getElementById(v)?.scrollIntoView({block:'start'});},60);}break;
 }},true);
document.addEventListener('change',e=>{const t=e.target;
 if(t.dataset.ceh&&S.crewEdit){const H=S.crewEdit.f.hours||(S.crewEdit.f.hours=clone(S.hoursDefault));hset(H,t.dataset.ceh,t.value);}
 if(t.dataset.hd){hset(S.hoursDefault,t.dataset.hd,t.value);}
 if(t.hasAttribute('data-impv')){S.impValue=Math.max(0,+t.value||0);IMPT[2][1]=`Job worth ${money(S.impValue)} or more`;log('Setting',`Important-client job value set to ${money(S.impValue)}.`);render();}});
S.view=isAdmin()?'onboard':'queue';
render();
/* admin-entered ratings count right away */
window.addEventListener('click',e=>{const b=e.target.closest('[data-act="cesave"]');if(!b||!S.crewEdit||!S.modal)return;const c=crewById(S.modal.id);const d=S.crewEdit;c.rsrc=c.rsrc||{};
 Object.keys(d.r).forEach(k=>{if(d.r[k]!=null&&d.r[k]!==c.r[k])c.rsrc[k]='admin';});if(d.f.size&&c.f.sizeWas)delete c.f.sizeWas;},true);

/* ================= v7: Nico + Oct 26 feedback ================= */
/* ---------- users: Ido (admin), Carla and Jessie (schedulers) ---------- */
PEOPLE.scheduler2='Jessie T. (Scheduler)';

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
let _RJ=null;const capW=(cs,d)=>capAll(cs,d)*(_RJ&&_RJ.ext&&S.rules.weather&&rain(d)?0:1);
function segCap(cs,a,z){let c=0;for(let d=a;d<=z;d++)c+=capW(cs,d);return c;}
function nextWork(cs,d){while(d<41&&!capAll(cs,d))d++;return d;}
function rebalance(jid,fixed){const p=S.place[jid];const job=JOBS[jid];_RJ=job;const cs=crewsOf(p.crew,p.extra);const n=need(job,p.crew,p.extra).n;
 const f=p.segs[fixed];const rem=n-segCap(cs,f[0],f[1]);const o=fixed===0?1:0;
 if(rem<=0.01){p.segs=[f];return 'one';}
 if(!p.segs[o])p.segs.push([nextWork(cs,nextWork(cs,f[1]+1)+1),0]);
 const g=p.segs[o];
 if(o>fixed){if(g[0]<=f[1]+1)g[0]=nextWork(cs,f[1]+2);g[0]=nextWork(cs,g[0]);let c=0,d=g[0];while(d<41){c+=capW(cs,d);if(c>=rem-1e-6)break;d++;}g[1]=d;}
 else{g[0]=nextWork(cs,g[0]);let c=0,d=g[0];while(d<41){c+=capW(cs,d);if(c>=rem-1e-6)break;d++;}g[1]=d;if(g[1]>=f[0]-1){const sh=g[1]-f[0]+2;f[0]+=sh;f[1]+=sh;f[0]=nextWork(cs,f[0]);}}
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
 ${shown.map((d,i)=>{const g=dayDigest(d);const isToday=d===today;return `<details class="dday" ${i===0?'open':''}><summary><b>${isToday?'Today so far':esc(d)}</b><span class="tiny">${isToday?'Riley writes this up tonight at 2:00 AM':g.empty?'Quiet day':`${plural(g.per.length,'person','people')} active${g.learned.length?` · ${plural(g.learned.length,'thing')} learned`:''}${g.qs.length?` · ${plural(g.qs.length,'question')}`:''}`}</span></summary>
  ${g.empty?'<p class="small muted">No scheduling activity.</p>':`<div class="dgrid"><div><div class="eyebrow">Who did what</div>${g.per.map(([w,b])=>`<div class="hr"><b style="min-width:84px">${esc(w)}</b><span class="small grow">${b.length?esc(b.join(' · ')):'<span class="faint">Signed in</span>'}</span></div>`).join('')||'<p class="tiny">No one active.</p>'}</div>
   <div><div class="eyebrow">What Riley learned</div>${g.learned.map(x=>`<div class="dlx small">${esc(x)}</div>`).join('')||'<p class="tiny">Nothing new.</p>'}
   ${g.qs.length?`<div class="eyebrow" style="margin-top:10px">Questions it has</div>${g.qs.map(q=>`<div class="dlx small">${esc(q.text)} ${q.ans?`<span class="chip good">Answered</span>`:'<a class="lnk" href="#rq">Answer below</a>'}</div>`).join('')}`:''}</div></div>`}</details>`;}).join('')}
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
function fillT(t,c,jid){const job=jid?JOBS[jid]:(c&&c.jobs[0]?JOBS[c.jobs[0]]:null);const p=job&&S.place[job.id];return t.replace(/\{first\}/g,c?c.first:'there').replace(/\{company\}/g,COMPANY).replace(/\{job\}/g,job?job.title:'your project').replace(/\{crew\}/g,p?crewById(p.crew).name:'our').replace(/\{link\}/g,'ppp.crewboard.app/c/'+(c?c.id:'new'));}
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
  <div class="eyebrow" style="margin:12px 0 4px">All clients</div>${list.map(x=>`<button class="crow ${c===x?'on':''}" data-act="client" data-v="${x.id}"><b>${esc(x.name)}</b><span class="tiny">${esc(x.area||'')} · ${esc(clientStatus(x))}${x.sf?'':' · <span class="warnt">not in Salesforce</span>'}</span></button>`).join('')||'<p class="small muted">No match.</p>'}</section>`;
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
 <section class="card pad"><h3 style="font-size:17px">Messages</h3><p class="tiny" style="margin:2px 0 8px">Outbound. Replies come in on ${esc(CHANNELS[c.channel]||'their phone')} as usual.</p>
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

