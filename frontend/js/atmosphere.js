/* The existing appearance controls run against a temporary project copy.
   Only appearance fields are committed by Apply; the preview iframe has no scripts. */
var atmosphereSavedSignature=null,atmosphereDraftState=null,atmosphereRendering=false,atmosphereMode='interface',atmosphereFrameReady=false,atmosphereResize=null;
var ATMOSPHERE_KEYS=['theme','accent','accentPreset','specialAccents','appearance'];
function atmospherePageChanged(next){
 document.body.classList.toggle('atmosphere-open',next==='themes');
 if(next!=='themes'&&atmosphereDraftState){atmosphereDraftState=null;const frame=$('atmosphere-preview');if(frame)delete frame.dataset.initialized;applyTheme();}
 for(const link of document.querySelectorAll('#navigation a')){if(!link.hasAttribute('aria-label'))link.setAttribute('aria-label',link.textContent.trim());link.title=link.textContent.trim();}
 atmosphereUpdateRail();
}
function withAtmosphereDraft(action){
 if(page!=='themes'||atmosphereRendering)return action();
 const signature=JSON.stringify(ATMOSPHERE_KEYS.map(k=>s[k]));
 if(!atmosphereDraftState||signature!==atmosphereSavedSignature){atmosphereDraftState=clone(s);atmosphereSavedSignature=signature;}
 const actual=s;atmosphereRendering=true;s=atmosphereDraftState;
 try{return action();}finally{atmosphereDraftState=s;try{refreshAtmosphereScene(actual);}finally{s=actual;atmosphereRendering=false;}}
}
function atmosphereApply(){
 if(!atmosphereDraftState)return;
 for(const key of ATMOSPHERE_KEYS)s[key]=clone(atmosphereDraftState[key]);
 save();applyTheme();renderThemes();toast('Aparência aplicada e salva neste navegador.');
}
function refreshAtmosphereScene(actual){
 const theme=themes.find(t=>t.id===s.theme)||themes[0],stage=$('atmosphere-stage');if(!stage)return;atmosphereUpdateRail();
 const intensity=s.appearance.backgroundIntensity??70;
 stage.style.setProperty('--atmosphere-wallpaper',theme.effect==='nexus-command'?'var(--atmosphere-harbor)':theme.effect==='titanium-orange'?'var(--titanium-wallpaper)':'none');
 stage.style.setProperty('--atmosphere-shade',String(1-intensity/100));stage.dataset.mode=atmosphereMode;stage.dataset.special=String(!!theme.special);
 $('background-intensity').value=String(intensity);$('background-intensity').disabled=!theme.special;
 $('background-intensity-value').textContent=theme.special?intensity+'%':'Sem imagem';
 $('atmosphere-preview-name').textContent=theme.name;$('atmosphere-description').textContent=theme.desc;
 const pending=ATMOSPHERE_KEYS.some(k=>JSON.stringify(s[k])!==JSON.stringify(actual[k]));
 $('atmosphere-status').textContent=pending?'Alterações em prévia':'Tema aplicado';$('atmosphere-status').dataset.pending=String(pending);
 $('atmosphere-apply').disabled=!pending;
 $('atmosphere-category').value=themeCategory;
 document.querySelectorAll('[data-action=atmosphere-scene]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.id===theme.id)));
 document.querySelectorAll('[data-action=atmosphere-view]').forEach(b=>b.setAttribute('aria-pressed',String((b.dataset.view==='background')===(atmosphereMode==='background'))));
 $('atmosphere-preview-shell').hidden=atmosphereMode==='background';document.querySelector('.atmosphere-background-note').hidden=atmosphereMode!=='background';
 $('atmosphere-single-mode').hidden=themes.filter(t=>t.familyKey===theme.familyKey).length>1;
 atmosphereUpdateFrame();
}
function atmosphereUpdateFrame(){
 const frame=$('atmosphere-preview');if(!frame)return;
 // Cache the static document: theme and reading variables update without reloading it.
 if(!frame.dataset.initialized){
  if(!$('resource-tabs').children.length)renderBuilder();
  const builder=atmosphereBuilderPreview();
  const doc=document.implementation.createHTMLDocument('Prévia do construtor');
  const style=doc.createElement('style');style.textContent=[...document.querySelectorAll('style')].map(el=>el.textContent).join('\n')+'\n'+ATMOSPHERE_PREVIEW_CSS;doc.head.append(style);
  const icons=document.querySelector('.icon-defs');if(icons)doc.body.append(icons.cloneNode(true));doc.body.append(builder);
  atmosphereFrameReady=false;frame.dataset.initialized='true';frame.onload=()=>{atmosphereFrameReady=true;if(page==='themes')withAtmosphereDraft(()=>atmosphereUpdateFrame());};
  frame.srcdoc='<!doctype html>'+doc.documentElement.outerHTML;
 }
 if(atmosphereFrameReady&&frame.contentDocument){
  const root=frame.contentDocument.documentElement;
  for(const attr of [...root.attributes])root.removeAttribute(attr.name);
  for(const attr of [...document.documentElement.attributes])root.setAttribute(attr.name,attr.value);
  root.lang=typeof interfaceLanguage==='undefined'?'pt-BR':interfaceLanguage;
  atmosphereLocalizePreview(frame.contentDocument);
 }
 frame.dataset.previewHeight=String(650+Math.max(0,(s.appearance.fontScale||1)-1)*280);
 if(atmosphereFrameReady&&frame.contentDocument)frame.contentDocument.documentElement.style.setProperty('--preview-height',frame.dataset.previewHeight+'px');
 atmosphereFitFrame();if(!atmosphereResize){atmosphereResize=new ResizeObserver(atmosphereFitFrame);atmosphereResize.observe($('atmosphere-preview-viewport'));}
}
// Re-dispatch only the synchronous appearance controls under the draft context.
// This preserves keyboard/native select behavior and reuses the validated palette logic.
for(const type of ['click','input','change'])document.addEventListener(type,event=>{
 if(page!=='themes'||atmosphereRendering)return;
 const el=event.target,button=el.closest('[data-action]'),action=button?.dataset.action;
 if(type==='click'&&action==='atmosphere-scroll'){event.preventDefault();event.stopImmediatePropagation();const list=$('theme-family-list');list.scrollBy({left:Number(button.dataset.direction)*list.clientWidth*.7,behavior:'smooth'});return;}
 if(type==='click'&&action==='atmosphere-apply'){event.preventDefault();event.stopImmediatePropagation();atmosphereApply();return;}
 if(type==='click'&&action==='atmosphere-reading'){event.preventDefault();event.stopImmediatePropagation();const box=$('atmosphere-reading');box.hidden=!box.hidden;button.setAttribute('aria-expanded',String(!box.hidden));box.querySelector('details').open=!box.hidden;if(!box.hidden)box.scrollIntoView({block:'nearest',behavior:'smooth'});return;}
 if(type==='click'&&['atmosphere-scene','atmosphere-classics','atmosphere-view'].includes(action)){
  event.preventDefault();event.stopImmediatePropagation();withAtmosphereDraft(()=>{
   if(action==='atmosphere-scene'){s.theme=button.dataset.id;themeCategory='all';applyTheme();renderAppearanceStudio();}
   if(action==='atmosphere-classics'){themeCategory='standard';$('theme-search').value='';renderAppearanceStudio();}
   if(action==='atmosphere-view')atmosphereMode=button.dataset.view;
  });return;
 }
 if(el.id==='background-intensity'&&type==='input'){event.stopImmediatePropagation();withAtmosphereDraft(()=>{s.appearance.backgroundIntensity=Number(el.value);applyReadability();});return;}
 if(el.id==='atmosphere-category'&&type==='change'){event.stopImmediatePropagation();withAtmosphereDraft(()=>{themeCategory=el.value;$('theme-search').value='';renderAppearanceStudio();});return;}
 const actions=['theme','theme-family','theme-category','accent-swatch','reset-accent','reset-reading','next-theme','font-cycle'];
 const fields=['accent-picker','font-scale','font-family','code-font-family','ui-density','line-height','letter-spacing','code-size'];
 if(type==='click'&&!actions.includes(action)||type!=='click'&&!fields.includes(el.id))return;
 event.preventDefault();event.stopImmediatePropagation();
 withAtmosphereDraft(()=>el.dispatchEvent(new Event(type,{bubbles:true,cancelable:true})));
},true);

function atmosphereBuilderPreview(){
 const t=text=>document.documentElement.lang==='pt-BR'?text:translateUiText(text);
 const create=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;};
 const card=create('section','atmosphere-builder-card');
 const header=create('header','preview-builder-header');header.append(create('strong','','OCI Architect Studio'),create('span','',t('Construtor de arquitetura')),create('span','preview-badge',t('Prévia')));card.append(header);
 const grid=create('div','preview-builder-grid'),steps=create('nav','preview-steps');steps.setAttribute('aria-label',t('Etapas da configuração'));
 builderSteps().forEach((step,index)=>{const row=create('div','preview-step'+(index===0?' active':''));row.append(create('b','',String(index+1)),create('span','',t(step.label)));steps.append(row)});
 const form=create('form','preview-builder-form');form.id='resource-form';form.append(create('h2','',t('Configurar recurso')),create('p','preview-muted',t('Preencha as propriedades específicas deste recurso.')));
 for(const source of [$('service-selector'),$('f-name')?.closest('label')]){if(!source)continue;const copy=source.cloneNode(true);copy.querySelectorAll('input,select,textarea').forEach(el=>{const original=document.getElementById(el.id);if(!original)return;if(el.tagName==='SELECT')for(const opt of el.options)opt.toggleAttribute('selected',opt.value===original.value);else el.setAttribute('value',original.value)});form.append(copy)}
 const field=(label,value)=>{const box=create('label','',t(label));const input=create('input');input.readOnly=true;input.value=value;input.setAttribute('value',value);input.setAttribute('translate','no');box.append(input);return box};
 form.append(field('Região',s.region),field('Compartimento',draft.compartmentId||s.compartmentId||t('Padrão do projeto')));
 const policy=create('div','preview-policy');policy.append(create('strong','',t('Políticas IAM')),create('small','',t('Revise as dependências e as policies deste recurso.')));form.append(policy);
 const summary=create('aside','preview-builder-summary');summary.append(create('h3','',t('Resumo')));
 const facts=[['Projeto',s.projectName],['Recurso',TYPES[selectedType].title],['Shape',draft.shape||'—'],['Região',s.region]];
 for(const [label,value]of facts){const item=create('div','preview-fact'),text=create('span','',value);text.setAttribute('translate','no');item.append(create('small','',t(label)),text);summary.append(item)}
 grid.append(steps,form,summary);card.append(grid);
 const footer=create('footer','preview-builder-footer');footer.append(create('span','preview-muted',t('Prévia do construtor')),create('button','preview-next',t('Continuar')+' →'));card.append(footer);return card;
}
function atmosphereLocalizePreview(doc){
 if(typeof interfaceLanguage==='undefined'||interfaceLanguage==='pt-BR')return;
 const walker=doc.createTreeWalker(doc.body,NodeFilter.SHOW_TEXT);let node;
 while((node=walker.nextNode()))if(node.parentElement&&!node.parentElement.closest('style,script,[translate=no],input,select'))node.data=translateUiText(node.data);
}
const ATMOSPHERE_PREVIEW_CSS=`
body{margin:0;padding:0;min-width:1100px;background:var(--panel)!important;overflow:hidden;font-size:calc(14px * var(--read-scale,1))}
*{box-sizing:border-box;transition:none!important;animation:none!important}
.atmosphere-builder-card{height:var(--preview-height,650px);display:flex;flex-direction:column;background:linear-gradient(125deg,var(--panel),var(--bg));color:var(--text)}
.preview-builder-header{display:flex;align-items:center;gap:18px;padding:18px 24px;border-bottom:1px solid var(--border);height:62px;font-size:calc(12px * var(--read-scale,1))}
.preview-builder-header strong{color:var(--accent)}.preview-builder-header .preview-badge{padding:3px 8px;border:1px solid var(--border);border-radius:5px;color:var(--accent);font-size:calc(10px * var(--read-scale,1))}
.preview-builder-grid{display:grid;grid-template-columns:190px minmax(0,1fr) 250px;gap:0;flex:1;min-height:0}
.preview-steps{display:flex;flex-direction:column;gap:0;background:color-mix(in srgb,var(--bg) 70%,var(--panel));padding:22px 18px;border-right:1px solid var(--border)}
.preview-step{display:flex;align-items:flex-start;gap:14px;position:relative;min-height:83px;font-size:calc(14px * var(--read-scale,1));color:var(--muted);padding:7px 0}
.preview-step:not(:last-child)::after{content:'';position:absolute;left:15px;top:39px;bottom:-6px;width:1px;background:var(--border)}
.preview-step b{display:grid;place-items:center;flex-shrink:0;width:30px;height:30px;border-radius:50%;background:var(--raised);border:1px solid var(--border);font-size:calc(12px * var(--read-scale,1))}.preview-step span{padding-top:5px}.preview-step.active{color:var(--text)}.preview-step.active b{color:var(--special-brand-ink,var(--accent-ink));background:var(--special-brand,var(--accent));border-color:var(--special-brand,var(--accent))}
#resource-form.preview-builder-form{padding:24px 28px 14px;overflow:hidden;display:flex;flex-direction:column;gap:14px}
.preview-builder-form h2{font-size:calc(22px * var(--read-scale,1));margin:0}.preview-muted{color:var(--muted);font-size:calc(12px * var(--read-scale,1));line-height:1.6}.preview-builder-form>p{margin:-5px 0 2px}.preview-builder-form label{font-size:calc(14px * var(--read-scale,1));margin:0;display:flex;flex-direction:column;gap:8px}.preview-builder-form :is(input,select){width:100%;height:40px;padding:8px 12px;border:1px solid var(--border);border-radius:6px;background:var(--input);color:var(--text);font-size:calc(15px * var(--read-scale,1))}.preview-builder-form #service-selector{margin:0}.preview-builder-form .field-hint{display:none}
.preview-policy{padding:12px 14px;border:1px solid var(--border);border-radius:7px;background:var(--raised);display:flex;flex-direction:column;gap:5px;font-size:calc(12px * var(--read-scale,1))}.preview-policy small{color:var(--muted);font-size:calc(11px * var(--read-scale,1))}
.preview-builder-summary{margin:24px 20px 24px 0;padding:20px 18px;border:1px solid var(--border);border-radius:9px;background:color-mix(in srgb,var(--raised) 55%,var(--panel));align-self:start}.preview-builder-summary h3{margin:0 0 22px;font-size:calc(16px * var(--read-scale,1))}.preview-fact{display:flex;flex-direction:column;gap:7px;margin:0 0 24px;overflow-wrap:anywhere}.preview-fact:last-child{margin-bottom:0}.preview-fact small{font-size:calc(11px * var(--read-scale,1));color:var(--muted)}.preview-fact span{font-size:calc(14px * var(--read-scale,1))}
.preview-builder-footer{height:62px;padding:12px 24px;border-top:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;margin:0}.preview-next{padding:10px 22px;border-radius:6px;border:1px solid var(--border);color:var(--special-brand-ink,var(--accent-ink));background:var(--special-brand,var(--accent));font-size:calc(12px * var(--read-scale,1));font-weight:600}
`;

function atmosphereThemeFamilies(){
 const families=[...new Map(themes.filter(t=>themeCategory==='all'||!!t.special===(themeCategory==='special')).map(t=>[t.familyKey,t])).values()];
 if(themeCategory!=='all')return families;
 const featured=['nexus-command','titanium-orange','dracula','github','monokai','oracle'];
 return families.sort((a,b)=>{const rank=t=>featured.includes(t.familyKey)?featured.indexOf(t.familyKey):featured.length;return rank(a)-rank(b)});
}

function atmosphereFitFrame(){const frame=$('atmosphere-preview'),viewport=$('atmosphere-preview-viewport');if(!frame||!viewport)return;const height=Number(frame.dataset.previewHeight||650);frame.style.height=height+'px';frame.style.transform='scale('+viewport.clientWidth/1100+')';viewport.style.height=viewport.clientWidth/1100*height+'px';}

function atmosphereUpdateRail(){
 const names={'pt-BR':['Construtor','Shapes','Rede','IAM','Tags','Exportar','Aparência','Guia'],en:['Builder','Shapes','Network','IAM','Tags','Export','Appearance','Guide'],es:['Constructor','Shapes','Red','IAM','Tags','Exportar','Apariencia','Guía'],fr:['Constructeur','Shapes','Réseau','IAM','Tags','Exporter','Apparence','Guide'],de:['Konfigurator','Shapes','Netzwerk','IAM','Tags','Export','Design','Hilfe'],it:['Costruttore','Shapes','Rete','IAM','Tag','Esporta','Aspetto','Guida'],ja:['構築','シェイプ','ネットワーク','IAM','タグ','出力','外観','ガイド'],zh:['构建器','规格','网络','IAM','标签','导出','外观','指南']};
 const labels=names[document.documentElement.lang]||names['pt-BR'];
 ['builder','catalog','network','iam','tags','export','themes','guide'].forEach((page,index)=>{const label=document.querySelector('#navigation [data-page="'+page+'"] .nav-text');if(label)label.dataset.compactLabel=labels[index]});
}
