/* محطاتي — طبقة الاتصال بقاعدة البيانات (Supabase): القراءة، التحديث اللحظي، الدخول */
let sb=null,sb2=null,CH=null;
const EM=u=>`${String(u).trim().toLowerCase()}@mahattati.app`;
const fromSt=r=>({id:r.id,name:r.name,gov:r.governorate,area:r.area||'',addr:r.address||'',phones:r.phones||'',map:r.map_url||'',lat:r.lat,lng:r.lng,hours:{from:r.hours_from,to:r.hours_to},manual:r.manual_status,fuel:r.fuel||{},prices:r.prices||{},pupd:r.prices_updated_at?Date.parse(r.prices_updated_at):null,upd:Date.parse(r.updated_at)});
const fromSv=r=>({id:r.id,station:r.station_id,title:r.title,desc:r.description||'',img:r.image_url||'',upd:Date.parse(r.updated_at)});
function initSb(){if(!CFG.url||!CFG.key||!window.supabase)return false;sb=supabase.createClient(CFG.url,CFG.key);return true}
function need(){if(!sb){toast('لم تُضبط قاعدة البيانات في ملف config.js');return false}if(!navigator.onLine){toast('يلزم اتصال بالإنترنت لهذا الإجراء');return false}return true}
async function pull(q){if(!sb||!navigator.onLine){net();return false}
const[a,b]=await Promise.all([sb.from('stations').select('*').order('name'),sb.from('services').select('*').order('updated_at',{ascending:false})]);
if(a.error||b.error){toast('تعذر تحديث البيانات');return false}
DB.stations=a.data.map(fromSt);DB.services=b.data.map(fromSv);save(1);if(S.u&&S.u.admin)await pullOwners();if(!q)render();return true}
async function pullOwners(){const r=await sb.from('profiles').select('*').eq('role','owner').order('created_at');if(!r.error)DB.owners=r.data.map(p=>({id:p.id,user:p.username,station:p.station_id,fails:p.failed_attempts,temp:p.must_reset,code:p.reset_code}))}
function subscribe(){if(!sb||CH)return;let t;const f=()=>{clearTimeout(t);t=setTimeout(()=>pull(['owner','admin','login'].includes(S.tab)),400)};
CH=sb.channel('live').on('postgres_changes',{event:'*',schema:'public',table:'stations'},f).on('postgres_changes',{event:'*',schema:'public',table:'services'},f).subscribe()}
async function restore(id){const r=await sb.from('profiles').select('*').eq('id',id).single();if(r.error||!r.data){await sb.auth.signOut();S.u=null;return false}const p=r.data;S.u=p.role==='admin'?{id,admin:1}:{id,station:p.station_id,must:p.must_reset};return true}
async function boot(){if(!initSb())return;subscribe();try{const{data}=await sb.auth.getSession();if(data.session)await restore(data.session.user.id)}catch(e){}await pull()}
async function out(){S.u=null;DB.owners=[];if(sb)try{await sb.auth.signOut()}catch(e){}go('home')}
