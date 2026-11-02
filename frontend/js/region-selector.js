// UI preferences are separate from the project. The native region control owns selection/export semantics.
const OCI_REGION_CATALOG = [];
(()=>{
 const select=$('region'),container=select.closest('.region-control'),metadata=new Map(OCI_REGION_CATALOG.regions.map(r=>[r.id,r]));
 const favoriteKey='oci-studio.region-favorites.v1';let favorites=new Set();
 try{const stored=JSON.parse(localStorage.getItem(favoriteKey)||'[]');if(Array.isArray(stored))favorites=new Set(stored.filter(id=>metadata.has(id)));}catch{}
 select.hidden=true;container.querySelector('svg')?.remove();
 container.insertAdjacentHTML('beforeend','<button type="button" id="region-button" class="region-button" aria-haspopup="dialog" aria-controls="region-menu" aria-expanded="false"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg><span id="region-current" translate="no"></span><span aria-hidden="true" class="language-chevron">⌄</span></button><section id="region-menu" class="region-menu" hidden role="dialog" aria-modal="false" aria-labelledby="region-menu-heading"><div class="region-menu-heading" id="region-menu-heading">Região OCI</div><label class="region-search"><svg aria-hidden="true"><use href="#i-search"/></svg><input id="region-search" type="search" placeholder="Buscar cidade, país ou código…" aria-label="Buscar região OCI" autocomplete="off"></label><label class="region-filter-label"><span>Tipo de região</span><select id="region-filter"><option value="all">Todas</option><option value="commercial">Comerciais</option><option value="government">Governamentais</option><option value="sovereign">Soberanas da UE</option><option value="restricted">Dedicadas e restritas</option></select></label><div id="region-results" class="region-results" aria-live="polite"></div><div class="region-list-scroll"><section id="region-favorites-section" hidden><h3>Favoritos</h3><div id="region-favorites" role="group" aria-label="Regiões favoritas"></div></section><h3 id="region-all-heading">Todas as regiões</h3><div id="region-options" role="group" aria-labelledby="region-all-heading"></div></div><p class="region-menu-note">Acesso e serviços dependem da sua tenancy e do realm.</p><p class="region-catalog-date">Catálogo revisto em <time data-ui-date="'+OCI_REGION_CATALOG.reviewedAt+'T12:00:00Z" data-date-only translate="no"></time></p></section>');
 const button=$('region-button'),menu=$('region-menu'),search=$('region-search'),filter=$('region-filter'),list=$('region-options'),favoriteList=$('region-favorites');
 const normalize=value=>String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase();
 function countryName(code){if(!code)return '';try{return new Intl.DisplayNames([currentUiLocale()],{type:'region'}).of(code);}catch{return code;}}
 function regionName(option){return option.textContent.split(' · ')[0];}
 function close(focus=false){menu.hidden=true;button.setAttribute('aria-expanded','false');if(focus)button.focus();}
 function makeRow(option,copy=false){
  const data=metadata.get(option.value),custom=option.value==='custom',name=regionName(option),country=countryName(data?.country);
  const wrapper=document.createElement('div');wrapper.className='region-row';
  const row=document.createElement('button');row.type='button';row.className='region-option';row.dataset.region=option.value;if(copy)row.dataset.copy='favorite';row.setAttribute('aria-pressed',String(select.value===option.value));
  const text=document.createElement('span');text.className='region-option-label';text.textContent=name;
  if(!custom){text.setAttribute('translate','no');const place=document.createElement('span');place.className='region-country';place.textContent=country?' — '+country:'';text.append(place);const code=document.createElement('small');code.textContent=option.value+(data?' · '+data.realm.toUpperCase():'');text.append(code);row.title=(data?.category?translateUiText(({commercial:'Comerciais',government:'Governamentais',sovereign:'Soberanas da UE',restricted:'Dedicadas e restritas'})[data.category])+' · ':'')+option.value;}
  const check=document.createElement('span');check.className='region-check';check.setAttribute('aria-hidden','true');check.textContent=select.value===option.value?'✓':'';row.append(text,check);wrapper.append(row);
  if(data){const star=document.createElement('button');star.type='button';star.className='region-favorite-button';star.dataset.favorite=option.value;star.setAttribute('aria-pressed',String(favorites.has(option.value)));star.setAttribute('aria-label',translateUiText(favorites.has(option.value)?'Remover dos favoritos':'Adicionar aos favoritos')+' — '+name);star.title=star.getAttribute('aria-label');star.textContent=favorites.has(option.value)?'★':'☆';wrapper.append(star);}
  return wrapper;
 }
 function render(){
  const query=normalize(search.value),collator=new Intl.Collator(currentUiLocale(),{sensitivity:'base',numeric:true});list.replaceChildren();favoriteList.replaceChildren();
  const options=[...select.options].filter(o=>o.value!=='custom').sort((a,b)=>collator.compare(regionName(a),regionName(b))||collator.compare(a.value,b.value));
  const visible=options.filter(option=>{const r=metadata.get(option.value);return (filter.value==='all'||r?.category===filter.value)&&normalize([regionName(option),option.value,countryName(r?.country),r?.realm].join(' ')).includes(query);});
  for(const option of visible){list.append(makeRow(option));if(favorites.has(option.value))favoriteList.append(makeRow(option,true));}
  $('region-favorites-section').hidden=!favoriteList.children.length;
  if(!visible.length){const empty=document.createElement('p');empty.className='region-empty';empty.textContent=translateUiText('Nenhuma região encontrada.');list.append(empty);}
  const custom=[...select.options].find(o=>o.value==='custom');if(custom)list.append(makeRow(custom));
  $('region-results').textContent=translateUiText('Regiões encontradas')+': '+formatUiNumber(visible.length);
  refreshUiFormats();
 }
 function update(){const option=select.selectedOptions[0],r=metadata.get(select.value);$('region-current').textContent=option?regionName(option):s.region;button.title=(r?regionName(option)+' — '+countryName(r.country)+' · ':'')+s.region;button.setAttribute('aria-label',translateUiText('Região OCI')+' — '+button.title);if(!menu.hidden)render();}
 const nativeSyncRegion=syncRegion;syncRegion=function(){nativeSyncRegion();update();};
 button.addEventListener('click',()=>{if(!menu.hidden){close();return;}search.value='';render();menu.hidden=false;button.setAttribute('aria-expanded','true');menu.querySelector('.region-list-scroll').scrollTop=0;search.focus();});
 button.addEventListener('keydown',e=>{if(['ArrowDown','ArrowUp'].includes(e.key)){e.preventDefault();if(menu.hidden)button.click();const rows=[...menu.querySelectorAll('[data-region]')];(e.key==='ArrowUp'?rows.at(-1):rows[0])?.focus();}});
 search.addEventListener('input',()=>{render();menu.querySelector('.region-list-scroll').scrollTop=0;});filter.addEventListener('change',()=>{render();menu.querySelector('.region-list-scroll').scrollTop=0;});
 menu.addEventListener('click',e=>{
  const star=e.target.closest('[data-favorite]');if(star){const id=star.dataset.favorite,copy=!!star.closest('#region-favorites');if(favorites.has(id))favorites.delete(id);else favorites.add(id);try{localStorage.setItem(favoriteKey,JSON.stringify([...favorites]));}catch{}render();(menu.querySelector((copy?'#region-favorites ':'#region-options ')+'[data-favorite="'+id+'"]')||menu.querySelector('#region-options [data-favorite="'+id+'"]'))?.focus();return;}
  const option=e.target.closest('[data-region]');if(!option)return;select.value=option.dataset.region;select.dispatchEvent(new Event('change',{bubbles:true}));close(true);
 });
 menu.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();close(true);return;}if(e.target===filter)return;if(e.target===search&&['Home','End','ArrowLeft','ArrowRight'].includes(e.key))return;const rows=[...menu.querySelectorAll('[data-region]')],at=rows.indexOf(document.activeElement);let next;if(e.key==='ArrowDown')next=(at+1)%rows.length;if(e.key==='ArrowUp')next=(at-1+rows.length)%rows.length;if(e.key==='Home')next=0;if(e.key==='End')next=rows.length-1;if(next!==undefined&&rows.length){e.preventDefault();rows[next].focus();}});
 document.addEventListener('pointerdown',e=>{if(!container.contains(e.target))close();});document.addEventListener('focusin',e=>{if(!container.contains(e.target))close();});window.addEventListener('hashchange',()=>close());
 window.addEventListener('studio-language-change',()=>{update();refreshUiFormats();});
 const warning=document.createElement('aside');warning.id='region-change-warning';warning.className='region-change-warning';warning.hidden=true;warning.setAttribute('role','status');document.querySelector('main').prepend(warning);
 select.addEventListener('change',()=>{const previous=s.region;queueMicrotask(()=>{if(previous===s.region)return;showWarning(previous,s.region);});});
 function showWarning(previous,current){
  warning.replaceChildren();const body=document.createElement('div'),heading=document.createElement('strong');heading.textContent='Região alterada';body.append(heading);
  const context=document.createElement('p');const old=document.createElement('span');old.setAttribute('translate','no');old.textContent=previous+' → '+current;context.append(old);body.append(context);
  const description=document.createElement('p');description.textContent='Revise imagens, sub-redes, availability domains e outros OCIDs: podem pertencer à região anterior. Seus recursos, configurações e catálogo foram preservados; o catálogo anterior não é usado em outra região.';body.append(description);
  const date=document.createElement('p');date.className='small muted';date.innerHTML='<span>Alteração em</span> '+uiDate(new Date().toISOString());body.append(date);
  const dismiss=document.createElement('button');dismiss.type='button';dismiss.className='icon-button';dismiss.textContent='×';dismiss.setAttribute('aria-label','Fechar aviso');dismiss.addEventListener('click',()=>{warning.hidden=true;button.focus();});warning.append(body,dismiss);warning.hidden=false;localizeInterface();
 }
 update();localizeInterface();
})();
