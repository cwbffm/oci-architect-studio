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

`npm test` executa regressão, exportação OCI CLI e idiomas. O comando de temas verifica aparência, contraste, persistência e layout dos temas clássicos e especiais. Para executar uma suíte isolada, use `node tests/regression.cjs`, `node tests/oci-cli.cjs`, `node tests/languages.cjs` ou `node tests/themes.cjs`.

Artefatos são gravados em `work/`, ignorado pelo Git. O workflow [Validate Studio](.github/workflows/validate.yml) usa esses testes no GitHub Actions.

## Verificações adicionais e histórico

- [OCI_CLI.md](OCI_CLI.md): conferência offline dos parâmetros com a OCI CLI oficial, sem chamadas à tenancy.
- [Histórico de validação](docs/VALIDATION_HISTORY.md): resultados registrados em revisões anteriores. Eles não representam novos testes executados nesta limpeza.

## Limites

Build, testes de navegador e validação de schema não comprovam permissões IAM, disponibilidade regional, custos ou conectividade real. Antes de aplicar o Terraform exportado, revise a configuração e execute `terraform fmt`, `terraform init`, `terraform validate` e `terraform plan` no seu ambiente. O HCL manual Universal exige revisão própria.

## Layout comum e temas

`tests/workspace.cjs` verifica as oito páginas com Nexus, Titanium e um tema claro
em cinco larguras (120 layouts), IDs únicos e navegação comum. Também cria, edita,
recarrega e remove um recurso pelos controles reais do construtor.

`tests/atmosphere.cjs` verifica prévia, aplicação e descarte de aparência sem mudar
o projeto. As suítes de temas cobrem os 38 clássicos e os dois especiais, incluindo
contraste, persistência, backups, idiomas e layouts. Os resultados históricos de
catálogos anteriores estão em `docs/VALIDATION_HISTORY.md`.

A navegação programática é síncrona para impedir uma segunda renderização do
construtor após abrir uma edição. O teste de layout cobre essa regressão e o
histórico de voltar/avançar, além do menu móvel e seu estado acessível.
