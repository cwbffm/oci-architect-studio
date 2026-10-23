# Temas

O Studio oferece 29 famílias e 45 variantes: os modos neutros Claro/Escuro e 43 variantes de 28 famílias do catálogo de referência abaixo. Os nomes públicos não incluem a marca ChatGPT.

## Famílias e modos

| Família | Variantes disponíveis |
| --- | --- |
| Padrão | Claro, Escuro |
| Absolutely | Claro, Escuro |
| Ayu | Escuro |
| Catppuccin | Latte (claro), Mocha (escuro) |
| Codex | Claro, Escuro |
| Dracula | Escuro |
| Everforest | Claro, Escuro |
| GitHub | Claro, Escuro |
| Gruvbox | Claro, Escuro |
| Linear | Claro, Escuro |
| Lobster | Escuro |
| Material | Escuro |
| Matrix | Escuro |
| Monokai | Escuro |
| Night Owl | Escuro |
| Nord | Escuro |
| Notion | Claro, Escuro |
| Oscurange | Escuro |
| One | Claro, Escuro |
| Proof | Claro |
| Raycast | Claro, Escuro |
| Rose Pine | Claro, Escuro |
| Sentry | Escuro |
| Solarized | Claro, Escuro |
| Tokyo Night | Escuro |
| Temple | Escuro |
| Vercel | Claro, Escuro |
| VS Code Plus | Claro, Escuro |
| Xcode | Claro, Escuro |

Ao selecionar uma família, o modo atual é mantido quando existe uma variante correspondente. Caso contrário, a variante disponível é aplicada. O botão da barra superior alterna claro/escuro dentro da família; se o modo oposto não existir, aplica o modo neutro correspondente.

As preferências ficam no navegador e nos backups. IDs antigos de Catppuccin são migrados para Mocha/Latte; antigas variantes claras de Ayu, Dracula e Lobster são migradas para a variante escura disponível. Recursos, nomes de projetos e Terraform não são alterados.

Há nove opções de destaque: Padrão, Azul, Verde, Amarelo, Rosa, Laranja, Roxo, Branco e Personalizado. Padrão usa a cor própria da paleta. Texto, cores semânticas e destaques são ajustados quando necessário para contraste mínimo de 4,5:1 nas superfícies principais. A interface continua disponível nos oito idiomas existentes.

## Proveniência e limites

Dados adaptados do projeto MIT [smallyunet/codex-palette-vscode](https://github.com/smallyunet/codex-palette-vscode/tree/fc6741785b1a21c584ee0309a3cc9faa896b6127), commit `fc6741785b1a21c584ee0309a3cc9faa896b6127`, arquivos `src/palettes.mjs` e `src/codex-source-colors.mjs`.

A [proveniência registrada](https://github.com/smallyunet/codex-palette-vscode/blob/fc6741785b1a21c584ee0309a3cc9faa896b6127/SOURCE_PROVENANCE.md) identifica ChatGPT macOS 26.730.61309, build 6223, capturado em 2026-08-05. São paletas do Workbench: a lista pode variar conforme a versão do aplicativo e não garante corresponder a todas as instalações atuais. Transparência e composição da interface original não são reproduzidas literalmente. As cores foram adaptadas às superfícies do Studio e à legibilidade.

Licença e atribuição em [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md), também incorporadas ao HTML distribuído.

## Validação

`tests/themes.cjs` verifica o catálogo completo, seleção e persistência de todas as variantes, migração, nove destaques por tema, teclado, alternância de modos e oito páginas em três larguras. Execute com Playwright e Chromium instalados:

```sh
node tests/themes.cjs
```
