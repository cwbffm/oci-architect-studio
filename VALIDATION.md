# Validação antes da publicação — 23/10/2026

## Personalização v8
- Verificação de sintaxe JavaScript: passou.
- `tests/regression.cjs`: 10 testes passaram, incluindo backup, escape de conteúdo, validação de exportação e HTML limpo.
- `tests/workspace.cjs`: 9 testes passaram, incluindo prévia sem inclusão no plano, navegação e persistência de perfis, favoritos, restauração de presets, ambiente independente das tags e migração de backups antigos.
- Os 22 tipos nativos renderizam a prévia correspondente e a etapa de tags sem exceções.
- `tests/languages.cjs`: 64 combinações de navegação e 192 cenários de layout passaram, com oito idiomas e sem overflow global.
- A suíte de workspace também cobre oito páginas em 320, 390, 1024, 1440 e 1920 px, com paletas clara e escura (80 cenários).
- Capturas do construtor, redes, aparência e celular inspecionadas em Chromium Headless Shell 151.0.7922.34.
- Nenhum ID duplicado no HTML. Favoritos e presets recebem validação na restauração; nomes inseridos pelo usuário são escapados e preservados na localização.
- Esta revisão trata da interface. Não executa `terraform apply` nem valida recursos em uma tenancy OCI.
- Integração sobre a atualização mais recente das famílias de temas: os 20 temas, os nove destaques e a migração foram preservados. Os nove testes de tests/themes.cjs passaram também após a integração, com 480 layouts e 180 combinações de contraste.

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
