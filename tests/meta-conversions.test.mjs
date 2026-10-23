import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
const source = readFileSync(new URL('../src/lib/meta-conversions.ts', import.meta.url), 'utf8').replace("'./meta-measurement'", JSON.stringify(new URL('../src/lib/meta-measurement.ts', import.meta.url).href));
const js = ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {sendMetaBooking, bookingMetaEventId} = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);

test('CAPI is gated, bounded, redacted and shares a stable booking ID', async () => {
  const env = {...process.env}; const originalFetch = globalThis.fetch; const calls=[];
  try {
    process.env.META_PIXEL_ID='2173890399880386'; process.env.META_CAPI_ACCESS_TOKEN='test-token';
    process.env.META_GRAPH_API_VERSION='v26.0'; process.env.META_MEASUREMENT_ENABLED='1'; process.env.META_CAPI_ENABLED='1';
    globalThis.fetch=async (url, options)=>{calls.push({url,options});return Response.json({events_received:1});};
    const input={id:42, consent:true, fbp:'fb.1.1792740000000.123456789',userAgent:'Test browser'};
    await sendMetaBooking({...input,consent:false});
    await sendMetaBooking({...input,fbp:'invalid'});
    assert.equal(calls.length,0);
    assert.equal(await sendMetaBooking(input),true);
    const data=JSON.parse(calls[0].options.body).data[0];
    assert.equal(data.event_id,bookingMetaEventId(42));
    assert.notEqual(data.event_id,bookingMetaEventId(43));
    assert.equal(data.event_name,'Lead');
    assert.deepEqual(Object.keys(data.user_data).sort(),['client_user_agent','fbp']);
    assert.equal(data.event_source_url,'https://www.lablae.net/');
    assert.equal(calls[0].options.redirect,'error');
    assert(calls[0].options.signal instanceof AbortSignal);
    process.env.META_CAPI_ENABLED='0';
    await sendMetaBooking(input); assert.equal(calls.length,1);
    process.env.META_CAPI_ENABLED='1'; globalThis.fetch=async()=>{calls.push({});throw new Error('offline');};
    assert.equal(await sendMetaBooking(input),false); assert.equal(calls.length,2);
  } finally {globalThis.fetch=originalFetch; for(const key of Object.keys(process.env))if(!(key in env))delete process.env[key];Object.assign(process.env,env);}
});
