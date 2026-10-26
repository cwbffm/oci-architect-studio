/* Decorative themes keep opaque editor and input surfaces for legibility. */
function createSpecialThemes(){
 const styles=[
 ['liquid-glass','Liquid Glass','Reflexos suaves e vidro translúcido.','#101e35','#8acaff'],
 ['glassmorphism','Glassmorphism','Transparência, desfoque e profundidade.','#142439','#87cdff'],
 ['frosted-glass','Frosted Glass','Vidro fosco com reflexos discretos.','#182b38','#91d9ee'],
 ['acrylic','Acrylic','Vidro escuro com textura sutil.','#182c31','#8fd6cc'],
 ['mica','Mica','Superfícies foscas com um toque de cor.','#202b3d','#aec7ef'],
 ['aurora-glass','Aurora Glass','Gradientes de azul, verde e violeta.','#131e36','#a7bcff'],
 ['holographic-glass','Holographic Glass','Reflexos iridescentes nas bordas.','#201e36','#dabaff'],
 ['neumorphism','Neumorphism','Relevo suave e controles esculpidos.','#292f39','#b7d2ff'],
 ['soft-ui','Soft UI','Superfícies acolhedoras e sombras suaves.','#302b2a','#f6bd99']
 ];
 return styles.flatMap(([effect,family,desc,bg,accent])=>['dark','light'].map(mode=>{
 const light=mode==='light',warm=effect==='soft-ui';
 const base=light?(warm?'#faf4ec':'#edf3fa'):bg;
 return {id:effect+'-'+mode,name:family+(light?' Claro':' Escuro'),family,familyKey:effect,mode,special:true,effect,desc,
 bg:base,sidebar:light?(warm?'#f1e7db':'#e0e9f3'):bg,panel:light?(warm?'#fffaf4':'#f5f8fc'):bg,accent:light?(warm?'#96461e':'#215ca6'):accent,
 tokens:{raised:light?(warm?'#eee2d5':'#dce6f2'):'#354356',input:light?'#ffffff':'#182333',border:light?'#73859b':'#66788e',text:light?'#172639':'#f5f8ff',muted:light?'#475c73':'#c1cfdf',subtle:light?'#50627a':'#bac8dc',mint:light?'#216e4a':'#94d9bc',blue:light?'#245ccd':'#a8c8ff',danger:light?'#ae302b':'#ffb4ae',editor:light?'#f7f9fc':'#101a28'}};
 }));
}
