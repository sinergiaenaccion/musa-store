let products = [];
let bag = JSON.parse(localStorage.getItem('musaBag') || '[]');

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
    document.querySelector('#bagTotal').textContent=money(0);
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
  document.querySelector('#bagTotal').textContent=money(total);
  localStorage.setItem('musaBag',JSON.stringify(bag));
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

document.querySelector('#checkoutBtn').onclick=async()=>{
  if(!bag.length){openBag();return;}
  const button=document.querySelector('#checkoutBtn');
  button.disabled=true;
  button.textContent='ABRIENDO PAGO…';
  try{
    const response=await fetch('/api/create-preference',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({items:bag})
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
    const text=encodeURIComponent('Hola MUSA 💗 Quiero comprar:%0A'+selected+'%0A%0A¿Me pasan el medio de pago y cómo recibo los workbooks?');
    window.open('https://wa.me/5493513394174?text='+text,'_blank','noopener');
  }finally{
    button.disabled=false;
    button.textContent='CONTINUAR CON MERCADO PAGO ✦';
  }
};

document.querySelector('#newsletterForm').addEventListener('submit',e=>{
  e.preventDefault();
  e.target.innerHTML='<strong>YA ESTÁS ADENTRO ♡</strong><span style="margin-left:10px;color:#665b63">Te avisamos del próximo drop.</span>';
});

const nav=document.querySelector('.desktop-nav');
document.querySelector('#menuBtn').addEventListener('click',()=>nav.classList.toggle('mobile-open'));
nav.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>nav.classList.remove('mobile-open')));

loadProducts().catch(error=>{
  console.error(error);
  document.querySelector('#digitalProducts').innerHTML='<p class="empty-results">Estamos actualizando MUSA. Volvemos enseguida ♡</p>';
});