# Temas e aparência

A tela de Aparência oferece dez famílias, cada uma com modo claro e escuro (20 temas):
Padrão, Absolutely, Ayu, Catppuccin, Dracula, Everforest, GitHub, Gruvbox, Linear e Lobster.

Os nomes públicos dos dois temas básicos são Claro e Escuro. Os nomes, títulos e prévias não usam a marca anterior. As paletas das famílias são adaptações para a interface a partir das referências fornecidas.

## Uso
Escolha a família no seletor Tema e depois o modo na prévia. O botão da barra superior alterna claro/escuro dentro da família ativa.
Padrão usa o destaque nativo da paleta selecionada; as cores nomeadas e a cor personalizada continuam disponíveis.

## Compatibilidade
Preferências da versão anterior permanecem válidas, inclusive a cor escolhida. Backups aceitam os vinte IDs atuais. Alguns IDs antigos conhecidos recebem aliases para as famílias correspondentes; outros modos antigos migram para Claro ou Escuro. Dados do projeto e Terraform são preservados. A importação de paletas arbitrárias continua removida.

## Validação antes da publicação
- Nove testes de temas passaram.
- 20 temas selecionados, restaurados e persistidos.
- 180 combinações de tema/destaque verificadas.
- 480 cenários de layout sem overflow: 20 temas, oito páginas e três larguras.
- Contraste mínimo: texto 7,06:1; botões 5,18:1; destaque contra superfícies 4,51:1.
- Dez testes de regressão passaram.
- Idiomas: 64 cenários de navegação e 192 de layout passaram.
- Os geradores Terraform e IAM não foram alterados.

Com Playwright e Chromium:

    node tests/themes.cjs

Use CHROMIUM_PATH para outro executável. Resultados e captura são gravados em work/.
