// Fixed reading panel, with independent tabs. Existing input handlers own settings and persistence.
(()=>{
 const group=document.querySelector('#view-themes .reading-tabs');if(!group)return;
 const tabs=[...group.querySelectorAll('[data-reading-tab]')];
 function activate(tab,focus=false){
  for(const candidate of tabs){const selected=candidate===tab;candidate.setAttribute('aria-selected',String(selected));candidate.tabIndex=selected?0:-1;document.getElementById(candidate.getAttribute('aria-controls')).hidden=!selected;}
  if(focus)tab.focus();
 }
 group.addEventListener('click',event=>{const tab=event.target.closest('[data-reading-tab]');if(tab)activate(tab);});
 group.addEventListener('keydown',event=>{const at=tabs.indexOf(document.activeElement);if(at<0)return;let next;if(event.key==='ArrowRight')next=(at+1)%tabs.length;if(event.key==='ArrowLeft')next=(at-1+tabs.length)%tabs.length;if(event.key==='Home')next=0;if(event.key==='End')next=tabs.length-1;if(next!==undefined){event.preventDefault();activate(tabs[next],true);}});
 activate(tabs[0]);
})();
