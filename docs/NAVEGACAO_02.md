# Navegação 02 — topo principal e lateral enxuta

Implementada sobre a versão 21d4164 e integrada ao Construtor aprovado.

- Logo e controles globais no cabeçalho fixo, em toda a largura da página.
- Sidebar de 208 px no desktop, começando abaixo do topo, com as oito rotas originais e backup local.
- Conteúdo à direita da lateral, sem mudança de formulários, Aparência 13, cores de destaque, idiomas ou regiões.
- No celular, logo/página e controles se acomodam em linhas; o drawer começa abaixo da altura real do cabeçalho.
- O `ResizeObserver` sincroniza a posição da sidebar e do dropdown de regiões com a altura do topo. O menu móvel atualiza `aria-expanded` e fecha por Escape, clique externo ou navegação.

## Fontes mantidas

`frontend/index.template.html` contém o logo movido para o topo. `frontend/styles/navigation-shell.css` aplica a composição aprovada. `frontend/js/navigation-shell.js` trata apenas geometria e acessibilidade, sem mutações no projeto, geração de código ou chamadas de implantação. Os módulos são incluídos pelo build em `index.html`.

## Validação

`npm run test:navigation`: 48 combinações de página/largura, oito rotas, controles dentro do viewport, alinhamento de cabeçalho/sidebar, topo fixo durante rolagem, menu móvel por clique/Escape/clique externo/rota, ARIA, logo para Construtor e integridade de estado/HCL/OCI CLI. Suítes gerais, de regiões, aparência e temas continuam disponíveis.

A prévia em HTML abre na aba Aparência; a build do projeto mantém o Construtor como entrada padrão. Sem scripts ou rótulos de demonstração na build.
