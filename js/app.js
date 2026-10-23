/* محطاتي — التشغيل والرسم الرئيسي */
function render(){net();const t=S.tab;if((t==='admin'&&!(S.u&&S.u.admin))||(t==='owner'&&!(S.u&&S.u.id)))S.tab='login';
const v={home,station,services,login,admin,owner}[S.tab];const y=scrollY;$('#app').innerHTML=v();scrollTo(0,y)}
applyLang();trNode(document.body);
if("serviceWorker"in navigator)addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
load();render();boot();setTimeout(()=>{const s=$('#splash');s.style.opacity=0;setTimeout(()=>s.remove(),500)},2200);
