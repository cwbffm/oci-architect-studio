# Temas e aparência

O catálogo atual tem **21 famílias e 40 variantes**: 19 famílias clássicas (38 variantes) e Titanium Orange e Nexus Command como temas especiais escuros.

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

A tela Estúdio de atmosferas reúne um fundo panorâmico, uma prévia compacta do
construtor com os dados do projeto e uma barra inferior de personalização. O menu
lateral fica compacto, com ícones e rótulos, somente nesta tela.

O catálogo horizontal tem busca, filtro por categoria e navegação por setas. Em
Todos os temas, Nexus Command, Titanium Orange e quatro clássicos aparecem em
destaque. Os modos disponíveis, as 17 cores de destaque e a cor personalizada
ficam acessíveis na barra. Texto e espaçamento abre os controles de leitura.

A intensidade ajusta as imagens dos temas especiais. Interface/Fundo permite
examinar a cena com ou sem o formulário. O fundo portuário do estúdio é exclusivo
da prévia de Nexus; o fundo de conexões do tema no restante do aplicativo é mantido.

As alterações são temporárias até clicar em Aplicar tema. Sair da tela descarta
as escolhas pendentes; a aplicação salva somente preferências de aparência.
Recursos, tags, redes e código gerado são preservados. A prévia é uma representação
estática e resumida do construtor, sem scripts ou ações de provisionamento.

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

## Tema especial atual

Titanium Orange é um dos dois temas especiais. Mantém o construtor, a navegação e os
painéis do Studio, com superfícies pretas, detalhes laranja e um fundo original
de montanhas e globo iluminado. O WebP é incorporado ao HTML e funciona offline.
A preferência de transparência reduzida desativa as imagens decorativas.

Os 38 temas clássicos continuam disponíveis. Preferências dos 27 temas especiais
removidos migram para Titanium Orange; cores desses temas são descartadas sem
alterar os recursos do projeto ou os geradores Terraform e OCI CLI.

O destaque especial é salvo separadamente do destaque clássico. Restaurar padrão
recupera a cor laranja original. A suíte `npm run test:themes` cobre ambos os catálogos.

## Nexus Command

Tema escuro adicional com mapa de conexões globais, instalação industrial,
superfícies de aço azul escuro e molduras técnicas. Ciano destaca controles e
laranja identifica ações principais. Preserva o menu, o construtor e os painéis
do projeto; a imagem decorativa não representa dados operacionais.
Seu fundo WebP está incorporado ao HTML para uso offline. As cores personalizadas
são salvas independentemente de Titanium Orange e dos temas clássicos.

O acabamento Nexus usa molduras SVG incorporadas com cantos chanfrados, trilhos
metálicos e luzes ciano, sem bloquear os controles. Menu, abas e etapas ativas
usam laranja; os painéis mantêm o construtor e a navegação existentes.

Titanium Orange também usa molduras chanfradas e relevos metálicos, com trilhos
e pontos de fixação em cobre/âmbar, controles ativos laranja e identificação
TITANIUM ORANGE na lateral. O fundo de montanhas e globo é preservado.

## Estúdio de atmosferas

A tela de Aparência apresenta uma cena panorâmica, uma prévia estática do
construtor real e uma barra inferior com categoria, busca, temas, modos, cores
sempre visíveis e acesso aos ajustes de leitura. O controle de intensidade vale
para os fundos especiais. Interface/Fundo alterna o foco da visualização.

As mudanças são experimentadas em uma cópia temporária. Aplicar tema salva
somente a aparência; sair da tela descarta alterações pendentes. Recursos,
tags e código gerado são preservados. A prévia não executa scripts e não
aceita operações de edição ou provisionamento.
