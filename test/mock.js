(()=>{const K='__mockdb';const load=()=>JSON.parse(localStorage.getItem(K)||'{}');const save=o=>localStorage.setItem(K,JSON.stringify(o));
const merge=(a,b)=>{for(const k in b){if(b[k]&&typeof b[k]==='object'&&!Array.isArray(b[k])&&a[k]&&typeof a[k]==='object')merge(a[k],b[k]);else a[k]=b[k];}return a;};
const snap=(p,d)=>({id:p.split('/').pop(),exists:d!==undefined,data:()=>d,metadata:{fromCache:false,hasPendingWrites:false}});
window.__writes=0;
const doc=p=>({path:p,id:p.split('/').pop(),get:async()=>snap(p,load()[p]),set:async d=>{const o=load();o[p]=JSON.parse(JSON.stringify(d));save(o);__writes++;},
 update:async d=>{const o=load();if(!o[p])throw{code:'invalid_argument'};merge(o[p],JSON.parse(JSON.stringify(d)));save(o);__writes++;},delete:async()=>{const o=load();delete o[p];save(o);},onSnapshot:(n)=>{setTimeout(()=>n(snap(p,load()[p])),10);return()=>{}},collection:c=>coll(p+'/'+c)});
const coll=c=>({path:c,doc:id=>doc(c+'/'+id),get:async()=>{const o=load();const docs=Object.keys(o).filter(k=>k.startsWith(c+'/')&&k.split('/').length===c.split('/').length+1).map(k=>snap(k,o[k]));return{docs,size:docs.length,empty:!docs.length}}});
const db={doc,collection:coll};const who=window.__who||{id:'u_ido',owner:false};
const user={id:async()=>who.id,isOwner:async()=>who.owner,can:async()=>true,canEdit:async()=>true,me:async()=>({id:who.id})};
const comments={openComposer:async()=>({opened:true})};
window.claude={use:async n=>({db,user,comments,downloads:{save:async()=>{}}})[n]||null};})();
