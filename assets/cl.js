/* caladrii.com — langue, en-tête, sommaire, apparition, et l'ouverture « onde → vocabulaire ». Aucun appel réseau. */
(function(){
  var html=document.documentElement;
  var LANGS=(html.getAttribute('data-langs')||'en fr').split(' ');
  function store(k,v){try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(e){return null}}
  function pick(l){return LANGS.indexOf(l)>=0?l:(LANGS.indexOf('en')>=0?'en':LANGS[0])}
  function setLang(l,save){
    var want=l;l=pick(l);html.lang=l;
    if(save)store('cl-lang',want);
    document.querySelectorAll('.lang button').forEach(function(b){
      b.hidden=LANGS.indexOf(b.dataset.lang)<0;b.setAttribute('aria-pressed',b.dataset.lang===l);
    });
  }
  var nav=((navigator.languages&&navigator.languages[0])||navigator.language||'en').slice(0,2).toLowerCase();
  setLang(store('cl-lang')||nav,false);
  document.querySelectorAll('.lang button').forEach(function(b){b.addEventListener('click',function(){setLang(b.dataset.lang,true)})});

  var head=document.querySelector('header');
  if(head){
    window.addEventListener('scroll',function(){head.classList.toggle('scrolled',window.scrollY>8)},{passive:true});
    var mb=head.querySelector('.menu-btn');
    if(mb)mb.addEventListener('click',function(){var o=head.classList.toggle('open');mb.setAttribute('aria-expanded',o)});
  }

  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var IO='IntersectionObserver' in window;

  var toc=[].slice.call(document.querySelectorAll('.toc a'));
  if(toc.length&&IO){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){toc.forEach(function(a){a.classList.toggle('on',a.getAttribute('href')==='#'+e.target.id)})}})},{rootMargin:'-25% 0px -65% 0px'});
    toc.forEach(function(a){var s=document.querySelector(a.getAttribute('href'));if(s)io.observe(s)});
  }

  var rv=[].slice.call(document.querySelectorAll('.reveal'));
  if(rv.length){
    if(IO&&!reduce){
      var ro=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');ro.unobserve(e.target)}})},{threshold:.1});
      rv.forEach(function(r){ro.observe(r)});
    }else rv.forEach(function(r){r.classList.add('in')});
  }

  // Ouverture : une onde de parole qui s'écrit en vocabulaire radiologique.
  var cv=document.getElementById('wave'),out=document.getElementById('dictee');
  if(!cv||!out||!cv.getContext)return;
  var LINES=[
    'Malformation artério-veineuse grade 3 de [Spetzler-Martin].',
    'Lésion de la zone périphérique classée [PI-RADS 4].',
    'Tumeur de [Klatskin] de type IIIa de [Bismuth-Corlette].',
    'Kyste rénal gauche classé [Bosniak IIF].',
    'Gonarthrose fémoro-tibiale médiale stade 3 de [Kellgren-Lawrence].',
    'Hypersignaux de la substance blanche, [Fazekas 2].',
    'Trachéobronchomégalie évoquant un syndrome de [Mounier-Kuhn].'
  ];
  var ctx=cv.getContext('2d'),dpr=Math.min(window.devicePixelRatio||1,2),W=0,H=0,N=64,amp=new Array(N).fill(0),target=new Array(N).fill(0);
  function size(){var r=cv.getBoundingClientRect();W=r.width;H=r.height;cv.width=W*dpr;cv.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0)}
  function draw(){
    ctx.clearRect(0,0,W,H);
    var gap=W/N,bw=Math.max(2,gap*.42),mid=H/2;
    for(var i=0;i<N;i++){
      amp[i]+=(target[i]-amp[i])*.22;
      var h=Math.max(1.5,amp[i]*H*.46);
      var a=.25+.75*Math.min(1,amp[i]*1.6);
      ctx.fillStyle='rgba(12,68,124,'+a.toFixed(3)+')';
      var x=i*gap+(gap-bw)/2;
      ctx.beginPath();
      if(ctx.roundRect)ctx.roundRect(x,mid-h,bw,h*2,bw/2);else ctx.rect(x,mid-h,bw,h*2);
      ctx.fill();
    }
  }
  function render(line,n,caret){
    // n = nombre de caractères visibles (crochets exclus du comptage)
    var s='',k=0,inTerm=false;
    for(var i=0;i<line.length&&k<n;i++){
      var c=line[i];
      if(c==='['){s+='<span class="term">';inTerm=true;continue}
      if(c===']'){s+='</span>';inTerm=false;continue}
      s+=c==='<'?'&lt;':c;k++;
    }
    if(inTerm)s+='</span>';
    out.innerHTML=s+(caret?'<span class="caret"></span>':'');
  }
  function plain(line){return line.replace(/[\[\]]/g,'')}
  window.addEventListener('resize',function(){size();draw()});
  size();

  if(reduce){render(LINES[0],999,false);for(var i=0;i<N;i++)target[i]=amp[i]=.15+.25*Math.abs(Math.sin(i*.7));draw();return}

  var li=0,t0=0,phase='speak',dur=0,visible=true;
  if(IO)new IntersectionObserver(function(es){visible=es[0].isIntersecting},{}).observe(cv);
  function start(now){t0=now;phase='speak';dur=plain(LINES[li]).length*48+500}
  function frame(now){
    if(!t0)start(now);
    var t=now-t0,line=LINES[li],len=plain(line).length;
    if(phase==='speak'){
      var p=Math.min(1,t/dur);
      for(var i=0;i<N;i++){
        var env=Math.sin(Math.PI*Math.min(1,p*1.05))*.9;
        target[i]=env*(.25+.75*Math.abs(Math.sin(t/90+i*.55)*Math.cos(t/170-i*.31)))*(.6+.4*Math.random());
      }
      render(line,Math.floor(len*Math.min(1,p*1.12)),true);
      if(p>=1){phase='hold';t0=now}
    }else if(phase==='hold'){
      for(var j=0;j<N;j++)target[j]=0;
      render(line,len,true);
      if(t>2600){phase='clear';t0=now}
    }else{
      out.style.opacity=Math.max(0,1-t/350);
      if(t>380){out.style.opacity=1;li=(li+1)%LINES.length;start(now)}
    }
    if(visible)draw();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
