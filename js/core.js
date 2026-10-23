/* محطاتي — الأساس: الأدوات والبيانات والتخزين والاتصال */
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const P={img:'<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="M21 16l-5-5-8 8"/>',copy:'<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 012-2h9"/>',calc:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01"/>',coin:'<circle cx="12" cy="12" r="9"/><path d="M14.5 9.2a3 3 0 00-5 2.1c0 3 5 1.7 5 4.5a3 3 0 01-5 .9M12 6.5v1.5M12 16v1.5"/>',fuel:'<path d="M5 21V5a2 2 0 012-2h6a2 2 0 012 2v16M4 21h12M15 9h2a2 2 0 012 2v5a1.5 1.5 0 003 0V9l-3-3M8 7h4"/>',pin:'<path d="M12 21s7-6.2 7-12a7 7 0 10-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>',search:'<circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/>',user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/>',back:'<path d="M9 6l6 6-6 6"/>',phone:'<path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',tool:'<path d="M14 7a4 4 0 005 5l-9 9a2.1 2.1 0 01-3-3l9-9a4 4 0 00-2-2z"/>',ref:'<path d="M20 11a8 8 0 00-14-4L4 9M4 4v5h5M4 13a8 8 0 0014 4l2-2M20 20v-5h-5"/>',wifi:'<path d="M2 8a15 15 0 0120 0M5 12a10 10 0 0114 0M9 16a5 5 0 016 0M3 3l18 18"/>',loc:'<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="8"/><path d="M12 1v3M12 20v3M1 12h3M20 12h3"/>',home:'<path d="M3 11l9-8 9 8v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z"/>',plus:'<path d="M12 5v14M5 12h14"/>',trash:'<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',out:'<path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>',key:'<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16 7l3 3"/>'};
const ic=n=>`<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${P[n]}</svg>`;
const GOV=['دمشق','ريف دمشق','حلب','حمص','حماة','اللاذقية','طرطوس','إدلب','دير الزور','الرقة','الحسكة','درعا','السويداء','القنيطرة'];
const FUEL={b89:'بنزين 89',b95:'بنزين 95',b98:'بنزين 98',d:'ديزل',m:'مازوت'};
const K='mh_cache_v2';let DB,S={tab:'home',gov:'',q:'',near:null,sel:null,u:null};
const now=()=>Date.now(),fh={from:'06:00',to:'22:00'};


function load(){try{localStorage.removeItem('mh_db_v1')}catch(e){}try{const c=JSON.parse(localStorage.getItem(K));DB=c&&Array.isArray(c.stations)?{stations:c.stations,services:c.services||[],ts:c.ts||0,owners:[]}:null}catch(e){DB=null}DB=DB||{stations:[],services:[],owners:[],ts:0}}
function save(q){DB.ts=now();try{localStorage.setItem(K,JSON.stringify({stations:DB.stations,services:DB.services,ts:DB.ts}))}catch(e){}if(!q)render()}

function toast(t){const x=$('#toast');x.textContent=t;x.style.display='block';clearTimeout(x.t);x.t=setTimeout(()=>x.style.display='none',2500)}
function isOpen(s){if(s.manual)return s.manual==='open';const d=new Date(),n=d.getHours()*60+d.getMinutes(),f=s.hours.from.split(':'),t=s.hours.to.split(':'),a=+f[0]*60+ +f[1],b=+t[0]*60+ +t[1];return a<=b?n>=a&&n<b:n>=a||n<b}
const ago=t=>{if(!t)return'—';const m=Math.floor((now()-t)/6e4);return m<1?'الآن':m<60?`منذ ${m} دقيقة`:m<1440?`منذ ${Math.floor(m/60)} ساعة`:new Date(t).toLocaleDateString(L==='en'?'en-GB':'ar')};
function dist(a,b,c,d){const r=x=>x*Math.PI/180,h=Math.sin(r(c-a)/2)**2+Math.cos(r(a))*Math.cos(r(c))*Math.sin(r(d-b)/2)**2;return 12742*Math.asin(Math.sqrt(h))}
function net(){const o=!navigator.onLine,b=$('#off');b.style.display=o?'flex':'none';b.innerHTML=o?`${ic('wifi')}<span class="sp">لا يوجد اتصال بالإنترنت — المعلومات المعروضة قد تكون غير محدثة</span>`:''}
addEventListener('online',()=>{net();refresh()});addEventListener('offline',net);
async function refresh(){if(!navigator.onLine){net();return toast('لا يتوفر اتصال بالإنترنت')}if(!sb)return toast('لم تُضبط قاعدة البيانات في ملف config.js');await pull();toast('تم تحديث البيانات')}
const go=(t,x)=>{S.tab=t;if(t==='station')S.st='info';if(x!==undefined)S.sel=x;render();scrollTo(0,0)};
