/* eslint-disable @typescript-eslint/no-require-imports -- Isolated HTTP integration test. */
const assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const fs=require('node:fs/promises');
const path=require('node:path');
const os=require('node:os');
const {randomUUID}=require('node:crypto');
const {open}=require('sqlite');
const sqlite3=require('sqlite3');

(async()=>{
  const root=path.resolve(__dirname,'..');
  const directory=await fs.mkdtemp(path.join(os.tmpdir(),'lablae-meta-booking-'));
  const filename=path.join(directory,'test.db');
  let db,server,log='';
  const base='http://127.0.0.1:3058';
  const request=(suffix,options={})=>fetch(base+suffix,{...options,signal:AbortSignal.timeout(10000)});
  const post=(body,consent=true)=>request('/api/reservations',{method:'POST',headers:{'content-type':'application/json',...(consent?{cookie:'lablae_meta_consent=yes'}:{})},body:JSON.stringify(body)});
  try {
    await fs.copyFile(path.join(root,'database/seed.db'),filename);
    db=await open({filename,driver:sqlite3.Database}); await db.exec('DELETE FROM reservations');
    server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-H','127.0.0.1','-p','3058'],{
      cwd:root,env:{...process.env,NODE_ENV:'production',NODE_OPTIONS:'',DATA_DIR:directory,DATABASE_PATH:filename,UPLOAD_DIR:path.join(directory,'uploads'),SITE_URL:base,
        META_MEASUREMENT_ENABLED:'1',META_PIXEL_ID:'2173890399880386',META_CAPI_ENABLED:'0',META_CAPI_ACCESS_TOKEN:'',
        LINE_CHANNEL_ACCESS_TOKEN:'',LINE_CHANNEL_SECRET:'',LINE_GROUP_ID:'',SHOP_LINE_CHANNEL_ACCESS_TOKEN:'',SHOP_LINE_CHANNEL_SECRET:'',SHOP_LINE_NOTIFICATIONS_ENABLED:'0'},
      stdio:['ignore','pipe','pipe']});
    server.stdout.on('data',d=>log+=d);server.stderr.on('data',d=>log+=d);
    let ready=false; for(let i=0;i<80;i++){try{ready=(await request('/robots.txt')).ok;}catch{}if(ready)break;await new Promise(r=>setTimeout(r,100));}
    assert(ready,log);
    const date=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Bangkok',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(Date.now()+86400000));
    const input={name:'TEST ONLY',phone:'0861112233',date,time:'12:00',guests:2,notes:'Isolated test only',requestKey:randomUUID()};
    const failed=await post({...input,phone:'invalid'}); assert.equal(failed.status,400); assert.equal((await failed.json()).metaEventId,undefined);
    const response=await post(input);assert.equal(response.status,200);const receipt=await response.json();
    assert.match(receipt.metaEventId,/^[a-f0-9]{64}$/);
    assert(!receipt.metaEventId.includes(receipt.bookingCode));
    const again=await post(input);assert.equal(again.status,200);const retry=await again.json();assert.equal(retry.metaEventId,receipt.metaEventId);
    assert.equal((await db.get('SELECT COUNT(*) n FROM reservations')).n,1);
    const {emitBookingLead}=await import('../src/lib/meta-measurement.ts');
    const calls=[],seen=new Set();
    for(const data of [receipt,retry])emitBookingLead((...args)=>calls.push(args),'2173890399880386',data.metaEventId,seen);
    assert.equal(calls.length,1);assert.equal(calls[0][2],'Lead');
    const noConsent=await post({...input,phone:'0861112244',time:'13:00',requestKey:randomUUID()},false);assert.equal(noConsent.status,200);assert.equal((await noConsent.json()).metaEventId,undefined);
    console.log('PASS: saved booking emits one opaque Lead; retry stays one booking/Lead; invalid booking and no-consent return no tracking ID; LINE/CAPI disabled; temporary database only.');
  } finally {
    server?.kill('SIGTERM');if(server)await new Promise(r=>{server.once('exit',r);setTimeout(r,2000).unref();});
    await db?.close();await fs.rm(directory,{recursive:true,force:true});
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
