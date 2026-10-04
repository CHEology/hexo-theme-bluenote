const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const vm=require('node:vm');
const helpers={};
vm.runInNewContext(readFileSync(join(__dirname,'../scripts/post-end.js'),'utf8'),{
  require,hexo:{extend:{helper:{register:(name,fn)=>helpers[name]=fn}}}
});
const context={...helpers,__:()=> 'Back to top'};
const link=helpers.post_end_link.call(context);
const render=content=>helpers.post_content_with_end.call(context,{content});

test('end mark preserves exact authored HTML and follows the final paragraph',()=>{
  for(const html of [
    '<p>前一段。</p><p>末句。</p>\n',
    '<div class="literary-panel"><p>末句 <em>in italics</em>。</p></div>\n<!-- end -->',
    '<blockquote><p>末句 <a href="/">link</a></p></blockquote>',
    '<ul><li>One</li><li>Two</li></ul>',
    '<p>He said &quot;hello&quot;.</p>'
  ]) {
    const result=render(html);
    assert.equal(result.replace(link,''),html);
    assert.match(result,/class="post-end"[\s\S]*<\/a><\/(?:p|li)>/);
    assert.equal(result.split('class="post-end"').length-1,1);
    assert.doesNotMatch(result,/post-end-line/);
  }
});
test('non-prose endings keep the end mark outside media, code and tables',()=>{
  for(const html of ['<p><img src="photo.jpg"></p>','<figure><img src="photo.jpg"><figcaption>Caption</figcaption></figure>','<pre><code>example</code></pre>','<table><tr><td>Cell</td></tr></table>']) {
    assert.equal(render(html),html+'<div class="post-end-line">'+link+'</div>');
  }
});
test('private source remains untouched and the accessible label is escaped',()=>{
  assert.equal(helpers.post_content_with_end.call(context,{content:'<p>Locked</p>',private_post:true}),'<p>Locked</p>');
  assert.match(helpers.post_end_link.call({__:()=> 'Return "up"'}),/aria-label="Return &quot;up&quot;"/);
});
