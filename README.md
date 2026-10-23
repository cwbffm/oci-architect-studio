# OCI Architect Studio

Aplicação estática para planejamento de recursos Oracle Cloud Infrastructure e geração de Terraform.

## Personalização do workspace
- **Developer Studio**: plano, configuração e prévia de Terraform em três colunas nas telas a partir de 1380 px; em telas menores, os painéis se reorganizam.
- **Blueprint Studio**: abre o laboratório de redes, com mapa, decisões de ida/retorno e inspeção de rotas.
- **Governança**: abre o workspace de policies IAM. Tags possuem uma etapa própria na configuração dos recursos.
- O cabeçalho mantém projeto, região e ambiente visíveis. O ambiente pode seguir a tag freeform `Environment` ou receber uma identificação manual; a identificação manual não modifica tags.
- Em **Aparência**, favorite temas e salve até oito presets de layout, tema, cor de destaque, fontes e densidade. Salvar novamente com o mesmo nome atualiza o preset.
- Perfis, favoritos e presets acompanham o backup JSON. Backups anteriores continuam compatíveis e usam Developer Studio como perfil inicial.
- A prévia distingue **Com rascunho** de **Somente plano**. Alterar a prévia não adiciona recursos ao plano; a inclusão ocorre ao finalizar o formulário.
- Identidade visual com símbolo de rede, favicon e assinatura de Fabio Ferreira. Os controles acompanham as famílias de temas, os modos claro/escuro e a cor de destaque selecionada, sem novas dependências de rede.
- Ícones Lucide incorporados no HTML; Compute e banco de dados têm símbolos próprios. Licença incluída no arquivo e em THIRD_PARTY_NOTICES.md.

## Executar localmente
Abra index.html no navegador. Os projetos ficam no armazenamento local do navegador; exporte backups JSON para preservá-los.

## Publicação
O workflow .github/workflows/pages.yml publica index.html no GitHub Pages a cada push na branch docker-compose.

Antes da primeira execução, selecione Settings > Pages > Build and deployment > Source > GitHub Actions.
Depois de habilitar Pages, execute Actions > Publish GitHub Pages > Run workflow.

## Limites
O HTML inclui correções de validação de backups, exportação de Terraform, rotas de Service Gateway, exportação limpa e layout móvel. Consulte VALIDATION.md para os testes e limites.
Revise o Terraform e execute terraform fmt, terraform validate e terraform plan antes de aplicar.

## Testes da interface
Com Playwright e Chromium disponíveis, execute `node tests/regression.cjs`, `node tests/languages.cjs`, `node tests/themes.cjs` e `node tests/workspace.cjs`.
Defina `CHROMIUM_PATH` quando o executável estiver fora de `/usr/bin/chromium`.
