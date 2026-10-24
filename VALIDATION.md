# Validação antes da publicação — 23/10/2026

## Correções
- Backups são validados antes de migrar e substituir o projeto; a migração trabalha com cópia isolada.
- Tipos, limites e chaves perigosas são verificados; catálogo numérico não aceita HTML.
- Valores do catálogo também recebem escape no ponto de renderização.
- Importação inválida preserva o projeto ativo e o armazenamento anterior.
- Referências de gateway são verificadas por tipo e VCN.
- Route table oferece CIDR IPv4 ou Serviço Oracle e gera SERVICE_CIDR_BLOCK quando necessário.
- Copiar e baixar Terraform usam a mesma validação de recursos, tags e IAM.
- Universal sem policies é bloqueado; nenhuma policy com statements vazios é gerada.
- Exportar HTML usa o documento original, sem os dados dinâmicos do projeto.
- Layout ajustado para 320 px, com rolagem local para código e tabelas.

## Verificações executadas
- node --check: passou.
- Oito páginas abertas no Chromium sem erros de JavaScript nos fluxos válidos.
- 22 tipos nativos: formulário e geração de código sem exceções.
- 78 temas aplicados sem exceções; temas Oracle selecionáveis e persistentes; Ayu Mirage continua padrão.
- Dez testes de regressão passaram (tests/regression.cjs).
- 24 cenários de layout: oito páginas em 1440, 390 e 320 px, sem overflow global.
- Nenhum ID duplicado no DOM inspecionado.
- Simulação de rede padrão passou.
- Terraform 1.13.4: checksum do binário conferido com o arquivo oficial.
- Provider oracle/oci 9.11.0: instalado e assinatura verificada pelo Terraform.
- terraform validate: 32/32 configurações passaram (22 tipos nativos, rota Service Gateway, rede padrão, Windows, IP reservado, bootstrap Linux, defined tags, Universal e TCP/UDP/ICMP stateless).

## Reproduzir os testes de regressão
Na raiz do repositório, instale Playwright como dependência de desenvolvimento ou temporária e disponibilize Chromium.
Execute:

    node tests/regression.cjs

O executável padrão é /usr/bin/chromium. Para outro caminho:

    CHROMIUM_PATH=/caminho/chromium node tests/regression.cjs

Os resultados e os exemplos de Terraform são gravados em work/. O teste usa uma origem isolada, sem acessar a tenancy nem alterar a publicação.

## Limites
terraform validate verifica sintaxe, tipos e schema do provider. Não foi executado terraform plan ou apply contra uma tenancy. Disponibilidade regional, capacidade, compatibilidade efetiva de imagens, permissões IAM e conectividade real continuam dependendo da OCI.
A entrada HCL do recurso Universal permanece manual e exige revisão.

## Atualização: seletor de idiomas

Foram adicionados oito idiomas à interface, com preferência local e menu acessível. Os testes de navegação (64 cenários), layout (192 cenários), preservação de dados/código e teclado passaram. Os dez testes de regressão passaram novamente. Consulte I18N.md e tests/languages.cjs. Esta atualização não altera o gerador Terraform; a validação com provider registrada acima pertence à revisão das correções.

## Atualização: somente temas ChatGPT

O catálogo anterior foi substituído por ChatGPT Claro e ChatGPT Escuro, com nove opções de destaque. Passaram oito testes de aparência, 48 cenários de layout e 18 verificações de contraste. Passaram também os dez testes de regressão e os testes de idiomas. A migração preserva projeto, recursos e Terraform. Consulte THEMES.md e tests/chatgpt-themes.cjs. As validações históricas de 78 temas acima pertencem às versões anteriores.

## Atualização: famílias de temas e nomes neutros

Foram adicionadas Absolutely, Ayu, Catppuccin, Dracula, Everforest, GitHub, Gruvbox, Linear e Lobster, cada uma clara e escura. Com os modos básicos Claro e Escuro, são 20 temas. Passaram nove testes, 180 verificações de contraste e 480 cenários de layout, além dos dez testes de regressão e dos testes de idiomas. Consulte THEMES.md e tests/themes.cjs. A seção anterior sobre somente dois temas é histórica; o catálogo atual tem dez famílias.


## Atualização: catálogo de referência completo

O catálogo atual substitui as contagens históricas acima: 29 famílias e 45 variantes (43 variantes registradas e dois modos neutros). Veja THEMES.md para a versão de origem, licença, adaptações e limites.

Passaram dez testes de aparência, com 405 combinações de tema/destaque e 1.080 cenários de layout (45 variantes, oito páginas, três larguras), sem erros JavaScript. Seleção, persistência, migração dos IDs antigos, alternância entre famílias com um ou dois modos e teclado foram verificados. Corrigida a escolha do texto em botões coloridos para garantir contraste mínimo de 4,5:1.

Os dez testes de regressão passaram novamente. Os testes de idiomas passaram em 64 cenários de navegação e 192 cenários de layout, sem overflow. Os nomes das novas famílias também foram verificados nos oito idiomas. Projeto e Terraform permanecem iguais ao trocar temas e restaurar backups. Nenhuma nova validação contra a tenancy foi executada nesta alteração de aparência.


## Atualização: paletas revisadas e seleção organizada — 24/10/2026

O catálogo atual tem 14 famílias e 28 variantes: os 20 temas anteriores restaurados e revisados, mais Nord, Solarized, Tokyo Night e Rose Pine em claro e escuro. Esta seção substitui as contagens históricas acima. As variantes são adaptações para o Studio; consulte THEMES.md.

A seleção de famílias agora usa botões com amostras de cor e estado acessível, preservando o foco pelo teclado. Cor de destaque e opções de leitura ficam em seções recolhíveis. Texto principal e secundário, destaques e cores semânticas foram revisados para contraste mínimo de 4,5:1 nas superfícies principais.

Passaram dez testes de aparência, 252 combinações de tema/destaque e 672 cenários de layout (28 temas, oito páginas, três larguras), sem erros JavaScript. Passaram também os dez testes de regressão, 64 cenários de navegação e 192 cenários de layout dos idiomas. Verificação adicional confirmou seleção por teclado e interface das famílias nos oito idiomas.

Backups, persistência e migração dos IDs da versão ampliada foram verificados. O gerador Terraform permanece inalterado; não foi executada nova validação contra a tenancy nesta alteração de aparência.


## Atualização: menu de cores, busca e novas famílias

O catálogo atual tem 16 famílias e 32 variantes, substituindo as contagens históricas acima. Monokai e VS Code foram adicionados em claro e escuro; Dracula e GitHub permanecem disponíveis. As versões claras são adaptações do Studio, conforme THEMES.md.

Os menus nativos têm fundo opaco e texto explícito, com espaço para a seta e amostra que não intercepta cliques. Botões de cor deixam de ser recriados a cada seleção, preservando foco e navegação pelo teclado. O seletor de cor personalizada permanece montado durante mudanças sucessivas. O painel de ajustes ficou mais curto; busca e famílias em ordem alfabética ficam junto às prévias.

Passaram 12 testes de aparência, incluindo busca, estado sem resultados, opções opacas dos menus, teclado, identidade do controle de cor personalizada, migração e persistência. Foram verificadas 288 combinações de tema/destaque e 768 cenários de layout, sem erros JavaScript nem overflow global. Passaram os dez testes de regressão e os testes dos oito idiomas (64 navegações e 192 layouts), além da conferência visual e de foco das famílias nos oito idiomas.

O gerador Terraform e as validações de recursos permanecem inalterados. Não foi executado plan ou apply contra uma tenancy nesta alteração de aparência.


## Atualização: Oracle Redwood, destaques e leitura

O catálogo atual tem 19 famílias e 38 variantes: acrescentados Oracle Redwood, One e Material nos modos claro e escuro. Oracle Redwood é uma interpretação para o Studio inspirada no visual da Oracle; não é um tema oficial ou certificado pela Oracle. Foram adicionadas oito cores de destaque, totalizando 17 opções com Padrão e Personalizado. Consulte THEMES.md.

Texto/espaçamento ganhou painel próprio, prévia e restauração independente. O tamanho de código também foi conferido nas saídas Terraform e IAM. Há texto de 90% a 125%, três densidades, três alturas de linha, dois espaçamentos de letras e código de 12 a 18 px, além das fontes existentes. As preferências persistem e são validadas ao importar backups; versões antigas recebem os padrões dos campos novos.

Passaram 14 testes de aparência: 646 combinações de tema/destaque, 912 cenários de layout dos temas e 128 cenários adicionais com leitura ampliada, espaçamento amplo e código grande em desktop/tablet/celular. Não houve erros JavaScript nem overflow global. Foram verificados restauração sem alterar o projeto, persistência, normalização de preferências inválidas, migração dos temas Oracle antigos e controles nos oito idiomas.

Os dez testes de regressão e os testes de idiomas (64 navegações e 192 layouts) passaram novamente. O gerador Terraform e a geração de policies permanecem inalterados; a importação de backups apenas passou a normalizar as novas preferências de leitura. Não houve plan/apply contra uma tenancy nesta alteração visual.
