// Three views of one local project. Manual review never implies OCI approval.
var suiteSelectedId,suiteReviews;
function syncSuiteMode(){
  const mode=page==='review'?'review':page==='present'?'present':'work';document.body.dataset.experience=mode;
  document.querySelectorAll('[data-suite-mode]').forEach(link=>{const active=link.dataset.suiteMode===mode;link.classList.toggle('active',active);if(active)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');});
  if($('suite-mode-caption'))$('suite-mode-caption').textContent=({work:'Topologia de Precisão',review:'Sala de Revisão',present:'Observatório do Projeto'})[mode];
}
function suiteResource(){return s.resources.find(resource=>resource.id===suiteSelectedId)||s.resources[0];}
function renderSuiteWork(){
  const resource=suiteResource();if(resource)suiteSelectedId=resource.id;
  document.querySelectorAll('#prism-diagram a').forEach(link=>link.dataset.selected=String(link.dataset.id===suiteSelectedId));
  renderSuiteInspector();renderSuiteLibrary();syncSuiteMode();
}
function renderSuiteLibrary(){
  const container=$('suite-service-library');if(!container)return;const query=($('suite-service-search')?.value||'').toLocaleLowerCase();
  container.innerHTML=Object.entries(TYPES).filter(([id,type])=>[id,type.label,type.title].join(' ').toLocaleLowerCase().includes(query)).map(([id,type])=>'<button type="button" data-action="suite-new" data-type="'+id+'">'+icon(type.icon)+'<span>'+esc(type.label)+'</span></button>').join('')||'<p class="empty-message">Nenhum serviço encontrado.</p>';
}
function renderSuiteInspector(){
  const container=$('suite-inspector');if(!container)return;const resource=suiteResource();
  if(!resource){container.innerHTML='<div class="suite-panel-heading"><h2>Propriedades do recurso</h2></div><div class="suite-inspector-empty">'+icon('cube')+'<h3>Comece sua arquitetura</h3><p>Adicione um serviço pela biblioteca. Selecione um recurso na topologia para editar suas propriedades.</p><a href="#builder" class="button primary">Adicionar recurso</a><button type="button" class="button" data-action="suite-example">Carregar exemplo local</button></div>';return;}
  const type=TYPES[resource.type],priority=['cidr','dns','shape','ocpus','memory','subnet','vcn','publicIp','privateIp','size','ad'];const fields=type.fields.filter(field=>['text','number','select','shape','hostshape','ref'].includes(field.type)).sort((a,b)=>(priority.includes(a.key)?priority.indexOf(a.key):99)-(priority.includes(b.key)?priority.indexOf(b.key):99)).slice(0,6);
  const controls=fields.map(field=>{const value=resource.values[field.key]??field.value??'';let control;
    if(field.type==='ref'){const refs=s.resources.filter(item=>item.id!==resource.id&&(field.refType==='gateway'?['drg','igw','nat','sgw'].includes(item.type):item.type===field.refType));const choices=[['','Não definido'],...refs.map(item=>[item.id,item.name])];if(value&&!refs.some(item=>item.id===value))choices.push([value,value]);control='<select data-suite-field="'+esc(field.key)+'">'+options(choices,value)+'</select>';}
    else if(field.type==='select')control='<select data-suite-field="'+esc(field.key)+'">'+options(field.options,value)+'</select>';
    else if(['shape','hostshape'].includes(field.type)){const shapes=sortedShapes(s).filter(shape=>field.type==='hostshape'?shape.kind==='DVH':shape.kind!=='DVH'),choices=shapes.map(shape=>[shape.name,shape.name]);if(value&&!shapes.some(shape=>shape.name===value))choices.unshift([value,value+' · fora do catálogo']);control='<select data-suite-field="'+esc(field.key)+'">'+options(choices,value)+'</select>';}
    else control='<input type="'+(field.type==='number'?'number':'text')+'" data-suite-field="'+esc(field.key)+'" value="'+esc(value)+'"'+(field.min!==undefined?' min="'+field.min+'"':'')+'>';
    return '<label>'+esc(field.label)+control+'</label>';
  }).join('');
  const errors=validateResource(resource,s);
  container.innerHTML='<div class="suite-inspector-title"><span>'+icon(type.icon)+'</span><div><small>'+esc(type.title)+'</small><h2 translate="no">'+esc(resource.name)+'</h2></div></div><div class="suite-inspector-facts"><span>'+esc(resource.region||s.region)+'</span><span>'+esc(type.cat)+'</span></div><form id="suite-inspector-form" novalidate><label>Nome do recurso<input id="suite-resource-name" value="'+esc(resource.name)+'" maxlength="120"></label>'+controls+'<div id="suite-inspector-errors" role="status">'+(errors.length?'<p class="suite-inline-warning">'+errors.length+' ajuste(s) no recurso. Revise no construtor.</p>':'')+'</div><button type="submit" class="button primary">Salvar recurso</button></form><button type="button" class="button" data-action="edit-resource" data-id="'+resource.id+'">Abrir configuração completa '+icon('arrow')+'</button><p class="suite-help">Alterações ficam no projeto local. A revisão manual será invalidada quando o plano mudar.</p>';
}
function suiteReviewDefinitions(){return [
 {group:'Segurança',id:'private-access',title:'Exposição e acesso administrativo revisados',detail:'Confirme endpoints públicos, acesso SSH/RDP e regras de rede.'},
 {group:'Segurança',id:'least-privilege',title:'Privilégio mínimo e identidade revisados',detail:'Revise statements IAM, principal e compartimentos de destino.'},
 {group:'Rede',id:'addressing',title:'Endereçamento e segmentação revisados',detail:'Confira CIDRs, subnets e a separação entre aplicação e dados.'},
 {group:'Rede',id:'dependencies',title:'Rotas e dependências revisadas',detail:'Confirme referências locais, OCIDs externos e caminhos de retorno.'},
 {group:'Disponibilidade',id:'failure-domains',title:'Domínios de falha e recuperação discutidos',detail:'Documente premissas de redundância, backup e restauração.'},
 {group:'Disponibilidade',id:'capacity',title:'Capacidade e limites regionais revisados',detail:'Confirme shapes e imagens na região; o catálogo local é uma referência.'},
 {group:'Operação',id:'ownership',title:'Tags e responsabilidade operacional revisadas',detail:'Registre ambiente, equipe e propósito dos recursos.'},
 {group:'Operação',id:'delivery',title:'Variáveis e execução da entrega revisadas',detail:'Revise Terraform/OCI CLI e valide no terminal antes de aplicar.'}
];}
function suiteSnapshot(){return JSON.stringify({projectName:s.projectName,region:s.region,compartmentId:s.compartmentId,resources:s.resources,tags:s.tags,iam:s.iam,includeIam:s.includeIam,createTagSchema:s.createTagSchema,catalog:s.catalog,exportFormat:s.exportFormat});}
function suiteReviewKey(){return JSON.stringify([s.projectName,s.region]);}
function suiteReviewStore(){
  if(suiteReviews)return suiteReviews;suiteReviews=Object.create(null);
  try{const raw=localStorage.getItem('oci-studio-local-reviews-v1');if(raw&&raw.length<2000000){const records=JSON.parse(raw);if(Array.isArray(records))for(const record of records.slice(-20)){if(!record||typeof record.key!=='string'||typeof record.snapshot!=='string'||record.snapshot.length>500000)continue;const items={};for(const item of suiteReviewDefinitions())items[item.id]=record.items?.[item.id]===true;suiteReviews[record.key]={snapshot:record.snapshot,items,notes:String(record.notes||'').slice(0,6000),reviewer:String(record.reviewer||'').slice(0,100),updated:typeof record.updated==='string'?record.updated:''};}}}catch{}
  return suiteReviews;
}
function suiteReviewRecord(){const record=suiteReviewStore()[suiteReviewKey()],current=suiteSnapshot();if(record?.snapshot===current)return {...record,stale:false};return {snapshot:current,items:{},notes:record?.notes||'',reviewer:record?.reviewer||'',updated:'',stale:!!record};}
function saveSuiteReview(){
  const previous=suiteReviewRecord(),items={};document.querySelectorAll('[data-review-item]').forEach(input=>items[input.dataset.reviewItem]=input.checked);
  const record={snapshot:suiteSnapshot(),items,notes:($('suite-review-notes')?.value??previous.notes).slice(0,6000),reviewer:($('suite-reviewer')?.value??previous.reviewer).slice(0,100),updated:new Date().toISOString()};
  const records=suiteReviewStore();records[suiteReviewKey()]=record;
  try{localStorage.setItem('oci-studio-local-reviews-v1',JSON.stringify(Object.entries(records).slice(-20).map(([key,value])=>({key,...value}))));$('suite-review-save-status').textContent='Revisão salva neste navegador.';}catch{$('suite-review-save-status').textContent='Revisão nesta sessão. Exporte o relatório para guardar.';}
  updateSuiteReviewProgress(record);
}
function updateSuiteReviewProgress(record=suiteReviewRecord()){
  const count=suiteReviewDefinitions().filter(item=>record.items[item.id]).length;if($('suite-review-progress'))$('suite-review-progress').textContent=count+' / '+suiteReviewDefinitions().length+' revisados';
  document.querySelectorAll('[data-review-status]').forEach(label=>label.textContent=record.items[label.dataset.reviewStatus]?'Revisado manualmente':'Pendente');
}
function suiteTopologySnapshot(){
  renderPrismContext();const source=$('prism-diagram').querySelector('svg');
  if(!source)return '<div class="suite-empty-topology">Adicione recursos ao plano para iniciar a revisão.</div>';
  const copy=source.cloneNode(true);copy.removeAttribute('style');copy.querySelectorAll('a').forEach(link=>{const group=document.createElementNS('http://www.w3.org/2000/svg','g');while(link.firstChild)group.append(link.firstChild);link.replaceWith(group);});return copy.outerHTML.replaceAll('prism-arrow','suite-review-arrow');
}
function suiteDeliveryReview(){const generated=currentExport();return {format:s.exportFormat,generated,issues:[...new Set([...terraformExportErrors(s),...(generated.errors||[])])]};}
function renderSuiteReview(){
  const record=suiteReviewRecord();$('suite-review-topology').innerHTML=suiteTopologySnapshot();$('suite-reviewer').value=record.reviewer;$('suite-review-notes').value=record.notes;
  const groups=[...new Set(suiteReviewDefinitions().map(item=>item.group))];
  $('suite-checklist').innerHTML=groups.map(group=>'<details open><summary>'+esc(group)+'</summary><div>'+suiteReviewDefinitions().filter(item=>item.group===group).map(item=>'<label class="suite-check-item"><input type="checkbox" data-review-item="'+item.id+'"'+(record.items[item.id]?' checked':'')+(!s.resources.length?' disabled':'')+'><span><strong>'+esc(item.title)+'</strong><small>'+esc(item.detail)+'</small><em data-review-status="'+item.id+'"></em></span></label>').join('')+'</div></details>').join('');
  $('suite-review-save-status').textContent=record.stale?'Plano alterado. Confirme o checklist novamente; as observações foram preservadas.':record.updated?'Revisão local salva.':'Revisão manual ainda não salva.';
  const {issues,generated,format}=suiteDeliveryReview();
  $('suite-validation-summary').innerHTML='<p><strong>Formato: '+(format==='oci-cli'?'OCI CLI':'Terraform')+'</strong></p>'+(!s.resources.length?'<p>Adicione recursos ao projeto antes de revisar.</p>':(issues.length?'<p class="suite-inline-warning">'+issues.length+' ajuste(s) na conferência local.</p><ul>'+issues.slice(0,6).map(issue=>'<li>'+esc(issue)+'</li>').join('')+'</ul>':'<p>Conferência local sem bloqueios encontrados. Revise a configuração na OCI antes da execução.</p>')+'<p class="suite-help">'+generated.variables.length+' variável(is) ainda precisam ser preenchidas no terminal.</p>');
  updateSuiteReviewProgress(record);syncSuiteMode();
}
function suiteScene(){
  const resources=s.resources.slice(0,24);if(!resources.length)return '<div class="suite-empty-topology"><h2>Sua arquitetura começa no plano.</h2><p>Adicione recursos no modo Trabalhar para criar a apresentação.</p><a href="#diagram" class="button primary">Abrir topologia</a></div>';
  const positions=new Map(resources.map((resource,index)=>[resource.id,{x:145+(index%4)*205+(Math.floor(index/4)%2)*30,y:220+Math.floor(index/4)*175}]));
  const height=Math.max(520,Math.ceil(resources.length/4)*175+200),width=1000;
  const edges=resources.flatMap(resource=>TYPES[resource.type].fields.filter(field=>field.type==='ref'&&positions.has(resource.values[field.key])).map(field=>{const from=positions.get(resource.values[field.key]),to=positions.get(resource.id);return '<path class="suite-city-link" d="M'+from.x+' '+(from.y+36)+' Q'+((from.x+to.x)/2)+' '+(Math.min(from.y,to.y)+95)+' '+to.x+' '+(to.y+36)+'"/>';})).join('');
  const blocks=resources.map(resource=>{const {x,y}=positions.get(resource.id),category=TYPES[resource.type].cat,h=category==='compute'?100:category==='database'?88:category==='storage'?62:45;return '<g class="suite-city-resource" data-category="'+category+'"><polygon class="suite-city-pad" points="'+(x-82)+','+y+' '+x+','+(y-42)+' '+(x+82)+','+y+' '+x+','+(y+42)+'"/><polygon class="suite-city-left" points="'+(x-45)+','+(y-h)+' '+x+','+(y-h+24)+' '+x+','+(y+24)+' '+(x-45)+','+y+'"/><polygon class="suite-city-right" points="'+x+','+(y-h+24)+' '+(x+45)+','+(y-h)+' '+(x+45)+','+y+' '+x+','+(y+24)+'"/><polygon class="suite-city-top" points="'+x+','+(y-h-24)+' '+(x+45)+','+(y-h)+' '+x+','+(y-h+24)+' '+(x-45)+','+(y-h)+'"/><use href="#i-'+TYPES[resource.type].icon+'" x="'+(x-12)+'" y="'+(y-h-10)+'" width="24" height="24" class="suite-city-icon"/><text x="'+x+'" y="'+(y+69)+'" text-anchor="middle" class="suite-city-label" translate="no">'+esc(resource.name.length>23?resource.name.slice(0,21)+'…':resource.name)+'</text><text x="'+x+'" y="'+(y+89)+'" text-anchor="middle" class="suite-city-type">'+esc(TYPES[resource.type].label.slice(0,28))+'</text></g>';}).join('');
  return '<svg viewBox="0 0 '+width+' '+height+'" role="img" aria-label="Visão isométrica dos recursos locais"><defs><pattern id="suite-city-grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="#ffffff08" stroke-width=".7"/></pattern><radialGradient id="suite-city-light"><stop offset="0" stop-color="#527891" stop-opacity=".18"/><stop offset="1" stop-color="#081019" stop-opacity="0"/></radialGradient></defs><rect width="1000" height="'+height+'" fill="url(#suite-city-light)"/><rect x="25" y="70" width="950" height="'+(height-110)+'" rx="25" fill="url(#suite-city-grid)"/>'+edges+blocks+'</svg>'+(s.resources.length>24?'<p class="suite-help">Mostrando 24 de '+s.resources.length+' recursos. O inventário ao lado inclui todos.</p>':'');
}
function renderSuitePresentation(){
  $('suite-present-project').textContent=s.projectName;$('suite-present-region').textContent=s.region+' · arquitetura local';$('suite-city-scene').innerHTML=suiteScene();
  $('suite-present-inventory').innerHTML=CATEGORIES.map(category=>{const resources=s.resources.filter(resource=>TYPES[resource.type].cat===category.id);return resources.length?'<details open><summary>'+esc(category.name)+'<span>'+resources.length+'</span></summary>'+resources.map(resource=>'<div>'+icon(TYPES[resource.type].icon)+'<span translate="no">'+esc(resource.name)+'</span></div>').join('')+'</details>':'';}).join('')||'<p class="suite-help">Nenhum recurso no plano.</p>';
  const record=suiteReviewRecord();$('suite-present-narrative').textContent=record.notes||'Defina premissas e próximos passos na Sala de Revisão para acompanhar a apresentação.';
  $('suite-present-review-status').textContent=(record.stale?'Plano alterado · revisão manual pendente.':suiteReviewDefinitions().filter(item=>record.items[item.id]).length+' de '+suiteReviewDefinitions().length+' itens revisados manualmente.')+(record.reviewer?' Responsável: '+record.reviewer:'');syncSuiteMode();
}
document.addEventListener('click',async event=>{
  const button=event.target.closest('[data-action]');if(!button)return;const action=button.dataset.action;
  if(action==='suite-select'){event.preventDefault();suiteSelectedId=button.dataset.id;renderSuiteWork();}
  if(action==='suite-example')document.querySelector('[data-action=load-example]')?.click();
  if(action==='suite-new'){chooseType(button.dataset.type);setPage('builder');}
  if(action==='suite-report'){const record=suiteReviewRecord(),delivery=suiteDeliveryReview();download('revisao-arquitetura.json',JSON.stringify({schemaVersion:1,project:{name:s.projectName,region:s.region},resources:s.resources,manualReview:record,exportFormat:delivery.format,localIssues:delivery.issues,notice:'Revisão manual local. Não comprova permissões ou operação na OCI.'},null,2),'application/json');}
  if(action==='suite-fullscreen'){try{if(document.fullscreenElement)await document.exitFullscreen();else await $('view-present').requestFullscreen();}catch{toast('Tela cheia indisponível neste navegador.');}}
});
document.addEventListener('input',event=>{if(event.target.id==='suite-service-search')renderSuiteLibrary();if(['suite-reviewer','suite-review-notes'].includes(event.target.id))saveSuiteReview();});
document.addEventListener('change',event=>{if(event.target.matches('[data-review-item]'))saveSuiteReview();});
document.addEventListener('submit',event=>{
  if(event.target.id!=='suite-inspector-form')return;event.preventDefault();const resource=suiteResource();if(!resource)return;
  const values={...resource.values},name=$('suite-resource-name').value.trim();event.target.querySelectorAll('[data-suite-field]').forEach(input=>values[input.dataset.suiteField]=input.type==='number'&&input.value!==''?Number(input.value):input.value);values.name=name;
  const candidate={...resource,name,values},issues=validateResource(candidate,s);if(!name)issues.unshift('Informe o nome do recurso.');
  if(issues.length){$('suite-inspector-errors').textContent=issues.join(' ');return;}
  s.resources=s.resources.map(item=>item.id===resource.id?candidate:item);updateAll();toast('Recurso salvo no projeto local.');
});
for(const row of [['Trabalhar','Work','Trabajar','Travailler','Arbeiten','Lavora','作業','工作'],['Revisar','Review','Revisar','Réviser','Prüfen','Rivedi','レビュー','审查'],['Apresentar','Present','Presentar','Présenter','Präsentieren','Presenta','プレゼンテーション','演示'],['Sala de revisão','Review room','Sala de revisión','Salle de révision','Prüfraum','Sala di revisione','レビュールーム','审查室']])I18N_TEXT.set(row[0],row.slice(1));
localizeInterface();syncSuiteMode();
