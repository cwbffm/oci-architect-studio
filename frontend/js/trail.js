// Guided trail (A): three project steps, common service cards and the review page.
// Presentation only: resources, validation and exporters remain authoritative in studio.js.
function trailSection(current) {
  return { builder: 'builder', catalog: 'builder', network: 'builder', review: 'review', iam: 'review', tags: 'review', export: 'export' }[current] || '';
}
function renderTrail() {
  const nav = document.getElementById('trail');
  if (!nav) return;
  const order = ['builder', 'review', 'export'], section = trailSection(page), reached = order.indexOf(section);
  nav.querySelectorAll('a[data-page]').forEach((link, index) => {
    link.classList.toggle('trail-current', link.dataset.page === section);
    link.classList.toggle('trail-done', reached > index);
  });
  const chips = document.getElementById('trail-plan-chips');
  if (chips) {
    chips.innerHTML = s.resources.length
      ? s.resources.map(r => '<button type="button" class="trail-chip" data-action="edit-resource" data-id="' + esc(r.id) + '" translate="no">' + esc(r.name) + '</button>').join('')
      : '<span class="trail-plan-empty">Nenhum recurso ainda.</span>';
  }
  const tip = document.getElementById('trail-tip');
  if (tip) tip.hidden = s.resources.length > 0;
}
function updateTrailBuilder() {
  const cards = document.getElementById('trail-services');
  if (!cards) return;
  const serviceStep = builderStep === 'service';
  cards.hidden = !serviceStep || Boolean(editingId);
  cards.querySelectorAll('[data-type]').forEach(card => card.setAttribute('aria-pressed', String(card.dataset.type === selectedType)));
  document.getElementById('builder-title').textContent = editingId ? 'Editar recurso' : serviceStep ? 'O que você quer criar na OCI?' : 'Vamos configurar seu recurso?';
  document.getElementById('builder-subtitle').textContent = serviceStep && !editingId
    ? 'Escolha um item. A gente pergunta só o necessário e monta o código para você.'
    : 'Escolha o serviço, responda às etapas e revise antes de adicionar ao plano.';
}
function renderReview() {
  const list = document.getElementById('review-resources');
  if (!list) return;
  const count = document.getElementById('review-count');
  count.textContent = formatUiNumber(s.resources.length);
  count.setAttribute('translate', 'no');
  list.innerHTML = s.resources.length
    ? s.resources.map(r => {
        const issues = validateResource(r, s);
        return '<article class="review-row"><span class="plan-item-icon">' + icon(TYPES[r.type].icon) + '</span><div class="review-row-main"><button type="button" class="review-row-name" data-action="edit-resource" data-id="' + esc(r.id) + '" translate="no">' + esc(r.name) + '</button><small>' + esc(TYPES[r.type].label) + '</small>' +
          (issues.length ? '<ul class="review-issues">' + issues.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>' : '') +
          '</div><span class="badge ' + (issues.length ? 'warning' : 'mint') + '">' + (issues.length ? 'Falta ajustar' : 'Pronto') + '</span></article>';
      }).join('')
    : '<div class="review-empty"><p><strong>Seu plano ainda está vazio.</strong></p><p>Adicione um recurso para conferir aqui.</p><a class="button primary" href="#builder">Montar o plano</a></div>';
  const tagErrors = tagAudit(s).errors;
  document.getElementById('review-tags').innerHTML = tagErrors.length
    ? '<span class="badge warning">Falta ajustar</span><ul class="review-issues">' + tagErrors.map(x => '<li>' + esc(x.message) + '</li>').join('') + '</ul>'
    : '<span class="badge mint">Pronto</span><p class="section-caption">As tags do projeto estão prontas para exportar.</p>';
}
document.addEventListener('click', event => {
  const card = event.target.closest('[data-action="trail-pick"]');
  if (card && TYPES[card.dataset.type]) {
    chooseType(card.dataset.type);
    document.getElementById('f-name')?.focus({ preventScroll: true });
  }
});
for (const [source, ...values] of [
  ['Montar o plano', 'Build the plan', 'Armar el plan', 'Composer le plan', 'Plan erstellen', 'Crea il piano', 'プランを作成', '制定计划'],
  ['Escolha o que criar', 'Choose what to create', 'Elige qué crear', 'Choisissez quoi créer', 'Wählen Sie, was erstellt wird', 'Scegli cosa creare', '作成するものを選択', '选择要创建的内容'],
  ['Conferir', 'Review', 'Revisar', 'Vérifier', 'Prüfen', 'Verifica', '確認', '检查'],
  ['Recursos, tags e pendências', 'Resources, tags and open items', 'Recursos, etiquetas y pendientes', 'Ressources, tags et points en attente', 'Ressourcen, Tags und offene Punkte', 'Risorse, tag ed elementi in sospeso', 'リソース、タグ、未対応項目', '资源、标记和待办事项'],
  ['Exportar', 'Export', 'Exportar', 'Exporter', 'Exportieren', 'Esporta', 'エクスポート', '导出'],
  ['Terraform ou OCI CLI', 'Terraform or OCI CLI', 'Terraform u OCI CLI', 'Terraform ou OCI CLI', 'Terraform oder OCI CLI', 'Terraform o OCI CLI', 'Terraform または OCI CLI', 'Terraform 或 OCI CLI'],
  ['Mais', 'More', 'Más', 'Plus', 'Mehr', 'Altro', 'その他', '更多'],
  ['Mais opções', 'More options', 'Más opciones', 'Plus d’options', 'Weitere Optionen', 'Altre opzioni', 'その他のオプション', '更多选项'],
  ['Etapas do projeto', 'Project steps', 'Pasos del proyecto', 'Étapes du projet', 'Projektschritte', 'Passaggi del progetto', 'プロジェクトの手順', '项目步骤'],
  ['O que você quer criar na OCI?', 'What do you want to create on OCI?', '¿Qué quieres crear en OCI?', 'Que voulez-vous créer sur OCI ?', 'Was möchten Sie in OCI erstellen?', 'Cosa vuoi creare su OCI?', 'OCIで何を作成しますか？', '您想在 OCI 上创建什么？'],
  ['Escolha um item. A gente pergunta só o necessário e monta o código para você.', 'Pick an item. We ask only what is needed and build the code for you.', 'Elige un elemento. Preguntamos solo lo necesario y armamos el código por ti.', 'Choisissez un élément. Nous demandons seulement le nécessaire et préparons le code pour vous.', 'Wählen Sie ein Element. Wir fragen nur das Nötige ab und erstellen den Code für Sie.', 'Scegli un elemento. Chiediamo solo il necessario e prepariamo il codice per te.', '項目を選択してください。必要なことだけを確認し、コードを作成します。', '选择一项。我们只询问必要信息并为您生成代码。'],
  ['Editar recurso', 'Edit resource', 'Editar recurso', 'Modifier la ressource', 'Ressource bearbeiten', 'Modifica risorsa', 'リソースを編集', '编辑资源'],
  ['Serviços mais usados', 'Most used services', 'Servicios más usados', 'Services les plus utilisés', 'Meistgenutzte Dienste', 'Servizi più usati', 'よく使うサービス', '常用服务'],
  ['Rede', 'Network', 'Red', 'Réseau', 'Netzwerk', 'Rete', 'ネットワーク', '网络'],
  ['A rede privada onde seus recursos ficam.', 'The private network where your resources live.', 'La red privada donde viven tus recursos.', 'Le réseau privé où se trouvent vos ressources.', 'Das private Netzwerk für Ihre Ressourcen.', 'La rete privata in cui risiedono le tue risorse.', 'リソースを配置するプライベートネットワーク。', '承载您资源的专用网络。'],
  ['Servidor', 'Server', 'Servidor', 'Serveur', 'Server', 'Server', 'サーバー', '服务器'],
  ['Uma máquina Linux ou Windows.', 'A Linux or Windows machine.', 'Una máquina Linux o Windows.', 'Une machine Linux ou Windows.', 'Eine Linux- oder Windows-Maschine.', 'Una macchina Linux o Windows.', 'Linux または Windows のマシン。', '一台 Linux 或 Windows 计算机。'],
  ['Armazenamento', 'Storage', 'Almacenamiento', 'Stockage', 'Speicher', 'Archiviazione', 'ストレージ', '存储'],
  ['Um bucket para guardar seus arquivos.', 'A bucket to keep your files.', 'Un bucket para guardar tus archivos.', 'Un bucket pour conserver vos fichiers.', 'Ein Bucket für Ihre Dateien.', 'Un bucket per conservare i tuoi file.', 'ファイルを保存するバケット。', '用于保存文件的存储桶。'],
  ['Banco de dados', 'Database', 'Base de datos', 'Base de données', 'Datenbank', 'Database', 'データベース', '数据库'],
  ['Autonomous Database gerenciado pela Oracle.', 'Autonomous Database managed by Oracle.', 'Autonomous Database gestionado por Oracle.', 'Autonomous Database géré par Oracle.', 'Von Oracle verwaltete Autonomous Database.', 'Autonomous Database gestito da Oracle.', 'Oracle が管理する Autonomous Database。', '由 Oracle 管理的 Autonomous Database。'],
  ['Balanceador', 'Load balancer', 'Balanceador', 'Équilibreur de charge', 'Load Balancer', 'Bilanciatore', 'ロードバランサー', '负载均衡器'],
  ['Distribui o acesso entre servidores.', 'Spreads traffic across servers.', 'Distribuye el acceso entre servidores.', 'Répartit le trafic entre les serveurs.', 'Verteilt Zugriffe auf mehrere Server.', 'Distribuisce il traffico tra i server.', 'サーバー間でアクセスを分散します。', '在服务器之间分配访问流量。'],
  ['Um cluster OKE para contêineres.', 'An OKE cluster for containers.', 'Un clúster OKE para contenedores.', 'Un cluster OKE pour les conteneurs.', 'Ein OKE-Cluster für Container.', 'Un cluster OKE per i container.', 'コンテナ用の OKE クラスター。', '用于容器的 OKE 集群。'],
  ['Não achou? Escolha entre todos os serviços na lista abaixo.', 'Not here? Choose from all services in the list below.', '¿No está aquí? Elige entre todos los servicios en la lista de abajo.', 'Introuvable ? Choisissez parmi tous les services dans la liste ci-dessous.', 'Nicht dabei? Wählen Sie unten aus allen Diensten.', 'Non lo trovi? Scegli tra tutti i servizi nell’elenco qui sotto.', '見つかりませんか？下のリストからすべてのサービスを選択できます。', '没找到？请从下方列表的全部服务中选择。'],
  ['Seu plano', 'Your plan', 'Tu plan', 'Votre plan', 'Ihr Plan', 'Il tuo piano', 'あなたのプラン', '您的计划'],
  ['Nenhum recurso ainda.', 'No resources yet.', 'Aún no hay recursos.', 'Aucune ressource pour l’instant.', 'Noch keine Ressourcen.', 'Ancora nessuna risorsa.', 'リソースはまだありません。', '尚无资源。'],
  ['Conferir o plano', 'Review the plan', 'Revisar el plan', 'Vérifier le plan', 'Plan prüfen', 'Verifica il piano', 'プランを確認', '检查计划'],
  ['Primeira vez?', 'First time?', '¿Primera vez?', 'Première fois ?', 'Zum ersten Mal hier?', 'Prima volta?', '初めてですか？', '第一次使用？'],
  ['Comece por um modelo pronto e mude o que quiser depois.', 'Start from a ready-made template and change anything later.', 'Empieza con una plantilla lista y cambia lo que quieras después.', 'Commencez par un modèle prêt à l’emploi et modifiez-le ensuite.', 'Starten Sie mit einer fertigen Vorlage und passen Sie sie später an.', 'Parti da un modello pronto e modifica ciò che vuoi in seguito.', '既成のテンプレートから始めて、後で自由に変更できます。', '从现成模板开始，之后可随意修改。'],
  ['Usar modelo de rede + servidor', 'Use the network + server template', 'Usar plantilla de red + servidor', 'Utiliser le modèle réseau + serveur', 'Vorlage Netzwerk + Server verwenden', 'Usa il modello rete + server', 'ネットワーク＋サーバーのテンプレートを使用', '使用网络 + 服务器模板'],
  ['ETAPA 2 DE 3', 'STEP 2 OF 3', 'PASO 2 DE 3', 'ÉTAPE 2 SUR 3', 'SCHRITT 2 VON 3', 'PASSAGGIO 2 DI 3', 'ステップ 2/3', '第 2 步，共 3 步'],
  ['Confira seu plano', 'Review your plan', 'Revisa tu plan', 'Vérifiez votre plan', 'Prüfen Sie Ihren Plan', 'Verifica il tuo piano', 'プランを確認しましょう', '检查您的计划'],
  ['Veja o que será criado e resolva as pendências antes de exportar.', 'See what will be created and fix open items before exporting.', 'Mira lo que se creará y resuelve los pendientes antes de exportar.', 'Voyez ce qui sera créé et réglez les points en attente avant d’exporter.', 'Sehen Sie, was erstellt wird, und klären Sie offene Punkte vor dem Export.', 'Guarda cosa verrà creato e risolvi gli elementi in sospeso prima di esportare.', '作成される内容を確認し、エクスポート前に未対応項目を解決します。', '查看将要创建的内容，并在导出前解决待办事项。'],
  ['Permissões (IAM)', 'Permissions (IAM)', 'Permisos (IAM)', 'Autorisations (IAM)', 'Berechtigungen (IAM)', 'Autorizzazioni (IAM)', '権限 (IAM)', '权限 (IAM)'],
  ['Opcional. Consulte as policies de referência para os serviços do plano.', 'Optional. See the reference policies for the services in the plan.', 'Opcional. Consulta las políticas de referencia para los servicios del plan.', 'Facultatif. Consultez les policies de référence pour les services du plan.', 'Optional. Sehen Sie sich die Referenz-Policies für die Dienste im Plan an.', 'Facoltativo. Consulta le policy di riferimento per i servizi del piano.', '任意。プラン内のサービス向け参照ポリシーを確認できます。', '可选。查看计划中各服务的参考策略。'],
  ['Abrir tags', 'Open tags', 'Abrir etiquetas', 'Ouvrir les tags', 'Tags öffnen', 'Apri i tag', 'タグを開く', '打开标记'],
  ['Abrir políticas IAM', 'Open IAM policies', 'Abrir políticas IAM', 'Ouvrir les policies IAM', 'IAM-Policies öffnen', 'Apri le policy IAM', 'IAM ポリシーを開く', '打开 IAM 策略'],
  ['Voltar ao plano', 'Back to the plan', 'Volver al plan', 'Retour au plan', 'Zurück zum Plan', 'Torna al piano', 'プランに戻る', '返回计划'],
  ['Continuar para exportar', 'Continue to export', 'Continuar para exportar', 'Continuer vers l’export', 'Weiter zum Export', 'Continua verso l’esportazione', 'エクスポートへ進む', '继续导出'],
  ['Pronto', 'Ready', 'Listo', 'Prêt', 'Bereit', 'Pronto', '準備完了', '就绪'],
  ['Falta ajustar', 'Needs attention', 'Falta ajustar', 'À corriger', 'Anpassung nötig', 'Da sistemare', '要対応', '需要调整'],
  ['Seu plano ainda está vazio.', 'Your plan is still empty.', 'Tu plan aún está vacío.', 'Votre plan est encore vide.', 'Ihr Plan ist noch leer.', 'Il tuo piano è ancora vuoto.', 'プランはまだ空です。', '您的计划还是空的。'],
  ['Adicione um recurso para conferir aqui.', 'Add a resource to review it here.', 'Añade un recurso para revisarlo aquí.', 'Ajoutez une ressource pour la vérifier ici.', 'Fügen Sie eine Ressource hinzu, um sie hier zu prüfen.', 'Aggiungi una risorsa per verificarla qui.', 'リソースを追加すると、ここで確認できます。', '添加资源后即可在此检查。'],
  ['As tags do projeto estão prontas para exportar.', 'The project tags are ready to export.', 'Las etiquetas del proyecto están listas para exportar.', 'Les tags du projet sont prêts à être exportés.', 'Die Projekt-Tags sind exportbereit.', 'I tag del progetto sono pronti per l’esportazione.', 'プロジェクトのタグはエクスポートできます。', '项目标记已可导出。'],
]) if (!I18N_TEXT.has(source)) I18N_TEXT.set(source, values);
localizeInterface();
renderTrail();
updateTrailBuilder();
if (page === 'review') renderReview();
