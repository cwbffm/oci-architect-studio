// European Portuguese UI vocabulary only. Never applied to project data or generated code.
function translatePortuguesePortugal(source){
 const exact={
  'Escolher idioma':'Selecionar idioma',
  'Vamos configurar seu recurso?':'Vamos configurar o seu recurso?',
  'O que você quer criar?':'O que pretende criar?',
  'Como esse recurso deve funcionar?':'Como deve funcionar este recurso?',
  'Como ele vai se conectar?':'Como se vai ligar à rede?',
  'Escolha a rede e os acessos que este recurso precisa.':'Escolha a rede e os acessos de que este recurso necessita.',
  'Revisar e exportar':'Rever e exportar',
  'Revisão':'Revisão',
  'Revisar IAM':'Rever IAM',
  'Seu projeto':'O seu projeto',
  'Região atualizada. Importe o catálogo desta região e revise OCIDs já configurados.':'Região atualizada. Importe o catálogo desta região e reveja os OCIDs já configurados.',
  'Região não alterada.':'A região não foi alterada.',
  'Identificador da região OCI, ex.: eu-madrid-1':'Identificador da região OCI, por exemplo: eu-madrid-1',
  'Revise imagens, sub-redes, availability domains e outros OCIDs: podem pertencer à região anterior. Seus recursos, configurações e catálogo foram preservados; o catálogo anterior não é usado em outra região.':'Reveja as imagens, sub-redes, domínios de disponibilidade e restantes OCIDs: podem pertencer à região anterior. Os seus recursos, configurações e catálogo foram preservados; o catálogo anterior não é utilizado noutra região.',
  'Buscar cidade, país ou código…':'Pesquisar cidade, país ou código…',
  'Buscar região OCI':'Pesquisar região OCI',
  'Nenhuma região encontrada.':'Não foi encontrada nenhuma região.',
  'Catálogo revisto em':'Catálogo revisto em',
  'Remover dos favoritos':'Remover dos favoritos',
  'Adicionar aos favoritos':'Adicionar aos favoritos',
  'Acesso e serviços dependem da sua tenancy e do realm.':'O acesso e os serviços dependem da sua tenancy e do realm.',
  'Salvar projeto':'Guardar projeto',
  'Salvar alterações':'Guardar alterações',
  'Seu projeto fica neste navegador.':'O seu projeto fica neste navegador.',
  'Exporte um backup para guardar.':'Exporte uma cópia de segurança para guardar.',
  'Banco de dados':'Base de dados',
  'Bancos de dados':'Bases de dados',
  'Sistema operacional':'Sistema operativo',
  'Nome de usuário':'Nome de utilizador',
  'Senha':'Palavra-passe',
  'Nome do banco inválido.':'Nome da base de dados inválido.',
  'Informe o nome.':'Introduza o nome.',
  'Usuário Linux inválido: use letras minúsculas, números, hífen ou sublinhado; até 32 caracteres.':'Utilizador Linux inválido: utilize letras minúsculas, números, hífen ou sublinhado; até 32 caracteres.',
  'Tela cheia':'Ecrã inteiro',
  'Baixar arquivo':'Descarregar ficheiro',
  'Carregar arquivo':'Carregar ficheiro',
  'Arquivo de configuração':'Ficheiro de configuração',
  'Gerenciar recursos':'Gerir recursos',
  'Selecionar imagem e distribuição':'Selecionar imagem e distribuição',
  'Digite para buscar…':'Escreva para pesquisar…',
  'Nenhum recurso adicionado ao plano.':'Ainda não foram adicionados recursos ao plano.',
  'Seu recurso só entra no plano ao finalizar.':'O recurso só é adicionado ao plano ao concluir.',
  'Escolha o serviço acima e dê um nome ao recurso.':'Selecione o serviço acima e atribua um nome ao recurso.',
  'Defina o sistema operacional e a capacidade da VM.':'Defina o sistema operativo e a capacidade da VM.',
  'Associe as dependências e configure o acesso ao recurso.':'Associe as dependências e configure o acesso ao recurso.',
  'Confira os dados, as tags e as pendências para o Terraform.':'Verifique os dados, as tags e os requisitos em falta para o Terraform.',
  'O Terraform continua sendo produzido pelo construtor original.':'O Terraform continua a ser produzido pelo construtor original.',
  'Sua arquitetura começa aqui.':'A sua arquitetura começa aqui.',
  'Você ainda não adicionou recursos.':'Ainda não adicionou recursos.',
  'Sem conexão OCI':'Sem ligação à OCI',
  'SEM CONEXÃO OCI':'SEM LIGAÇÃO À OCI',
  'Pronto para começar':'Pronto para começar',
  'Restaurar campos':'Repor campos',
  'Restaurar layout':'Repor disposição',
  'Abrir editor completo →':'Abrir editor completo →',
  'Alterações só entram no projeto após salvar e validar.':'As alterações só são adicionadas ao projeto depois de guardar e validar.',
  'Edição não salva':'Edição por guardar',
  'Buscar recursos, serviços ou templates…':'Pesquisar recursos, serviços ou modelos…',
  'Buscar recurso...':'Pesquisar recurso...',
  'Um fluxo. Todas as ferramentas.':'Um fluxo. Todas as ferramentas.'
 };
 const trimmed=source.trim(),leading=source.match(/^\s*/)[0],trailing=source.match(/\s*$/)[0];
 if(Object.hasOwn(exact,trimmed))return leading+exact[trimmed]+trailing;
 const terms=[
  [/bancos de dados/gi,'bases de dados'],[/banco de dados/gi,'base de dados'],
  [/sistemas operacionais/gi,'sistemas operativos'],[/sistema operacional/gi,'sistema operativo'],
  [/\bvisualização\b/gi,'visualização'],[/\busuários\b/gi,'utilizadores'],[/\busuário\b/gi,'utilizador'],
  [/\bsenhas\b/gi,'palavras-passe'],[/\bsenha\b/gi,'palavra-passe'],
  [/\barquivos\b/gi,'ficheiros'],[/\barquivo\b/gi,'ficheiro'],
  [/\btelas\b/gi,'ecrãs'],[/\btela\b/gi,'ecrã'],
  [/\brevisar\b/gi,'rever'],[/\brevise\b/gi,'reveja'],[/\bconfira\b/gi,'verifique'],[/\bdigite\b/gi,'introduza'],[/\baplicativos\b/gi,'aplicações'],[/\baplicativo\b/gi,'aplicação'],
  [/\bfaixa\b/gi,'intervalo'],[/\binforme\b/gi,'introduza'],[/\bsomente\b/gi,'apenas'],[/\bcustomizadas\b/gi,'personalizadas'],[/\bcustomizada\b/gi,'personalizada'],[/\broteamento\b/gi,'encaminhamento'],[/\bpolicies\b/gi,'políticas'],
  [/\bbaixar\b/gi,'descarregar'],[/\bdownload\b/gi,'transferência'],
  [/\bsalvar\b/gi,'guardar'],[/\bsalvo\b/gi,'guardado'],[/\bsalvos\b/gi,'guardados'],[/\bsalva\b/gi,'guardada'],
  [/\bbuscar\b/gi,'pesquisar'],[/\bbusca\b/gi,'pesquisa'],
  [/\bgerenciar\b/gi,'gerir'],[/\bgerenciamento\b/gi,'gestão'],
  [/\bcompartilhamento\b/gi,'partilha'],[/\bcompartilhar\b/gi,'partilhar'],
  [/\bequipe\b/gi,'equipa'],[/\bcadastrar\b/gi,'registar'],[/\bcadastro\b/gi,'registo'],
  [/\bregistro\b/gi,'registo'],[/\bregistros\b/gi,'registos'],
  [/\bconexões\b/gi,'ligações'],[/\bconexão\b/gi,'ligação'],
  [/\bmemória RAM\b/gi,'memória RAM'],[/\bexcluídos\b/gi,'eliminados'],[/\bexcluir\b/gi,'eliminar'],
  [/\batualizações\b/gi,'atualizações'],[/\bchecagem\b/gi,'verificação'],
  [/\bbackup\b/gi,'cópia de segurança'],[/\bbackups\b/gi,'cópias de segurança'],
  [/\bpendências\b/gi,'requisitos em falta'],[/\bpendência\b/gi,'requisito em falta'],
  [/\btemplates\b/gi,'modelos'],[/\btemplate\b/gi,'modelo']
 ];
 let text=source;
 for(const [pattern,replacement]of terms)text=text.replace(pattern,match=>match===match.toUpperCase()?replacement.toUpperCase():match[0]===match[0].toUpperCase()?replacement[0].toUpperCase()+replacement.slice(1):replacement);
 return text;
}

// Display formatting is separate from machine values in forms and exports.
function currentUiLocale(){try{return interfaceLocale();}catch{return 'pt-BR';}}
function formatUiNumber(value,digits=0){return new Intl.NumberFormat(currentUiLocale(),{minimumFractionDigits:digits,maximumFractionDigits:digits}).format(Number(value));}
function formatUiDate(value,dateOnly=false){const date=new Date(value);if(Number.isNaN(date.getTime()))return '—';return new Intl.DateTimeFormat(currentUiLocale(),dateOnly?{dateStyle:'medium',timeZone:'UTC'}:{dateStyle:'medium',timeStyle:'short'}).format(date);}
function uiNumber(value,digits=0){const number=Number(value);return '<span data-ui-number="'+number+'" data-ui-digits="'+digits+'" translate="no">'+formatUiNumber(number,digits)+'</span>';}
function uiDate(value){return '<time data-ui-date="'+esc(value)+'" translate="no">'+formatUiDate(value)+'</time>';}
function refreshUiFormats(){document.querySelectorAll('[data-ui-number]').forEach(el=>el.textContent=formatUiNumber(el.dataset.uiNumber,Number(el.dataset.uiDigits||0)));document.querySelectorAll('[data-ui-date]').forEach(el=>el.textContent=formatUiDate(el.dataset.uiDate,el.hasAttribute('data-date-only')));}
