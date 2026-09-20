const products=[
  {id:1,name:'Heart Phone Charm',price:12900,category:'tech',emoji:'💗',bg:'#ffd8e9',badge:'NEW',sub:'Phone crush'},
  {id:2,name:'Cherry Lip Balm',price:8900,category:'beauty',emoji:'🍒',bg:'#ffe5ec',badge:'MUSA PICK',sub:'Beauty'},
  {id:3,name:'Mini Bow Scrunchie',price:6900,category:'accessories',emoji:'🎀',bg:'#fff0cf',badge:'NEW',sub:'Girly stuff'},
  {id:4,name:'Cute Study Stickers',price:5900,category:'school',emoji:'✨',bg:'#e8f3e7',badge:'BESTIE FAV',sub:'School'},
  {id:5,name:'Pearl Hair Clip',price:9900,category:'accessories',emoji:'🤍',bg:'#eee8ff',badge:'TREND ALERT',sub:'Accessories'},
  {id:6,name:'Cloud Mirror',price:10900,category:'beauty',emoji:'☁️',bg:'#e6f0ff',badge:'NEW',sub:'Beauty'},
  {id:7,name:'Star Cable Charm',price:7900,category:'tech',emoji:'⭐',bg:'#fff2a9',badge:'ZOE’S PICK',sub:'Tech'},
  {id:8,name:'Pet Lover Keychain',price:8500,category:'gifts',emoji:'🐾',bg:'#e8f3e7',badge:'CUTE FIND',sub:'Gifts'},
  {id:9,name:'Pastel Gel Pens',price:7500,category:'school',emoji:'🖊️',bg:'#eee8ff',badge:'SCHOOL FAV',sub:'School'},
  {id:10,name:'Mini Gift Pouch',price:11900,category:'gifts',emoji:'🎁',bg:'#ffd8e9',badge:'GIFTABLE',sub:'Gifts'},
  {id:11,name:'Glossy Claw Clip',price:8900,category:'accessories',emoji:'🦋',bg:'#e6f0ff',badge:'NEW',sub:'Accessories'},
  {id:12,name:'Self Care Headband',price:9900,category:'beauty',emoji:'🫧',bg:'#fff0cf',badge:'MUSA PICK',sub:'Self care'}
];

let bag=JSON.parse(localStorage.getItem('musaBag')||'[]');

const money=n=>new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:0}).format(n);

function card(p){
  return `<article class="product-card">
    <div class="product-image" style="background:${p.bg}">
      <span class="product-badge">${p.badge}</span>
      <button class="product-like" aria-label="Favorito">♡</button>
      <span class="product-emoji">${p.emoji}</span>
    </div>
    <div class="product-info">
      <div><div class="product-name">${p.name}</div><div class="product-sub">${p.sub}</div></div>
      <div class="product-price">${money(p.price)}</div>
    </div>
    <button class="add-btn" onclick="addToBag(${p.id})">ADD TO BAG +</button>
  </article>`;
}

function renderGrid(target,list){document.querySelector(target).innerHTML=list.map(card).join('')}

renderGrid('#newGrid',products.slice(0,4));
renderGrid('#shopGrid',products);

document.querySelectorAll('.filter').forEach(btn=>{
  btn.addEventListener('click',()=>{
    document.querySelectorAll('.filter').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const f=btn.dataset.filter;
    renderGrid('#shopGrid',f==='all'?products:products.filter(p=>p.category===f));
  });
});

document.querySelectorAll('.vibe-card').forEach(v=>{
  v.addEventListener('click',e=>{
    e.preventDefault();
    const f=v.dataset.category;
    document.querySelectorAll('.filter').forEach(b=>b.classList.toggle('active',b.dataset.filter===f));
    renderGrid('#shopGrid',products.filter(p=>p.category===f));
    document.querySelector('#shop').scrollIntoView({behavior:'smooth'});
  });
});

function addToBag(id){
  const found=bag.find(x=>x.id===id);
  if(found) found.qty++;
  else bag.push({id,qty:1});
  saveBag();
  openBag();
}
function saveBag(){localStorage.setItem('musaBag',JSON.stringify(bag));renderBag()}
function renderBag(){
  const count=bag.reduce((s,x)=>s+x.qty,0);
  document.querySelector('#bagCount').textContent=count;
  const items=document.querySelector('#bagItems');
  if(!bag.length){items.innerHTML='<p class="empty-bag">Your bag is waiting for something cute ✦</p>';document.querySelector('#bagTotal').textContent=money(0);return}
  let total=0;
  items.innerHTML=bag.map(x=>{
    const p=products.find(p=>p.id===x.id); total+=p.price*x.qty;
    return `<div class="bag-item"><div class="bag-thumb" style="background:${p.bg}">${p.emoji}</div><div><h4>${p.name}</h4><small>${x.qty} × ${money(p.price)}</small></div><button class="remove" onclick="removeFromBag(${p.id})">×</button></div>`;
  }).join('');
  document.querySelector('#bagTotal').textContent=money(total);
}
function removeFromBag(id){bag=bag.filter(x=>x.id!==id);saveBag()}

const drawer=document.querySelector('#bagDrawer'),backdrop=document.querySelector('#backdrop');
function openBag(){drawer.classList.add('open');backdrop.classList.add('open');drawer.setAttribute('aria-hidden','false')}
function closeBag(){drawer.classList.remove('open');backdrop.classList.remove('open');drawer.setAttribute('aria-hidden','true')}
document.querySelector('#bagBtn').onclick=openBag;
document.querySelector('#closeBag').onclick=closeBag;
backdrop.onclick=closeBag;
renderBag();

const overlay=document.querySelector('#searchOverlay');
document.querySelector('#searchBtn').onclick=()=>{overlay.classList.add('open');overlay.setAttribute('aria-hidden','false');setTimeout(()=>document.querySelector('#searchInput').focus(),100)};
document.querySelector('#closeSearch').onclick=()=>{overlay.classList.remove('open');overlay.setAttribute('aria-hidden','true')};
document.querySelector('#searchInput').addEventListener('input',e=>{
  const q=e.target.value.toLowerCase().trim();
  if(!q){document.querySelector('#searchHint').textContent='Probá: beauty, charm, stickers...';return}
  const found=products.filter(p=>(p.name+' '+p.category+' '+p.sub).toLowerCase().includes(q));
  document.querySelector('#searchHint').textContent=found.length?`${found.length} find${found.length===1?'':'s'} encontrad${found.length===1?'o':'os'} ♡`:'No encontramos eso todavía — maybe next drop?';
});

document.querySelector('#newsletterForm').addEventListener('submit',e=>{e.preventDefault();e.target.innerHTML='<strong>YOU’RE IN ♡</strong><span style="margin-left:10px;color:#665b63">Te avisamos del próximo drop.</span>'});
document.querySelector('#checkoutBtn').onclick=()=>alert('Checkout Mercado Pago: lo conectamos en la próxima etapa ♡');
document.querySelector('#menuBtn').onclick=()=>document.querySelector('.desktop-nav').classList.toggle('mobile-open');
