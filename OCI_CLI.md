# Exportação Terraform e OCI CLI

Na tela **Código e exportação**, escolha **Terraform** ou **OCI CLI** em Formato de exportação. O mesmo plano alimenta os dois geradores; trocar o formato não altera recursos, tags, IAM ou região. A preferência acompanha o backup e fica salva no navegador. Backups anteriores continuam abrindo em Terraform.

| Formato | Arquivo | Execução |
| --- | --- | --- |
| Terraform | `main.tf` | Configuração declarativa, state e revisão com `terraform plan` |
| OCI CLI | `deploy-oci.sh` | Comandos nativos `oci`, com execução direta no terminal |

Copiar e baixar usam o formato selecionado e bloqueiam recursos inválidos. O navegador gera texto; não se autentica nem executa comandos na OCI.

## OCI CLI

O script exige Bash, Python 3 e OCI CLI autenticada. Pode ser executado no OCI Cloud Shell. Os parâmetros foram conferidos com a CLI oficial **3.95.1**.

1. Revise o script e as variáveis pendentes exibidas na aplicação.
2. Autentique a OCI CLI no terminal ou use Cloud Shell. Perfil/autenticação seguem a configuração normal da CLI.
3. Exporte as variáveis solicitadas. Exemplo de plano simples sem OCID de compartimento preenchido:

```sh
export COMPARTMENT_OCID='ocid1.compartment.oc1...'
bash deploy-oci.sh
```

A região selecionada no Studio é fixada no script. OCIDs já preenchidos no formulário são preservados; campos em branco tornam-se variáveis obrigatórias. Quando houver criação de IAM Policy ou de namespaces/chaves de tags, preencha também `IAM_HOME_REGION` com a região de origem da tenancy. Availability domain, imagem, versão Kubernetes, chave pública SSH, senha ADB e endpoint de gerenciamento KMS aparecem como variáveis quando necessários.

Senhas ADB são fornecidas pelo ambiente do terminal, sem campo de senha no navegador. Os payloads JSON usam um diretório temporário privado, arquivos com permissão 0600 e limpeza ao sair. Valores do plano são serializados em JSON, sem execução como shell. O script verifica variáveis antes da primeira chamada, usa `set -euo pipefail`, ordena dependências e captura os identificadores retornados. Os identificadores capturados são exibidos no terminal para conferência.

**OCI CLI não mantém state nem oferece o plan do Terraform.** A execução cria recursos e pode gerar custos. Se houver falha parcial, os recursos já criados permanecem; não repita o script inteiro para retomar. Use os OCIDs registrados e revise as operações pendentes. Não existe exclusão nem rollback automático.

## Cobertura

São contemplados os 22 tipos nativos existentes no Studio: Compute, VCN, subnet, NSG e regra, route table, DRG, attachment, Internet Gateway, NAT Gateway, Service Gateway, Block Volume, bucket, Load Balancer, Autonomous Database, OKE, Vault, KMS key, File Storage, DNS zone, log group, Notifications topic e Dedicated VM Host.

Também há suporte às opções atuais de tags, criação de namespaces/chaves de tags, IAM Policy, associação de IP reservado, cloud-init Linux e bootstrap Windows. Backend/listener de Load Balancer, node pools de OKE e mount target/export NFS permanecem etapas adicionais, assim como no gerador Terraform.

Limites explícitos, com bloqueio de cópia/download em OCI CLI:

- **Universal/HCL manual:** não pode ser convertido automaticamente. Use Terraform.
- **Windows BYOL:** use Terraform; a CLI conferida não expõe `licensing-configs` no comando de lançamento. O lançamento Windows nativo e seu bootstrap são suportados.

A alternativa OCI CLI está na exportação do plano principal. As exportações específicas do laboratório de rede e do pacote IAM independente continuam em Terraform. A versão CLI não executa as consultas nem confirma capacidade, permissões ou disponibilidade na tenancy durante a geração.

## Validação reproduzível

Os testes de navegador usam Playwright e Chromium, conforme VALIDATION.md. Para conferir a geração e os argumentos oficiais sem criar recursos:

```sh
python3 -m venv work/oci-cli-env
work/oci-cli-env/bin/pip install oci-cli==3.95.1
node tests/oci-cli.cjs
work/oci-cli-env/bin/python tests/discover-oci-cli.py
work/oci-cli-env/bin/python tests/validate-oci-cli.py
```

O primeiro teste cobre formato, persistência, cópia/download, bloqueios, oito idiomas e layout. Os testes Python verificam Bash, ordem das operações, payloads, proteção contra expansão de shell, limpeza dos arquivos temporários, região/OCIDs preenchidos e parada quando faltam entradas. A conferência com a CLI oficial substitui o cliente por um coletor local e bloqueia sockets. Não são enviados comandos à OCI.

Referência: https://docs.oracle.com/en-us/iaas/tools/oci-cli/latest/oci_cli_docs/
