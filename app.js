const FREE_SHIPPING_THRESHOLD = 50000;
const WHATSAPP = '5493513394174';
let products = [];
let bag = JSON.parse(localStorage.getItem('musaBag') || '[]');

const money = n => new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:0}).format(n);

async function loadProducts(){
  const response = await fetch('data/products.json', {cache:'no-store'});
  if(!response.ok) throw new Error('No se pudo cargar el catálogo');
  products = await response.json();
  renderGrid('#newGrid', products.filter(p=>p.active && p.newDrop && !p.digital).slice(0,4));
  renderGrid('#digitalProducts', products.filter(p=>p.active && p.digital));
  renderGrid('#shopGrid', products.filter(p=>p.active));
  renderBag();
}

function card(p){
  const stockLabel = p.digital ? 'DIGITAL' : (p.stock <= 2 ? 'ÚLTIMAS UNIDADES' : p.badge);
  const pickLabel = p.musaPick ? 'MUSA PICK' : stockLabel;
  return `<article class="product-card">
    <div class="product-image" style="background:${p.bg}">
      <span class="product-badge">${pickLabel}</span>
      <button class="product-like" aria-label="Favorito">♡</button>
      <span class="product-emoji">${p.emoji}</span>
    </div>
    <div class="product-info">
      <div><div class="product-name">${p.name}</div><div class="product-sub">${p.sub}</div></div>
      <div class="product-price">${money(p.price)}</div>
    </div>
    <button class="add-btn" onclick="${p.digital ? 'buyDigital(\''+p.id+'\')' : 'addToBag(\''+p.id+'\')'}" ${p.stock<1?'disabled':''}>${p.digital?'COMPRAR DIGITAL ↗':(p.stock<1?'SIN STOCK':'AGREGAR +')}</button>
  </article>`;
}

function renderGrid(target,list){
  const el=document.querySelector(target);
  el.innerHTML=list.length ? list.map(card).join('') : '<p class="empty-results">No encontramos productos en esta categoría todavía ♡</p>';
}

function renderBag(){
  bag = bag.filter(x=>products.some(p=>p.id===x.id && p.active));
  const count=bag.reduce((s,x)=>s+x.qty,0);
  document.querySelector('#bagCount').textContent=count;
  const items=document.querySelector('#bagItems');
  if(!bag.length){
    items.innerHTML='<p class="empty-bag">Tu bolsa está esperando algo lindo ✦</p>';
    updateShipping(0);
    return;
  }
  let total=0;
  items.innerHTML=bag.map(x=>{
    const p=products.find(p=>p.id===x.id);
    const safeQty=Math.min(x.qty,p.stock);
    x.qty=safeQty;
    total+=p.price*safeQty;
    return `<div class="bag-item">
      <div class="bag-thumb" style="background:${p.bg}">${p.emoji}</div>
      <div><h4>${p.name}</h4><small>${safeQty} × ${money(p.price)}</small></div>
      <button class="remove" onclick="removeFromBag('${p.id}')">×</button>
    </div>`;
  }).join('');
  document.querySelector('#bagTotal').textContent=money(total);
  const physicalSubtotal=bag.reduce((sum,x)=>{const p=products.find(p=>p.id===x.id);return sum+(p && !p.digital ? p.price*x.qty:0)},0);
  updateShipping(physicalSubtotal);
  localStorage.setItem('musaBag',JSON.stringify(bag));
}

function updateShipping(subtotal){
  const totalEl=document.querySelector('#shippingTotal');
  const message=document.querySelector('#freeShippingMessage');
  if(subtotal===0){
    totalEl.textContent='A CALCULAR';
    message.textContent='';
    return;
  }
  if(subtotal>=FREE_SHIPPING_THRESHOLD){
    totalEl.textContent='BONIFICADO ♡';
    message.textContent='🎉 ¡Tu compra tiene envío bonificado!';
  }else{
    const missing=FREE_SHIPPING_THRESHOLD-subtotal;
    totalEl.textContent='A CALCULAR';
    message.textContent=`✨ Te faltan ${money(missing)} para tener envío bonificado.`;
  }
}

function buyDigital(id){
  const p=products.find(x=>x.id===id);
  if(!p) return;
  const text=encodeURIComponent('Hola MUSA 💗 Quiero comprar el producto digital "'+p.name+'" por '+money(p.price)+'. ¿Me pasan el medio de pago y cómo recibo el PDF?');
  window.open('https://wa.me/'+WHATSAPP+'?text='+text,'_blank','noopener');
}
function addToBag(id){
  const p=products.find(p=>p.id===id);
  if(!p || p.stock<1) return;
  if(p.digital){buyDigital(id);return;}
  const found=bag.find(x=>x.id===id);
  if(found){
    if(found.qty>=p.stock) return;
    found.qty++;
  }else bag.push({id,qty:1});
  localStorage.setItem('musaBag',JSON.stringify(bag));
  renderBag();
  openBag();
}
function removeFromBag(id){ bag=bag.filter(x=>x.id!==id); renderBag(); }

const drawer=document.querySelector('#bagDrawer'),backdrop=document.querySelector('#backdrop');
function openBag(){drawer.classList.add('open');backdrop.classList.add('open');drawer.setAttribute('aria-hidden','false')}
function closeBag(){drawer.classList.remove('open');backdrop.classList.remove('open');drawer.setAttribute('aria-hidden','true')}
document.querySelector('#bagBtn').onclick=openBag;
document.querySelector('#closeBag').onclick=closeBag;
backdrop.onclick=closeBag;

document.querySelectorAll('.filter').forEach(btn=>{
  btn.addEventListener('click',()=>{
    document.querySelectorAll('.filter').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const f=btn.dataset.filter;
    renderGrid('#shopGrid',f==='all'?products.filter(p=>p.active):products.filter(p=>p.active && p.category===f));
  });
});

document.querySelectorAll('.vibe-card').forEach(v=>{
  v.addEventListener('click',e=>{
    e.preventDefault();
    const f=v.dataset.category;
    document.querySelectorAll('.filter').forEach(b=>b.classList.toggle('active',b.dataset.filter===f));
    renderGrid('#shopGrid',f==='all'?products.filter(p=>p.active):products.filter(p=>p.active && p.category===f));
    document.querySelector('#shop').scrollIntoView({behavior:'smooth'});
  });
});

const overlay=document.querySelector('#searchOverlay');
document.querySelector('#searchBtn').onclick=()=>{overlay.classList.add('open');overlay.setAttribute('aria-hidden','false');setTimeout(()=>document.querySelector('#searchInput').focus(),100)};
document.querySelector('#closeSearch').onclick=()=>{overlay.classList.remove('open');overlay.setAttribute('aria-hidden','true')};
document.querySelector('#searchInput').addEventListener('input',e=>{
  const q=e.target.value.toLowerCase().trim();
  if(!q){document.querySelector('#searchHint').textContent='Probá: beauty, funda, stickers...';return}
  const found=products.filter(p=>(p.name+' '+p.category+' '+p.sub).toLowerCase().includes(q));
  document.querySelector('#searchHint').textContent=found.length?`${found.length} resultado${found.length===1?'':'s'} encontrado${found.length===1?'':'s'} ♡`:'Todavía no encontramos eso — quizás en el próximo drop ✦';
});

document.querySelector('#newsletterForm').addEventListener('submit',e=>{
  e.preventDefault();
  e.target.innerHTML='<strong>YA ESTÁS ADENTRO ♡</strong><span style="margin-left:10px;color:#665b63">Te avisamos del próximo drop.</span>';
});

document.querySelector('#checkoutBtn').onclick=()=>{
  const subtotal=bag.reduce((sum,x)=>{const p=products.find(p=>p.id===x.id);return sum+(p?p.price*x.qty:0)},0);
  if(!subtotal){openBag();return}
  alert('El checkout seguro de Mercado Pago se conectará en el backend de MUSA. El carrito y la regla de envío bonificado ya están preparados. ♡');
};

const nav=document.querySelector('.desktop-nav');
document.querySelector('#menuBtn').addEventListener('click',()=>nav.classList.toggle('mobile-open'));
nav.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>nav.classList.remove('mobile-open')));

loadProducts().catch(error=>{
  console.error(error);
  document.querySelector('#newGrid').innerHTML='<p class="empty-results">Estamos actualizando MUSA. Volvemos enseguida ♡</p>';
  document.querySelector('#shopGrid').innerHTML='<p class="empty-results">Estamos actualizando MUSA. Volvemos enseguida ♡</p>';
  document.querySelector('#digitalProducts').innerHTML='<p class="empty-results">Estamos actualizando MUSA. Volvemos enseguida ♡</p>';
});