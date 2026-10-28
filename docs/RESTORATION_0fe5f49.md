# Restauração da interface 0fe5f49

A base visual é `0fe5f49`. As correções funcionais de `351a164` foram preservadas sem importar Prisma, Monolith ou seus modos de trabalho. O tema inicial é Escuro; os 38 temas clássicos foram preservados. Os temas especiais e seus fundos foram removidos após a restauração, conforme solicitado. Preferências válidas de projetos existentes continuam aceitas.

## Correções preservadas

- Policies IAM opcionais e exportadas separadamente, sem inclusão em `main.tf` ou `deploy-oci.sh`, inclusive com `includeIam: true` legado.
- HCL Universal aceita ausência de policies e continua bloqueado no OCI CLI.
- Validação dos campos de seleção, tiers de bucket suportados e referências entre VCN, subnet, tabela de rotas e endpoint OKE.
- Restrições do Load Balancer público/privado e IP reservado.
- Compartimento de namespaces de tags parametrizado quando a referência IAM não é um OCID.
- Diferenças entre Terraform e OCI CLI documentadas na própria tela de exportação; Windows BYOL permanece bloqueado no CLI validado.

Foi corrigida uma sobreposição presente na interface histórica: os botões do assistente agora ficam depois dos campos, sem barra sticky cobrindo o formulário.

## Validação local

- Regressão de importação, escape de conteúdo, exportação limpa e separação IAM: passou.
- OCI CLI: 22 tipos nativos, três cenários compostos, 15 enums inválidos e isolamento IAM passaram.
- Execução simulada: 25 scripts, 36 comandos simulados e 29 caminhos oficiais do OCI CLI, sem chamadas OCI.
- Terraform 1.13.4 com oracle/oci 9.11.0: 50 configurações aprovadas por validação offline do provider.
- Interface: 78 etapas nativas, criação/edição, 160 layouts em quatro temas e cinco larguras, menu de celular; sem erros ou campos cobertos pelas ações.
- Idiomas: 64 navegações e 192 layouts em oito idiomas, sem transbordamento horizontal ou erros JavaScript.
- Temas clássicos: 646 casos de contraste e 912 layouts; migração de temas especiais antigos, preservando os dados; sem erros.
- Servidor Python: teste de conteúdo estático e restrição de caminhos passou.
- Build sincronizado e `git diff --check` sem erros.

A validação não cria recursos nem consulta uma tenancy. As capturas usam um projeto de exemplo. A publicação utiliza o workflow GitHub Pages na branch `docker-compose`, após a validação local.

O estado local anterior à restauração foi preservado em `/workspace/backups/studio-before-0fe5f49-restore.tar.gz`.
