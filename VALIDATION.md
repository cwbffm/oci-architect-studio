# Validação do Studio

O Studio funciona localmente, sem integração direta com OCI. Os testes não provisionam infraestrutura.

## Build e servidor Python

Execute na raiz do repositório, com Python 3.12 ou superior. Não é necessário instalar pacotes Python:

```bash
python3 tools/build_frontend.py --check
python3 -m unittest discover -s tests -p "test_*.py" -v
```

Se alterar `frontend/`, atualize o HTML com `python3 tools/build_frontend.py` antes da verificação. O teste do servidor verifica o acesso ao HTML e o bloqueio de caminhos internos.

## Interface, exportações, idiomas e temas

Instale as versões registradas no lockfile e o Chromium:

```bash
npm ci
npx playwright install chromium
```

Os testes usam `/usr/bin/chromium` por padrão. Quando usar o navegador instalado pelo Playwright, configure o caminho (Bash):

```bash
export CHROMIUM_PATH="$(node -e 'process.stdout.write(require("playwright").chromium.executablePath())')"
npm test
npm run test:themes
```

`npm test` executa regressão, exportação OCI CLI, idiomas e a interface restaurada. `npm run test:themes` verifica contraste, persistência, leitura e layout dos 38 temas clássicos e a migração dos temas especiais removidos.

Artefatos são gravados em `work/`, ignorado pelo Git. O workflow [Validate Studio](.github/workflows/validate.yml) usa esses testes no GitHub Actions.

## Verificações adicionais e histórico

- [OCI_CLI.md](OCI_CLI.md): conferência offline dos parâmetros com a OCI CLI oficial, sem chamadas à tenancy.
- [Histórico de validação](docs/VALIDATION_HISTORY.md): resultados registrados em revisões anteriores. Eles não representam novos testes executados nesta limpeza.

## Limites

Build, testes de navegador e validação de schema não comprovam permissões IAM, disponibilidade regional, custos ou conectividade real. Antes de aplicar o Terraform exportado, revise a configuração e execute `terraform fmt`, `terraform init`, `terraform validate` e `terraform plan` no seu ambiente. O HCL manual Universal exige revisão própria.

## Interface restaurada

`node tests/restored-interface.cjs` verifica os formulários nativos, criação e edição de recurso, oito páginas em quatro temas e cinco larguras (160 layouts), além da abertura e navegação pelo menu no celular. O visual segue `0fe5f49`; as correções funcionais dos geradores seguem `351a164`. As prévias usam um projeto de exemplo. Nenhuma publicação é executada.

## Revisão dos geradores — 28/10/2026

- Terraform: 50 configurações passaram por `terraform validate -json`, com Terraform **1.13.4** e provider **oracle/oci 9.11.0**. Inclui os 22 tipos nativos, variantes Compute/Linux/Windows/BYOL, IP reservado, KMS/NSG, tags, dependências, HCL Universal de exemplo, seis variantes do laboratório de rede e dois pacotes IAM independentes.
- IAM não é incluído nos geradores de infraestrutura, mesmo quando um estado legado contém `includeIam: true`. Policies opcionais continuam no workspace IAM; seus erros não impedem exportar recursos válidos. HCL Universal pode ser salvo sem statements IAM.
- Buckets aceitam Standard ou Archive; Infrequent Access é uma classe de objetos. Valores fora das opções de campos select em backups são sinalizados, impedindo exportação inválida.
- O servidor foi verificado contra caminhos internos, traversal codificado, symlinks externos, arquivos de backup e requisições HEAD.

Para repetir a validação real do provider, use uma pasta isolada. O script substitui `main.tf` nessa pasta e exige o provider previamente inicializado:

```sh
mkdir -p work/terraform-validation
cat > work/terraform-validation/main.tf <<'EOF'
terraform {
  required_providers {
    oci = { source = "oracle/oci", version = "9.11.0" }
  }
}
EOF
terraform -chdir=work/terraform-validation init -backend=false
node tests/validate-terraform.cjs
```

Se o executável ou a pasta estiverem em outro caminho, defina `TERRAFORM` e `TF_VALIDATION_DIR`. O relatório fica em `work/terraform-validation-results.json`. Não há execução de `plan` ou `apply`, consulta de permissões ou criação de recursos. A validade de um HCL Universal de exemplo não valida qualquer HCL digitado pelo usuário.

A OCI CLI oficial **3.95.1** passou na conferência offline de **25 scripts, 36 comandos simulados e 29 caminhos oficiais**, com sockets bloqueados. As dependências npm foram auditadas sem vulnerabilidades conhecidas.
