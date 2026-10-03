/* Five articles per page, two pages in view, one-column steps. */
(function () {
  'use strict';
  var root=document.documentElement,folio=document.querySelector('.home-folio');
  if(root.getAttribute('data-home-style')!=='fog'||!folio)return;
  var wide=matchMedia('(min-width:768px)'),reduce=matchMedia('(prefers-reduced-motion:reduce)');
  var cover=document.querySelector('.home-cover'),slogan=document.querySelector('.home-cover__slogan');
  var stage=folio.querySelector('.home-folio-pages'),numbers=folio.querySelector('.home-folio-numbers');
  var previous=folio.querySelector('[data-folio-step="-1"]'),next=folio.querySelector('[data-folio-step="1"]');
  var source=document.querySelector('#home-folio-source'),pages=[],start=0,busy=false,epoch=0,animations=[],pending=false;
  var unlocked=root.classList.contains('private-reading-unlocked');
  function smooth(x){x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);}
  function maximum(){return Math.max(0,pages.length-2);}
  function clamp(n){return Math.max(0,Math.min(maximum(),n));}
  function controls(){
    previous.disabled=busy||start===0;next.disabled=busy||start>=maximum();
    numbers.querySelectorAll('[data-folio-page]').forEach(function(a){
      var i=Number(a.dataset.folioPage)-1,active=i===start||i===start+1;
      if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');
      a.setAttribute('aria-label','Page '+(i+1)+(active?', currently visible':''));
      // Keep the page strip bounded when a large archive accumulates.
      a.hidden=pages.length>9&&i!==0&&i!==pages.length-1&&Math.abs(i-start)>2&&Math.abs(i-start-1)>2;
    });
  }
  function render(announce){
    start=clamp(start);
    pages.forEach(function(page,i){page.hidden=i!==start&&i!==start+1;page.dataset.side=i===start?'left':'right';});
    controls();
    if(announce)folio.querySelector('[data-folio-status]').textContent='Pages '+(start+1)+(pages[start+1]?' and '+(start+2):'')+' of '+pages.length;
  }
  function cancel(){epoch++;animations.forEach(function(a){a.cancel();});animations=[];busy=false;render(false);}
  function build(){
    cancel();
    var entries=Array.from(source.content.querySelectorAll('.home-folio-entry')).filter(function(e){return unlocked||!e.hasAttribute('data-private-entry');});
    stage.replaceChildren();numbers.replaceChildren();pages=[];
    for(var i=0;i<Math.max(1,Math.ceil(entries.length/5));i++){
      var column=document.createElement('div');column.className='home-folio-column';column.id='home-page-'+(i+1);column.dataset.page=String(i+1);column.setAttribute('role','group');column.setAttribute('aria-label','Page '+(i+1));
      entries.slice(i*5,i*5+5).forEach(function(e){column.append(e.cloneNode(true));});stage.append(column);pages.push(column);
      var a=document.createElement('a');a.href='#home-page-'+(i+1);a.dataset.folioPage=String(i+1);a.textContent=String(i+1);numbers.append(a);
    }
    folio.classList.add('is-ready');render(false);
  }
  function animate(element,frames,options){
    var a=element.animate(frames,options);animations.push(a);return a.finished.catch(function(){});
  }
  async function turn(target,history){
    target=clamp(target);if(busy||target===start||!wide.matches)return;
    var from=start,ticket=++epoch,old=[pages[from],pages[from+1]].filter(Boolean);
    busy=true;controls();
    if(!reduce.matches&&Element.prototype.animate){
      if(Math.abs(target-from)===1){
        var forward=target>from,outgoing=pages[forward?from:from+1],retained=pages[forward?from+1:from],incoming=pages[forward?target+1:target];
        if(outgoing)await animate(outgoing,[{opacity:1},{opacity:0}],{duration:140,fill:'forwards'});
        if(ticket!==epoch)return;
        var before=retained.getBoundingClientRect().left;
        outgoing.hidden=true;retained.dataset.side=forward?'left':'right';
        incoming.hidden=false;incoming.dataset.side=forward?'right':'left';
        var distance=before-retained.getBoundingClientRect().left;
        await Promise.all([
          animate(retained,[{transform:'translateX('+distance+'px)'},{transform:'translateX(0)'}],{duration:300,easing:'cubic-bezier(.22,.61,.36,1)',fill:'both'}),
          animate(incoming,[{opacity:0},{opacity:1}],{delay:160,duration:180,fill:'both'})
        ]);
      }else{
        await Promise.all(old.map(function(e){return animate(e,[{opacity:1},{opacity:0}],{duration:140,fill:'forwards'});}));
        if(ticket!==epoch)return;
        start=target;render(false);
        await Promise.all([pages[target],pages[target+1]].filter(Boolean).map(function(e){return animate(e,[{opacity:0},{opacity:1}],{duration:180,fill:'both'});}));
      }
    }
    if(ticket!==epoch)return;
    animations.forEach(function(a){a.cancel();});animations=[];start=target;busy=false;render(true);
    if(history)window.history.pushState(null,'','#home-page-'+(start+1));
  }
  function fromHash(){var m=location.hash.match(/^#home-page-(\d+)$/);return m?clamp(Number(m[1])-1):0;}
  function update(){
    pending=false;
    if(!wide.matches){
      ['--fog-camera','--fog-light','--folio-reveal','--folio-rise'].forEach(function(k){root.style.removeProperty(k);});
      slogan.style.removeProperty('opacity');slogan.style.removeProperty('transform');root.classList.remove('home-fog-ready');return;
    }
    var ratio=scrollY/(cover.offsetHeight||innerHeight),p=smooth(ratio),reveal=smooth((ratio-.12)/.54);
    root.classList.add('home-fog-ready');
    root.style.setProperty('--fog-camera',String(reduce.matches?1:1.12-.12*p));
    root.style.setProperty('--fog-light',String(.88*(reduce.matches?1:p)));
    root.style.setProperty('--folio-reveal',String(reduce.matches?1:reveal));root.style.setProperty('--folio-rise',(reduce.matches?0:12*(1-reveal))+'px');
    slogan.style.opacity=String(1-smooth(ratio/.4));slogan.style.transform=reduce.matches?'none':'translateY('+(-10*p)+'px)';
  }
  function request(){if(!pending){pending=true;requestAnimationFrame(update);}}
  folio.addEventListener('click',function(event){
    var control=event.target.closest('[data-folio-page],[data-folio-step]');if(!control||!wide.matches||!folio.classList.contains('is-ready'))return;
    if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    event.preventDefault();turn(control.hasAttribute('data-folio-page')?Number(control.dataset.folioPage)-1:start+Number(control.dataset.folioStep),true);
  });
  folio.addEventListener('focusin',function(){if(wide.matches&&scrollY<cover.offsetHeight*.7){scrollTo({top:cover.offsetHeight,behavior:'instant'});update();}});
  addEventListener('scroll',request,{passive:true});addEventListener('pageshow',request);
  addEventListener('resize',function(){if(busy)cancel();request();});
  wide.addEventListener('change',function(){if(wide.matches&&!folio.classList.contains('is-ready'))build();cancel();request();});
  reduce.addEventListener('change',function(){cancel();request();});
  addEventListener('popstate',function(){cancel();start=fromHash();render(true);});
  new MutationObserver(function(){var value=root.classList.contains('private-reading-unlocked');if(value!==unlocked){unlocked=value;if(wide.matches)build();}}).observe(root,{attributes:true,attributeFilter:['class']});
  if(wide.matches){build();start=fromHash();render(false);if(location.hash.match(/^#home-page-/))requestAnimationFrame(function(){scrollTo(0,cover.offsetHeight);});}
  update();
})();
