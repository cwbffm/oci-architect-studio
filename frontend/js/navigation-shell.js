// Shell geometry and "Mais" menu accessibility only. No project, generation or deployment side effects.
(()=>{
 const header=document.querySelector('.topbar'),sidebar=document.getElementById('sidebar'),toggle=document.querySelector('[data-action="menu"]');if(!header||!sidebar||!toggle)return;
 function syncHeight(){const height=Math.ceil(header.getBoundingClientRect().height);if(height>0)document.body.style.setProperty('--studio-header-height',height+'px');}
 function syncDrawer(){toggle.setAttribute('aria-expanded',String(sidebar.classList.contains('open')));}
 new ResizeObserver(syncHeight).observe(header);new MutationObserver(syncDrawer).observe(sidebar,{attributes:true,attributeFilter:['class']});
 document.addEventListener('keydown',event=>{if(!event.defaultPrevented&&event.key==='Escape'&&sidebar.classList.contains('open')){sidebar.classList.remove('open');toggle.focus();}});
 document.addEventListener('pointerdown',event=>{if(sidebar.classList.contains('open')&&!sidebar.contains(event.target)&&!toggle.contains(event.target))sidebar.classList.remove('open');});
 window.addEventListener('resize',syncHeight);
 syncHeight();syncDrawer();
})();
