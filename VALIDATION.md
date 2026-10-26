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

`npm test` executa regressão, exportação OCI CLI e idiomas. O comando de temas verifica aparência, contraste, persistência e layout. Para executar uma suíte isolada, use `node tests/regression.cjs`, `node tests/oci-cli.cjs`, `node tests/languages.cjs` ou `node tests/themes.cjs`.

Artefatos são gravados em `work/`, ignorado pelo Git. O workflow [Validate Studio](.github/workflows/validate.yml) usa esses testes no GitHub Actions.

## Verificações adicionais e histórico

- [OCI_CLI.md](OCI_CLI.md): conferência offline dos parâmetros com a OCI CLI oficial, sem chamadas à tenancy.
- [Histórico de validação](docs/VALIDATION_HISTORY.md): resultados registrados em revisões anteriores. Eles não representam novos testes executados nesta limpeza.

## Limites

Build, testes de navegador e validação de schema não comprovam permissões IAM, disponibilidade regional, custos ou conectividade real. Antes de aplicar o Terraform exportado, revise a configuração e execute `terraform fmt`, `terraform init`, `terraform validate` e `terraform plan` no seu ambiente. O HCL manual Universal exige revisão própria.
