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
test('related text is a single escaped HTTPS footer outside unchanged article content',async()=>{
  const f=await fixture({defaults:true,prepare:prepare({url:'https://example.test/writing/修图/',label:'Response <one>',aria_label:'Read the response'})});
  try {
    const html=f.read('companion/index.html');
    assert.equal((html.match(/class="post-companion"/g)||[]).length,1);
    assert.match(html,/https:\/\/example.test\/writing\/%E4%BF%AE%E5%9B%BE\//);
    assert.match(html,/Response &lt;one&gt;/);
    assert(html.indexOf('Original fixture body.</p>')<html.indexOf('class="post-companion"'));
    assert(html.indexOf('class="post-companion"')<html.indexOf('class="post-nav"'));
    assert.doesNotMatch(f.read('reading/index.html'),/class="post-companion"/);
    assert.doesNotMatch(html,/role="tab"|target="_blank"/);
  } finally {f.cleanup();}
});
test('private posts omit the related link; unsafe destinations fail the build',async()=>{
  const f=await fixture({defaults:true,prepare:prepare({url:'https://example.test/response/',label:'Response'},true)});
  try {assert.doesNotMatch(f.read('companion/index.html'),/class="post-companion"/);}finally{f.cleanup();}
  await assert.rejects(fixture({defaults:true,prepare:prepare({url:'javascript:alert(1)',label:'Response'})}),/HTTPS/);
});
