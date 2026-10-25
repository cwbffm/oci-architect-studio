# Validação da integração HTML + Python — 25/10/2026

## Resultado

A interface existente foi revisada antes da mudança. Os fontes foram separados e o HTML independente passou a ser gerado por build determinístico. A API Python e a tela de integração foram testadas sem criar infraestrutura OCI.

| Verificação | Resultado |
|---|---|
| Regressão da aplicação e HTML limpo | 10 verificações aprovadas |
| Exportação OCI CLI | 22 tipos nativos + 3 cenários extras; 24 layouts |
| Idiomas nas páginas anteriores | 64 navegações e 192 layouts |
| Temas | 14 verificações, 646 combinações de contraste, 912 layouts |
| Integração no navegador, com API simulada | 17 verificações; 8 idiomas e 24 layouts |
| API Python, com OCI simulado | 41 testes aprovados |
| Terraform gerado pelo backend | 24 configurações válidas; Terraform 1.13.4 e provider OCI 9.11.0; sem erros ou avisos |
| Dependências Python | `pip check` sem conflitos; `pip-audit` consultando PyPI: 38 pacotes, nenhuma vulnerabilidade conhecida |
| Dependências JavaScript | `npm audit`: nenhuma vulnerabilidade conhecida |
| Build e alterações | `build_frontend.py --check` e `git diff --check` aprovados |

Os testes Python emitem um aviso de depreciação da biblioteca de testes sobre a futura troca de `httpx` por `httpx2`. Os testes continuam aprovados. Isso não corresponde a uma falha na API ou a uma vulnerabilidade identificada.

## O que foi corrigido durante a revisão

- Login Oracle com issuer global e discovery/endpoints no Identity Domain específico; teste de PKCE e rejeição de endpoints fora do domínio configurado.
- Inicialização direta da tela `#integration` antes da definição de seu estado.
- Confirmação que era limpa pelo estado “ocupado” antes de enviar apply.
- Truncamento silencioso no navegador que poderia ocultar parte do plano.
- Bibliotecas Python com vulnerabilidades conhecidas, substituídas por versões verificadas.
- Recuperação da execução depois de recarregar/reconectar, sem restaurar credenciais ou aprovação.
- Destino imutável de uma stack existente; associação nova exige uma ação explícita.
- Identidades de usuários separadas por modo de autenticação e emissor OIDC; trocar o domínio de login não transfere acesso a projetos existentes.
- Revogação dos destinos no servidor: planos antigos deixam de poder ser aplicados quando o administrador remove região ou compartment da configuração.

## Controles exercitados

A API recompõe Terraform JSON a partir de campos permitidos; não executa HCL, shell ou ZIP enviados pelo navegador. Foram testados escaping de templates, destinos permitidos, referências internas de rede, separação por usuário, autenticação JWT assinada, validação de issuer/audience/expiração, concorrência, plano exato, logs incompletos e falhas remotas de resultado incerto.

A interface foi testada com tokens apenas em memória, logs como texto inerte, rejeição de URLs HTTP externas, restrição dos links ao Console Oracle, bloqueio de planos alterados e login OIDC com PKCE/state. O HTML limpo e o backup não transportam os tokens.

## Reprodução

Na raiz do repositório:

```bash
python3 tools/build_frontend.py --check
npm ci
npx playwright install chromium
export CHROMIUM_PATH="$(node -e 'process.stdout.write(require("playwright").chromium.executablePath())')"
npm test
npm run test:themes
python3 -m venv backend/.venv
backend/.venv/bin/pip install -r backend/requirements-dev.txt
backend/.venv/bin/python -m pytest -c backend/pytest.ini -q
backend/.venv/bin/pip check
```

O teste adicional `tests/validate-backend-terraform.py` exige Terraform e um diretório já inicializado com o provider OCI 9.11.0. Ele lê os defaults reais da interface, compila os casos e executa somente `terraform validate -json`; não executa init, plan ou apply. Veja os argumentos no próprio script.

Para repetir a consulta de vulnerabilidades, instale `pip-audit` em um ambiente de ferramentas e execute `pip-audit -r backend/requirements.txt -s pypi`. O resultado representa os avisos publicados na data da consulta, não garantia contra falhas desconhecidas.

## Limites

Não havia identidade OCI configurada neste ambiente. Não foram testados login real no Identity Domain, IAM efetivo, versão de Terraform disponível no Resource Manager, capacidade, quotas, compatibilidade da imagem nem execução em uma tenancy. A implantação real continua dependendo da configuração descrita em [backend/README.md](../backend/README.md).

O backend suporta dez tipos com restrições; os 22 tipos nativos da exportação local não têm todos execução direta. As limitações anteriores de Load Balancer, OKE, NFS, estado/retomada do script OCI CLI e security lists do gerador local permanecem documentadas em [GENERATOR_REVIEW.md](GENERATOR_REVIEW.md). A geração do backend usa security lists explícitas e versão restrita do provider.

As stacks devem ser gerenciadas exclusivamente pelo Studio. O controle local de concorrência e as verificações OCI não impedem atomicamente uma operação externa iniciada no Console entre duas chamadas. Uma aplicação com falha pode deixar recursos criados; não há rollback automático.
