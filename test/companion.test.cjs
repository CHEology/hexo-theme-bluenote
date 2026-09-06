const {test}=require('node:test');
const assert=require('node:assert/strict');
const {writeFileSync}=require('node:fs');
const {join}=require('node:path');
const {fixture}=require('./support.cjs');

function prepare(companion, privatePost=false) {
  return base=>writeFileSync(join(base,'source/_posts/companion.md'),
    '---\ntitle: Companion fixture\ndate: 2026-01-01\npermalink: companion/\n'+
    'private_post: '+privatePost+'\ncompanion: '+JSON.stringify(companion)+'\n---\n\nOriginal fixture body.\n');
}
test('related text is a single escaped HTTPS strip before adjacent-post navigation',async()=>{
  const f=await fixture({defaults:true,prepare:prepare({url:'https://example.test/writing/修图/',label:'Response <one>',aria_label:'Read the response'})});
  try {
    const html=f.read('companion/index.html');
    assert.equal((html.match(/class="post-companion__link"/g)||[]).length,1);
    assert.match(html,/https:\/\/example.test\/writing\/%E4%BF%AE%E5%9B%BE\//);
    assert.match(html,/Response &lt;one&gt;/);
    assert(html.indexOf('Original fixture body.</p>')<html.indexOf('class="post-companion"'));
    assert(html.indexOf('class="post-companion"')<html.indexOf('class="post-nav"'));
    assert.match(html,/<span>Response &lt;one&gt;<\/span><svg[^>]*icon--arrow-up-right/);
    assert.match(html,/id="icon-arrow-up-right"/);
    assert.doesNotMatch(f.read('reading/index.html'),/post-companion__link|post-nav--companion/);
    assert.doesNotMatch(html,/role="tab"|target="_blank"/);
  } finally {f.cleanup();}
});
test('private posts omit the related link; unsafe destinations fail the build',async()=>{
  const f=await fixture({defaults:true,prepare:prepare({url:'https://example.test/response/',label:'Response'},true)});
  try {assert.doesNotMatch(f.read('companion/index.html'),/post-companion__link|post-nav--companion/);}finally{f.cleanup();}
  await assert.rejects(fixture({defaults:true,prepare:prepare({url:'javascript:alert(1)',label:'Response'})}),/HTTPS/);
});
test('a companion remains available when adjacent-post navigation is disabled',async()=>{
  const f=await fixture({defaults:true,theme:{post:{prev_next:false}},prepare:prepare({url:'https://example.test/response/',label:'reflection'})});
  try {
    const html=f.read('companion/index.html');
    assert.match(html,/post-companion__link/);
    assert.doesNotMatch(html,/<a class="post-nav__(?:prev|next)"/);
  }finally{f.cleanup();}
});
