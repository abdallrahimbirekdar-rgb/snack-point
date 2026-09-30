(()=>{'use strict';
 const $=id=>document.getElementById(id),api=(window.BALADNA_DELIVERY_API||'').replace(/\/$/,'');
 const token=new URLSearchParams(location.hash.slice(1)).get('token');
 const states={preparing:'جارٍ تجهيز طلبك',out_for_delivery:'طلبك في الطريق',arrived:'وصل المندوب',delivered:'تم تسليم الطلب'};
 let timer,lastPosition='',lastData=null;
 function freshness(){if(!lastData)return;const p=lastData.location;const age=p?Math.max(0,Math.floor((Date.now()-p.updated)/1000)):0;$('freshness').textContent=p?(age>60?'الموقع غير محدث — آخر تحديث منذ '+Math.floor(age/60)+' دقيقة':'آخر تحديث للموقع منذ '+age+' ثانية'):(lastData.status==='out_for_delivery'?'بانتظار إرسال موقع المندوب…':'سيظهر الموقع أثناء التوصيل.');}
 if(!api){$('notice').textContent='خدمة التتبّع لم تُفعّل بعد. تواصل مع الماركت لمعرفة حالة طلبك.';return}
 if(!/^[a-f0-9]{64}$/.test(token||'')){$('notice').textContent='رابط التتبّع غير صالح. افتح الرابط المرفق بطلبك.';return}
 async function poll(){clearTimeout(timer);if(document.hidden)return;
  try{const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),10000);let response;try{response=await fetch(api+'/track',{headers:{Authorization:'Bearer '+token},cache:'no-store',signal:controller.signal})}finally{clearTimeout(timeout)}
   if(!response.ok)throw new Error(response.status===404?'لم يؤكد الماركت الطلب بعد، أو انتهت صلاحية الرابط.':'تعذّر تحديث التتبّع. سنحاول مجددًا.');
   const data=await response.json();lastData=data;$('details').hidden=false;$('notice').hidden=true;$('order').textContent='طلب '+data.id;$('status').textContent=states[data.status]||'بانتظار تحديث الحالة';$('arrival').hidden=data.status!=='arrived';freshness();
   $('map').hidden=!data.location;$('accuracy').textContent='';
   if(data.location){const p=data.location,key=p.lat.toFixed(4)+','+p.lng.toFixed(4);if(key!==lastPosition){const box=[p.lng-.008,p.lat-.008,p.lng+.008,p.lat+.008].join(',');$('map').src='https://www.openstreetmap.org/export/embed.html?bbox='+encodeURIComponent(box)+'&layer=mapnik&marker='+encodeURIComponent(p.lat+','+p.lng);lastPosition=key}$('accuracy').textContent='دقة الموقع التقريبية: '+Math.round(p.accuracy)+' متر';}
   if(data.status==='delivered')return;
  }catch(error){$('notice').hidden=false;$('notice').textContent=error.message; if(lastData){lastData.location=null;$('map').hidden=true;$('freshness').textContent='انقطع التحديث؛ الحالة المعروضة هي آخر حالة وصلتنا.'}}
  timer=setTimeout(poll,15000);
 }
 document.addEventListener('visibilitychange',()=>{clearTimeout(timer);if(!document.hidden)poll()});setInterval(freshness,1000);poll();
})();
