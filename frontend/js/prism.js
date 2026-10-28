// Prisma is a presentation layer over the existing project and generators.
var prismCategory;
function renderPrismLibrary(){
  const tabs=$('resource-tabs'),list=$('prism-service-list');if(!tabs||!list)return;
  const category=prismCategory||'all';
  tabs.innerHTML=[{id:'all',name:'Todos'},...CATEGORIES].map(c=>'<button type="button" data-action="prism-category" data-cat="'+c.id+'" aria-pressed="'+(category===c.id)+'" class="'+(category===c.id?'active':'')+'">'+esc(c.name)+'</button>').join('');
  const q=($('prism-service-search')?.value||'').toLocaleLowerCase();
  const featured=['compute','volume','vcn','lb','bucket','adb','vault'];
  const entries=Object.entries(TYPES).sort(([a],[b])=>(featured.includes(a)?featured.indexOf(a):99)-(featured.includes(b)?featured.indexOf(b):99)).filter(([id,t])=>(category==='all'||t.cat===category)&&[t.label,t.title,id].join(' ').toLocaleLowerCase().includes(q));
  const labels={compute:['Compute','Instâncias e VMs'],volume:['Block Volume','Armazenamento'],vcn:['VCN','Rede virtual'],lb:['Load Balancer','Balanceamento'],bucket:['Object Storage','Objetos'],adb:['Autonomous DB','Banco de dados'],vault:['Vault','Chaves e segredos']};
  list.innerHTML=entries.map(([id,t])=>'<button type="button" class="prism-service '+(id===selectedType?'selected':'')+'" data-action="prism-service" data-type="'+id+'" aria-pressed="'+(id===selectedType)+'"><span class="prism-service-icon">'+icon(id==='compute'?'cube':t.icon)+'</span><span><strong>'+esc(labels[id]?.[0]||t.label)+'</strong><small>'+esc(labels[id]?.[1]||CATEGORIES.find(c=>c.id===t.cat)?.name||t.cat)+'</small></span></button>').join('')||'<p class="empty-message">Nenhum serviço encontrado.</p>';
}
function renderPrismContext(){
  const map=$('prism-diagram');if(!map)return;
  const resources=s.resources,byId=new Map(resources.map(r=>[r.id,r]));
  const refs=r=>[...new Set(TYPES[r.type].fields.filter(f=>f.type==='ref').map(f=>r.values[f.key]).filter(id=>byId.has(id)&&id!==r.id))];
  function rank(r,path=new Set()){
    if(path.has(r.id))return 0;const next=new Set(path);next.add(r.id);
    return Math.min(6,Math.max(0,...refs(r).filter(id=>!next.has(id)).map(id=>rank(byId.get(id),next)+1)));
  }
  const ranks=new Map(),positions=new Map();
  for(const r of resources){const col=rank(r),row=ranks.get(col)||0;ranks.set(col,row+1);positions.set(r.id,{x:28+col*245,y:30+row*110});}
  const width=Math.max(700,...[...positions.values()].map(p=>p.x+225)),height=Math.max(130,...[...positions.values()].map(p=>p.y+88));
  const edges=resources.flatMap(r=>refs(r).map(id=>{const a=positions.get(id),b=positions.get(r.id);return '<path d="M '+(a.x+200)+' '+(a.y+36)+' C '+(a.x+225)+' '+(a.y+36)+', '+(b.x-25)+' '+(b.y+36)+', '+b.x+' '+(b.y+36)+'" class="prism-edge" marker-end="url(#prism-arrow)"/>';})).join('');
  const nodes=resources.map(r=>{const p=positions.get(r.id);return '<a href="'+(page==='diagram'?'#diagram':'#builder')+'" data-action="'+(page==='diagram'?'suite-select':'edit-resource')+'" data-id="'+r.id+'" aria-label="'+esc(r.name)+'"><rect x="'+p.x+'" y="'+p.y+'" width="200" height="74" rx="9" class="prism-node" data-category="'+TYPES[r.type].cat+'"/><use href="#i-'+TYPES[r.type].icon+'" x="'+(p.x+13)+'" y="'+(p.y+20)+'" width="24" height="24" class="prism-node-icon"/><text x="'+(p.x+48)+'" y="'+(p.y+28)+'" class="prism-node-name" translate="no">'+esc(r.name.length>18?r.name.slice(0,16)+'…':r.name)+'</text><text x="'+(p.x+48)+'" y="'+(p.y+52)+'" class="prism-node-type">'+esc(String(r.values.shape||TYPES[r.type].label).slice(0,24))+'</text></a>';}).join('');
  map.innerHTML=resources.length?'<svg viewBox="0 0 '+width+' '+height+'" role="group" aria-label="Diagrama dos recursos e suas referências locais"><defs><marker id="prism-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6" fill="none" stroke="currentColor"/></marker></defs>'+edges+nodes+'</svg>':'<div class="prism-map-empty">'+icon('network')+'<strong>Sua arquitetura começa aqui</strong><span>Adicione recursos ao plano para visualizar suas dependências.</span></div>';
  const code=$('prism-code');if(!code)return;
  const generated=currentExport();
  if($('prism-download-label'))$('prism-download-label').textContent=s.exportFormat==='oci-cli'?'Baixar OCI CLI (.sh)':'Baixar Terraform (.tf)';
  if($('prism-copy-label'))$('prism-copy-label').textContent=s.exportFormat==='oci-cli'?'Copiar OCI CLI':'Copiar Terraform';
  code.textContent=resources.length?generated.code:'// Adicione seu primeiro recurso ao plano.\n// O código gerado aparecerá aqui.';
  applyPrismZoom();
  $('prism-export-note').textContent=resources.length?'Prévia dos recursos no plano. Revise as variáveis e pendências antes de executar.':'O recurso em configuração só entra no código ao ser adicionado ao plano.';
  if(resources.length){const lines=code.textContent.split('\n');let start=lines.findIndex(line=>line.startsWith('resource \"'+TYPES[selectedType].tf+'\"'));if(start<0)start=lines.findIndex(line=>line.startsWith('resource '));if(start>=0)code.scrollTop=start*18;}
  colorPrismCode(code);
  document.querySelectorAll('[data-action="prism-format"]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.format===s.exportFormat)));
}
document.addEventListener('click',event=>{
  const button=event.target.closest('[data-action]');if(!button)return;
  if(button.dataset.action==='prism-category'){prismCategory=button.dataset.cat;renderPrismLibrary();}
  if(button.dataset.action==='prism-service')chooseType(button.dataset.type);
  if(button.dataset.action==='prism-format'){s.exportFormat=button.dataset.format==='oci-cli'?'oci-cli':'terraform';save();renderPrismContext();}
});
document.addEventListener('input',event=>{if(event.target.id==='prism-service-search')renderPrismLibrary();});
// New presentation strings use the same localization mechanism as the Studio.
for(const row of [
 ['Diagrama','Diagram','Diagrama','Diagramme','Diagramm','Diagramma','図','架构图'],
 ['Biblioteca de serviços OCI','OCI service library','Biblioteca de servicios OCI','Bibliothèque de services OCI','OCI-Servicebibliothek','Libreria servizi OCI','OCIサービスライブラリ','OCI 服务库'],
 ['Diagrama da arquitetura','Architecture diagram','Diagrama de arquitectura','Diagramme d’architecture','Architekturdiagramm','Diagramma architettura','アーキテクチャ図','架构图'],
 ['Revisão e exportação','Review and export','Revisión y exportación','Révision et export','Prüfen und exportieren','Revisione ed esportazione','レビューとエクスポート','审查与导出'],
 ['Buscar serviços…','Search services…','Buscar servicios…','Rechercher des services…','Services suchen…','Cerca servizi…','サービスを検索…','搜索服务…'],
 ['Nenhum serviço encontrado.','No services found.','No se encontraron servicios.','Aucun service trouvé.','Keine Services gefunden.','Nessun servizio trovato.','サービスが見つかりません。','未找到服务。']
])I18N_TEXT.set(row[0],row.slice(1));
localizeInterface();

// General keeps the exact same inputs, moved between panes rather than cloned.
function preparePrismGeneral(){
  const pane=document.querySelector('[data-step-pane=service]');if(!pane)return;
  let grid=pane.querySelector('.prism-general-grid');
  if(!grid){grid=document.createElement('div');grid.className='prism-general-grid';const label=document.createElement('label');label.textContent='Região';const select=document.createElement('select');select.id='prism-region';select.setAttribute('aria-label','Região do projeto');select.innerHTML=$('region').innerHTML;select.value=s.region;label.append(select);grid.append(label);pane.querySelector('.fields').after(grid);}
  const summary=pane.querySelector('.advanced-settings summary');if(summary?.firstChild)summary.firstChild.textContent='Opções avançadas ';
  const shape=$('f-shape')?.closest('.field-block');
  if(shape&&selectedType==='compute'){
    if(builderStep==='service')grid.append(shape);
    else document.querySelector('[data-step-pane=config] .configuration-group .fields')?.prepend(shape);
  }
  for(const button of $('builder-steps').querySelectorAll('[data-step]')){
    const number=button.querySelector('.step-number');if(number)number.innerHTML=icon(({service:'chip',config:'grid',access:'network',init:'code',review:'check'})[button.dataset.step]||'cube');
    const label=button.querySelector('span:last-child');if(button.dataset.step==='service')label.textContent='Geral';if(button.dataset.step==='config'&&selectedType==='compute')label.textContent='Shape e imagem';
    if(['init','review'].includes(button.dataset.step))button.classList.add('prism-secondary-step');
  }
  if(!$('prism-governance-links')){
    const links=document.createElement('div');links.id='prism-governance-links';links.innerHTML='<a href="#iam">'+icon('shield')+'Segurança (IAM)</a><a href="#tags">'+icon('tag')+'Tags</a><details class="prism-more"><summary>Mais opções</summary><div><button type="button" data-action="prism-stage" data-target-step="review">Revisão do recurso</button>'+(selectedType==='compute'?'<button type="button" data-action="prism-stage" data-target-step="init">Inicialização</button>':'')+'<a href="#catalog">Shapes e imagens</a><a href="#guide">Guia e fontes</a><button type="button" data-action="backup">Salvar projeto</button></div></details>';
    $('builder-steps').append(links);
  }
  // The primary button opens the existing validated review before submitting.
  let actions=$('prism-compact-actions');if(!actions){actions=document.createElement('div');actions.id='prism-compact-actions';actions.innerHTML='<button type="button" class="button" data-action="prism-cancel">Cancelar</button><button type="button" class="button primary" data-action="prism-add">Adicionar ao diagrama '+icon('arrow')+'</button>';$('resource-form').append(actions);}
}
var prismZoom=1;
function applyPrismZoom(){const svg=$('prism-diagram')?.querySelector(':scope > svg');if(svg){svg.style.width=(100*(prismZoom||1))+'%';svg.style.height=((document.fullscreenElement?innerHeight*.75:Math.max(132,$('prism-diagram').clientHeight))*(prismZoom||1))+'px';}if($('prism-zoom-label'))$('prism-zoom-label').textContent=Math.round((prismZoom||1)*100)+'%';}
document.addEventListener('change',event=>{if(event.target.id==='prism-region'){
  draft=gatherDraft();$('region').value=event.target.value;$('region').dispatchEvent(new Event('change',{bubbles:true}));
}});
document.addEventListener('click',async event=>{
  const button=event.target.closest('[data-action]');if(!button)return;
  const action=button.dataset.action;
  if(action==='prism-stage')changeBuilderStep(button.dataset.targetStep);
  if(action==='prism-add'){
    if(selectedType==='universal'){document.querySelector('[data-action=universal]')?.click();return;}
    draft=gatherDraft();builderStep='review';applyBuilderStep();$('resource-form').requestSubmit();
  }
  if(action==='prism-cancel')chooseType(selectedType);
  if(action==='prism-plan'){$('prism-project-details').open=true;document.querySelector('.plan-panel')?.scrollIntoView({behavior:'smooth',block:'nearest'});}
  if(action==='prism-zoom'){prismZoom=Math.max(.6,Math.min(2,(prismZoom||1)+Number(button.dataset.delta)));applyPrismZoom();}
  if(action==='prism-fit'){prismZoom=1;applyPrismZoom();}
  if(action==='prism-fullscreen'){try{if(document.fullscreenElement)await document.exitFullscreen();else await document.querySelector('.prism-map').requestFullscreen();}catch{toast('Tela cheia indisponível neste navegador.');}}
});

function colorPrismCode(code){
  const text=code.textContent,pattern=/(#[^\n]*|"(?:\\.|[^"\\])*"|\b(?:resource|variable|provider|terraform|output|locals)\b)/g,fragment=document.createDocumentFragment();let index=0;
  for(const match of text.matchAll(pattern)){fragment.append(document.createTextNode(text.slice(index,match.index)));const token=document.createElement('span');token.className=match[0][0]==='#'?'code-comment':match[0][0]==='"'?'code-string':'code-keyword';token.textContent=match[0];fragment.append(token);index=match.index+match[0].length;}
  fragment.append(document.createTextNode(text.slice(index)));code.replaceChildren(fragment);
}

document.addEventListener('fullscreenchange',applyPrismZoom);

window.addEventListener('resize',()=>requestAnimationFrame(applyPrismZoom));
