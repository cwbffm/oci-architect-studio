// Overview shows local inventory only; no telemetry or cloud health is inferred.
function renderMonolithOverview(){
  const bars=$('monolith-bars');if(!bars)return;
  renderStats();$('monolith-project-title').textContent=s.projectName;
  const groups=[{id:'compute',name:'Computação',type:'compute',icon:'chip',color:'var(--blue)'},{id:'network',name:'Rede',type:'vcn',icon:'network',color:'var(--accent)'},{id:'storage',name:'Armazenamento',type:'volume',icon:'cube',color:'var(--mint)'},{id:'database',name:'Banco de dados',type:'adb',icon:'cube',color:'var(--danger)'},{id:'security',name:'Segurança',type:'vault',icon:'shield',color:'var(--muted)'},{id:'advanced',name:'Universal',type:'universal',icon:'code',color:'var(--subtle)'}].map(group=>({...group,count:s.resources.filter(resource=>TYPES[resource.type]?.cat===group.id).length}));
  const total=s.resources.length,maximum=Math.max(1,...groups.map(group=>group.count));
  bars.innerHTML=groups.map(group=>'<div class="monolith-bar-row"><div><span>'+esc(group.name)+'</span><strong>'+group.count+'</strong></div><div class="monolith-bar-track" role="meter" aria-label="'+esc(group.name)+'" aria-valuemin="0" aria-valuemax="'+maximum+'" aria-valuenow="'+group.count+'"><i style="width:'+(100*group.count/maximum)+'%;background:'+group.color+'"></i></div></div>').join('');
  $('monolith-shortcuts').innerHTML=groups.slice(0,3).map(group=>'<button type="button" class="monolith-shortcut" data-action="monolith-new" data-type="'+group.type+'"><span class="monolith-shortcut-icon" style="color:'+group.color+'">'+icon(group.icon)+'</span><span><strong>'+esc(group.name)+'</strong><small>'+group.count+' recurso(s) no plano</small></span>'+icon('arrow')+'</button>').join('');
  $('monolith-resource-total').textContent=total;$('monolith-donut-count').textContent=total;
  let position=0;const segments=groups.filter(group=>group.count).map(group=>{const start=position;position+=100*group.count/Math.max(total,1);return group.color+' '+start+'% '+position+'%';});
  $('monolith-donut').style.background=segments.length?'conic-gradient('+segments.join(',')+')':'var(--border)';
  $('monolith-legend').innerHTML=groups.map(group=>'<div><i style="background:'+group.color+'"></i><span>'+esc(group.name)+'</span><strong>'+group.count+'</strong></div>').join('');
}
document.addEventListener('click',event=>{const button=event.target.closest('[data-action="monolith-new"]');if(!button)return;chooseType(button.dataset.type);setPage('builder');});
I18N_TEXT.set('Visão geral',['Overview','Vista general','Vue d’ensemble','Übersicht','Panoramica','概要','概览']);
I18N_TEXT.set('Composição do projeto',['Project composition','Composición del proyecto','Composition du projet','Projektzusammensetzung','Composizione del progetto','プロジェクト構成','项目组成']);
I18N_TEXT.set('Inventário',['Inventory','Inventario','Inventaire','Inventar','Inventario','インベントリ','资源清单']);
for(const row of [
 ['Seu projeto. Uma visão sólida.','Your project. A solid overview.','Tu proyecto. Una visión sólida.','Votre projet. Une vue solide.','Ihr Projekt. Ein solider Überblick.','Il tuo progetto. Una visione solida.','プロジェクトを確かな視点で。','您的项目，清晰呈现。'],
 ['Estruturas sólidas e minimalismo profundo.','Solid structures and deep minimalism.','Estructuras sólidas y minimalismo profundo.','Structures solides et minimalisme profond.','Solide Strukturen und tiefer Minimalismus.','Strutture solide e minimalismo profondo.','堅牢な構造と深いミニマリズム。','坚实结构，极致简约。'],
 ['Recursos por categoria','Resources by category','Recursos por categoría','Ressources par catégorie','Ressourcen nach Kategorie','Risorse per categoria','カテゴリ別リソース','按类别划分的资源'],
 ['Construa com intenção. Revise cada detalhe.','Build with intent. Review every detail.','Construye con intención. Revisa cada detalle.','Construisez avec intention. Vérifiez chaque détail.','Bewusst bauen. Jedes Detail prüfen.','Costruisci con intenzione. Rivedi ogni dettaglio.','意図を持って構築し、細部を確認。','用心构建，审查每个细节。'],
 ['Abrir construtor','Open builder','Abrir constructor','Ouvrir le concepteur','Konfigurator öffnen','Apri costruttore','ビルダーを開く','打开构建器'],
 ['Ver diagrama','View diagram','Ver diagrama','Voir le diagramme','Diagramm anzeigen','Vedi diagramma','図を表示','查看架构图']
])I18N_TEXT.set(row[0],row.slice(1));
localizeInterface();
