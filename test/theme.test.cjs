const {test}=require('node:test');
const assert=require('node:assert/strict');
const {existsSync,writeFileSync}=require('node:fs');
const {join}=require('node:path');
const {fixture}=require('./support.cjs');

test('default installation works below a subdirectory without Gallery or a private archive',async()=>{
  const f=await fixture({defaults:true,root:'/notes/'});
  try {
    const home=f.read('index.html'),post=f.read('reading/index.html');
    assert.match(home,/href="\/notes\/css\/bluenote.css\?v=/);
    assert.match(home,/"path":"\/notes\/search.xml"/);
    assert.match(home,/"privateManifest":""/);
    assert.ok(!existsSync(join(f.publicDir,'gallery/index.html')));
    assert.ok(!existsSync(join(f.publicDir,'js/gallery.js')));
    assert.doesNotMatch(home,/src="[^"]*gallery.js/);
    assert.doesNotMatch(post,/<body[^>]*photo-post/);
    assert.equal((post.match(/<figcaption/g)||[]).length,3);
    assert.match(post,/class="post-toc"/);
    assert.match(f.read('photo-study/index.html'),/<body[^>]*photo-post/);
  } finally {f.cleanup();}
});

test('configuration switches reach the browser, and content language is independent of navigation',async()=>{
  const f=await fixture({theme:{search:{enable:false},post:{lightbox:false,language:'zh-CN',photo_layout:{enable:false}}}});
  try {
    const html=f.read('reading/index.html');
    assert.match(html,/<html lang="zh-CN"/);
    assert.match(html,/"lightbox":false/);
    assert.doesNotMatch(html,/href="#site-search"/);
    assert.doesNotMatch(f.read('photo-study/index.html'),/<body[^>]*photo-post/);
    assert.match(html,/>Archives</);
  } finally {f.cleanup();}
});

test('Gallery supports a custom path, translated controls and page-only assets',async()=>{
  const f=await fixture({root:'/notes/',theme:{gallery:{path:'photographs',language:'zh-CN',labels:{few:'A few'}}}});
  try {
    const few=f.read('photographs/index.html'),all=f.read('photographs/all/index.html');
    assert.match(few,/href="\/notes\/photographs\/all\/"/);
    assert.match(few,/>A few</);
    assert.match(few,/aria-label="照片浏览"/);
    assert.equal((all.match(/data-gallery-open=/g)||[]).length,6);
    assert.doesNotMatch(f.read('index.html'),/<(?:link|script)[^>]*(?:css|js)\/gallery/);
    assert.match(few,/js\/gallery-selection.js\?v=/);
    assert.doesNotMatch(all,/<script[^>]*src="[^"]*gallery-selection/);
    assert.equal((few.match(/<h1/g)||[]).length,1);
  } finally {f.cleanup();}
});

test('missing Gallery data is an intentional empty page; invalid paths fail before generating',async()=>{
  const f=await fixture({theme:{gallery:{data:'empty'}}});
  try {assert.match(f.read('gallery/index.html'),/No photographs yet/);assert.doesNotMatch(f.read('gallery/index.html'),/<dialog/);}finally{f.cleanup();}
  await assert.rejects(fixture({theme:{gallery:{path:'../escape'}}}),/URL-safe/);
});

test('letterbox design: one bar everywhere, a dated index grouped by year, no cover banner or typing',async()=>{
  const f=await fixture({root:'/notes/',theme:{design:'letterbox',home:{cover:'/images/cover.svg',slogan:'Quiet things.'}}});
  try {
    const home=f.read('index.html'),post=f.read('reading/index.html');
    for(const html of [home,post]) assert.match(html,/<html[^>]*data-design="letterbox"/);
    assert.match(home,/<img class="letterbox-frame__image" src="\/notes\/images\/cover.svg"/);
    assert.match(home,/rel="preload" as="image" fetchpriority="high" href="\/notes\/images\/cover.svg"/);
    assert.match(home,/<p class="letterbox-dock__line"><span>Quiet things\.<\/span><\/p>/);
    assert.doesNotMatch(home,/id="banner"|typed\.min\.js|home-folio|index-card/);
    const years=[...home.matchAll(/<h2 class="letterbox-year__title">(\d{4})<\/h2>/g)].map(m=>Number(m[1]));
    assert.ok(years.length>0);
    assert.deepEqual(years,[...years].sort((a,b)=>b-a));
    assert.match(home,/<a class="letterbox-entry__link" href="\/notes\/[^"]+" data-excerpt="[^"]*">\s*<time class="letterbox-entry__date" datetime="\d{4}-\d{2}-\d{2}">\d{2}\.\d{2}<\/time>/);
    assert.match(post,/<time class="masthead__date" datetime="\d{4}-\d{2}-\d{2}">\d{4}\.\d{2}\.\d{2}<\/time>\s*<h1 class="masthead__title">/);
    assert.match(f.read('archives/index.html'),/<time class="listing__date" datetime="[^"]+">\d{2}\.\d{2}<\/time>/);
    const css=f.read('css/bluenote.css');
    assert.match(css,/html\[data-design="letterbox"\] \{[^}]*--lb-bar-h: 88px/);
    assert.match(css,/html:not\(\.private-reading-unlocked\) \.letterbox-entry\[data-private-entry\]/);
    assert.doesNotMatch(css,/100vw/);
  } finally {f.cleanup();}
});

test('classic remains the default: no letterbox markup unless a site opts in',async()=>{
  const f=await fixture({defaults:true});
  try {
    const home=f.read('index.html');
    assert.doesNotMatch(home,/data-design=|letterbox-frame/);
    assert.match(home,/id="banner" class="home-cover"/);
    assert.doesNotMatch(f.read('reading/index.html'),/masthead__date/);
  } finally {f.cleanup();}
});

test('letterbox home includes all years and all entries beyond the old row capacity',async()=>{
  const f=await fixture({theme:{design:'letterbox'},prepare(base){
    for(let i=0;i<25;i++) writeFileSync(join(base,'source/_posts',`continuous-${i}.md`),
      `---\ntitle: Continuous ${i}\ndate: ${2000+i}-01-02 12:00:00\n---\nPublic paragraph.\n`);
    writeFileSync(join(base,'source/_posts','private-history.md'),
      '---\ntitle: Locked history\ndate: 1990-01-01 12:00:00\nprivate_post: true\nprivate_id: example-private\ndescription: MUST NOT APPEAR\n---\nMUST NOT APPEAR\n');
  }});
  try {
    const home=f.read('index.html');
    for(let i=0;i<25;i++) assert.match(home,new RegExp(`>Continuous ${i}</span>`));
    assert.match(home,/<section class="letterbox-year" data-private-year="true">/);
    assert.match(home,/<li class="letterbox-entry" data-private-entry="true">/);
    assert.match(home,/>Locked history<\/span>/);
    assert.doesNotMatch(home,/MUST NOT APPEAR/);
    assert.ok((home.match(/<h2 class="letterbox-year__title">/g)||[]).length>25);
  } finally {f.cleanup();}
});
