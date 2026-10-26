# Temas e aparência

O catálogo atual tem **19 famílias e 38 variantes**. Os 20 temas anteriores foram recuperados como base e suas cores foram revisadas; nove famílias complementares foram adicionadas. São adaptações para o Studio, sem pretensão de reproduzir integralmente um aplicativo externo.

| Família | Característica | Modos |
| --- | --- | --- |
| Padrão | Cinzas neutros | Claro e escuro |
| Absolutely | Tons quentes e violeta suave | Claro e escuro |
| Ayu | Azul acinzentado com âmbar | Claro e escuro |
| Catppuccin | Tons pastel e lilás | Claro e escuro |
| Dracula | Violeta com contraste marcado | Claro e escuro |
| Everforest | Verdes e tons naturais | Claro e escuro |
| GitHub | Superfícies neutras e destaque azul | Claro e escuro |
| Gruvbox | Tons terrosos e dourados | Claro e escuro |
| Linear | Cinzas frios e índigo | Claro e escuro |
| Lobster | Tons rosados e coral | Claro e escuro |
| Material | Superfícies azuladas e verde-água | Claro e escuro |
| Monokai | Carvão e verde-lima, com adaptação clara suave | Claro e escuro |
| Nord | Azuis frios e superfícies suaves | Claro e escuro |
| Solarized | Tons quentes no claro e petróleo no escuro | Claro e escuro |
| Tokyo Night | Azuis e violetas | Claro e escuro |
| One | Cinzas frios e destaque azul | Claro e escuro |
| Oracle Redwood | Neutros quentes e vermelho inspirado na Oracle | Claro e escuro |
| Rose Pine | Rosé, creme e violeta | Claro e escuro |
| VS Code | Cinzas neutros e azul | Claro e escuro |

## Organização

As famílias aparecem em ordem alfabética, com Padrão primeiro, em uma grade de botões com amostras de cor. O campo de busca filtra as famílias pelo nome e informa quando não há resultados, sem mudar o tema ativo. Ao selecionar uma família, o modo atual é mantido e duas prévias permitem comparar claro e escuro. Ambas acompanham o destaque selecionado, incluindo cores personalizadas e o contraste adequado ao modo. O estado selecionado é indicado visualmente e por `aria-pressed`; os botões funcionam com teclado e preservam o foco.

A busca e a grade de famílias ficam junto às prévias, enquanto tema atual e cor de destaque ficam no painel lateral curto. Texto/espaçamento tem um painel próprio junto às prévias, com controles em colunas e amostra de leitura. As cores de destaque ficam sempre visíveis, sem controle para recolher. Texto/espaçamento permanece em uma seção recolhível. A seleção de destaque usa somente amostras clicáveis, com nome acessível, dica de nome e indicação da cor ativa. A amostra multicolorida abre o campo de cor personalizada. Os botões de amostra permanecem montados ao trocar de cor para preservar o foco do teclado. O controle de cor personalizada também permanece montado durante os eventos de seleção. As 17 opções de destaque estão disponíveis, incluindo a cor padrão da família e uma cor personalizada. Os nomes públicos não usam a marca ChatGPT.

## Paletas e legibilidade

Cada família mantém sua combinação de fundos, painéis e destaque. Texto principal, secundário, cores semânticas e destaques são ajustados para contraste mínimo de 4,5:1 nas quatro superfícies principais. A cor do texto de botões é escolhida entre preto e branco pelo maior contraste. O ajuste pode modificar ligeiramente a cor de referência.

As variantes claras adicionadas são adaptações próprias do Studio; não são apresentadas como variantes oficiais dos projetos que inspiraram os nomes.

## Compatibilidade

As preferências são salvas no navegador. Backups mantêm recursos e Terraform. IDs antigos de Catppuccin, Dracula, Nord e Tokyo Night são migrados para a variante correspondente. Famílias removidas do catálogo ampliado migram para o modo neutro claro ou escuro. Nenhum tema personalizado de backup é executado ou importado.

A interface mantém seus oito idiomas. O gerador Terraform não foi alterado nesta revisão.

## Testes

`tests/themes.cjs` verifica os 38 temas, persistência, backups, migração, 17 destaques por tema, alternância de modos, teclado e oito páginas em três larguras. Também cobre a busca, a seleção por amostras, o foco das amostras e mudanças sucessivas de cor personalizada. A instalação com `npm ci` e a configuração do Chromium estão em [VALIDATION.md](VALIDATION.md). Para executar somente temas:

```sh
node tests/themes.cjs
```

## Mais cores e leitura

Além das opções anteriores, há Vermelho Oracle, Ciano, Turquesa, Lima, Âmbar, Índigo, Cobre e Ardósia. O destaque padrão continua sendo próprio da família e existe uma opção de cor personalizada. As cores são adaptadas por modo e ajustadas para contraste nas superfícies principais.

O tema **Oracle Redwood** é uma interpretação para o Studio inspirada nas cores da Oracle: vermelho, neutros quentes e versões clara e escura. Não é um tema oficial distribuído ou certificado pela Oracle.

Os ajustes de leitura são independentes do projeto:

- Texto: 90%, 100%, 112% ou 125%.
- Fonte da interface e fonte de código, usando as fontes já disponíveis.
- Densidade: compacta, confortável ou espaçosa.
- Altura de linha: 1,4, 1,6 ou 1,85.
- Letras: espaçamento normal ou amplo.
- Código: 12, 14, 16 ou 18 px.

A prévia acompanha os ajustes. Restaurar leitura redefine somente as preferências de leitura. As escolhas persistem no navegador e nos backups; backups antigos recebem os padrões dos campos novos e valores fora das opções são normalizados. Valores numéricos não finitos continuam sendo rejeitados pela validação estrutural existente.
