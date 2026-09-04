const {test}=require('node:test');
const assert=require('node:assert/strict');
const {existsSync}=require('node:fs');
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
