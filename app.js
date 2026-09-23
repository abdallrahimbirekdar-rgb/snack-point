const categories=[['all','الكل'],['drinks','مشروبات'],['grocery','بقالة'],['appetizers','مقبلات'],['sweets','حلويات'],['cheese','أجبان ولحوم'],['spices','بهارات'],['fruits','خضار وفواكه']];
// category|name|description|price|emoji|rating|reviews|badge
const rows=`drinks|كوكاكولا كلاسيك|عبوة 12 علبة 330مل|85000|🥤|4.8|124|hot
drinks|كوكاكولا زيرو|بدون سكر، عبوة 12 علبة|85000|🧊|4.5|89
drinks|7Up|علبة 330مل|15000|🍋|4.3|56
drinks|فانتا برتقال|علبة 330مل|15000|🍊|4.4|67
drinks|سبرايت|علبة 330مل|15000|🥤|4.2|45
drinks|بيبسي|علبة 330مل|15000|🥤|4.3|52
drinks|كابري سون كولا|10 علب 200مل|45000|🧃|4.6|78|new
drinks|ليبتون آيس تي خوخ|علبة 330مل|20000|🍹|4.4|61
drinks|مياه معدنية|عبوة 1.5 لتر|8000|💧|4.7|112
drinks|عصير برتقال|عبوة 1 لتر|35000|🍊|4.5|83
grocery|رز أبو كاس|5 كيلو — أرز بسمتي|45000|🍚|4.9|156
grocery|برغل ناعم|1 كيلو غرام|12000|🌾|4.4|48
grocery|عدس أحمر|1 كيلو غرام|15000|🫘|4.3|42
grocery|فاصولياء بيضاء|1 كيلو غرام|18000|🫘|4.5|55
grocery|حمص حب|1 كيلو غرام|14000|🫘|4.4|39
grocery|طحين|2 كيلو غرام|12000|🌾|4.6|67
grocery|سكر|1 كيلو غرام|8000|🍬|4.5|72
grocery|زيت دوار الشمس|1 لتر|45000|🫒|4.7|98
grocery|زيت زيتون|750 مل|65000|🫒|4.9|134
grocery|معكرونة|500 غرام|8000|🍝|4.3|44
grocery|فريكة|1 كيلو غرام|22000|🌾|4.6|58
grocery|شعيرية|500 غرام|7000|🍜|4.2|36
appetizers|حمص بالطحينة|400 غرام|18000|🫓|4.7|89
appetizers|متبل بيروتي|400 غرام|16000|🍆|4.5|67
appetizers|بابا غنوج|400 غرام|15000|🍆|4.6|73
appetizers|تبولة|400 غرام|14000|🥗|4.4|52
appetizers|سلطة فتوش|400 غرام|12000|🥗|4.3|48
appetizers|زعتر بلدي|250 غرام|10000|🌿|4.8|95
appetizers|مكدوس|500 غرام|35000|🍆|4.7|82|new
appetizers|يالنجي|400 غرام|28000|🥬|4.5|61
appetizers|مسبحة|400 غرام|16000|🫓|4.4|55
appetizers|فول مدمس|400 غرام|10000|🫘|4.6|71
sweets|حلاوة الجبن|500 غرام|45000|🍯|4.8|112
sweets|بقلاوة|500 غرام|55000|🥮|4.9|145
sweets|كنافة|500 غرام|40000|🍮|4.7|98
sweets|معتمر|500 غرام|35000|🍪|4.5|67
sweets|تمر مجدول|1 كيلو غرام|60000|🌴|4.8|123
sweets|عسل طبيعي|500 غرام|75000|🍯|4.9|156
sweets|مربى فراولة|400 غرام|18000|🍓|4.4|53
sweets|طحينة|500 غرام|25000|🥜|4.6|78
sweets|دبس رمان|500 مل|22000|🍇|4.5|62
sweets|دبس فليفلة|650 غرام|20000|🌶️|4.3|47
cheese|جبنة حلوم|500 غرام|55000|🧀|4.7|98
cheese|جبنة شلل|500 غرام|45000|🧀|4.5|72
cheese|جبنة بلدية|500 غرام|35000|🧀|4.4|58
cheese|لبنة بقري|400 غرام|28000|🥛|4.6|81
cheese|جبنة قشقوان|500 غرام|60000|🧀|4.8|115
cheese|مرتديلا|500 غرام|35000|🥩|4.3|49
cheese|بسطرمة|300 غرام|75000|🥩|4.7|87
cheese|سجق|500 غرام|45000|🌭|4.4|56
cheese|لحم بعجين|4 قطع|30000|🥟|4.5|68
cheese|كبة|500 غرام|40000|🥟|4.6|79
spices|زعتر|250 غرام|12000|🌿|4.7|86
spices|كمون|250 غرام|10000|🧂|4.5|63
spices|بابريكا|250 غرام|12000|🌶️|4.4|52
spices|قرفة|250 غرام|15000|🫚|4.6|71
spices|فلفل أسود|250 غرام|14000|🌶️|4.5|58
spices|سماق|250 غرام|18000|🍋|4.7|74
spices|بهارات مشكلة|250 غرام|16000|🧂|4.8|92
spices|كركم|250 غرام|10000|🟡|4.4|48
spices|هيل|100 غرام|35000|🌿|4.8|85
spices|زعفران|5 غرام|95000|🌺|4.9|132
fruits|بندورة|1 كيلو غرام|8000|🍅|4.3|41
fruits|خيار|1 كيلو غرام|6000|🥒|4.2|38
fruits|بصل|1 كيلو غرام|5000|🧅|4.4|45
fruits|ثوم|500 غرام|12000|🧄|4.5|52
fruits|بطاطا|2 كيلو غرام|10000|🥔|4.3|44
fruits|باذنجان|1 كيلو غرام|7000|🍆|4.2|37
fruits|كوسا|1 كيلو غرام|8000|🥒|4.1|33
fruits|ليمون|1 كيلو غرام|12000|🍋|4.5|49
fruits|تفاح أحمر|1 كيلو غرام|18000|🍎|4.6|57
fruits|موز|1 كيلو غرام|15000|🍌|4.4|43`;
const productPhotoIds=new Set([1, 8, 9, 11, 12, 13, 14, 15, 18, 19, 21, 22, 23, 24, 25, 26, 29, 31, 33, 35, 37, 38, 39, 40, 44, 46, 48, 49, 50, 51, 52, 53, 54, 55, 56, 59, 60, 61, 63, 64, 65, 68, 70]);
const products=rows.split('\n').map((line,id)=>{const [cat,name,desc,price,emoji,rating,reviews,badge]=line.split('|');return {id,cat,name,desc,price:+price,emoji,rating:+rating,reviews:+reviews,badge}});
const $=id=>document.getElementById(id),fmt=n=>n.toLocaleString('en-US')+' ل.س';let cart={};try{cart=JSON.parse(localStorage.getItem('daryaCart')||'{}')}catch{}let cat='all',sort='default',coupon='',customerLocation=null;
const coupons={WELCOME10:{type:'percent',value:10},SAVE20:{type:'percent',value:20},FIRST50:{type:'fixed',value:50000}};
function totalBefore(){return products.reduce((sum,p)=>sum+(cart[p.id]||0)*p.price,0)}function discount(){const c=coupons[coupon];if(!c)return 0;return Math.min(totalBefore(),c.type==='percent'?Math.round(totalBefore()*c.value/100):c.value)}function total(){return totalBefore()-discount()}function count(){return Object.values(cart).reduce((a,b)=>a+b,0)}function save(){localStorage.setItem('daryaCart',JSON.stringify(cart));renderAll()}function change(id,delta){cart[id]=Math.max(0,(cart[id]||0)+delta);if(!cart[id])delete cart[id];save()}
function renderCategories(){$('categories').innerHTML=categories.map(([key,label])=>`<button type="button" data-cat="${key}" class="${cat===key?'active':''}" aria-pressed="${cat===key}">${label}</button>`).join('')}
function renderProducts(){let list=products.filter(p=>(cat==='all'||p.cat===cat)&&(p.name+' '+p.desc).toLowerCase().includes($('search').value.trim().toLowerCase()));list=[...list];if(cat==='all'&&sort==='default')list.sort((a,b)=>Number(b.id===0||productPhotoIds.has(b.id))-Number(a.id===0||productPhotoIds.has(a.id)));if(sort==='price-low')list.sort((a,b)=>a.price-b.price);if(sort==='price-high')list.sort((a,b)=>b.price-a.price);if(sort==='rating')list.sort((a,b)=>b.rating-a.rating);if(sort==='popular')list.sort((a,b)=>b.reviews-a.reviews);$('resultCount').textContent=`${list.length} منتج`;$('emptyResults').hidden=!!list.length;$('products').innerHTML=list.map(p=>`<article class="product"><div class="product-art">${p.id===0?`<img class="product-photo contain" src="coca-cola-can.webp" alt="صورة عبوة كوكاكولا كلاسيك" loading="lazy">`:productPhotoIds.has(p.id)?`<img class="product-photo ${[1,8,18,37,40,61].includes(p.id)?"contain":""}" src="product-${String(p.id).padStart(2,"0")}.webp" alt="صورة ${p.name}" loading="lazy">`:`<span role="img" aria-label="${p.name}">${p.emoji}</span>`}${p.badge?`<b class="badge ${p.badge==='new'?'new':''}">${p.badge==='new'?'جديد':'الأكثر طلباً'}</b>`:''}</div><div class="product-info"><div class="rating">★ ${p.rating.toFixed(1)} <small>(${p.reviews})</small></div><h3>${p.name}</h3><p>${p.desc}</p><div class="product-bottom"><strong class="price">${p.price.toLocaleString('en-US')} <small>ل.س</small></strong>${cart[p.id]?`<div class="qty"><button type="button" data-id="${p.id}" data-delta="-1" aria-label="تقليل ${p.name}">−</button><b>${cart[p.id]}</b><button type="button" data-id="${p.id}" data-delta="1" aria-label="زيادة ${p.name}">+</button></div>`:`<button type="button" class="add-btn" data-id="${p.id}" data-delta="1" aria-label="إضافة ${p.name} للسلة">+</button>`}</div></div></article>`).join('')}
function renderCart(){const chosen=products.filter(p=>cart[p.id]);$('cartItems').innerHTML=chosen.length?chosen.map(p=>`<div class="cart-item"><div class="cart-emoji">${p.emoji}</div><div class="cart-item-main"><strong>${p.name}</strong><small>${p.desc}</small><div class="qty"><button type="button" data-id="${p.id}" data-delta="-1" aria-label="تقليل ${p.name}">−</button><b>${cart[p.id]}</b><button type="button" data-id="${p.id}" data-delta="1" aria-label="زيادة ${p.name}">+</button></div></div><span class="cart-item-price">${fmt(p.price*cart[p.id])}</span></div>`).join(''):'<div class="empty-cart"><span>🛒</span>سلتك فارغة<br>أضف بعض المنتجات!</div>';$('cartCount').textContent=count();$('summaryItems').textContent=count()+' منتجات';$('summaryTotal').textContent=fmt(total());$('drawerTotal').textContent=fmt(total());$('sendBtn').disabled=!count();$('cartCheckout').disabled=!count();$('mobileCart').hidden=!count();$('mobileCount').textContent=count();$('mobileTotal').textContent=fmt(total())}
function renderAll(){renderProducts();renderCart()}
function openCart(){ $('cartScrim').hidden=false;$('cartDrawer').classList.add('open');$('cartDrawer').setAttribute('aria-hidden','false');document.body.style.overflow='hidden';$('cartClose').focus()}function closeCart(){$('cartScrim').hidden=true;$('cartDrawer').classList.remove('open');$('cartDrawer').setAttribute('aria-hidden','true');document.body.style.overflow='';$('cartOpen').focus()}
$('categories').addEventListener('click',e=>{const b=e.target.closest('[data-cat]');if(!b)return;cat=b.dataset.cat;renderCategories();renderProducts()});$('search').addEventListener('input',renderProducts);$('sort').addEventListener('change',e=>{sort=e.target.value;renderProducts()});document.addEventListener('click',e=>{const b=e.target.closest('[data-id][data-delta]');if(b)change(+b.dataset.id,+b.dataset.delta)});$('cartOpen').onclick=openCart;$('mobileCartOpen').onclick=openCart;$('cartClose').onclick=closeCart;$('cartScrim').onclick=closeCart;document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('cartDrawer').classList.contains('open'))closeCart()});$('cartCheckout').onclick=()=>{closeCart();$('checkout').scrollIntoView({behavior:'smooth'})};$('clearCart').onclick=()=>{cart={};coupon='';$('couponInput').value='';$('couponMessage').textContent='';save()};$('applyCoupon').onclick=()=>{const code=$('couponInput').value.trim().toUpperCase();if(coupons[code]){coupon=code;$('couponMessage').textContent='تم تطبيق رمز الخصم';renderCart()}else{$('couponMessage').textContent='رمز الخصم غير صحيح'}};
const dayNames=['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];for(let i=0;i<7;i++){const d=new Date();d.setDate(d.getDate()+i);const opt=document.createElement('option');opt.value=d.toLocaleDateString('en-CA');opt.textContent=i===0?`اليوم (${dayNames[d.getDay()]})`:i===1?`غداً (${dayNames[d.getDay()]})`:`${dayNames[d.getDay()]} ${d.getDate()}/${d.getMonth()+1}`;$('daySelect').append(opt)}for(let h=8;h<=22;h++)for(let m=0;m<60;m+=30){const t=`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;const o=document.createElement('option');o.value=o.textContent=t;$('timeSelect').append(o)}
$('locationBtn').onclick=()=>{if(!navigator.geolocation){$('locationStatus').textContent='الموقع غير متاح على هذا الجهاز';return}$('locationStatus').textContent='جارٍ تحديد موقعك...';navigator.geolocation.getCurrentPosition(pos=>{customerLocation=`https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`;$('locationStatus').textContent='تم تحديد موقعك وسيضاف إلى رسالة الطلب'},()=>{$('locationStatus').textContent='تعذّر تحديد الموقع. يمكنك إرساله يدوياً في واتساب.'},{enableHighAccuracy:true,timeout:10000})};
$('orderForm').addEventListener('submit',e=>{e.preventDefault();if(!count())return;const name=$('customerName').value.trim();if(!name){$('customerName').focus();return}let msg=`🛒 *طلب جديد — ماركت داريا الحديثة*\n\n👤 الاسم: ${name}\n`;const phone=$('customerPhone').value.trim();if(phone)msg+=`📱 الهاتف: ${phone}\n`;msg+=`📅 الموعد: ${$('daySelect').selectedOptions[0].text} الساعة ${$('timeSelect').value}\n🔖 رقم الطلب: ORD-${Date.now().toString(36).toUpperCase()}\n\n`;if(customerLocation)msg+=`📍 موقع العميل: ${customerLocation}\n\n`;msg+='📦 *المنتجات:*\n';products.filter(p=>cart[p.id]).forEach(p=>msg+=`${p.emoji} ${p.name}: ${cart[p.id]} × ${fmt(p.price)} = ${fmt(cart[p.id]*p.price)}\n`);if(discount())msg+=`\n🎟️ الخصم: -${fmt(discount())}\n`;msg+=`\n💰 *المجموع: ${fmt(total())}*\n\n— أُرسل من موقع ماركت داريا الحديثة`;window.open('https://wa.me/491621356262?text='+encodeURIComponent(msg),'_blank','noopener,noreferrer')});
renderCategories();renderAll();
// Hero gallery: gentle automatic transitions, with manual controls.
(()=>{const slides=[...document.querySelectorAll('.hero-slide')],dots=[...document.querySelectorAll('#slideDots button')],hero=document.querySelector('.hero-carousel');let active=0,timer;const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');function show(n){active=(n+slides.length)%slides.length;slides.forEach((slide,i)=>slide.classList.toggle('active',i===active));dots.forEach((dot,i)=>{dot.classList.toggle('active',i===active);if(i===active)dot.setAttribute('aria-current','true');else dot.removeAttribute('aria-current')})}function stop(){clearInterval(timer)}function start(){stop();if(!reduced.matches)timer=setInterval(()=>show(active+1),5500)}$('slidePrev').onclick=()=>{show(active-1);start()};$('slideNext').onclick=()=>{show(active+1);start()};dots.forEach((dot,i)=>dot.onclick=()=>{show(i);start()});hero.addEventListener('mouseenter',stop);hero.addEventListener('mouseleave',start);hero.addEventListener('focusin',stop);hero.addEventListener('focusout',e=>{if(!hero.contains(e.relatedTarget))start()});document.addEventListener('visibilitychange',()=>document.hidden?stop():start());reduced.addEventListener('change',start);start()})();
