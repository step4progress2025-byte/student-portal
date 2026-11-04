/* Asha animated mascot player: smooth, lazy, alpha-WebM with still fallback.
   Usage: var a = AshaPlayer.mount(hostEl); a.say('wave'); a.say('cheer'); ... clips return to 'idle' loop automatically. */
var AshaPlayer=(function(){
  var BASE='asha/', FADE=220;
  var CLIPS=['idle','wave','thumbsup','heart','cheer','think','sleepy'];
  var END={wave:7.6,thumbsup:7.5,heart:7.6,sleepy:7.4,think:7.85,cheer:9.8};
  var ALPHA_TEST='data:video/webm;base64,GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQJChYECGFOAZwEAAAAAAAIQEU2bdLpNu4tTq4QVSalmU6yBoU27i1OrhBZUrmtTrIHYTbuMU6uEElTDZ1OsggEiTbuMU6uEHFO7a1OsggH67AEAAAAAAABZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAVSalmsirXsYMPQkBNgI1MYXZmNjAuMTYuMTAwV0GNTGF2ZjYwLjE2LjEwMESJiEBZAAAAAAAAFlSua8WuAQAAAAAAADzXgQFzxYixRYg9EVyHK5yBACK1nIN1bmSIgQCGhVZfVlA5g4EBI+ODhAX14QDgjbCBELqBEJqBAlPAgQESVMNnQIBzc6BjwIBnyJpFo4dFTkNPREVSRIeNTGF2ZjYwLjE2LjEwMHNz2mPAi2PFiLFFiD0RXIcrZ8ilRaOHRU5DT0RFUkSHmExhdmM2MC4zMS4xMDIgbGlidnB4LXZwOWfIoUWjiERVUkFUSU9ORIeTMDA6MDA6MDAuMTAwMDAwMDAwAB9DtnXN54EAoMihoIEAAACCSYNCAADwAPYAOCQcGIwAADBgAAAQv//6jeAAdaGjpqHugQGlnIJJg0IAAPAA9gA4JBwYjAAAMGAAABC///toaAAcU7trkbuPs4EAt4r3gQHxggGo8IED';
  var urls={}, pending={}, alphaOK=null, alphaWait=[], avatars=[];
  var still=(navigator.connection&&navigator.connection.saveData)||(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);

  function detectAlpha(cb){
    if(alphaOK!==null)return cb(alphaOK);
    alphaWait.push(cb); if(alphaWait.length>1)return;
    function done(v){alphaOK=v;alphaWait.splice(0).forEach(function(f){f(v);});}
    try{
      var v=document.createElement('video');v.muted=true;v.playsInline=true;
      v.onloadeddata=function(){try{
        var c=document.createElement('canvas');c.width=c.height=4;var x=c.getContext('2d');x.drawImage(v,0,0,4,4);
        done(x.getImageData(1,1,1,1).data[3]===0);}catch(e){done(false);}};
      v.onerror=function(){done(false);};
      setTimeout(function(){if(alphaOK===null)done(false);},2500);
      v.src=ALPHA_TEST;v.load();
    }catch(e){done(false);}
  }
  function fetchClip(name){
    if(urls[name])return Promise.resolve(urls[name]);
    if(location.protocol==='file:'){urls[name]=BASE+name+'.webm';return Promise.resolve(urls[name]);}
    if(pending[name])return pending[name];
    pending[name]=fetch(BASE+name+'.webm').then(function(r){if(!r.ok)throw 0;return r.blob();}).then(function(b){return urls[name]=URL.createObjectURL(b);});
    return pending[name];
  }
  function preload(list){ // idle first, the rest when the browser is idle
    (list||CLIPS).reduce(function(p,n){return p.then(function(){return new Promise(function(res){
      var go=function(){fetchClip(n).then(res,res);};
      (window.requestIdleCallback||function(f){setTimeout(f,150);})(go);});});},Promise.resolve());
  }
  function layer(){var v=document.createElement('video');v.muted=true;v.playsInline=true;v.setAttribute('playsinline','');v.preload='auto';
    v.style.cssText='position:absolute;inset:0;width:100%;height:100%;object-fit:contain;opacity:0;transition:opacity '+FADE+'ms linear;pointer-events:none';return v;}

  function confetti(host){
    var c=document.createElement('canvas'),r=host.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2);
    c.width=Math.max(60,r.width)*dpr;c.height=Math.max(60,r.height)*dpr;
    c.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none';host.appendChild(c);
    var x=c.getContext('2d'),cols=['#C9A84C','#E8C96A','#0D2137','#2E86DE','#E74C3C','#27AE60','#fff'],P=[],i;
    for(i=0;i<70;i++)P.push({x:c.width*(.15+Math.random()*.7),y:c.height*.2,vx:(Math.random()-.5)*7*dpr,vy:(-2-Math.random()*7)*dpr,w:(4+Math.random()*5)*dpr,h:(7+Math.random()*7)*dpr,a:Math.random()*6,va:(Math.random()-.5)*.4,c:cols[i%cols.length]});
    var t0=performance.now();
    (function f(t){var k=(t-t0)/1900;x.clearRect(0,0,c.width,c.height);
      if(k>=1){c.remove();return;}
      P.forEach(function(p){p.vy+=.28*dpr;p.x+=p.vx;p.y+=p.vy;p.a+=p.va;x.save();x.globalAlpha=1-k*k;x.translate(p.x,p.y);x.rotate(p.a);x.fillStyle=p.c;x.fillRect(-p.w/2,-p.h/2,p.w,p.h);x.restore();});
      requestAnimationFrame(f);})(t0);
  }
  var css=document.createElement('style');
  css.textContent='.asha-fade{-webkit-mask-image:linear-gradient(to bottom,#000 86%,transparent 100%);mask-image:linear-gradient(to bottom,#000 86%,transparent 100%)}.asha-still img{animation:ashaBreathe 3.6s ease-in-out infinite}@keyframes ashaBreathe{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-1.2%) scale(1.012)}}@media (prefers-reduced-motion:reduce){.asha-still img{animation:none}}';
  document.head.appendChild(css);
  function mount(host,opts){
    opts=opts||{};
    if(opts.fade!==false)host.classList.add('asha-fade');
    host.classList.add('asha-host');
    host.style.position=host.style.position||'relative';
    var img=document.createElement('img');img.src=BASE+'still.webp';img.alt=opts.alt||'Asha';img.decoding='async';
    img.style.cssText='position:absolute;inset:0;width:100%;height:100%;object-fit:contain';
    host.appendChild(img);
    var A=layer(),B=layer();host.appendChild(A);host.appendChild(B);
    var cur=A,nxt=B,state={name:null,vis:true,mode:'init',token:0};
    var av={host:host,still:img,
      say:function(name,loopAfter){
        if(CLIPS.indexOf(name)<0)name='idle';
        state.want=name;
        if(name==='cheer'&&!still&&opts.confetti!==false)confetti(host);
        if(state.mode==='still'||state.mode==='init'){return;}
        play(name,name==='idle');
      }};
    function swapTo(name,loop){
      var token=++state.token;
      fetchClip(name).then(function(u){
        if(token!==state.token)return;
        var n=nxt;n.loop=loop;n.src=u;n.currentTime=0;
        var go=function(){
          if(token!==state.token)return;
          var p=n.play();(p&&p.then?p:Promise.resolve()).then(function(){
            if(token!==state.token){n.pause();return;}
            n.style.opacity=1;cur.style.opacity=0;
            var old=cur;cur=n;nxt=old;
            setTimeout(function(){if(old!==cur&&token===state.token)old.pause();},FADE+60);
            img.style.opacity=0;state.shown=name;
          }).catch(function(){});
        };
        if(n.readyState>=3)go();else n.addEventListener('canplay',go,{once:true});
      }).catch(function(){});
    }
    function play(name,loop){
      state.name=name;
      swapTo(name,loop);
      if(!loop){ // crossfade back to idle shortly before the end
        var watch=function(){
          if(state.name!==name)return;
          if(state.shown!==name){setTimeout(watch,120);return;}
          var end=Math.min(END[name]||9e9,cur.duration||9e9);
          if(cur.currentTime>=end-FADE/1000-0.05){play('idle',true);return;}
          if(cur.ended){play('idle',true);return;}
          (cur.requestVideoFrameCallback?cur.requestVideoFrameCallback.bind(cur):requestAnimationFrame)(watch);
        };
        setTimeout(watch,400);
      }
    }
    // visibility: pause when scrolled away or tab hidden
    if('IntersectionObserver' in window){
      new IntersectionObserver(function(es){es.forEach(function(e){
        state.vis=e.isIntersecting;
        if(state.mode==='video'){ if(!state.vis){cur.pause();} else {cur.play().catch(function(){});} }
      });}).observe(host);
    }
    document.addEventListener('visibilitychange',function(){
      if(state.mode!=='video')return;
      if(document.hidden)cur.pause();else if(state.vis)cur.play().catch(function(){});
    });
    detectAlpha(function(ok){
      if(!ok||still){state.mode='still';host.classList.add('asha-still');return;}
      state.mode='video';play(state.want||'idle',(state.want||'idle')==='idle');
    });
    avatars.push(av);
    return av;
  }
  return {mount:mount,confetti:confetti,preload:preload,supported:detectAlpha,clips:CLIPS};
})();
