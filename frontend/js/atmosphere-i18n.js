// Appearance workbench labels follow the existing eight-language interface.
for(const [source,...translations] of [
['Temas anteriores','Previous themes','Temas anteriores','Thèmes précédents','Vorherige Designs','Temi precedenti','前のテーマ','上一个主题'],
['Mais temas','More themes','Más temas','Plus de thèmes','Weitere Designs','Altri temi','その他のテーマ','更多主题'],
['Padrão do projeto','Project default','Predeterminado del proyecto','Valeur par défaut du projet','Projektstandard','Predefinito del progetto','プロジェクトの既定値','项目默认值'],
['Estúdio de atmosferas','Atmosphere studio','Estudio de atmósferas','Studio des ambiances','Atmosphärenstudio','Studio delle atmosfere','雰囲気スタジオ','氛围工作室'],
['Explore seu ambiente antes de aplicar.','Explore your workspace before applying.','Explora tu entorno antes de aplicar.','Explorez votre espace avant de l’appliquer.','Erkunden Sie Ihre Umgebung vor dem Anwenden.','Esplora il tuo ambiente prima di applicarlo.','適用する前に環境を確認できます。','应用前预览您的工作环境。'],
['Intensidade do fundo','Background intensity','Intensidad del fondo','Intensité du fond','Hintergrundintensität','Intensità dello sfondo','背景の強度','背景强度'],
['Fundo','Background','Fondo','Fond','Hintergrund','Sfondo','背景','背景'],
['PRÉVIA DO SEU CONSTRUTOR','YOUR BUILDER PREVIEW','VISTA PREVIA DEL CONSTRUCTOR','APERÇU DE VOTRE CONSTRUCTEUR','VORSCHAU IHRES KONSTRUKTORS','ANTEPRIMA DEL COSTRUTTORE','ビルダーのプレビュー','构建器预览'],
['EM PRÉVIA','PREVIEW','VISTA PREVIA','APERÇU','VORSCHAU','ANTEPRIMA','プレビュー','预览'],
['Alterações em prévia','Preview changes','Cambios en vista previa','Modifications en aperçu','Änderungen in der Vorschau','Modifiche in anteprima','変更をプレビュー中','更改预览中'],
['Tema aplicado','Applied theme','Tema aplicado','Thème appliqué','Angewendetes Design','Tema applicato','適用済みテーマ','已应用主题'],
['Sem imagem','No image','Sin imagen','Sans image','Kein Bild','Nessuna immagine','画像なし','无图片'],
['Aplicar tema','Apply theme','Aplicar tema','Appliquer le thème','Design anwenden','Applica tema','テーマを適用','应用主题'],
['Todos os temas','All themes','Todos los temas','Tous les thèmes','Alle Designs','Tutti i temi','すべてのテーマ','所有主题'],
['Disponível em modo escuro.','Available in dark mode.','Disponible en modo oscuro.','Disponible en mode sombre.','Im dunklen Modus verfügbar.','Disponibile in modalità scura.','ダークモードで利用できます。','仅提供深色模式。'],
['Aa · Texto e espaçamento','Aa · Text and spacing','Aa · Texto y espaciado','Aa · Texte et espacement','Aa · Text und Abstände','Aa · Testo e spaziatura','Aa · 文字と間隔','Aa · 文字与间距'],
['Visualização do fundo. Escolha Interface para rever o construtor.','Background preview. Choose Interface to see the builder.','Vista previa del fondo. Elige Interfaz para ver el constructor.','Aperçu du fond. Choisissez Interface pour revoir le constructeur.','Hintergrundvorschau. Wählen Sie Interface für den Konstruktor.','Anteprima dello sfondo. Scegli Interfaccia per vedere il costruttore.','背景のプレビューです。Interface を選ぶとビルダーに戻ります。','背景预览。选择 Interface 返回构建器。'],
['As alterações só ficam salvas ao aplicar. Seu projeto permanece no navegador.','Changes are saved only when applied. Your project stays in this browser.','Los cambios solo se guardan al aplicar. Tu proyecto permanece en este navegador.','Les modifications sont enregistrées à l’application. Votre projet reste dans ce navigateur.','Änderungen werden erst beim Anwenden gespeichert. Ihr Projekt bleibt im Browser.','Le modifiche vengono salvate solo quando applicate. Il progetto resta nel browser.','適用すると変更が保存されます。プロジェクトはブラウザー内に保持されます。','仅在应用后保存更改。项目保留在浏览器中。'],
['Aparência aplicada e salva neste navegador.','Appearance applied and saved in this browser.','Apariencia aplicada y guardada en este navegador.','Apparence appliquée et enregistrée dans ce navigateur.','Darstellung angewendet und in diesem Browser gespeichert.','Aspetto applicato e salvato in questo browser.','外観を適用し、このブラウザーに保存しました。','外观已应用并保存在此浏览器中。']
])I18N_TEXT.set(source,translations);
localizeInterface();
