export async function hash(value) {
 const bytes = await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));
 return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
}
async function courierKey(secret,id) {
 const material=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const bytes=new Uint8Array(await crypto.subtle.sign('HMAC',material,new TextEncoder().encode('baladna-courier-v2:'+id)));
 return Array.from(bytes.slice(0,10),b=>b.toString(16).padStart(2,'0')).join('').match(/.{4}/g).join('-');
}
const legacyWorker = {async fetch(request,env) {
 const origin=request.headers.get('Origin');
 const headers={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin'};
 if(origin===env.SITE_ORIGIN) headers['Access-Control-Allow-Origin']=origin;
 const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers});
 if(origin&&origin!==env.SITE_ORIGIN)return reply({error:'Origin denied'},403);
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{...headers,'Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Authorization, Content-Type'}});
 const fail=(text,status=400)=>{throw Object.assign(new Error(text),{status})};
 try {
  if(!env.DB||!env.OWNER_SECRET)fail('Delivery service is not configured',503);
  const path=new URL(request.url).pathname.replace(/\/$/,'');
  const token=(request.headers.get('Authorization')||'').replace(/^Bearer /,'');
  if(!token||token.length>200)fail('Authentication required',401);
  const now=Date.now();
  const owner=path.startsWith('/admin/');
  if(owner&&await hash(token)!==await hash(env.OWNER_SECRET))fail('Unauthorized',401);
  let data={};
  if(request.method==='POST') {
   if(Number(request.headers.get('Content-Length'))>4096)fail('Payload too large',413);
   const body=await request.text();if(body.length>4096)fail('Payload too large',413);
   try{data=JSON.parse(body)}catch{fail('Invalid JSON')}
  }
  if(owner) {
   if(path==='/admin/couriers'&&request.method==='GET')return reply({couriers:(await env.DB.prepare('SELECT id,name,active FROM couriers').all()).results});
   if(path==='/admin/couriers'&&request.method==='POST') {
    if(typeof data.name!=='string'||!data.name.trim()||data.name.length>80)fail('Invalid name');
    const id=crypto.randomUUID(),key=await courierKey(env.OWNER_SECRET,id);
    await env.DB.prepare('INSERT INTO couriers(id,name,token_hash) VALUES(?,?,?)').bind(id,data.name.trim(),await hash(key)).run();
    return reply({id,name:data.name.trim(),key},201);
   }
   if(path==='/admin/key'&&request.method==='POST') {
    const courier=await env.DB.prepare('SELECT id,name,token_hash FROM couriers WHERE id=? AND active=1').bind(String(data.id)).first();
    if(!courier)fail('Courier not found',404);
    const key=await courierKey(env.OWNER_SECRET,courier.id);
    if(await hash(key)!==courier.token_hash) {
     if(data.replace!==true) return reply({legacy:true});
     await env.DB.prepare('UPDATE couriers SET token_hash=? WHERE id=? AND active=1').bind(await hash(key),courier.id).run();
    }
    return reply({key,name:courier.name});
   }
   if(path==='/admin/revoke'&&request.method==='POST') {
    await env.DB.batch([
     env.DB.prepare('UPDATE couriers SET active=0,lat=NULL,lng=NULL,updated=NULL WHERE id=?').bind(String(data.id)),
     env.DB.prepare("UPDATE orders SET courier_id=NULL,status='preparing',updated=? WHERE courier_id=? AND status!='delivered'").bind(now,String(data.id))
    ]);return reply({ok:true});
   }
   if(path==='/admin/orders'&&request.method==='GET')return reply({orders:(await env.DB.prepare('SELECT o.id,o.status,o.courier_id,c.name AS courier,o.updated FROM orders o LEFT JOIN couriers c ON c.id=o.courier_id WHERE expires>? ORDER BY created DESC LIMIT 200').bind(now).all()).results});
   if(path==='/admin/orders'&&request.method==='POST') {
    if(!/^ORD-[A-Z0-9-]{1,40}$/.test(data.id||'')||! /^[a-f0-9]{64}$/.test(data.token||''))fail('Invalid tracking link');
    const courier=await env.DB.prepare('SELECT id FROM couriers WHERE id=? AND active=1').bind(String(data.courierId)).first();
    if(!courier)fail('Courier not found');
    const existing=await env.DB.prepare('SELECT status,token_hash FROM orders WHERE id=?').bind(data.id).first();
    const tokenHash=await hash(data.token);
    if(existing&&(existing.status!=='preparing'||existing.token_hash!==tokenHash))fail('Order cannot be reassigned',409);
    await env.DB.prepare("INSERT INTO orders(id,token_hash,courier_id,status,created,updated,expires) VALUES(?,?,?,'preparing',?,?,?) ON CONFLICT(id) DO UPDATE SET courier_id=excluded.courier_id,updated=excluded.updated").bind(data.id,tokenHash,courier.id,now,now,now+7*86400000).run();
    return reply({ok:true},201);
   }
  }
  if(path==='/track'&&request.method==='GET') {
   const row=await env.DB.prepare('SELECT o.id,o.status,o.updated,c.lat,c.lng,c.accuracy,c.updated AS locationUpdated FROM orders o LEFT JOIN couriers c ON c.id=o.courier_id AND c.active=1 WHERE o.token_hash=? AND o.expires>?').bind(await hash(token),now).first();
   if(!row)fail('Order not yet confirmed or link expired',404);
   const location=row.status==='out_for_delivery'&&row.locationUpdated>=row.updated&&row.lat!==null?{lat:row.lat,lng:row.lng,accuracy:row.accuracy,updated:row.locationUpdated}:null;
   return reply({id:row.id,status:row.status,updated:row.updated,location});
  }
  if(path.startsWith('/courier/')) {
   const courier=await env.DB.prepare('SELECT id FROM couriers WHERE token_hash=? AND active=1').bind(await hash(token)).first();
   if(!courier)fail('Unauthorized',401);
   if(path==='/courier/orders'&&request.method==='GET')return reply({orders:(await env.DB.prepare("SELECT id,status FROM orders WHERE courier_id=? AND expires>? AND status!='delivered' ORDER BY created").bind(courier.id,now).all()).results});
   if(path==='/courier/location'&&request.method==='POST') {
    if(!Number.isFinite(data.lat)||Math.abs(data.lat)>90||!Number.isFinite(data.lng)||Math.abs(data.lng)>180||!Number.isFinite(data.accuracy)||data.accuracy<0||data.accuracy>100000)fail('Invalid coordinates');
    const active=await env.DB.prepare("SELECT id FROM orders WHERE courier_id=? AND status='out_for_delivery' AND expires>? LIMIT 1").bind(courier.id,now).first();
    if(!active)return reply({active:false});
    await env.DB.prepare('UPDATE couriers SET lat=?,lng=?,accuracy=?,updated=? WHERE id=?').bind(data.lat,data.lng,data.accuracy,now,courier.id).run();
    return reply({active:true});
   }
   if(path==='/courier/status'&&request.method==='POST') {
    const previous={out_for_delivery:'preparing',arrived:'out_for_delivery',delivered:'arrived'}[data.status];
    if(!previous)fail('Invalid status');
    const result=await env.DB.prepare('UPDATE orders SET status=?,updated=? WHERE id=? AND courier_id=? AND status=? AND expires>?').bind(data.status,now,String(data.id),courier.id,previous,now).run();
    if(!result.meta.changes)fail('Order or status transition invalid',409);
    return reply({ok:true});
   }
  }
  return reply({error:'Not found'},404);
 }catch(e){return reply({error:e.status?e.message:'Service unavailable'},e.status||503)}
}};


const defaults={version:3,paused:false,manualOpen:true,useHours:false,open:'08:00',close:'22:00',etaMin:30,etaMax:45,freeAbove:50000,regions:[],stock:{},bundles:[]};
async function setup(DB){await DB.batch([
 DB.prepare('CREATE TABLE IF NOT EXISTS order_details (id TEXT PRIMARY KEY, details TEXT NOT NULL, estimate TEXT, subscription TEXT, notified INTEGER DEFAULT 0)'),
 DB.prepare('CREATE TABLE IF NOT EXISTS shop_settings (id TEXT PRIMARY KEY, value TEXT NOT NULL)'),
 DB.prepare('CREATE TABLE IF NOT EXISTS service_keys (id TEXT PRIMARY KEY, value TEXT NOT NULL)')
]);}
async function settings(DB){const row=await DB.prepare("SELECT value FROM shop_settings WHERE id='shop'").first();return row?{...defaults,...JSON.parse(row.value)}:{...defaults};}
function isOpen(s){if(s.paused)return false;if(!s.useHours)return s.manualOpen;const t=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Damascus',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date());return s.open===s.close?true:s.open<s.close?t>=s.open&&t<s.close:t>=s.open||t<s.close;}
function cleanSettings(d){const money=x=>Number.isFinite(x)&&x>=0&&x<=1e9;const time=x=>/^([01]\d|2[0-3]):[0-5]\d$/.test(x||'');if(!time(d.open)||!time(d.close)||!money(d.freeAbove)||!Number.isInteger(d.etaMin)||!Number.isInteger(d.etaMax)||d.etaMin<1||d.etaMax<d.etaMin||d.etaMax>1440)throw new Error('راجع الساعات والتقدير والمبالغ.');if(!Array.isArray(d.regions)||d.regions.length>30||!Array.isArray(d.bundles)||d.bundles.length>20)throw new Error('عدد المناطق أو الحزم أكبر من المسموح.');const regions=d.regions.map((r,i)=>{if(typeof r.name!=='string'||!r.name.trim()||r.name.length>80||!money(r.fee)||!money(r.minimum))throw new Error('راجع اسم المنطقة والرسوم والحد الأدنى.');return{id:String(i+1),name:r.name.trim(),fee:r.fee,minimum:r.minimum,enabled:r.enabled!==false};});const stock={};for(const [id,v]of Object.entries(d.stock||{})){if(/^\d{1,5}$/.test(id)&&v===false)stock[id]=false;}const bundles=d.bundles.map(b=>{if(typeof b.name!=='string'||!b.name.trim()||b.name.length>80||!Array.isArray(b.items)||!b.items.length||b.items.length>40||!Number.isFinite(b.percent)||b.percent<0||b.percent>80)throw new Error('راجع الحزمة ومنتجاتها ونسبة الخصم.');if(new Set(b.items.map(i=>i.id)).size!==b.items.length)throw new Error('لا تكرر المنتج داخل الحزمة.');return{id:String(b.id||crypto.randomUUID()),name:b.name.trim(),percent:b.percent,items:b.items.map(i=>{if(!Number.isInteger(i.id)||i.id<0||i.id>=100000||!Number.isInteger(i.quantity)||i.quantity<1||i.quantity>99)throw new Error('منتج الحزمة غير صالح');return{id:i.id,quantity:i.quantity};})};});return{...defaults,paused:!!d.paused,manualOpen:!!d.manualOpen,useHours:!!d.useHours,open:d.open,close:d.close,etaMin:d.etaMin,etaMax:d.etaMax,freeAbove:d.freeAbove,regions,stock,bundles};}
async function catalog(){const url='https://script.google.com/macros/s/AKfycbw2Qj3Ds207IFfjaapjvZo3N4QfI5NqvgsBCN0cvzifSlkcvJ34iGVU-oHB5Z_-wVwLhw/exec?catalog=1&callback=baladnaCatalogLoaded';const r=await fetch(url,{signal:AbortSignal.timeout(10000)});if(!r.ok)throw new Error('تعذّر التحقق من أسعار المنتجات.');const text=await r.text();const m=text.match(/^\s*baladnaCatalogLoaded\s*\(([\s\S]*)\)\s*;?\s*$/);if(!m)throw new Error('تعذّر قراءة كتالوج المنتجات.');const data=JSON.parse(m[1]);if(!Array.isArray(data.products))throw new Error('الكتالوج غير متاح.');return data.products;}
export default {async fetch(request,env,ctx){
 const origin=request.headers.get('Origin'),path=new URL(request.url).pathname.replace(/\/$/,'');
 const headers={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin'};if(origin===env.SITE_ORIGIN)headers['Access-Control-Allow-Origin']=origin;
 const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers});
 if(origin&&origin!==env.SITE_ORIGIN)return reply({error:'Origin denied'},403);
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{...headers,'Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Authorization, Content-Type'}});
 try{
 if(!env.DB||!env.OWNER_SECRET)return reply({error:'Delivery service is not configured'},503);
 const token=(request.headers.get('Authorization')||'').replace(/^Bearer /,'');const owner=path.startsWith('/admin/');
 if(owner&&(!token||await hash(token)!==await hash(env.OWNER_SECRET)))return reply({error:'Unauthorized'},401);
 if(owner)await setup(env.DB);
 let d={};if(request.method==='POST'&&(path==='/orders'||path==='/subscribe'||['/admin/settings','/admin/decision','/admin/estimate','/admin/assign'].includes(path))){const text=await request.text();if(text.length>16000)return reply({error:'الطلب كبير جدًا'},413);d=JSON.parse(text);}
 if(path==='/settings'&&request.method==='GET'){const s=await settings(env.DB);return reply({...s,openNow:isOpen(s)});}
 if(path==='/admin/catalog'&&request.method==='GET')return reply({products:await catalog()});
 if(path==='/admin/settings'){
  if(request.method==='POST'){const s=cleanSettings(d);await env.DB.prepare("INSERT INTO shop_settings(id,value) VALUES('shop',?) ON CONFLICT(id) DO UPDATE SET value=excluded.value").bind(JSON.stringify(s)).run();return reply({ok:true});}
  if(request.method==='GET')return reply(await settings(env.DB));
 }
 if(path==='/orders'&&request.method==='POST'){
 if(!/^ORD-[A-Z0-9-]{1,40}$/.test(d.id||'')||! /^[a-f0-9]{64}$/.test(d.token||'')||typeof d.name!=='string'||!d.name.trim()||d.name.length>100||typeof d.phone!=='string'||d.phone.length>40||typeof d.address!=='string'||!d.address.trim()||d.address.length>400||!Array.isArray(d.items)||!d.items.length||d.items.length>40)return reply({error:'راجع الاسم والعنوان والمنتجات.'},400);
 const s=await settings(env.DB);if(!isOpen(s))return reply({error:'استقبال الطلبات مغلق الآن. راجع ساعات العمل.'},409);
 const prior=await env.DB.prepare('SELECT token_hash FROM orders WHERE id=?').bind(d.id).first();if(prior){if(prior.token_hash!==await hash(d.token))return reply({error:'رقم الطلب مستخدم'},409);const saved=await env.DB.prepare('SELECT details FROM order_details WHERE id=?').bind(d.id).first();return reply({ok:true,id:d.id,details:saved?JSON.parse(saved.details):undefined});}
 const cat=await catalog(),map=new Map(cat.map(p=>[p.id,p]));const seen=new Set();const items=d.items.map(i=>{if(!Number.isInteger(i.quantity)||i.quantity<1||i.quantity>99||seen.has(i.id))throw new Error('كمية أو منتج غير صالح');seen.add(i.id);const p=map.get(i.id);if(!p||!Number.isFinite(p.price)||p.price<0||s.stock[i.id]===false)throw new Error('أحد المنتجات غير متاح؛ حدّث السلة.');return{id:p.id,name:String(p.name).slice(0,150),quantity:i.quantity,unitPrice:p.price};});
 const subtotal=items.reduce((a,i)=>a+i.quantity*i.unitPrice,0);const region=s.regions.find(r=>r.id===String(d.region));if(s.regions.length&&(!region||!region.enabled))return reply({error:'اختر منطقة ضمن نطاق التوصيل.'},400);if(region&&subtotal<region.minimum)return reply({error:'لم تصل إلى الحد الأدنى للطلب في هذه المنطقة.'},400);
 const fee=region?(s.freeAbove>0&&subtotal>=s.freeAbove?0:region.fee):0;
 const coupons={WELCOME10:{type:'percent',value:10},SAVE20:{type:'percent',value:20},FIRST50:{type:'fixed',value:50000}};const coupon=coupons[d.coupon];let discount=coupon?Math.min(subtotal,coupon.type==='percent'?Math.round(subtotal*coupon.value/100):coupon.value):0;
 const bundle=s.bundles.find(b=>b.id===d.bundleId);if(bundle&&bundle.items.every(i=>items.some(p=>p.id===i.id&&p.quantity>=i.quantity))){const bt=bundle.items.reduce((a,i)=>a+i.quantity*map.get(i.id).price,0);discount=Math.max(discount,Math.round(bt*bundle.percent/100));}
 let location='';if(typeof d.location==='string'&&d.location){const m=d.location.match(/^https:\/\/www\.google\.com\/maps\?q=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)$/);if(!m||Math.abs(+m[1])>90||Math.abs(+m[2])>180)throw new Error('رابط الموقع غير صالح');location=d.location;}
 const details={name:d.name.trim(),phone:d.phone.trim(),address:d.address.trim(),location,region:region?.name||'',day:String(d.day||'').slice(0,20),time:String(d.time||'').slice(0,20),substitution:d.substitution==='allow'?'allow':'call',notes:String(d.notes||'').slice(0,500),items,subtotal,discount,fee,total:subtotal-discount+fee,etaMin:s.etaMin,etaMax:s.etaMax};const now=Date.now();
 await env.DB.batch([env.DB.prepare("INSERT INTO orders(id,token_hash,status,created,updated,expires) VALUES(?,?,'new',?,?,?)").bind(d.id,await hash(d.token),now,now,now+7*86400000),env.DB.prepare('INSERT INTO order_details(id,details) VALUES(?,?)').bind(d.id,JSON.stringify(details))]);return reply({ok:true,id:d.id,details},201);
 }
 if(path==='/admin/orders'&&request.method==='GET'){const result=await env.DB.prepare('SELECT o.id,o.status,o.courier_id,c.name AS courier,o.updated,o.created,d.details,d.estimate FROM orders o LEFT JOIN couriers c ON c.id=o.courier_id LEFT JOIN order_details d ON d.id=o.id WHERE o.expires>? ORDER BY o.created DESC LIMIT 200').bind(Date.now()).all();return reply({orders:result.results.map(o=>({...o,details:o.details?JSON.parse(o.details):null}))});}
 if(path==='/admin/assign'&&request.method==='POST'){const courier=await env.DB.prepare('SELECT id FROM couriers WHERE id=? AND active=1').bind(String(d.courierId)).first();if(!courier)return reply({error:'المندوب غير موجود'},400);const r=await env.DB.prepare("UPDATE orders SET courier_id=?,updated=? WHERE id=? AND status='preparing' AND expires>?").bind(courier.id,Date.now(),String(d.id),Date.now()).run();return r.meta.changes?reply({ok:true}):reply({error:'اقبل الطلب أولًا أو تحقق من حالته'},409);}
 if(path==='/admin/decision'&&request.method==='POST'){if(!['preparing','cancelled'].includes(d.status))return reply({error:'حالة غير صالحة'},400);const result=await env.DB.prepare("UPDATE orders SET status=?,updated=? WHERE id=? AND status='new'").bind(d.status,Date.now(),String(d.id)).run();return result.meta.changes?reply({ok:true}):reply({error:'الطلب ليس جديدًا'},409);}
 if(path==='/admin/estimate'&&request.method==='POST'){if(typeof d.estimate!=='string'||d.estimate.length>120)return reply({error:'التقدير طويل'},400);await env.DB.prepare('UPDATE order_details SET estimate=? WHERE id=?').bind(d.estimate,String(d.id)).run();return reply({ok:true});}
 if(path==='/courier/orders'&&request.method==='GET'){const courier=await env.DB.prepare('SELECT id FROM couriers WHERE token_hash=? AND active=1').bind(await hash(token)).first();if(!courier)return reply({error:'Unauthorized'},401);const result=await env.DB.prepare("SELECT o.id,o.status,d.details,d.estimate FROM orders o LEFT JOIN order_details d ON d.id=o.id WHERE o.courier_id=? AND o.expires>? AND o.status IN ('preparing','out_for_delivery','arrived') ORDER BY o.created").bind(courier.id,Date.now()).all();return reply({orders:result.results.map(o=>({...o,details:o.details?JSON.parse(o.details):null}))});}
 if(path==='/track'&&request.method==='GET'){const response=await legacyWorker.fetch(request,env);if(!response.ok)return response;const body=await response.json();const row=await env.DB.prepare('SELECT estimate,details FROM order_details WHERE id=?').bind(body.id).first();const detail=row?JSON.parse(row.details):null;return reply({...body,estimate:row?.estimate||'',eta:detail?{min:detail.etaMin,max:detail.etaMax}:null});}
 if(path==='/push/public-key'&&request.method==='GET'){const row=await env.DB.prepare("SELECT value FROM service_keys WHERE id='vapid'").first();return row?reply({key:JSON.parse(row.value).publicKey}):reply({error:'الإشعارات غير مفعلة بعد'},503);}
 if(path==='/admin/push-enable'&&request.method==='POST'){let row=await env.DB.prepare("SELECT value FROM service_keys WHERE id='vapid'").first();if(!row){const pair=await crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},true,['sign','verify']);const privateKey=await crypto.subtle.exportKey('jwk',pair.privateKey);const publicKey=b64(new Uint8Array(await crypto.subtle.exportKey('raw',pair.publicKey)));await env.DB.prepare("INSERT OR IGNORE INTO service_keys(id,value) VALUES('vapid',?)").bind(JSON.stringify({privateKey,publicKey})).run();}return reply({ok:true});}
 if(path==='/subscribe'&&request.method==='POST'){const o=await env.DB.prepare('SELECT id FROM orders WHERE token_hash=? AND expires>?').bind(await hash(token),Date.now()).first();if(!o)return reply({error:'رابط الطلب غير صالح'},401);const sub=d.subscription;if(!sub||!pushEndpoint(sub.endpoint)||!sub.keys||unb64(sub.keys.p256dh).length!==65||unb64(sub.keys.auth).length!==16)return reply({error:'اشتراك غير صالح'},400);await env.DB.prepare('UPDATE order_details SET subscription=? WHERE id=?').bind(JSON.stringify(sub),o.id).run();return reply({ok:true});}
 if(path==='/courier/status'&&request.method==='POST'){const clone=request.clone();const response=await legacyWorker.fetch(request,env);if(response.ok){const data=await clone.json();if(data.status==='arrived'){const task=notifyArrival(env,data.id).catch(()=>{});if(ctx?.waitUntil)ctx.waitUntil(task);else await task;}}return response;}
 return await legacyWorker.fetch(request,env);
 }catch(e){return reply({error:e.message&&/[؀-ۿ]/.test(e.message)?e.message:'الخدمة غير جاهزة. افتح لوحة الإدارة بعد نشر النسخة الجديدة لتجهيزها.'},503);}
}};
function b64(bytes){return btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
function unb64(s){return Uint8Array.from(atob(String(s).replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-String(s).length%4)%4)),c=>c.charCodeAt(0));}
function catBytes(...arrays){const result=new Uint8Array(arrays.reduce((n,a)=>n+a.length,0));let offset=0;for(const a of arrays){result.set(a,offset);offset+=a.length;}return result;}
function pushEndpoint(value){try{const u=new URL(value);return u.protocol==='https:'&&u.port===''&&!u.username&&!u.password&&['fcm.googleapis.com','updates.push.services.mozilla.com','web.push.apple.com'].includes(u.hostname);}catch{return false;}}
async function hkdf(ikm,salt,info,size){const key=await crypto.subtle.importKey('raw',ikm,'HKDF',false,['deriveBits']);return new Uint8Array(await crypto.subtle.deriveBits({name:'HKDF',hash:'SHA-256',salt,info},key,size*8));}
async function notifyArrival(env,id){const row=await env.DB.prepare('SELECT subscription,notified FROM order_details WHERE id=?').bind(id).first();if(!row?.subscription||row.notified)return;const stored=await env.DB.prepare("SELECT value FROM service_keys WHERE id='vapid'").first();if(!stored)return;const vapid=JSON.parse(stored.value),sub=JSON.parse(row.subscription);if(!pushEndpoint(sub.endpoint))return;
 const te=new TextEncoder(),pair=await crypto.subtle.generateKey({name:'ECDH',namedCurve:'P-256'},true,['deriveBits']);const sender=new Uint8Array(await crypto.subtle.exportKey('raw',pair.publicKey)),receiver=unb64(sub.keys.p256dh);const rk=await crypto.subtle.importKey('raw',receiver,{name:'ECDH',namedCurve:'P-256'},false,[]);const shared=new Uint8Array(await crypto.subtle.deriveBits({name:'ECDH',public:rk},pair.privateKey,256));const salt=crypto.getRandomValues(new Uint8Array(16));const ikm=await hkdf(shared,unb64(sub.keys.auth),catBytes(te.encode('WebPush: info\0'),receiver,sender),32);const cek=await hkdf(ikm,salt,te.encode('Content-Encoding: aes128gcm\0'),16),nonce=await hkdf(ikm,salt,te.encode('Content-Encoding: nonce\0'),12);const aes=await crypto.subtle.importKey('raw',cek,'AES-GCM',false,['encrypt']);const payload=te.encode(JSON.stringify({title:'وصل مندوب بلدنا',body:'وصل طلبك. يرجى الاستعداد لاستلامه.',id}));const encrypted=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv:nonce},aes,catBytes(payload,new Uint8Array([2]))));const header=new Uint8Array(21);header.set(salt);new DataView(header.buffer).setUint32(16,4096);header[20]=65;const body=catBytes(header,sender,encrypted);
 const part=b64(te.encode(JSON.stringify({typ:'JWT',alg:'ES256'})))+'.'+b64(te.encode(JSON.stringify({aud:new URL(sub.endpoint).origin,exp:Math.floor(Date.now()/1000)+3600,sub:env.SITE_ORIGIN})));const signing=await crypto.subtle.importKey('jwk',vapid.privateKey,{name:'ECDSA',namedCurve:'P-256'},false,['sign']);const sig=new Uint8Array(await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},signing,te.encode(part)));const response=await fetch(sub.endpoint,{method:'POST',redirect:'error',headers:{Authorization:'vapid t='+part+'.'+b64(sig)+', k='+vapid.publicKey,'Content-Encoding':'aes128gcm','Content-Type':'application/octet-stream',TTL:'300'},body});if(response.ok)await env.DB.prepare('UPDATE order_details SET notified=1 WHERE id=?').bind(id).run();else if([404,410].includes(response.status))await env.DB.prepare('UPDATE order_details SET subscription=NULL WHERE id=?').bind(id).run();}
