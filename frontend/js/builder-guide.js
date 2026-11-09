// Presentation only: native wizard values, validation and exporters remain authoritative.
function dismissBuilderSuccess(){const card=document.getElementById('builder-success');if(card){card.hidden=true;delete card.dataset.resourceId;}}
function showBuilderSuccess(resource,updated=false){
 const card=document.getElementById('builder-success');if(!card)return;
 card.dataset.resourceId=resource.id;document.getElementById('builder-success-title').textContent=updated?'Recurso atualizado no plano':'Recurso adicionado ao plano';document.getElementById('builder-success-resource').textContent=resource.name;card.hidden=false;document.getElementById('builder-success-title').focus({preventScroll:true});card.scrollIntoView({block:'nearest',behavior:'auto'});
}
function updateBuilderGuide(){
 const selector=document.getElementById('service-selector');if(!selector)return;
 const serviceStep=builderStep==='service';selector.hidden=!serviceStep;
 const summary=document.getElementById('builder-service-summary');summary.hidden=serviceStep;document.getElementById('builder-summary-type').textContent=TYPES[selectedType].label;document.getElementById('builder-summary-name').textContent=draft.name||'—';
 const count=document.getElementById('builder-plan-count');if(count){count.dataset.uiNumber=String(s.resources.length);count.setAttribute('translate','no');count.textContent=formatUiNumber(s.resources.length);}
 const steps=builderSteps(),next=steps[steps.findIndex(step=>step.id===builderStep)+1];if(next)document.getElementById('builder-next').title='Próxima etapa: '+next.label;
 for(const detail of document.querySelectorAll('#resource-fields .advanced-settings')){if(detail.querySelector('.builder-optional-close'))continue;const button=document.createElement('button');button.type='button';button.className='text-button builder-optional-close';button.dataset.action='builder-close-optional';button.textContent='Configurar depois';button.title='Fecha este grupo sem apagar os valores preenchidos.';detail.append(button);}
}
function builderIssueTarget(message,field=''){
 const fields=TYPES[selectedType].fields,match=fields.find(f=>f.key===field||message.startsWith(f.label+':'));
 if(match)field=match.key;
 if(!field){for(const [pattern,key] of [[/nome|name/i,'name'],[/compartimento|compartment/i,'compartmentId'],[/imagem|image/i,'imageId'],[/availability.domain/i,'ad'],[/OCPU/i,'ocpus'],[/memória|memory/i,'memory'],[/DNS/i,'dns'],[/CIDR/i,'cidr'],[/subnet/i,'subnet']])if(pattern.test(message)){field=key;break;}}
 const input=document.getElementById('f-'+field),pane=input?.closest('[data-step-pane]');
 const step=pane?.dataset.stepPane||(field==='name'||field==='compartmentId'?'service':'config');
 return {step:builderSteps().some(s=>s.id===step)?step:'service',field:input?field:''};
}
function builderReviewLink(target){if(target.project)return '<button type="button" class="text-button" data-action="builder-review-project">Configurar projeto '+icon('arrow')+'</button>';return '<button type="button" class="text-button" data-action="builder-review-step" data-step="'+esc(target.step)+'" data-field="'+esc(target.field||'')+'">Revisar etapa '+icon('arrow')+'</button>';}
function builderPendingVariable(variable,resource){
 const current=variable.startsWith(resource.id+'_')||variable==='compartment_ocid';
 const suffix=variable.startsWith(resource.id+'_')?variable.slice(resource.id.length+1):variable;
 const map={compartment_ocid:['Compartimento','compartmentId'],image_ocid:['OCID da imagem','imageId'],availability_domain:['Availability domain','ad'],subnet_ocid:['Sub-rede','subnet'],endpoint_subnet_ocid:['Sub-rede','subnet'],vcn_ocid:['Rede virtual','vcn'],drg_ocid:['DRG','drg'],gateway_ocid:['Gateway','target'],service_ocid:['Serviço regional','serviceId'],kubernetes_version:['Versão Kubernetes','k8sVersion'],management_endpoint:['Endpoint do Vault','endpoint'],ssh_public_key:['Chave pública SSH','sshKey'],admin_password:['Senha do administrador','']};
 const info=map[suffix];const label=info?info[0]:'Variável de execução';
 if(!current)return '<li><div><strong>Outros recursos do plano</strong><code translate="no">'+esc(variable)+'</code></div><button type="button" class="text-button" data-action="builder-review-plan">Ver plano '+icon('arrow')+'</button></li>';
 const target=variable==='compartment_ocid'?{project:true}:info?.[1]&&document.getElementById('f-'+info[1])?builderIssueTarget('',info[1]):null;
 return '<li><div><strong>'+esc(label)+'</strong><span class="small muted">'+(target?'Pode definir agora ou preencher a variável no ambiente de execução.':'Defina no ambiente de execução. Nenhum segredo precisa ser salvo neste navegador.')+'</span></div>'+(target?builderReviewLink(target):'<span class="small muted">No ambiente de execução</span>')+'</li>';
}
function renderBuilderReview({resource,facts,errors,scope,generated}){
 const review=document.getElementById('resource-review');if(!review)return;
 const unique=[...new Set(errors)].filter((message,index,array)=>!(/^Informe o nome do recurso/.test(message)&&array.some(other=>other==='Informe o nome.'))),configured=facts.filter(([key,value])=>value&&value!=='Informe o nome');if(scope)configured.push(['Compartimento',scope]);
 const already=new Set(['shape','image','guestOs','vmLicense','ocpus','memory','bootSize','privateIp','sshKey','ad','kmsKey','nsgIds','namespace','dns']);
 for(const f of TYPES[selectedType].fields){const value=draft[f.key];if(f.type==='heading'||already.has(f.key)||value===''||value===undefined||value===null)continue;let display=String(value);if(f.type==='ref')display=s.resources.find(r=>r.id===value)?.name||display;if(f.type==='select'){const option=f.options.find(o=>String(Array.isArray(o)?o[0]:o)===String(value));if(option)display=Array.isArray(option)?String(option[1]):String(option);}configured.push([f.label,display]);}
 const optional=[['Compartimento específico',draft.compartmentId?'Preenchido':'Usa o padrão do projeto',{step:'service',field:'compartmentId'}]];
 for(const [key,label]of [['sshKey','Chave pública SSH'],['kmsKey','Chave KMS'],['nsgIds','Grupos de segurança adicionais'],['dns','DNS label'],['namespace','Namespace']])if(TYPES[selectedType].fields.some(f=>f.key===key))optional.push([label,draft[key]?'Preenchido':'Não informado',builderIssueTarget('',key)]);
 const variables=generated.variables;
 review.innerHTML='<section class="builder-review-group"><h4>Configurado</h4><p class="small muted">Valores informados no formulário. Confira os ajustes e pendências abaixo.</p><dl class="review-facts">'+configured.map(([key,value])=>'<div><dt>'+esc(key)+'</dt><dd>'+esc(value)+'</dd></div>').join('')+'</dl><div class="review-tags"><h4>Tags do projeto <span class="count">'+s.tags.length+'</span></h4><div>'+s.tags.map(tag=>'<span class="tag-chip">'+esc((tag.namespace?tag.namespace+'.':'')+tag.key)+' <b>'+esc(tag.value)+'</b></span>').join('')+'</div><a href="#tags" class="text-button">Editar tags '+icon('arrow')+'</a></div></section>'+
 '<section class="builder-review-group"><h4>Opcional</h4><ul class="builder-review-list">'+optional.map(([label,status,target])=>'<li><div><strong>'+esc(label)+'</strong><span class="small muted">'+esc(status)+'</span></div>'+builderReviewLink(target)+'</li>').join('')+'</ul></section>'+
 '<section class="builder-review-group'+(unique.length?' has-errors':'')+'"><h4>Falta preencher</h4>'+(unique.length?'<div class="notice error" role="alert"><strong>Corrigir antes de adicionar</strong><ul class="builder-review-list">'+unique.map(message=>'<li><span>'+esc(message)+'</span>'+builderReviewLink(builderIssueTarget(message))+'</li>').join('')+'</ul></div>':'<p class="builder-local-valid">Campos locais validados para adicionar ao plano.</p>')+
 (variables.length?'<p class="small muted">Antes de executar: estas variáveis serão solicitadas no Terraform ou OCI CLI. Elas não impedem salvar o plano local.</p><ul class="builder-review-list">'+variables.map(v=>builderPendingVariable(v,resource)).join('')+'</ul>':'<p class="small muted">Nenhuma variável pendente nesta configuração.</p>')+'</section>'+
 (generated.notes.length?'<details class="review-pending"><summary>Observações da exportação</summary><ul>'+generated.notes.map(note=>'<li>'+esc(note)+'</li>').join('')+'</ul></details>':'');
}
(()=>{
 const form=document.getElementById('resource-form'),list=document.getElementById('plan-list'),details=document.getElementById('builder-project-plan');if(!form)return;
 document.addEventListener('click',event=>{
  const button=event.target.closest('[data-action]');if(!button)return;const action=button.dataset.action;
  if(action==='builder-change-service'){changeBuilderStep('service');document.getElementById('f-resourceType')?.focus();}
  if(action==='builder-close-optional'){const detail=button.closest('details');detail.open=false;detail.querySelector('summary')?.focus();}
  if(action==='builder-review-step'){changeBuilderStep(button.dataset.step);const input=document.getElementById('f-'+button.dataset.field);if(input){let ancestor=input.parentElement;while(ancestor&&ancestor!==form){if(ancestor.tagName==='DETAILS')ancestor.open=true;ancestor=ancestor.parentElement;}input.focus({preventScroll:true});input.scrollIntoView({block:'nearest'});}}
  if(action==='builder-review-plan'){details.open=true;details.scrollIntoView({block:'start'});}
  if(action==='builder-review-project'){details.open=true;document.getElementById('project-settings').open=true;document.getElementById('project-compartment-id').focus();}
  if(action==='builder-add-another'){const type=selectedType;chooseType(type);const used=new Set(s.resources.map(r=>r.name));const base=draft.name;let candidate=base,n=2;while(used.has(candidate)){const match=base.match(/^(.*?)(\d+)$/);candidate=match?match[1]+String(Number(match[2])+n-1).padStart(match[2].length,'0'):base+'-'+n;n++;}draft.name=candidate;renderBuilder();document.getElementById('f-resourceType')?.focus();}
 });
 form.addEventListener('input',event=>{if(event.target.name)dismissBuilderSuccess();});
 if(!list||!details)return;let previous=s.resources.length;if(previous)details.open=true;
 new MutationObserver(()=>{if(s.resources.length>previous)details.open=true;previous=s.resources.length;const count=document.getElementById('builder-plan-count');count.dataset.uiNumber=String(previous);count.textContent=formatUiNumber(previous);const card=document.getElementById('builder-success');if(card?.dataset.resourceId&&!s.resources.some(r=>r.id===card.dataset.resourceId))dismissBuilderSuccess();}).observe(list,{childList:true});
})();
