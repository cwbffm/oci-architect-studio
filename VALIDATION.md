# Validação atual — 25/10/2026

A revisão e os testes da integração HTML + Python estão em [docs/VALIDATION_PYTHON_OCI.md](docs/VALIDATION_PYTHON_OCI.md): 39 testes da API, 16 verificações da nova interface, 24 configurações Terraform e repetição das suítes existentes. Nenhuma infraestrutura OCI foi criada.

## Validação anterior — 24/10/2026

Revisão do HTML e dos fluxos de planejamento, exportação, backups, rede, aparência, leitura e idiomas.

## Correções desta revisão

- As prévias clara e escura agora usam o destaque efetivamente selecionado, incluindo cores personalizadas e o ajuste de contraste de cada modo. Antes, a interface mudava de cor, mas as prévias mantinham a cor padrão da família.
- O workflow usa Ubuntu 24.04 e versões publicadas das ações compatíveis com Node.js 24: checkout 7.0.1, configure-pages 6.0.0, upload-pages-artifact 5.0.0 e deploy-pages 5.0.1. Permissões e branch de publicação permanecem iguais.
- Documentação atualizada para refletir o catálogo, os controles e a validação atuais.

## Verificações executadas

| Área | Resultado |
| --- | --- |
| Oito páginas e 22 tipos nativos | Formulários e geração sem exceções |
| Regressão | Dez testes passaram |
| Aparência | 14 testes passaram |
| Destaques e prévias | 646 combinações: 38 temas × 17 opções |
| Layout de temas | 912 cenários: 38 temas × oito páginas × três larguras |
| Leitura ampliada | 128 cenários adicionais, desktop/tablet/celular |
| Idiomas | 64 navegações e 192 layouts, sem overflow |
| Dados e idiomas | Nomes de recursos, valores de tags e código preservados; teclado e persistência passaram |
| Identificação de controles | Sem IDs duplicados, botões visíveis sem nome ou campos visíveis sem rótulo nas oito páginas |
| JavaScript | Nenhuma exceção nos fluxos válidos testados |
| Terraform | 32/32 configurações válidas, sem erros nem avisos |

Os testes de contraste verificam texto, texto secundário, destaque e texto sobre botões. As prévias selecionadas também são comparadas com a cor aplicada na interface.

Os testes de regressão verificam backups válidos e inválidos, preservação do projeto após rejeição, payload de catálogo malicioso, bloqueio consistente ao copiar/baixar código inválido, exportação permitida para plano válido, rotas de Service Gateway, Universal sem policies e exportação de HTML sem os dados do projeto.

## Terraform

Validação local com Terraform 1.13.4 e provider oracle/oci 9.11.0 já instalado. Foram regenerados e validados 22 exemplos nativos, rota com Service Gateway, laboratório de rede, Windows, IP reservado, bootstrap Linux, defined tags, Universal e rede stateless TCP/UDP/ICMP. As configurações foram verificadas sequencialmente para evitar disputa pelo mesmo diretório de validação.

## Reproduzir os testes de navegador

Instale Playwright e disponibilize Chromium. Na raiz do repositório:

```sh
npm install --no-save playwright
node tests/regression.cjs
node tests/themes.cjs
node tests/languages.cjs
```

O executável padrão é `/usr/bin/chromium`; use `CHROMIUM_PATH=/caminho/para/chromium` antes do comando para outro caminho. Os testes usam uma origem isolada e não acessam uma tenancy. Artefatos de teste são gravados em `work/`.

## Limites

`terraform validate` verifica sintaxe e schema do provider. Não foi executado `terraform plan` ou `apply` contra uma tenancy. Capacidade, imagens regionais, permissões IAM efetivas e conectividade real precisam ser confirmadas na OCI. O recurso Universal aceita HCL manual e exige revisão do conteúdo. A verificação de identificação de controles não substitui uma auditoria completa com leitores de tela.


## Atualização: exportação OCI CLI

A tela Código e exportação agora oferece Terraform (`main.tf`) e OCI CLI (`deploy-oci.sh`). Seleção, nome do arquivo, prévia, cópia e download seguem o formato escolhido. A preferência persiste no navegador e nos backups. O gerador Terraform e a geração de policies permanecem iguais; a importação de backups apenas normaliza o campo de formato novo.

Verificações desta atualização:

- Dez testes de regressão existentes passaram, preservando Terraform, backups, bloqueios e exportação limpa.
- 22 casos nativos e três casos adicionais geraram scripts Bash válidos: dependências fora de ordem com tags/IAM/IP reservado, Windows nativo e região/compartimento preenchidos.
- 25 scripts e 37 chamadas simuladas passaram; parâmetros de 30 caminhos de comandos foram processados pela OCI CLI oficial 3.95.1 com cliente substituído e sockets bloqueados. Não houve chamadas à OCI.
- Foram conferidos payloads JSON, estados de espera, ordem de dependências, variáveis ausentes, região/OCIDs escolhidos, bloqueio de expansão de shell e limpeza de arquivos temporários 0600.
- Interface: troca e persistência dos formatos, cópia/download, preservação da saída Terraform, bloqueios de plano inválido/Universal/BYOL, oito idiomas e 24 layouts CLI passaram, sem erros JavaScript.
- Os testes de idiomas existentes passaram novamente em 64 navegações e 192 layouts. A sintaxe JavaScript passou em `node --check`.

Os testes anteriores de provider e aparência permanecem documentados acima e não foram repetidos nesta atualização do exportador. Os campos/algoritmos das paletas e o gerador Terraform não foram alterados. O laboratório de rede e o pacote IAM independente continuam com suas exportações Terraform. Universal/HCL manual e Windows BYOL são explicitamente bloqueados na alternativa CLI. Consulte OCI_CLI.md para execução e limitações; não houve provisionamento real.
