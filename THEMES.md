# Aparência ChatGPT

A aplicação oferece somente ChatGPT Escuro e ChatGPT Claro, adaptados às referências visuais fornecidas. O modo inicial é escuro.

## Cores de destaque
Padrão, Azul, Verde, Amarelo, Rosa, Laranja, Roxo, Branco e Personalizado.
O personalizado usa um seletor de cor. Os tons aplicados ao texto se adaptam ao modo para manter contraste; a amostra mostra a cor escolhida. A cor acompanha a troca entre os dois modos.

## Preferências e migração
- Modos e destaques são salvos com o projeto no navegador.
- Preferências de temas antigos migram para claro ou escuro, preservando projeto, recursos e código.
- Cores antigas são redefinidas na migração para evitar trazer o destaque de uma paleta removida.
- Backups antigos continuam aceitos; temas personalizados antigos não são reinseridos no catálogo.
- A busca, os filtros, a galeria antiga e a importação/exportação de temas foram removidos.
- As opções de fontes, tamanho do texto e espaçamento continuam disponíveis.
- A interface permanece disponível nos oito idiomas.

## Testes antes da publicação
- Oito testes de aparência passaram: catálogo, migração, persistência, destaques, contraste, alternância, layout e teclado.
- 48 cenários de layout (oito páginas, dois modos, três larguras) sem overflow.
- 18 combinações de destaque/modo verificadas.
- Contraste mínimo medido: texto 14,77:1; texto de botão e destaque contra fundo 5,18:1.
- Dez testes de regressão passaram.
- Idiomas: 64 cenários de navegação e 192 de layout passaram; preservação de dados e comandos mantida.
- Geradores Terraform e IAM não foram alterados.

Com Playwright e Chromium instalados:

    node tests/chatgpt-themes.cjs

Use CHROMIUM_PATH para selecionar outro executável. Resultados e captura são gravados em work/.
