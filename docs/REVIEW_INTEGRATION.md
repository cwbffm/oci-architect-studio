# Revisão para integração HTML + Python

## Escopo

Revisão da aplicação existente no commit `c5a7728`, antes de acrescentar o backend Python. Inclui leitura dos fluxos de importação/exportação, geração Terraform e OCI CLI, aparência, idiomas, publicação estática e execução dos testes existentes em Chromium. Os resultados são de análise estática e testes locais; nenhuma infraestrutura OCI foi criada.

## Base existente verificada

| Comando | Resultado antes das alterações |
|---|---|
| `node tests/regression.cjs` | 10 verificações aprovadas; nenhum erro JavaScript |
| `node tests/oci-cli.cjs` | 22 tipos nativos e 3 cenários adicionais; 8 idiomas, 24 layouts; nenhum erro JavaScript |
| `node tests/languages.cjs` | 64 combinações de navegação e 192 de layout; nenhum overflow ou erro JavaScript |
| `node tests/themes.cjs` | 14 verificações aprovadas, 38 variantes, 646 combinações de contraste e 912 layouts; nenhum erro JavaScript |

Os testes de regressão cobrem restauração e rejeição de backups, preservação do projeto quando a importação falha, escaping no catálogo, bloqueio de exportações inválidas, rotas por Service Gateway e exportação de HTML limpo. Os testes OCI CLI verificam geração e comportamento da interface; eles não executam os scripts contra uma tenancy.

A sintaxe do JavaScript original também passou em `node --check`. A análise do HTML original encontrou 182 IDs, sem duplicações, sem scripts externos e sem atributos de eventos inline.

## Achados relevantes para a mudança de estrutura

### Manter o HTML exportado independente

O recurso `downloadHtml()` exporta uma cópia do documento inicial e espera que CSS e JavaScript estejam presentes no próprio arquivo. Substituir simplesmente os blocos por referências externas quebraria esse uso. Os testes também carregam o documento inteiro por uma rota de teste, e o workflow Pages publica o HTML gerado.

A abordagem adotada separa os arquivos **de manutenção** em `frontend/` e usa um build determinístico para gerar novamente `index.html` com os recursos incorporados. Isso permite organizar o código sem retirar a exportação de um único HTML. O arquivo gerado não deve ser editado manualmente.

### A integração acrescenta uma página

A interface anterior possuía oito destinos de navegação. A página de integração acrescenta um nono. As verificações de quantidade de links e os mapas de navegação precisam refletir essa mudança; isso não representa perda das oito páginas anteriores.

## Limite de confiança do backend

Os controles existentes no navegador servem para ajudar a criar um arquivo revisável. Eles não constituem autorização para executar código em um servidor com acesso à OCI.

- **HCL Universal:** o gerador permite um corpo HCL manual. Esse recurso deve continuar disponível para download, mas não pode ser tratado como entrada confiável da execução remota. Terraform pode executar código durante a inicialização, o plano e a aplicação.
- **Compartment e região:** o backend deve validar os destinos contra sua configuração autorizada. Receber um OCID da interface não demonstra permissão para operar nesse destino.
- **Endpoints KMS:** o gerador aceita um endpoint de gerenciamento informado pelo usuário. Chamadas no servidor precisam restringir destinos e não devem aceitar URLs arbitrárias como serviço confiável.
- **IAM e bootstrap:** statements manuais e scripts cloud-init/Windows podem alterar acesso e comportamento dos recursos. Seu uso remoto deve ser limitado e autorizado explicitamente.
- **Credenciais:** tokens e chaves não devem entrar no backup do projeto, no HTML exportado nem no código publicado. A autenticação OCI do serviço deve permanecer no servidor.
- **Aplicação:** deve estar vinculada ao plano revisado e à versão da stack, com controle de concorrência e tratamento de falhas parciais. Um botão da interface não substitui autorização no servidor.

Esses pontos precisam de verificações no backend e de configuração IAM apropriada. Uma interface que mostra “conectado” não comprova capacidade, custo, conectividade ou autorização para criar todos os tipos de recurso.

## Pontos preexistentes que exigem evolução própria

1. **Versões Terraform/provider:** o gerador principal especifica Terraform `>= 1.5.0`, mas não uma faixa de versão do provider OCI. A atualização deve ser feita com validação de compatibilidade, sem copiar automaticamente os baselines dos PDFs.
2. **Security lists das subnets:** o gerador principal não associa explicitamente security lists. Regras do NSG não revogam permissões da security list padrão. O laboratório de rede possui um tratamento distinto e já gera listas explícitas.
3. **Serviços completos:** Load Balancer, OKE e File Storage deixam componentes operacionais adicionais para o usuário, como listeners/backends, node pools e mount targets/exports. Os avisos existentes devem ser preservados.
4. **OCI CLI e falha parcial:** os scripts registram identificadores, mas não gerenciam estado como Terraform. Reexecutar o script inteiro após uma falha pode duplicar recursos.
5. **Backups distintos:** backup JSON do desenho, estado Terraform e backup dos dados da infraestrutura não são equivalentes.

Esses itens foram identificados na revisão; sua presença nesta lista não significa que foram implementados ou validados em produção nesta entrega.

## O que os testes locais não demonstram

- Políticas IAM efetivas, disponibilidade regional, quotas e capacidade da tenancy.
- Configuração do provedor de identidade, certificados HTTPS e autorização dos usuários reais.
- Criação, atualização, exclusão ou recuperação de recursos na OCI.
- Adequação de qualquer arquitetura gerada a um SLA ou orçamento de produção.

Antes da operação real, configurar a identidade do backend, os destinos permitidos e as permissões do Resource Manager; validar primeiro uma stack de teste em um compartment isolado. Custos e recursos já criados continuam existindo quando uma aplicação falha parcialmente.
