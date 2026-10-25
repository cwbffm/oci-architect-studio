# API Python para integração OCI

O frontend continua estático; esta API executa a integração com OCI Resource Manager. O servidor compila uma configuração Terraform JSON a partir dos campos permitidos do desenho, cria/reutiliza uma stack e oferece **plan → revisão → apply do plano exato**. Nenhum HCL, ZIP, comando shell, provider, backend ou endpoint de serviço enviado pelo navegador é executado.

**Estado atual:** integração implementada e validada com cliente OCI simulado e Terraform local. Não foi autenticada nem executada em uma tenancy. A configuração IAM, o Identity Domain e a hospedagem HTTPS dependem do seu ambiente. O GitHub Pages não executa Python.

## Executar

Exige Python 3.12 ou superior. A partir deste diretório:

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
cp .env.example .env
```

Edite `.env` com os dados reais e gere um token de operador com pelo menos 32 caracteres:

```bash
python3 -c 'import secrets; print(secrets.token_urlsafe(48))'
```

O token é uma credencial da API, **não uma chave OCI**. Não o coloque no HTML, em URL, no Git ou em armazenamento persistente do navegador. O modo token permite um operador e não oferece segregação de usuários. Para múltiplos usuários, configure OIDC.

Preencha os compartments autorizados no objeto JSON `STUDIO_COMPARTMENTS` e as regiões em `STUDIO_REGIONS`. A API recusa inicializar sem credencial de acesso e limites explícitos. `STUDIO_ALLOWED_ORIGINS` contém origens exatas; para GitHub Pages, a origem é `https://cwbffm.github.io` sem o caminho do repositório.

```bash
.venv/bin/uvicorn studio_api.asgi:app --env-file .env --host 127.0.0.1 --port 8000
```

Desenvolvimento local pode usar `STUDIO_OCI_AUTH=config` e um profile OCI já configurado no servidor. Nenhum arquivo OCI é enviado pelo navegador. Para hospedagem, prefira Instance Principal em Compute ou Resource Principal em um runtime OCI compatível. Sem identidade OCI configurada, a API inicia, mas o teste de conexão falha de forma explícita.

Para testar a interface localmente, sirva apenas os arquivos públicos. Na raiz do repositório, em outro terminal:

```bash
mkdir -p _site
cp index.html _site/index.html
python3 -m http.server 8080 --bind 127.0.0.1 --directory _site
```

Abra `http://localhost:8080` e informe `http://localhost:8000` na tela de integração. A origem precisa constar em `STUDIO_ALLOWED_ORIGINS`. Não sirva o diretório do backend ou arquivos `.env` como conteúdo público. Abrir o HTML diretamente como arquivo continua adequado ao planejamento local, mas a conexão com a API exige uma origem HTTP/HTTPS autorizada.

## Hospedagem e identidade

1. Hospede a API na OCI com acesso aos endpoints dos serviços, TLS em um proxy/load balancer e credencial de acesso bem protegida. Exponha apenas HTTPS; limite requisições no proxy e desative logs de headers/body.
2. Para Compute, associe a instância a um dynamic group. Autorize apenas as operações de Resource Manager necessárias nos compartments permitidos. Não conceda administração da tenancy.
3. As execuções do Resource Manager precisam das permissões correspondentes aos recursos gerados, conforme a integração IAM usada pela tenancy. Ter permissão de criar jobs não comprova capacidade de provisionar todos os serviços.
4. Consulte as versões de Terraform suportadas pelo Resource Manager na região e configure `STUDIO_TERRAFORM_VERSION`. O exemplo usa `1.5.x`; disponibilidade e funcionamento dessa versão em sua tenancy não foram verificados. A configuração gerada restringe o provider OCI a `~> 9.11.0`. A validação local utilizou Terraform 1.13.4/provider 9.11.0 e não comprova execução no Resource Manager.
5. Use volume persistente para o diretório `data`, com backup protegido e permissões restritas. O SQLite guarda ownership, stack, jobs e a operação pendente. Excluir essa base perde a associação com as stacks reais e pode levar a novas criações.
6. Cada stack deve ser gerenciada exclusivamente pelo Studio. A API verifica ETags e jobs ativos, mas não pode bloquear atomicamente operações iniciadas no Console ou em outro sistema entre suas verificações. Não edite ou execute essas stacks simultaneamente fora do Studio.

O teste de conexão efetua `list_stacks` para verificar acesso de leitura no primeiro compartment configurado de cada região. A lista apresentada ao usuário é a allowlist do servidor; não é um inventário completo da tenancy nem comprovação das permissões em todos os alvos.

## OIDC e login

Configure uma aplicação pública de navegador no Identity Domain, com Authorization Code + PKCE, redirect URI exata da página do Studio, sem client secret no frontend. Cadastre também o recurso/API, a audience e os scopes necessários para obter um **access token JWT** destinado à API. Um ID token do navegador não é substituto desse access token.

Variáveis:

- `STUDIO_AUTH_MODE=oidc`;
- `STUDIO_OIDC_ISSUER`: issuer exato do discovery/token, incluindo eventual barra final. Na Oracle pode ser o issuer global `https://identity.oraclecloud.com/`, compartilhado entre domínios;
- `STUDIO_OIDC_DISCOVERY_URL`: URL HTTPS do discovery do **Identity Domain específico**, por exemplo `https://SEU_DOMINIO.identity.oraclecloud.com/.well-known/openid-configuration`. É independente do issuer. Se omitida, deriva do issuer para provedores OIDC convencionais; na Oracle, preencha explicitamente com o endereço do domínio;
- `STUDIO_OIDC_JWKS_URL`: URL HTTPS fixa da chave pública de assinatura;
- `STUDIO_OIDC_CLIENT_ID`: client ID público da aplicação de navegador;
- `STUDIO_OIDC_AUDIENCE`: audience da API;
- `STUDIO_OIDC_SCOPES`: scopes solicitados pelo frontend, por exemplo `openid profile` acrescido do scope registrado da API;
- `STUDIO_ALLOWED_SUBJECTS` ou `STUDIO_ALLOWED_GROUPS`: valores autorizados, separados por vírgula. A claim `groups` deve ser configurada como lista de strings se esse mecanismo for utilizado.

A API verifica assinatura RS256, issuer, audience, expiração, emissão e subject. URLs de verificação vêm exclusivamente da configuração do administrador. Usuários autorizados têm permissões de operador, inclusive aplicar, nos alvos configurados; não há papéis distintos de leitor/aprovador nesta versão. O ownership impede que um usuário acesse a arquitetura ou os jobs de outro. As identidades são separadas por modo de autenticação e, em OIDC, pelo conjunto issuer/URL JWKS/subject; trocar o Identity Domain não transfere a propriedade das arquiteturas. A URL JWKS fixa o domínio de confiança mesmo quando a Oracle compartilha um issuer global. Rotacionar as chaves no mesmo endpoint preserva a identidade; trocar o endpoint JWKS não transfere automaticamente o ownership. Uma mesma conta/token não fornece separação entre pessoas.

A Oracle documenta que o issuer pode ser global e os endpoints específicos do domínio: [OpenID Discovery](https://docs.oracle.com/en/cloud/paas/identity-cloud/idcsa/op-well-known-openid-configuration-get.html). Use os valores publicados pelo discovery da sua tenancy; não deduza a URL do domínio a partir do issuer. O access token precisa ter a audience da API e a configuração de CORS deve permitir a origem do Studio no fluxo de navegador.

## Recursos suportados na integração direta

| Tipo | Cobertura e limites |
|---|---|
| VCN | IPv4 canônico /16 a /30, DNS label opcional |
| Subnet | Referência à VCN do desenho; security list explícita sem regras; tabela de rotas vazia explícita quando não informada |
| NSG | Uma regra de ingresso TCP/UDP/todos; CIDR e porta validados |
| Internet Gateway / NAT Gateway | Referência à VCN do desenho |
| Route table | Destino IPv4 e gateway IGW/NAT do desenho na mesma VCN |
| DRG | Criação do DRG; attachment e rotas DRG ainda não disponíveis nesta integração |
| Block Volume | AD, tamanho e performance; não anexa nem monta no sistema operacional |
| Bucket | Privado, tier e versionamento; namespace preenchido ou consultado pelo provider |
| Compute | Linux privado, shapes VM.Standard E4/E5/A1/A2 Flex, AD e imagem regional preenchidos, boot volume e chave pública SSH opcionais |

Todas as dependências de rede precisam ser referências internas ao desenho. Overrides para outros compartments são rejeitados. Até dez tags **freeform** são aceitas; tags definidas, criação de schema e policies IAM devem estar desabilitadas. A integração direta não aceita Universal/HCL, KMS personalizado, Load Balancer, OKE, bancos, bootstrap ou scripts de usuário. Os formatos existentes de download continuam atendendo esses casos conforme sua cobertura própria.

Compute exige `configureUser`, bootstrap Linux e Windows desativados, sem IP público nem IP reservado. `nsgIds` pode conter IDs **internos** (`r_...`) de NSGs do desenho, separados por vírgula; OCIDs externos são rejeitados. Os NSGs devem estar na mesma VCN da subnet. Sem NSG associado, a subnet de regras vazias deixa a VM isolada. Ingresso e saída necessários precisam ser planejados; não existe acesso SSH, Bastion, DNS ou internet garantido por criar uma VM. Não há regra automática de egress.

Imagem, shape, capacidade e disponibilidade regional precisam ser conferidos. O compiler valida estrutura e limites básicos; a compatibilidade real é verificada pelo provider/OCI. Ele não consulta nem certifica o sistema operacional da imagem informada.

## Contrato HTTP

Toda rota abaixo, exceto health/config, exige `Authorization: Bearer ...`.

- `GET /api/health`: saúde do processo, não comprovação de conexão OCI.
- `GET /api/config`: modo de autenticação, dados públicos OIDC e tipos suportados.
- `GET /api/connection`: consulta de leitura OCI, identidade de acesso e alvos autorizados.
- `GET /api/architectures/{UUID}`: recupera stack, último job e indicador de reconciliação após recarregar a página.
- `POST /api/architectures/{UUID}/plan`: corpo `{"state": {...}}` com o estado do Studio; gera plano novo e preserva a stack da arquitetura.
- `GET /api/architectures/{UUID}/jobs/{job_id}`: status, logs, `console_url`, `logs_truncated` e `review_ready`.
- `POST /api/architectures/{UUID}/apply`: corpo `{"plan_job_id":"...","confirmation":"APPLY"}`. Apenas o plano atual e bem-sucedido pode ser aplicado. Repetir o pedido desse mesmo plano retorna a aplicação já existente.

Um identificador de arquitetura pertence a um principal e a um par região/compartment imutável. Remover um destino da configuração revoga imediatamente a aplicação de planos existentes e a consulta da arquitetura/jobs nesse destino. O SQLite serializa as intenções de mutação; a aplicação consulta o job ativo antes de permitir nova execução. Não existem endpoints de destroy, execução shell, upload de credenciais ou leitura de state.

Logs são paginados até 5.000 entradas ou 1 MB. Se esse limite for atingido, ou se não houver logs completos do plano, a API bloqueia apply. Use o Console para revisar a execução nesse caso. A revisão também precisa observar o tipo da operação e eventuais exclusões/substituições; um plano não é uma previsão de custos.

## Falhas parciais e reconciliação

A API grava uma intenção persistente antes de chamar operações remotas. Se a chamada falhar com resultado incerto, a arquitetura permanece bloqueada com `reconcile=1`. Não há repetição automática de uma criação ou aplicação possivelmente bem-sucedida.

A recuperação é administrativa: interrompa o serviço, preserve uma cópia da base, verifique a stack e os jobs reais no Console e confirme quais operações ocorreram antes de corrigir a associação e liberar a arquitetura. Não apague a linha nem crie uma arquitetura substituta para contornar o bloqueio sem verificar os recursos existentes. Uma stack pode ter sido criada antes de seu OCID ser persistido; procure pelo nome e horário no Resource Manager. A API não inclui uma ferramenta automática de reconciliação nesta versão.

Jobs que falham podem deixar recursos criados. Não existe rollback de infraestrutura ou restauração de dados automática. Backup JSON do desenho, banco da API, estado Terraform e backup dos dados são artefatos diferentes.

## Validação

```bash
.venv/bin/pip install -r requirements-dev.txt
.venv/bin/python -m pytest -c pytest.ini -q
```

Os testes usam OCI simulado e chaves RSA de teste; verificam autenticação, autorização, CORS, separação por usuário, rejeição de entradas inseguras, isolamento de rede, revisão completa dos logs, aplicação do plano exato, concorrência e tratamento de falhas incertas. Não são enviados comandos de criação à OCI.
