# OCI Architect Studio

Aplicação estática para planejar recursos Oracle Cloud Infrastructure e gerar Terraform, sem conexão direta com uma tenancy.

- 22 tipos nativos e recurso Universal para HCL manual.
- Planejamento de rede, policies IAM, tags e catálogo regional importável.
- Backups JSON, exportação de Terraform e HTML limpo.
- Oito idiomas, 38 variantes de temas, 17 opções de destaque e preferências de leitura.

## Executar localmente

Abra `index.html` no navegador. Os projetos ficam no armazenamento local; exporte backups JSON para preservá-los.

## Publicação

O workflow `.github/workflows/pages.yml` publica `index.html` no GitHub Pages a cada push na branch `docker-compose`. Usa Ubuntu 24.04 e ações compatíveis com Node.js 24.

Na primeira execução, selecione Settings → Pages → Build and deployment → Source → GitHub Actions. Depois execute Actions → Publish GitHub Pages → Run workflow.

## Validar e revisar

Consulte [VALIDATION.md](VALIDATION.md) para os resultados, reprodução dos testes e limites; [THEMES.md](THEMES.md) para aparência e leitura; e [I18N.md](I18N.md) para idiomas.

A revisão atual corrigiu as prévias de destaque e verificou 32 configurações com `terraform validate`. Antes de aplicar, revise o código e execute `terraform fmt`, `terraform validate` e `terraform plan` na sua configuração. Disponibilidade regional e permissões efetivas dependem da sua OCI. O HCL manual do recurso Universal exige revisão.
