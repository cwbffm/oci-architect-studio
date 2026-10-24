# Validação atual — 24/10/2026

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
