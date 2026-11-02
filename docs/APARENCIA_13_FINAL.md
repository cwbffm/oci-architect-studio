# Aparência 13 — versão final local

Aplicada à versão clássica baseada em fcb787f, mantendo as melhorias de idioma/região. Experimentos anteriores não são incluídos na build.

## Interface aprovada

- Lista dupla de famílias de temas, com busca e rolagem quando necessária.
- Modos claro/escuro compactos, com indicação da escolha atual.
- Painel **Texto e espaçamento** fixo, sem `<details>` ou controle de recolher.
- Três abas nativas: **Texto**, **Código** e **Espaçamento**.
- Cores de destaque, personalização e restauração mantidas no mesmo painel e sem novas regras de estilo.
- Preferências existentes de tema e leitura continuam persistidas. O tema claro permanece como padrão para novos projetos.
- Mantidos BR/pt-BR, PT/pt-PT, demais idiomas, regiões OCI com países, filtros/favoritos e aviso de troca.

Não há rótulos de proposta ou scripts de protótipo na build. Os módulos mantidos são `frontend/styles/appearance-13.css` e `frontend/js/appearance-reading.js`; o template contém as abas e seus painéis reais. IDs dos campos e handlers originais foram preservados. As abas suportam clique, setas esquerda/direita e Home/End, usando `aria-selected`, tabulação única e `role=tabpanel`.

## Verificação

`npm run test:appearance`: painel fixo, três abas, seleção de tema, teclado, persistência/reset, 30 combinações de largura/tema/aba e integridade de recursos/HCL/OCI CLI. `npm run test:regions-locales`: 85 regiões, países/filtros/favoritos, troca não destrutiva e tradução/formatação. Suíte clássica de regressão/CLI/idiomas/interface também executada. `npm run test:themes` valida todas as variantes, contraste, migrações e layouts.

Build: `python3 tools/build_frontend.py --check`. A prévia portátil difere do `index.html` apenas por abrir a aba Aparência automaticamente. A publicação utiliza a branch `docker-compose` e o workflow GitHub Pages.
