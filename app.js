let products = [];
let bag = JSON.parse(localStorage.getItem('musaBag') || '[]');
let appliedCoupon = localStorage.getItem('musaCoupon') || '';
let appliedCouponDiscount = Number(localStorage.getItem('musaCouponDiscount') || 0);
let buyerEmail = localStorage.getItem('musaBuyerEmail') || '';

const money = n => new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:0}).format(n);

async function loadProducts(){
  const response=await fetch('data/products.json', {cache:'no-store'});
  if(!response.ok) throw new Error('No se pudo cargar el catálogo');
  products = (await response.json()).filter(p=>p.active);
  syncFavorites();
  renderCatalog();
  renderBag();
}

function syncFavorites(){
  const favs=JSON.parse(localStorage.getItem('musaFavorites')||'[]');
  products.forEach(p=>p.favorite=favs.includes(p.id));
}

function saveFavorites(){
  localStorage.setItem('musaFavorites',JSON.stringify(products.filter(p=>p.favorite).map(p=>p.id)));
}

const catalogState={
  query:'',
  category:'Todos',
  collection:'Todos',
  sort:'recommended',
  minPrice:0,
  maxPrice:Infinity,
  onlyStock:false
};

function getCategories(){
  return ['Todos',...new Set(products.map(p=>p.category).filter(Boolean))];
}

function getVisibleProducts(){
  let list=products.filter(p=>{
    const text=[p.name,p.sub,p.description,...(p.includes||[]),...(p.tags||[])].join(' ').toLowerCase();
    const queryOk=!catalogState.query||text.includes(catalogState.query.toLowerCase());
    const catOk=catalogState.category==='Todos'||p.category===catalogState.category;
    const collectionOk=
      catalogState.collection==='Todos' ||
      (catalogState.collection==='Novedades'&&p.newDrop) ||
      (catalogState.collection==='Seleccionados MUSA'&&p.musaPick) ||
      (catalogState.collection==='Outlet'&&p.outlet) ||
      (catalogState.collection==='Favoritos'&&p.favorite);
    const priceOk=p.price>=catalogState.minPrice && p.price<=catalogState.maxPrice;
    const stockOk=!catalogState.onlyStock || p.stock>0;
    return queryOk&&catOk&&collectionOk&&priceOk&&stockOk;
  });
  list.sort((a,b)=>{
    if(catalogState.sort==='priceAsc') return a.price-b.price;
    if(catalogState.sort==='priceDesc') return b.price-a.price;
    if(catalogState.sort==='newest') return Number(b.newDrop)-Number(a.newDrop);
    if(catalogState.sort==='favorites') return Number(b.favorite)-Number(a.favorite);
    return Number(b.musaPick)-Number(a.musaPick)||Number(b.newDrop)-Number(a.newDrop)||Number(b.featured)-Number(a.featured);
  });
  return list;
}

function card(p){
  const isPhysical=!p.digital;
  const image=p.image
    ? `<img class="product-cover" src="${p.image}" alt="${p.name}" loading="lazy">`
    : `<div class="product-placeholder" aria-label="${p.name}"><span>${p.category==="Beauty"?"♡":"◉"}</span></div>`;
  return `<article class="product-card ${isPhysical?"physical-product-card":"digital-product-card"}">
    <div class="product-image" style="background:${p.bg||'#f3edf0'}">
      <span class="product-badge">${p.badge||p.category}</span>
      <button class="product-like ${p.favorite?'is-favorite':''}" aria-label="${p.favorite?'Quitar de favoritos':'Agregar a favoritos'}" onclick="toggleFavorite('${p.id}')">${p.favorite?'♥':'♡'}</button>
      ${image}
    </div>
    <div class="product-info digital-info">
      <div>
        <div class="product-name">${p.name}</div>
        <div class="product-sub">${p.sub}${p.pages ? ` · ${p.pages} páginas` : ""}</div>
      </div>
      <div class="product-price">${money(p.price)}</div>
    </div>
    <p class="product-description">${p.description}</p>
    ${p.usage?`<p class="product-usage"><strong>Modo de uso:</strong> ${p.usage}</p>`:""}
    ${p.note?`<p class="product-usage"><strong>Importante:</strong> ${p.note}</p>`:""}
    ${isPhysical?`<p class="product-usage"><strong>Envío:</strong> se calcula según destino antes de finalizar la compra.</p>`:""}
    <details class="product-details">
      <summary>${p.digital?'¿Qué incluye?':'Más información'} <span>＋</span></summary>
      <ul>${(p.includes||[]).map(item=>`<li>${item}</li>`).join('')}</ul>
    </details>
    <button class="add-btn digital-add" onclick="addToBag('${p.id}')">AGREGAR A LA BOLSA ♡</button>
  </article>`;
}

function renderGrid(target,list){
  const el=document.querySelector(target);
  if(!el) return;
  el.innerHTML=list.length ? list.map(card).join('') : '<p class="empty-results">No encontramos productos con estos filtros ♡</p>';
}

function renderCatalog(){
  const visible=getVisibleProducts();
  const digital=visible.filter(p=>p.digital);
  const physical=visible.filter(p=>!p.digital);
  renderGrid('#digitalProducts',digital);
  renderGrid('#physicalProducts',physical);
  const count=document.querySelector('#catalogCount');
  if(count) count.textContent=`${visible.length} producto${visible.length===1?'':'s'}`;
  const categories=document.querySelector('#categoryFilters');
  if(categories) categories.innerHTML=getCategories().map(c=>`<button class="filter-chip ${catalogState.category===c?'active':''}" onclick="setCategory('${c}')">${c}</button>`).join('');
}

function setCategory(category){
  catalogState.category=category;
  renderCatalog();
}

function setCollection(collection){
  catalogState.collection=collection;
  renderCatalog();
}

function setSort(sort){
  catalogState.sort=sort;
  renderCatalog();
}

function setPriceRange(max){
  catalogState.maxPrice=max===0?Infinity:Number(max);
  renderCatalog();
}

function setOnlyStock(checked){
  catalogState.onlyStock=checked;
  renderCatalog();
}

function toggleFavorite(id){
  const p=products.find(x=>x.id===id);
  if(!p) return;
  p.favorite=!p.favorite;
  saveFavorites();
  renderCatalog();
}

function rememberSearch(q){
  q=q.trim();
  if(!q) return;
  let searches=JSON.parse(localStorage.getItem('musaRecentSearches')||'[]');
  searches=[q,...searches.filter(x=>x.toLowerCase()!==q.toLowerCase())].slice(0,5);
  localStorage.setItem('musaRecentSearches',JSON.stringify(searches));
}

function renderRecentSearches(){
  const el=document.querySelector('#recentSearches');
  if(!el) return;
  const searches=JSON.parse(localStorage.getItem('musaRecentSearches')||'[]');
  el.innerHTML=searches.length ? searches.map(q=>`<button onclick="useRecentSearch('${q.replace(/'/g,"&#39;")}')">${q}</button>`).join('') : '<span>Sin búsquedas recientes</span>';
}

function useRecentSearch(q){
  catalogState.query=q;
  renderCatalog();
  renderRecentSearches();
  document.querySelector('#shop')?.scrollIntoView({behavior:'smooth'});
}

function renderBag(){
  bag = bag.filter(x=>products.some(p=>p.id===x.id));
  const count=bag.reduce((s,x)=>s+x.qty,0);
  document.querySelector('#bagCount').textContent=count;
  const items=document.querySelector('#bagItems');
  if(!bag.length){
    items.innerHTML='<p class="empty-bag">Tu bolsa está esperando algo lindo ✦</p>';
    document.querySelector('#bagSubtotal').textContent=money(0);
    document.querySelector('#bagTotal').textContent=money(0);
    document.querySelector('#discountRow').hidden=true;
    localStorage.setItem('musaBag',JSON.stringify(bag));
    return;
  }
  let total=0;
  items.innerHTML=bag.map(x=>{
    const p=products.find(p=>p.id===x.id);
    const qty=Math.max(1,Math.min(x.qty,p.stock));
    x.qty=qty;
    total+=p.price*qty;
    return `<div class="bag-item">
      <div class="bag-thumb"><img src="${p.image}" alt=""></div>
      <div><h4>${p.name}</h4><small>${qty} × ${money(p.price)}</small></div>
      <button class="remove" onclick="removeFromBag('${p.id}')">×</button>
    </div>`;
  }).join('');
  document.querySelector('#bagSubtotal').textContent=money(total);
  const emailInput=document.querySelector('#buyerEmail');
  if(emailInput) emailInput.value=buyerEmail;
  const discount = appliedCoupon ? Math.round(total * (appliedCouponDiscount || 0.20)) : 0;
  document.querySelector('#discountRow').hidden=!appliedCoupon;
  document.querySelector('#bagDiscount').textContent=money(-discount);
  document.querySelector('#bagTotal').textContent=money(total-discount);
  localStorage.setItem('musaBag',JSON.stringify(bag));
  localStorage.setItem('musaCoupon',appliedCoupon);
  const couponInput=document.querySelector('#couponInput');
  if(couponInput) couponInput.value='';
}

function addToBag(id){
  const p=products.find(p=>p.id===id);
  if(!p) return;
  const found=bag.find(x=>x.id===id);
  if(found){ found.qty++; } else { bag.push({id,qty:1}); }
  renderBag();
  openBag();
}

function removeFromBag(id){
  bag=bag.filter(x=>x.id!==id);
  renderBag();
}

const drawer=document.querySelector('#bagDrawer'),backdrop=document.querySelector('#backdrop');
function openBag(){drawer.classList.add('open');backdrop.classList.add('open');drawer.setAttribute('aria-hidden','false')}
function closeBag(){drawer.classList.remove('open');backdrop.classList.remove('open');drawer.setAttribute('aria-hidden','true')}
document.querySelector('#bagBtn').onclick=openBag;
document.querySelector('#closeBag').onclick=closeBag;
backdrop.onclick=closeBag;

const overlay=document.querySelector('#searchOverlay');
document.querySelector('#searchBtn').onclick=()=>{overlay.classList.add('open');overlay.setAttribute('aria-hidden','false');renderRecentSearches();setTimeout(()=>document.querySelector('#searchInput').focus(),100)};
document.querySelector('#closeSearch').onclick=()=>{overlay.classList.remove('open');overlay.setAttribute('aria-hidden','true')};
document.querySelector('#searchInput').addEventListener('input',e=>{
  const q=e.target.value.toLowerCase().trim();
  const hint=document.querySelector('#searchHint');
  if(!q){hint.textContent='Probá: glow, study, relax, planner...';return}
    catalogState.query=q;
  const found=getVisibleProducts();
  hint.textContent=found.length?`${found.length} resultado${found.length===1?'':'s'} encontrado${found.length===1?'':'s'} ♡`:'Todavía no encontramos eso — quizás en el próximo drop ✦';
  if(found.length) document.querySelector('#shop')?.scrollIntoView({behavior:'smooth',block:'start'});
  if(q) rememberSearch(q); renderCatalog(); renderRecentSearches();
});

document.querySelector('#applyCoupon').onclick=async()=>{
  const input=document.querySelector('#couponInput');
  const message=document.querySelector('#couponMessage');
  const button=document.querySelector('#applyCoupon');
  const code=(input.value||'').trim().toUpperCase();
  if(!code){
    appliedCoupon='';
    localStorage.removeItem('musaCoupon');
    message.textContent='Ingresá tu código para aplicar el beneficio. ♡';
    renderBag();
    return;
  }
  button.disabled=true;
  message.textContent='Verificando código…';
  try{
    const response=await fetch('/api/validate-coupon',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({code,email:buyerEmail})
    });
    const data=await response.json();
    if(!response.ok || !data.valid) throw new Error(data.error || 'coupon_invalid');
    appliedCoupon=code;
    appliedCouponDiscount=Number(data.discount || 0);
    localStorage.setItem('musaCoupon',appliedCoupon);
    localStorage.setItem('musaCouponDiscount',String(appliedCouponDiscount));
    message.textContent=`Código aplicado · ${Math.round(appliedCouponDiscount*100)}% OFF. ✦`;
    input.value='';
    renderBag();
  }catch(error){
    appliedCoupon='';
    appliedCouponDiscount=0;
    localStorage.removeItem('musaCoupon');
    localStorage.removeItem('musaCouponDiscount');
    message.textContent=error.message || 'Ese código no está disponible. ♡';
    renderBag();
  }finally{
    button.disabled=false;
  }
};

document.querySelector('#buyerEmail')?.addEventListener('input',e=>{
  buyerEmail=e.target.value.trim().toLowerCase();
  localStorage.setItem('musaBuyerEmail',buyerEmail);
});

document.querySelector('#voucherBtn').onclick=()=>{
  const text=encodeURIComponent('Hola MUSA 🎁 Quiero regalar un voucher MUSA. ¿Me cuentan las opciones y cómo puedo comprarlo?');
  window.open('https://wa.me/5493513394174?text='+text,'_blank','noopener');
};

document.querySelector('#transferBtn').onclick=()=>{
  if(!bag.length){openBag();return;}
  const subtotal=bag.reduce((sum,x)=>{
    const p=products.find(p=>p.id===x.id);
    return sum+(p?p.price*x.qty:0);
  },0);
  const discount=Math.round(subtotal*0.10);
  const total=subtotal-discount;
  const selected=bag.map(x=>{
    const p=products.find(p=>p.id===x.id);
    return p?`${x.qty} × ${p.name} — ${money(p.price*x.qty)}`:null;
  }).filter(Boolean).join('\n');
  const text=encodeURIComponent(
    'Hola MUSA 💗 Quiero comprar por transferencia:\n\n'+
    selected+
    '\n\nSubtotal: '+money(subtotal)+
    '\n10% OFF transferencia: -'+money(discount)+
    '\nTOTAL A TRANSFERIR: '+money(total)+
    '\n\nAlias Mercado Pago: armar.caer.cauces.mp'+
    '\n\nYa realicé la transferencia. Les envío el comprobante por acá para que me habiliten la descarga. ♡'
  );
  window.open('https://wa.me/5493513394174?text='+text,'_blank','noopener');
};

document.querySelector('#checkoutBtn').onclick=async()=>{
  if(!bag.length){openBag();return;}
  const button=document.querySelector('#checkoutBtn');
  button.disabled=true;
  button.textContent='ABRIENDO PAGO…';
  try{
    if(appliedCoupon==='BIENVENIDA10' && !buyerEmail){
      throw new Error('Para usar BIENVENIDA10 necesitamos el email con el que te sumaste a MUSA CLUB. ♡');
    }
    const response=await fetch('/api/create-preference',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({items:bag,coupon:appliedCoupon,buyerEmail})
    });
    const data=await response.json();
    if(!response.ok || !data.initPoint) throw new Error(data.error || 'checkout_unavailable');
    window.location.href=data.initPoint;
  }catch(error){
    console.warn('Checkout no disponible todavía:',error);
    const selected=bag.map(x=>{
      const p=products.find(p=>p.id===x.id);
      return p?`${x.qty} × ${p.name}`:null;
    }).filter(Boolean).join('%0A');
    const text=encodeURIComponent('Hola MUSA 💗 Quiero comprar:\n'+selected+'\n\n¿Me pasan el medio de pago y cómo recibo los workbooks?');
    window.open('https://wa.me/5493513394174?text='+text,'_blank','noopener');
  }finally{
    button.disabled=false;
    button.textContent='CONTINUAR CON MERCADO PAGO ✦';
  }
};

document.querySelector('#newsletterForm')?.addEventListener('submit',async e=>{
  e.preventDefault();
  const form=e.target;
  const input=form.querySelector('input[type="email"]');
  const button=form.querySelector('button');
  const email=input.value.trim();
  if(!email) return;
  button.disabled=true;
  button.textContent='SUMANDO…';
  try{
    const response=await fetch('/api/newsletter',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({email})
    });
    const data=await response.json();
    if(!response.ok) throw new Error(data.error || 'newsletter_error');
    form.innerHTML='<strong>YA FORMÁS PARTE DE MUSA CLUB ♡</strong><span style="display:block;margin-top:8px;color:#665b63">Te damos la bienvenida. Revisá tu mail: acabamos de enviarte un mensaje de bienvenida con todo lo que vas a recibir.</span>';
  }catch(error){
    console.warn('No se pudo completar MUSA CLUB:',error);
    button.disabled=false;
    button.textContent='ME SUMO ✦';
    let msg=form.querySelector('.newsletter-error');
    if(!msg){msg=document.createElement('small');msg.className='newsletter-error';msg.style.cssText='display:block;margin-top:10px;color:#b42318';form.appendChild(msg);}
    msg.textContent=error.message || 'No pudimos completar la suscripción. Probá nuevamente en unos segundos. ♡';
  }
});



const businessFriendsForm=document.querySelector('#businessFriendsForm');
const businessFriendsMessage=document.querySelector('#businessFriendsMessage');

businessFriendsForm?.addEventListener('submit',async e=>{
  e.preventDefault();
  const form=e.target;
  const button=form.querySelector('button[type="submit"]');
  const message=businessFriendsMessage;
  button.disabled=true;
  button.textContent='ENVIANDO…';
  if(message) message.textContent='';
  const payload=Object.fromEntries(new FormData(form).entries());

  try{
    const response=await fetch('/api/business-friends',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(payload)
    });
    const data=await response.json();
    if(!response.ok) throw new Error(data.error || 'No pudimos enviar la solicitud.');
    form.innerHTML='<div class="business-success"><strong>¡Solicitud recibida! ♡</strong><p>Gracias. Vamos a verificar tus datos y la vinculación con tu empresa. Te escribiremos al email que nos dejaste.</p><span>El proceso puede demorar hasta 5 días hábiles.</span></div>';
  }catch(error){
    button.disabled=false;
    button.textContent='QUIERO ACTIVAR MI BENEFICIO ✦';
    if(message) message.textContent=error.message || 'No pudimos completar la solicitud. Probá nuevamente.';
  }
});



const infoModal=document.querySelector('#infoModal');
const infoModalClose=document.querySelector('#infoModalClose');
const infoTitle=document.querySelector('#infoModalTitle');
const infoPanels=[...document.querySelectorAll('[data-info-panel]')];
const infoTitles={
  payments:'Medios de pago',
  terms:'Términos y condiciones',
  privacy:'Política de privacidad',
  refunds:'Política de reembolso',
  changes:'Cambios y devoluciones',
  data:'Tratamiento de datos',
  club:'Reglamento MUSA CLUB',
  complaints:'Libro de quejas web',
  faq:'Preguntas frecuentes',
  regret:'Botón de arrepentimiento'
};

function openInfo(key){
  if(!infoModal) return;
  infoPanels.forEach(panel=>panel.classList.toggle('active',panel.dataset.infoPanel===key));
  infoTitle.textContent=infoTitles[key]||'Información MUSA';
  infoModal.classList.add('open');
  infoModal.setAttribute('aria-hidden','false');
  document.body.style.overflow='hidden';
}
function closeInfo(){
  if(!infoModal) return;
  infoModal.classList.remove('open');
  infoModal.setAttribute('aria-hidden','true');
  document.body.style.overflow='';
}
document.addEventListener('click',e=>{
  const link=e.target.closest('[data-info]');
  if(link){
    e.preventDefault();
    openInfo(link.dataset.info);
  }
});
infoModalClose?.addEventListener('click',closeInfo);
infoModal?.addEventListener('click',e=>{if(e.target===infoModal) closeInfo();});
document.addEventListener('keydown',e=>{if(e.key==='Escape') closeInfo();});

const clubPopup=document.querySelector('#clubPopup');
const clubPopupForm=document.querySelector('#clubPopupForm');
const clubPopupClose=document.querySelector('#clubPopupClose');
const clubTab=document.querySelector('#clubTab');

function openClubPopup(){
  if(!clubPopup) return;
  clubPopup.classList.add('open');
  clubPopup.setAttribute('aria-hidden','false');
}
function closeClubPopup(){
  if(!clubPopup) return;
  clubPopup.classList.remove('open');
  clubPopup.setAttribute('aria-hidden','true');
}
clubTab?.addEventListener('click',openClubPopup);
clubPopupClose?.addEventListener('click',closeClubPopup);
clubPopup?.addEventListener('click',e=>{if(e.target===clubPopup) closeClubPopup();});
setTimeout(()=>{ if(!localStorage.getItem('musaClubSeen')) { openClubPopup(); localStorage.setItem('musaClubSeen','1'); } }, 5500);

clubPopupForm?.addEventListener('submit',async e=>{
  e.preventDefault();
  const input=clubPopupForm.querySelector('input[type="email"]');
  const button=clubPopupForm.querySelector('button');
  const email=input.value.trim().toLowerCase();
  if(!email) return;
  button.disabled=true;
  button.textContent='SUMANDO…';
  try{
    const response=await fetch('/api/newsletter',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({email})
    });
    const data=await response.json();
    if(!response.ok) throw new Error(data.error || 'No pudimos completar la suscripción.');
    buyerEmail=email;
    localStorage.setItem('musaBuyerEmail',email);
    clubPopupForm.innerHTML='<strong class="club-success">YA SOS PARTE DE MUSA CLUB ♡</strong><span>Revisá tu mail: te enviamos tu bienvenida y tu beneficio de 10% OFF.</span>';
    setTimeout(closeClubPopup,2200);
  }catch(error){
    button.disabled=false;
    button.textContent='QUIERO MI BENEFICIO ✦';
    let msg=clubPopupForm.querySelector('.club-popup-error');
    if(!msg){msg=document.createElement('small');msg.className='club-popup-error';clubPopupForm.appendChild(msg);}
    msg.textContent=error.message || 'No pudimos completar la suscripción. Probá nuevamente.';
  }
});

const nav=document.querySelector('.desktop-nav');
document.querySelector('#menuBtn').addEventListener('click',()=>nav.classList.toggle('mobile-open'));
nav.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>nav.classList.remove('mobile-open')));

loadProducts().catch(error=>{
  console.error(error);
  document.querySelector('#digitalProducts').innerHTML='<p class="empty-results">Estamos actualizando MUSA. Volvemos enseguida ♡</p>';
});