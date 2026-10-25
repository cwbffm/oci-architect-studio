# Revisão dos geradores Terraform e OCI CLI

## Escopo

Revisão realizada antes da integração Python, sobre a versão `c5a7728` do Studio. Foram examinados os geradores, validações de recursos, importação de backups e testes existentes. Os resultados abaixo distinguem a exportação de arquivos para revisão pelo usuário da execução de infraestrutura com a identidade do backend.

Nenhum recurso foi criado, alterado ou excluído na OCI nesta revisão. Os testes não demonstram permissões reais, capacidade regional nem funcionamento de serviços em uma tenancy.

## Verificações repetidas

| Verificação | Resultado observado |
| --- | --- |
| `node tests/oci-cli.cjs` | 22 tipos nativos e três casos extras; formato, persistência, cópia/download e bloqueios passaram |
| Idiomas e layout do exportador OCI CLI | Oito idiomas e 24 layouts, sem exceções JavaScript |
| `tests/validate-oci-cli.py`, com o diretório de fixtures apontado para o ambiente de validação existente | 25 scripts Bash, 37 chamadas simuladas e 30 caminhos de comandos passaram |
| Processamento pela OCI CLI oficial 3.95.1 | Parâmetros aceitos com cliente substituído e sockets bloqueados |
| Segurança dos scripts nos casos testados | Payloads JSON privados, limpeza temporária, validação de entradas ausentes e preservação literal de tentativas de expansão shell passaram |

O teste Python foi executado sem modificar sua lógica: o caminho das fixtures foi redirecionado em memória para `/workspace/work`, onde já estavam o ambiente OCI CLI e os schemas oficiais. Não houve uso de credenciais nem conexões a endpoints OCI.

Os testes de CLI verificam sintaxe, argumentos e geração. Não substituem `terraform validate`, um plano real ou a execução de serviços. A evidência histórica de 32 configurações Terraform validadas permanece em `VALIDATION.md`; essa bateria não foi repetida por esta revisão dos geradores.

## Controles necessários para a execução no backend

### 1. Gerar configuração no servidor a partir de dados estruturados

O gerador de exportação suporta um recurso Universal que insere o corpo HCL fornecido pelo usuário. Esse recurso é adequado apenas ao fluxo de exportação manual com revisão. Um backend não deve aceitar HCL, scripts ou arquivos Terraform arbitrários do navegador e executá-los com sua identidade.

Na integração, usar schema estrito e lista explícita de recursos suportados, produzir Terraform JSON no servidor e rejeitar campos e tipos desconhecidos. A validação do navegador continua útil para a experiência de uso, mas não substitui a validação do servidor.

### 2. Restringir identidade, compartments e referências

O gerador original permite `values.compartmentId` por recurso, além do compartment global. Também aceita OCIDs de recursos existentes como dependências. Portanto, validar apenas a seleção global não limita todos os alvos.

O backend deve autorizar todos os compartments de destino e definir quais referências externas são permitidas. Compartilhamento legítimo de rede ou chaves exige permissão explícita; não deve ser inferido a partir do acesso à interface. As políticas IAM da identidade executora são outra camada necessária.

### 3. Manter IAM e alterações privilegiadas fora do fluxo inicial

As opções `includeIam` e `createTagSchema` geram policies, namespaces e chaves de tags. O backend deve rejeitá-las quando não fizerem parte do conjunto autorizado. Não basta ocultar seus controles na interface.

Bootstrap de máquinas e outras opções que executam ações no sistema operacional também precisam de cobertura e autorização próprias. A existência dessas opções na exportação local não implica suporte automático à execução integrada.

### 4. Bloquear endpoints arbitrários

O recurso KMS key do gerador original aceita um `management_endpoint` informado pelo usuário. Esse valor controla um destino de rede. Ao integrar a execução, excluir essa opção inicialmente ou aplicar validação rigorosa de esquema, host, região e domínio OCI; nunca aceitar URL arbitrária com a identidade do servidor.

### 5. Preservar estado e associação da arquitetura

Persistir a associação entre projeto, proprietário, ambiente e stack. Reutilizar a stack nas atualizações e impedir aplicações concorrentes sobre a mesma stack. Uma nova stack por clique pode gerar recursos duplicados e vários estados disputando a mesma infraestrutura.

O fluxo de aplicação deve estar associado ao plano revisado, às entradas e à configuração correspondentes. Não aplicar automaticamente alterações após gerar o plano. Falhas de rede após submissão exigem consulta do job existente, sem repetição cega.

### 6. Validar versões e resultados

O Terraform original não fixa uma faixa de versão do provider OCI. Definir uma faixa testada para o gerador integrado e uma versão Terraform suportada pelo Resource Manager. Não copiar baselines de documentos sem conferir compatibilidade.

O gerador Terraform original não declara outputs. O backend pode acrescentar outputs seguros dos recursos suportados. Logs, variáveis e mensagens de erro precisam evitar exposição de segredos. A interface deve apresentar resultados que a implementação efetivamente coleta.

## Limitações da exportação local que permanecem separadas

| Área | Situação no gerador original | Implicação |
| --- | --- | --- |
| Subnet | Não declara explicitamente security lists no gerador principal | Herda listas padrão; NSGs não revogam permissões concedidas por essas listas |
| Load Balancer | Cria o balanceador e avisa sobre componentes adicionais | Backend set, backends, listener e TLS ainda exigem configuração |
| OKE | Cria control plane privado e avisa sobre node pools | Não entrega workers nem garante conectividade ao endpoint |
| Block Volume | Cria o volume | Attachment, identificação do dispositivo e montagem são etapas adicionais |
| File Storage | Cria filesystem e avisa sobre componentes adicionais | Mount target, export e rede NFS são etapas adicionais |
| Notifications | Cria tópico | Assinaturas e confirmação não são criadas pelo fluxo atual |
| OCI CLI | Script imperativo sem state | Reexecução integral após falha parcial pode duplicar recursos |
| OCI CLI: OKE e log groups | Comandos não capturam identificadores para variáveis do script | Não prometer um inventário completo de OCIDs a partir desses registros |
| Universal | Aceita HCL livre com revisão manual | Permanece export-only; não é entrada de execução integrada |
| Windows BYOL em OCI CLI | Bloqueado explicitamente | Usar a exportação Terraform conforme documentação existente |

O laboratório de rede possui tratamento próprio de security lists; a limitação da subnet acima se refere ao gerador principal. Nenhuma das duas opções deve ser descrita como isolamento comprovado sem revisar a composição efetiva das regras, rotas e serviços existentes.

## Conclusão técnica

Os fluxos de exportação testados preservam dados, escapam strings HCL nos tipos nativos e serializam payloads CLI sem expansão shell involuntária nos casos exercitados. A prioridade da integração é estabelecer uma nova validação no servidor e uma cobertura inicial explícita. O suporte amplo da exportação local não deve ampliar implicitamente os privilégios nem a superfície de execução do backend.
