export async function hash(value) {
 const bytes = await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));
 return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
}
async function courierKey(secret,id) {
 const material=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const bytes=new Uint8Array(await crypto.subtle.sign('HMAC',material,new TextEncoder().encode('baladna-courier-v2:'+id)));
 return Array.from(bytes.slice(0,10),b=>b.toString(16).padStart(2,'0')).join('').match(/.{4}/g).join('-');
}
export default {async fetch(request,env) {
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
