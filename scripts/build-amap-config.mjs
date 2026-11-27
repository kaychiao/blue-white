import {writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const output=fileURLToPath(new URL('../data/amap-config.js',import.meta.url));
// JS SDK credentials are browser-visible by design. Restrict them to your website domain.
const key=process.env.AMAP_JS_KEY?.trim(),securityJsCode=process.env.AMAP_JS_SECURITY_CODE?.trim();
const config=key&&securityJsCode?{key,securityJsCode}:null;
await writeFile(output,`// Browser JS SDK configuration.\nwindow.amapBrowserConfig = ${JSON.stringify(config).replaceAll('<','\\u003c')};\n`);
console.log(config?'AMap browser configuration prepared.':'::warning::AMAP_JS_KEY or AMAP_JS_SECURITY_CODE missing; nearby search disabled.');
