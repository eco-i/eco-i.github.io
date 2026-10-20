import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
import {resolve,join,extname} from 'node:path';
const root=process.argv[2]?resolve(process.argv[2]):null;
if(!root) throw Error('Pass generated LOCAL QA READY directory');
const index=readFileSync(join(root,'index.html'),'utf8');
if(!index.includes('workmoa-environment" content="local-synthetic-qa"') || /https?:\/\/[a-z0-9]{20}\.supabase\.co/i.test(index)) throw Error('Refusing non-local QA document');
const allowed=new Set(['index.html','maintenance-20261018.js','maintenance-mobile-20261018.css','site-update-history.js','site-update-history.css','future-holidays-2028-2035.js','version.json','manifest.webmanifest','icon-192.png','icon-512.png']);
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json; charset=utf-8','.png':'image/png'};
createServer((req,res)=>{
 if(req.method!=='GET' && req.method!=='HEAD'){res.writeHead(405);res.end();return;}
 let path;
 try{path=decodeURIComponent(new URL(req.url,'http://127.0.0.1:54330').pathname).replace(/^\/+/,'')||'index.html';}catch{res.writeHead(400);res.end();return;}
 if(!allowed.has(path) || path.includes('/') || path.includes('\\')){res.writeHead(404);res.end();return;}
 try{
  const data=readFileSync(join(root,path));
  res.writeHead(200,{'Content-Type':types[extname(path)],'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex, nofollow'});
  res.end(req.method==='HEAD'?undefined:data);
 }catch{res.writeHead(404);res.end();}
}).listen(54330,'127.0.0.1',()=>console.log('LOCAL QA PAGE: http://127.0.0.1:54330'));
