const {test}=require('node:test');
const assert=require('node:assert/strict');
const {existsSync,writeFileSync,mkdirSync}=require('node:fs');
const {join}=require('node:path');
const {fixture}=require('./support.cjs');

test('Notes are off by default and leave no routes or assets',async()=>{
  const f=await fixture({defaults:true});
  try {
    assert.ok(!existsSync(join(f.publicDir,'notes/index.html')));
    assert.ok(!existsSync(join(f.publicDir,'js/notes.js')));
    assert.doesNotMatch(f.read('about/index.html'),/about-avatar--link/);
  } finally {f.cleanup();}
});

test('Notes build a timeline, note pages, tag pages and a search index kept apart from posts',async()=>{
  const f=await fixture({root:'/site/'});
  try {
    const timeline=f.read('notes/index.html');
    assert.equal((timeline.match(/<article class="note"/g)||[]).length,3);
    // Newest first, with the note's own permalink and an encoded tag link.
    assert.ok(timeline.indexOf('note-20260110-0800')<timeline.indexOf('note-20260102-0930'));
    assert.match(timeline,/href="\/site\/notes\/20260105-2115\/"/);
    assert.match(timeline,/href="\/site\/notes\/tags\/%E6%95%A3%E6%AD%A5\/"/);
    assert.match(timeline,/<meta name="robots" content="noindex">/);
    assert.match(timeline,/href="\/site\/css\/notes.css\?v=/);
    assert.match(timeline,/src="\/site\/js\/notes.js\?v=/);
    assert.match(timeline,/data-notes-search hidden/);
    assert.doesNotMatch(timeline,/data-notes-composer/);
    assert.match(timeline,/<div class="note__body markdown-body"><p>Notes may also have no tags at all.<\/p>/);
    const single=f.read('notes/20260105-2115/index.html');
    assert.equal((single.match(/<article class="note"/g)||[]).length,1);
    assert.match(single,/href="\/site\/reading\/"/);
    const tagged=f.read('notes/tags/散步/index.html');
    assert.equal((tagged.match(/<article class="note"/g)||[]).length,1);
    assert.match(tagged,/aria-current="page">#散步/);
    const index=JSON.parse(f.read('notes/search.json'));
    assert.deepEqual(index.notes.map(n=>n.id),['20260110-0800','20260105-2115','20260102-0930']);
    assert.match(index.notes[1].text,/Evening walk along the river/);
    assert.deepEqual(JSON.parse(f.read('notes/tags.json')).tags.map(t=>t.name),['reading','walking','散步']);
    // Posts, archives and the site search do not see notes.
    for (const page of ['index.html','archives/index.html','search.xml']) assert.doesNotMatch(f.read(page),/Evening walk along the river|notes\/20260105/);
    assert.doesNotMatch(f.read('index.html'),/notes\.(?:css|js)/);
  } finally {f.cleanup();}
});

test('Notes paginate, emit a composer mount only on the first page, and link the avatar quietly',async()=>{
  const f=await fixture({theme:{
    notes:{per_page:2,language:'zh-CN',compose:{repo:'someone/site',branch:'master'}},
    about:{avatar:'/images/cover.svg',avatar_link:'/notes/',avatar_label:'Notes'}
  }});
  try {
    const first=f.read('notes/index.html'),second=f.read('notes/page/2/index.html');
    assert.equal((first.match(/<article class="note"/g)||[]).length,2);
    assert.equal((second.match(/<article class="note"/g)||[]).length,1);
    assert.match(first,/rel="next">较早</);
    assert.match(second,/rel="prev">较新</);
    assert.match(first,/data-notes-composer data-repo="someone&#x2F;site" data-branch="master" data-dir="source&#x2F;_notes"/);
    assert.doesNotMatch(second,/data-notes-composer/);
    assert.match(first,/placeholder="搜索短文"/);
    assert.match(f.read('about/index.html'),/<a class="about-avatar about-avatar--link" href="\/notes\/" aria-label="Notes"><img/);
  } finally {f.cleanup();}
});

test('Invalid notes fail the build with the file name',async()=>{
  const write=(name,text)=>base=>{mkdirSync(join(base,'source/_notes'),{recursive:true});writeFileSync(join(base,'source/_notes',name),text);};
  await assert.rejects(fixture({prepare:write('bad-date.md','---\ndate: yesterday\n---\nText\n')}),/bad-date\.md/);
  await assert.rejects(fixture({prepare:write('bad tag.md','---\ndate: 2026-01-01 00:00:00\n---\nText\n')}),/URL-safe/);
  await assert.rejects(fixture({prepare:write('tags.md','---\ndate: 2026-01-01 00:00:00\ntags:\n  - two words\n---\nText\n')}),/tags\.md/);
  await assert.rejects(fixture({prepare:write('empty.md','---\ndate: 2026-01-01 00:00:00\n---\n\n')}),/empty\.md/);
  await assert.rejects(fixture({theme:{notes:{compose:{repo:'not a repo'}}}}),/owner\/name/);
});
