const { mkdtempSync, cpSync, mkdirSync, symlinkSync, writeFileSync, readFileSync, existsSync, statSync, createReadStream, rmSync } = require('node:fs');
const { join, dirname, extname, resolve, sep } = require('node:path');
const { tmpdir } = require('node:os');
const { createServer } = require('node:http');
const { createGzip } = require('node:zlib');
const Hexo = require('hexo');
const yaml = require('js-yaml');
const themeRoot = resolve(__dirname,'..');
function merge(a,b) {
  const result={...a};
  for(const [k,v] of Object.entries(b||{})) result[k]=v && typeof v==='object' && !Array.isArray(v)?merge(a?.[k]||{},v):v;
  return result;
}
async function fixture(options={}) {
  const base=mkdtempSync(join(tmpdir(),'bluenote-theme-'));
  cpSync(join(themeRoot,'example/source'),join(base,'source'),{recursive:true});
  mkdirSync(join(base,'themes'));
  symlinkSync(themeRoot,join(base,'themes/bluenote'),'dir');
  symlinkSync(dirname(dirname(require.resolve('hexo/package.json'))),join(base,'node_modules'),'dir');
  const pkg=JSON.parse(readFileSync(join(themeRoot,'example/package.json'),'utf8'));
  delete pkg.dependencies['hexo-theme-bluenote'];
  writeFileSync(join(base,'package.json'),JSON.stringify(pkg));
  const site=yaml.load(readFileSync(join(themeRoot,'example/_config.yml'),'utf8'));
  const root=options.root||'/';site.root=root;site.url='https://example.test'+root;
  writeFileSync(join(base,'_config.yml'),JSON.stringify(merge(site,options.site)));
  const initial=options.defaults?{}:yaml.load(readFileSync(join(themeRoot,'example/_config.bluenote.yml'),'utf8'));
  writeFileSync(join(base,'_config.bluenote.yml'),JSON.stringify(merge(initial,options.theme)));
  if(options.prepare) options.prepare(base);
  const hexo=new Hexo(base,{silent:true});
  let failure;
  try { await hexo.init(); await hexo.call('generate',{}); }
  catch(error) { failure=error; }
  finally {await hexo.exit();}
  if(failure){rmSync(base,{recursive:true,force:true});throw failure;}
  return {base,root,publicDir:join(base,'public'),read:p=>readFileSync(join(base,'public',p),'utf8'),cleanup:()=>rmSync(base,{recursive:true,force:true})};
}
async function serve(publicDir,root='/') {
  const mime={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.json':'application/json','.xml':'application/xml','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg'};
  const server=createServer((req,res)=>{
    let pathname;
    try {pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);} catch {res.writeHead(400);res.end();return;}
    if(!pathname.startsWith(root)) {res.writeHead(404);res.end();return;}
    let file=resolve(publicDir,pathname.slice(root.length));
    if(file!==resolve(publicDir)&&!file.startsWith(resolve(publicDir)+sep)) {res.writeHead(404);res.end();return;}
    if(existsSync(file)&&statSync(file).isDirectory())file=join(file,'index.html');
    if(!existsSync(file)){res.writeHead(404);res.end('Not found');return;}
    const type=mime[extname(file)]||'application/octet-stream';
    const gzip=/text|json|xml|svg/.test(type)&&String(req.headers['accept-encoding']).includes('gzip');
    res.writeHead(200,{'content-type':type,'cache-control':'public,max-age=600',...(gzip?{'content-encoding':'gzip'}:{})});
    if(extname(file)==='.html'){
      // WebKit upgrades loopback HTTP resources to HTTPS; production HTML keeps this policy.
      const html=readFileSync(file,'utf8').replace(/<meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests">/g,'');
      if(gzip){const z=createGzip();z.pipe(res);z.end(html);}else res.end(html);
      return;
    }
    const stream=createReadStream(file);if(gzip)stream.pipe(createGzip()).pipe(res);else stream.pipe(res);
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  return {url:'http://127.0.0.1:'+server.address().port+root,close:()=>new Promise(resolve=>server.close(resolve))};
}
module.exports={fixture,serve,themeRoot};
