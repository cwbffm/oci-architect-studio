# Regiões OCI e tradução — seis melhorias

Base: versão clássica de fcb787f, com tema claro padrão e Aparência 13.

1. **País**: as 85 regiões têm código ISO do país no catálogo. O dropdown mostra cidade — país; `Intl.DisplayNames` apresenta o país no idioma selecionado. Cidade, código e realm continuam separados. A pesquisa aceita cidade, país ou identificador e ignora acentos.
2. **Filtros**: todas, comerciais (OC1), governamentais (OC2/OC3/OC4), soberanas da UE (OC19) e dedicadas/restritas (restantes realms). Os filtros não inferem acesso da tenancy. Dentro dos resultados, a ordem é alfabética pelo nome da cidade.
3. **Favoritos**: estrelas para adicionar/remover, seção separada e preferência `oci-studio.region-favorites.v1` no navegador. IDs desconhecidos são descartados ao ler a preferência. A lista completa permanece acessível. Filtros/pesquisa também se aplicam aos favoritos. Sem gravação de preferências no backup do projeto ou no HCL.
4. **Troca de região**: aviso persistente na página até ser fechado, com identificadores anterior/novo, data/hora local e orientação de revisão de imagens, sub-redes, ADs e OCIDs. Não altera a configuração dos recursos, não apaga o catálogo nem limpa o OCID de imagem do rascunho. O catálogo continua restrito à sua região de origem pela lógica existente. Nenhuma troca automática de OCIDs ou chamada OCI.
5. **BR/PT**: nomes nativos e códigos preservados; revisão dos textos estáticos, mensagens, erros comuns, pesquisa, tooltips e aviso de região. As mensagens temporárias e o diálogo de região personalizada também passam pela tradução. Padrões com placeholders preservam nomes/valores técnicos ao traduzir PT. Os novos controles incluem traduções para os outros sete idiomas disponíveis.
6. **Formatação**: indicadores numéricos (estatísticas, tamanho de tags e contagem de regiões) e datas (catálogo importado, revisão da lista e aviso) usam `Intl` conforme o idioma. A mudança de idioma atualiza os indicadores já montados, sem reconstruir o formulário. Campos numéricos, timestamps no backup, códigos de região e geradores continuam com valores de máquina. Não se aplicam separadores locais ao Terraform ou OCI CLI.

## Arquivos principais

- `frontend/data/oci-regions.json`: localidades, ISO do país, categoria e realm.
- `frontend/js/region-selector.js`: menu pesquisável, filtros, favoritos e aviso.
- `frontend/js/locale-pt.js`: revisão PT e funções de formatação visual.
- `frontend/js/locale-review.js`: traduções adicionais para os controles novos.
- `frontend/js/studio.js`: integração dos indicadores, mensagens e persistência existente.
- `frontend/styles/studio.css`: ajustes do menu, favoritos e aviso para desktop/mobile.
- `tools/build_frontend.py`: inclusão dos módulos e catálogo no HTML portátil, sem acesso de rede.

## Verificação

- Suíte original: regressão, 22 casos CLI nativos e 3 extras, idiomas e interface clássica (78 etapas/160 layouts).
- Idiomas: 72 navegações e 216 combinações de idioma/página/largura, sem overflow.
- `tests/regions-locales.cjs`: ordenação, seleção das 85 regiões pelo menu, exportação, persistência e região personalizada/cancelamento.
- `tests/region-discovery.cjs`: países, categorias (46 comerciais, 7 governamentais, 2 soberanas UE, 30 restritas), favoritos após reload, pesquisa por país, mudança BR/PT/EN, formatos, integridade de HCL/CLI e preservação integral de recursos, rascunho e catálogo na troca de região; 8 combinações de largura/tema para o menu.
