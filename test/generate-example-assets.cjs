// Original geometric fixtures, not stock photography or personal blog assets.
const { PNG } = require('pngjs');
const { writeFileSync, mkdirSync } = require('node:fs');
const { join } = require('node:path');
const target = join(__dirname, '../example/source/images');
mkdirSync(target, { recursive: true });
const photos = [];
const palettes = [[234,229,217,70,97,112],[213,215,205,55,71,80],[225,211,188,128,94,67],[197,212,215,55,91,107],[226,221,210,86,99,85],[212,208,198,92,75,66]];
for (let i = 1; i <= 6; i++) {
  const ratio = i === 2 || i === 5 ? 2/3 : 3/2;
  const images = [1200,600,300].map(width => {
    const height = Math.round(width / ratio), png = new PNG({width,height});
    const [r,g,b,fr,fg,fb] = palettes[i-1];
    for (let y=0;y<height;y++) for(let x=0;x<width;x++) {
      const u=x/width,v=y/height;
      const inside = u > .2 && u < .8 && v > .25 && v < .75;
      const shift = Math.round((u+v)*8);
      const at=(y*width+x)*4;
      png.data[at]=(inside?fr:r)+shift;png.data[at+1]=(inside?fg:g)+shift;png.data[at+2]=(inside?fb:b)+shift;png.data[at+3]=255;
    }
    const name='study-'+i+(width===1200?'':'-'+width)+'.png';
    writeFileSync(join(target,name),PNG.sync.write(png));
    return {src:'/images/'+name,width,height};
  });
  photos.push({id:'study-'+i,alt:'Geometric study '+i,full:images[0],previews:images.slice(1),...(i===3||i===4?{spread:'pair'}:{})});
}
mkdirSync(join(__dirname,'../example/source/_data'),{recursive:true});
writeFileSync(join(__dirname,'../example/source/_data/gallery.json'),JSON.stringify({version:1,photos},null,2)+'\n');
