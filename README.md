# OCI Architect Studio

Aplicação estática para planejamento de recursos Oracle Cloud Infrastructure e geração de Terraform.

## Executar localmente
Abra index.html no navegador. Os projetos ficam no armazenamento local do navegador; exporte backups JSON para preservá-los.

## Publicação
O workflow .github/workflows/pages.yml publica index.html no GitHub Pages a cada push na branch docker-compose.

Antes da primeira execução, selecione Settings > Pages > Build and deployment > Source > GitHub Actions.
Depois de habilitar Pages, execute Actions > Publish GitHub Pages > Run workflow.

## Limites
O HTML inclui correções de validação de backups, exportação de Terraform, rotas de Service Gateway, exportação limpa e layout móvel. Consulte VALIDATION.md para os testes e limites.
Revise o Terraform e execute terraform fmt, terraform validate e terraform plan antes de aplicar.
