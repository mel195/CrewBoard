/* ============ dates ============ */
const DOW=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const DL=[];(()=>{const d=new Date(2026,9,26);while(DL.length<30){const w=d.getDay();if(w>0&&w<6)DL.push({dow:DOW[w],m:d.toLocaleString('en-US',{month:'short'}),n:d.getDate(),mi:d.getMonth(),date:new Date(d),iso:`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`});d.setDate(d.getDate()+1);}})();
const DAYS=DL.slice(0,20);
const dlabel=i=>DL[i]?`${DL[i].dow} ${DL[i].m} ${DL[i].n}`:'later';
const sdate=i=>DL[i]?`${DL[i].m} ${DL[i].n}`:'later';
const idxOfDate=dt=>{const t=new Date(dt.getFullYear(),dt.getMonth(),dt.getDate()).getTime();let i=DL.findIndex(x=>x.date.getTime()>=t);return i<0?DL.length-1:i;};
const isoToIdx=(iso,cap=23)=>{if(!iso)return null;const t=new Date(iso+'T12:00:00');if(isNaN(t))return null;return Math.min(cap,idxOfDate(t));};
const WX=[[0,'sun'],[10,'sun'],[20,'cloud'],[70,'rain'],[60,'rain'],[0,'sun'],[10,'sun'],[20,'cloud'],[55,'rain'],[10,'sun'],[0,'sun'],[10,'sun'],[30,'cloud'],[25,'cloud'],[50,'rain'],[0,'sun'],[10,'sun'],[20,'cloud'],[10,'sun'],[60,'rain']];
const rain=i=>i<20&&WX[i][0]>=50;
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
 ['gian','Delgado','Exterior',0,2,9800],['gian','Brightwater HOA, phase 2','Commercial',8,12,21000],['gian','Lopez','Interior',15,17,6200],
 ['tania','Brickell Bay condo halls','Commercial',0,4,18500],['tania','Simmons','Exterior',7,9,8900],['tania','Watts','Interior',14,16,7100],
 ['johan-dani','Chen','Interior',0,1,4100],['johan-dani','Navarro','Exterior',4,7,9400],['johan-dani','Kim','Interior',11,13,6800],
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
 hernandez:{id:'hernandez',title:'Hernandez exterior',client:'Rosa & Daniel Hernandez',area:'Pinecrest',type:'exterior',ext:true,built:1974,hours:120,value:14800,earliest:3,deadline:13,lang:'es',hoa:true,
  skills:['prep','spray'],labels:['HOA','Repeat client'],colors:[['Repose Gray','#CCC9C0'],['Pure White','#F2F0EA'],['Tricorn Black','#2F2F30']],colorsOk:true,photos:14,sig:{returning:'2019 interior',referrals:5},past:'tania',
  src:'PaintScout #4127 · sold Oct 16 by Dana R.',srcs:{client:'ps',area:'ps',value:'ps',built:'ai',hours:'human',earliest:'human',deadline:'ai'},
  writeup:'Hernandez residence, Pinecrest. [ext|Two-story CBS/stucco home], [lead|built 1974]. Scope: [prep|pressure wash, patch stucco cracks at NE corner, prime patches]; [spray|two coats elastomeric on body] (Loxon XP, Repose Gray); trim and fascia in Pure White; front door Tricorn Black. Second-story eaves need a 28 ft ladder or lift. Colors HOA-approved Oct 16; [hoa|HOA allows work Mon to Fri, 8am to 5pm only]. [lang|Mrs. Hernandez prefers updates in Spanish]. [due|Hosting a wedding Nov 14, wants everything done by Nov 12]. [hours|Est. 120 labor hours]. [vip|Returning client (2019 interior), has referred 5 jobs].'},
 okafor:{id:'okafor',title:'Okafor trim & door',client:'James Okafor',area:'Pinecrest',type:'exterior',ext:true,built:1988,hours:18,value:3200,earliest:1,deadline:6,lang:'en',hoa:false,skills:['cutin','color'],labels:[],
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
 'Balanced':{w:{jobType:3,skills:3,quality:2,reliability:2,client:1,record:1,cost:1,distance:1,timing:2,balance:1,language:1},d:'Job fit first, then quality, start date and cost.',by:'Mel (Admin)'},
 'Protect margin':{w:{jobType:2,skills:2,speed:2,reliability:2,quality:1,record:4,cost:4,distance:2,timing:1},d:'Crews that finish within the sold days at a good cost.',by:'Mel (Admin)'},
 'Fastest start':{w:{jobType:2,skills:1,reliability:2,timing:5,distance:1},d:'Whoever can start soonest and show up.',by:'Mel (Admin)'},
 'White glove':{w:{jobType:3,skills:3,quality:4,client:4,care:3,communication:2,reliability:2,record:1,language:2},d:'Best quality and client manner. Default for important clients.',by:'Mel (Admin)'}};
const IMPT=[
 ['returning','Returning client',j=>j.sig.returning?`Returning client (${j.sig.returning})`:null],
 ['referrals','Has referred 2 or more jobs',j=>(j.sig.referrals||0)>=2?`Has referred ${j.sig.referrals} jobs`:null],
 ['value','Job worth $12,000 or more',j=>j.value>=12000?`${money(j.value)} job`:null],
 ['crm','Tagged VIP in the CRM',j=>j.sig.crm?'Tagged VIP in the CRM':null],
 ['trade','Designer, realtor or property manager',j=>j.sig.trade||null],
 ['manual','Flagged by the estimator',j=>j.sig.manual?`Estimator note: ${j.sig.manual}`:null]];
let JOB_LABELS=['HOA','Repeat client','Occupied home','Rush','Commercial','Pets on site','Gated community'];
const LANGS={en:'English',es:'Spanish',ht:'Haitian Creole'};
