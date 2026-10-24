# Temas e aparência

O catálogo atual tem **16 famílias e 32 variantes**. Os 20 temas anteriores foram recuperados como base e suas cores foram revisadas; seis famílias complementares foram adicionadas. São adaptações para o Studio, sem pretensão de reproduzir integralmente um aplicativo externo.

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
| Monokai | Carvão e verde-lima, com adaptação clara suave | Claro e escuro |
| Nord | Azuis frios e superfícies suaves | Claro e escuro |
| Solarized | Tons quentes no claro e petróleo no escuro | Claro e escuro |
| Tokyo Night | Azuis e violetas | Claro e escuro |
| Rose Pine | Rosé, creme e violeta | Claro e escuro |
| VS Code | Cinzas neutros e azul | Claro e escuro |

## Organização

As famílias aparecem em ordem alfabética, com Padrão primeiro, em uma grade de botões com amostras de cor. O campo de busca filtra as famílias pelo nome e informa quando não há resultados, sem mudar o tema ativo. Ao selecionar uma família, o modo atual é mantido e duas prévias permitem comparar claro e escuro. O estado selecionado é indicado visualmente e por `aria-pressed`; os botões funcionam com teclado e preservam o foco.

A busca e a grade de famílias ficam junto às prévias, enquanto tema atual, cor de destaque e leitura ficam no painel lateral curto. Cor de destaque e texto/espaçamento ficam em seções recolhíveis. O seletor nativo usa opções com fundo opaco e texto explícito em ambos os modos, área adequada para a seta e amostra sem interceptar cliques. Os botões de amostra permanecem montados ao trocar de cor para preservar o foco do teclado. O controle de cor personalizada também permanece montado durante os eventos de seleção. As nove opções de destaque continuam disponíveis, incluindo a cor padrão da família e uma cor personalizada. Os nomes públicos não usam a marca ChatGPT.

## Paletas e legibilidade

Cada família mantém sua combinação de fundos, painéis e destaque. Texto principal, secundário, cores semânticas e destaques são ajustados para contraste mínimo de 4,5:1 nas quatro superfícies principais. A cor do texto de botões é escolhida entre preto e branco pelo maior contraste. O ajuste pode modificar ligeiramente a cor de referência.

As variantes claras adicionadas são adaptações próprias do Studio; não são apresentadas como variantes oficiais dos projetos que inspiraram os nomes.

## Compatibilidade

As preferências são salvas no navegador. Backups mantêm recursos e Terraform. IDs antigos de Catppuccin, Dracula, Nord e Tokyo Night são migrados para a variante correspondente. Famílias removidas do catálogo ampliado migram para o modo neutro claro ou escuro. Nenhum tema personalizado de backup é executado ou importado.

A interface mantém seus oito idiomas. O gerador Terraform não foi alterado nesta revisão.

## Testes

`tests/themes.cjs` verifica os 32 temas, persistência, backups, migração, nove destaques por tema, alternância de modos, teclado e oito páginas em três larguras. Também cobre a busca, o menu de cor, o foco das amostras e mudanças sucessivas de cor personalizada. Execute com Playwright e Chromium instalados:

```sh
node tests/themes.cjs
```
