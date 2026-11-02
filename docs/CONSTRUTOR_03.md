# Construtor 03 — perguntas diretas

Implementado sobre a versão com topo principal e lateral enxuta.

- Formulário central em etapas, orientado por perguntas e explicações curtas.
- Um único seletor de serviço OCI (`#f-resourceType`), com os 23 tipos agrupados nas categorias existentes. A faixa de botões por categoria e seu handler foram removidos.
- Mantidos os valores técnicos do seletor, as funções de criação/edição, validação, referências entre recursos, backup e exportadores.
- Referência IAM opcional em um único disclosure nativo; não é incluída automaticamente na infraestrutura.
- Projeto e plano ficam em uma seção abaixo do formulário. Ao adicionar um recurso, a seção abre para mostrar o resultado local. Os campos de projeto continuam acessíveis.
- Mantidos scripts de inicialização, configurações avançadas, HCL Universal, todos os temas, cores de destaque e a Aparência 13.
- Os textos novos são localizados nas nove línguas disponíveis, com revisão específica para pt-PT.

## Fontes

`frontend/index.template.html`: composição real do formulário e da seção de projeto/plano.
`frontend/js/studio.js`: perguntas e remoção do seletor duplicado, mantendo os handlers nativos.
`frontend/js/builder-guide.js`: explicação da etapa e abertura do plano após inclusão; não executa OCI.
`frontend/js/locale-builder.js`: traduções dos textos e tooltips.
`frontend/styles/builder-guided.css`: composição do conceito aprovado, responsiva.

## Validação

`npm run test:builder` verifica que há um dropdown e nenhum botão de categoria, acesso a todos os 23 tipos, 78 etapas nativas, criação e edição local de VCN, geração HCL/OCI CLI, preservação do rascunho e 60 layouts por tema/largura/etapa. O teste de navegação aguarda a navegação assíncrona do link do logo antes de verificar a rota.

As suítes gerais de regressão, idiomas, interface, regiões, Aparência 13 e navegação continuam disponíveis. A prévia portátil é uma cópia da build mantida, sem scripts de demonstração ou projeto de exemplo embutido.

## Seis melhorias de usabilidade

- Serviço escolhido uma única vez; resumo e ação Trocar serviço nas etapas seguintes.
- Uma pergunta e instrução por etapa, sem caixa explicativa repetida.
- Campos essenciais primeiro; propriedades menos frequentes nos ajustes avançados.
- Configurar depois fecha grupos ou avança a inicialização sem apagar dados já preenchidos.
- Revisão separa Configurado, Opcional e Falta preencher, com atalhos aos campos. Variáveis de execução são diferenciadas dos erros que impedem adicionar ao plano.
- Confirmação ao adicionar/atualizar, com ações Adicionar outro recurso e Revisar e exportar. Nenhuma implantação é executada.

Validação: `npm test`, `npm run test:themes` e verificação do bundle. `tests/builder-six.cjs` cobre preservação de dados, bloqueio de configuração inválida, atalhos e confirmação.


## Compatibilidade da imagem na inicialização

O script Linux ou Windows mostra um alerta acessível junto aos controles quando a imagem não é reconhecida como compatível. Revisar imagem retorna à seleção. Corrigir a imagem ou confirmar a versão real da imagem customizada atualiza o aviso sem apagar opções do script. As validações nativas de inclusão e exportação continuam ativas. `tests/initialization-image-alert.cjs` verifica o alerta, a correção, a preservação dos ajustes e layouts claro/escuro.
