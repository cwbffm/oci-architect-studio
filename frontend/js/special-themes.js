/* Each variant owns its complete palette and backdrop, rather than tinting one UI. */
function createSpecialThemes(){
 const keys=['bg','sidebar','panel','raised','input','border','text','muted','accent','brand','mint','editor'];
 const palettes={
 'liquid-glass':{
 dark:['#09152a','#0c1b34','#122a46','#1b3b5b','#0c213b','#6786a6','#f2f8ff','#bbd1e8','#a4deff','#9bdbff','#6fe7d0','#08172b'],
 light:['#dcebf5','#d0e5f0','#eff8ff','#d4e7f3','#f8fcff','#6687a4','#132e45','#3b586f','#16527f','#5eb7ec','#2c786b','#f2f9ff']},
 glassmorphism:{
 dark:['#09152f','#0b1e40','#142d51','#213f63','#0b2241','#6c91bd','#eef7ff','#bfd6ef','#7dd8ff','#51c7ff','#aaa8ff','#09162b'],
 light:['#e1ecfc','#d1def7','#f1f7ff','#d2e1fa','#f8fbff','#758aa9','#172c53','#425c80','#174f99','#347be8','#7059bb','#f5f8ff']},
 'frosted-glass':{
 dark:['#172b3a','#1b3445','#294758','#365565','#193849','#829fad','#f1fbff','#c6e1ea','#b9e8ff','#b3e4fb','#aee5e0','#182f40'],
 light:['#eaf4fc','#d5e7f5','#f6fbff','#d7e8f6','#ffffff','#6d8faa','#163249','#3f607b','#16578c','#2d85e9','#2e7977','#f5faff']},
 acrylic:{
 dark:['#101e23','#14292f','#20383e','#2e484e','#142d33','#70979d','#eef9f7','#bad7d5','#a7e0d5','#8bcfc3','#bdce92','#10242a'],
 light:['#e4eeea','#cedfd8','#f2f7f2','#d3e3dc','#f7fbf8','#719186','#203b34','#46665b','#285f51','#63b6a1','#6c7b40','#f0f6f2']},
 mica:{
 dark:['#202936','#273343','#2d3a4b','#35465b','#202e40','#788da6','#f3f6fc','#c3d0e2','#bfd4ff','#afc9f7','#a5c8c7','#1f2b3c'],
 light:['#e8edf5','#dce3ee','#f6f8fc','#dce5f1','#ffffff','#75859b','#223045','#4c5f77','#315a94','#5579b3','#487773','#f0f3f8']},
 'aurora-glass':{
 dark:['#090f28','#101835','#162447','#213451','#0c1c36','#667fae','#f4f6ff','#cad6f6','#b6d6ff','#35d2e6','#ceacff','#0a1530'],
 light:['#e8e8fd','#d9d8f2','#f7f4ff','#e3ddf5','#fcfaff','#8981ae','#302848','#615576','#5e398f','#8f6ce6','#267b8d','#f4f0ff']},
 'holographic-glass':{
 dark:['#0d1022','#13172c','#1a2039','#27304e','#111a30','#837da7','#faf4ff','#d1cce8','#d7c2ff','#ba96ff','#68e3ef','#10152b'],
 light:['#f3edfb','#e5ddf3','#fff8ff','#e8dff4','#fffcff','#9883ae','#342342','#675074','#723e98','#bd74da','#287f92','#fcf6ff']},
 neumorphism:{
 dark:['#282e38','#282e38','#282e38','#333c49','#222a36','#74859a','#eef3fa','#c0cddd','#b2d4ff','#9dc8ff','#a8d6be','#222b37'],
 light:['#e4e9ef','#e4e9ef','#e4e9ef','#d7dfe9','#dce4ed','#7d8b9c','#25374b','#4b5d73','#1b5597','#2672da','#397968','#eaf0f6']},
 'soft-ui':{
 dark:['#2a201f','#302625','#3b2d2b','#493835','#302321','#a3877a','#fff5eb','#e0c9b9','#ffc39f','#f9b183','#9bd0b6','#2e2421'],
 light:['#faf3e9','#f5eadc','#fffaf3','#f3e3d0','#fffdf8','#a08773','#493328','#745947','#9d451f','#ff8347','#3e7b65','#fff8ef']}
 };
 const families=[['liquid-glass','Liquid Glass','Reflexos suaves e vidro translúcido.'],['glassmorphism','Glassmorphism','Transparência, desfoque e profundidade.'],['frosted-glass','Frosted Glass','Vidro fosco com reflexos discretos.'],['acrylic','Acrylic','Vidro acrílico com textura sutil.'],['mica','Mica','Superfícies foscas com um toque de cor.'],['aurora-glass','Aurora Glass','Gradientes de azul, verde e violeta.'],['holographic-glass','Holographic Glass','Reflexos iridescentes nas bordas.'],['neumorphism','Neumorphism','Relevo suave e controles esculpidos.'],['soft-ui','Soft UI','Superfícies acolhedoras e sombras suaves.']];
 const backdrops={
 'liquid-glass':['radial-gradient(ellipse at 8% 5%,#176a8a 0,transparent 48%),radial-gradient(ellipse at 95% 65%,#293d7b 0,transparent 50%),linear-gradient(135deg,#07152b,#102a49 55%,#101c3b)','radial-gradient(ellipse at 0 0,#b2e4f1,transparent 55%),radial-gradient(ellipse at 95% 85%,#c7cff2,transparent 58%),linear-gradient(135deg,#e4f6fd,#cadfec)'],
 glassmorphism:['radial-gradient(ellipse at 8% 85%,#075a91,transparent 55%),radial-gradient(ellipse at 90% 15%,#353376,transparent 58%),linear-gradient(140deg,#07132a,#102b52) ','radial-gradient(ellipse at 5% 95%,#97cfed,transparent 55%),radial-gradient(ellipse at 95% 5%,#c1b9f0,transparent 60%),linear-gradient(130deg,#e6f3ff,#c5d9f2)'],
 'frosted-glass':['linear-gradient(145deg,transparent 68%,#43667b 68.2%,#243f52 86%,transparent 86.2%),linear-gradient(35deg,#4a6d83,transparent 45%),linear-gradient(140deg,#203c51,#173345) ','linear-gradient(145deg,transparent 68%,#bfd9ec 68.2%,#e3f0fa 86%,transparent 86.2%),linear-gradient(35deg,#b0d2e9,transparent 45%),linear-gradient(140deg,#f2faff,#d8ebf8)'],
 acrylic:['radial-gradient(ellipse at 5% 90%,#28545a,transparent 65%),linear-gradient(135deg,#14242a,#172f35 55%,#1e3a3e)','radial-gradient(ellipse at 5% 90%,#b6d1c4,transparent 65%),linear-gradient(135deg,#e9f2eb,#d3e4dc)'],
 mica:['linear-gradient(125deg,#202b3b,#29394d 65%,#243144)','linear-gradient(125deg,#edf1f8,#e0e6f0 65%,#e7edf5)'],
 'aurora-glass':['radial-gradient(ellipse at 18% 15%,#096f83,transparent 50%),radial-gradient(ellipse at 90% 90%,#6833ad,transparent 58%),linear-gradient(125deg,#082b4d,#172255 45%,#252058)','radial-gradient(ellipse at 5% 20%,#a4e5df,transparent 55%),radial-gradient(ellipse at 90% 85%,#c7a5f2,transparent 60%),linear-gradient(125deg,#e0f6f7,#e5dbfc)'],
 'holographic-glass':['radial-gradient(ellipse at 0 100%,#103c52,transparent 45%),radial-gradient(ellipse at 100% 0,#34264f,transparent 48%),linear-gradient(140deg,#0c1023,#131831)','radial-gradient(ellipse at 0 100%,#c1e7ee,transparent 50%),radial-gradient(ellipse at 100% 0,#f0d2ec,transparent 55%),linear-gradient(140deg,#f7f1ff,#e9e6f8)'],
 neumorphism:['linear-gradient(#282e38,#282e38)','linear-gradient(#e4e9ef,#e4e9ef)'],
 'soft-ui':['radial-gradient(ellipse at 85% 8%,#3c2c27,transparent 65%),linear-gradient(#2a201f,#2d2522)','radial-gradient(ellipse at 85% 8%,#fff9f0,transparent 65%),linear-gradient(#faf3e9,#f7ecdf)']
 };
 function rgba(hex,alpha){return 'rgba('+[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)).join(',')+','+alpha+')';}
 return families.flatMap(([effect,family,desc])=>['dark','light'].map((mode,index)=>{
 const c=Object.fromEntries(keys.map((key,i)=>[key,palettes[effect][mode][i]])),light=mode==='light';
 const opaque=['mica','neumorphism','soft-ui'].includes(effect),alpha=effect==='frosted-glass'?.87:effect==='holographic-glass'?.88:effect==='acrylic'?.82:.72;
 return {id:effect+'-'+mode,name:family+(light?' Claro':' Escuro'),family,familyKey:effect,mode,special:true,effect,desc,bg:c.bg,sidebar:c.sidebar,panel:c.panel,accent:c.accent,
 tokens:{raised:c.raised,input:c.input,border:c.border,text:c.text,muted:c.muted,subtle:c.muted,mint:c.mint,blue:c.accent,danger:light?'#ae302b':'#ffb4ae',editor:c.editor},
 visual:{backdrop:backdrops[effect][index],glass:opaque?c.panel:rgba(c.panel,alpha),sidebar:opaque?c.sidebar:rgba(c.sidebar,effect==='frosted-glass'?.90:.79),topbar:opaque?c.sidebar:rgba(c.sidebar,.84),edge:rgba(c.border,light?.72:.74),brand:c.brand,glow:rgba(c.brand,light?.18:.24)}};
 }));
}
