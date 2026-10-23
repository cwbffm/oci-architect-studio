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
