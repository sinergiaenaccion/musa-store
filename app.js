let products = [];
let bag = JSON.parse(localStorage.getItem('musaBag') || '[]');
let appliedCoupon = localStorage.getItem('musaCoupon') || '';
let appliedCouponDiscount = Number(localStorage.getItem('musaCouponDiscount') || 0);
let buyerEmail = localStorage.getItem('musaBuyerEmail') || '';

const money = n => new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:0}).format(n);

async function loadProducts(){
  const response = await fetch('data/products.json', {cache:'no-store'});
  if(!response.ok) throw new Error('No se pudo cargar el catálogo');
  products = (await response.json()).filter(p=>p.active && p.digital);
  renderGrid('#digitalProducts', products);
  renderBag();
}

function card(p){
  return `<article class="product-card digital-product-card">
    <div class="product-image" style="background:${p.bg}">
      <span class="product-badge">${p.badge}</span>
      <button class="product-like" aria-label="Favorito">♡</button>
      <img class="product-cover" src="${p.image}" alt="${p.name}" loading="lazy">
    </div>
    <div class="product-info digital-info">
      <div>
        <div class="product-name">${p.name}</div>
        <div class="product-sub">${p.sub} · ${p.pages} páginas</div>
      </div>
      <div class="product-price">${money(p.price)}</div>
    </div>
    <p class="product-description">${p.description}</p>
    <details class="product-details">
      <summary>¿Qué incluye? <span>＋</span></summary>
      <ul>${p.includes.map(item=>`<li>${item}</li>`).join('')}</ul>
    </details>
    <button class="add-btn digital-add" onclick="addToBag('${p.id}')">AGREGAR A LA BOLSA ♡</button>
  </article>`;
}

function renderGrid(target,list){
  const el=document.querySelector(target);
  el.innerHTML=list.length ? list.map(card).join('') : '<p class="empty-results">No encontramos productos todavía ♡</p>';
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
document.querySelector('#searchBtn').onclick=()=>{overlay.classList.add('open');overlay.setAttribute('aria-hidden','false');setTimeout(()=>document.querySelector('#searchInput').focus(),100)};
document.querySelector('#closeSearch').onclick=()=>{overlay.classList.remove('open');overlay.setAttribute('aria-hidden','true')};
document.querySelector('#searchInput').addEventListener('input',e=>{
  const q=e.target.value.toLowerCase().trim();
  const hint=document.querySelector('#searchHint');
  if(!q){hint.textContent='Probá: glow, study, relax, planner...';return}
  const found=products.filter(p=>(p.name+' '+p.sub+' '+p.description+' '+p.includes.join(' ')).toLowerCase().includes(q));
  hint.textContent=found.length?`${found.length} resultado${found.length===1?'':'s'} encontrado${found.length===1?'':'s'} ♡`:'Todavía no encontramos eso — quizás en el próximo drop ✦';
  if(found.length) document.querySelector('#digitalProducts').scrollIntoView({behavior:'smooth',block:'start'});
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

document.querySelector('#newsletterForm').addEventListener('submit',async e=>{
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

const nav=document.querySelector('.desktop-nav');
document.querySelector('#menuBtn').addEventListener('click',()=>nav.classList.toggle('mobile-open'));
nav.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>nav.classList.remove('mobile-open')));

loadProducts().catch(error=>{
  console.error(error);
  document.querySelector('#digitalProducts').innerHTML='<p class="empty-results">Estamos actualizando MUSA. Volvemos enseguida ♡</p>';
});