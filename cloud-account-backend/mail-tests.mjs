import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mailReady,sendResetEmail} from './worker/mail.mjs';

const configured=provider=>({XAR_EMAIL_PROVIDER:provider,XAR_EMAIL_API_KEY:'test-mail-key-not-real',XAR_EMAIL_FROM:'cloud@example.com',XAR_EMAIL_REGION:'eu'});
const link='https://xar-cloud.stunningherring.chatgpt.site/#reset='+'a'.repeat(64);

test('Customer.io requires an explicit supported region and complete server configuration',()=>{
 const env=configured('customerio');assert.equal(mailReady(env),true);
 for(const key of ['XAR_EMAIL_REGION','XAR_EMAIL_API_KEY','XAR_EMAIL_FROM']){const missing={...env};delete missing[key];assert.equal(mailReady(missing),false)}
 assert.equal(mailReady({...env,XAR_EMAIL_REGION:'other'}),false);
 assert.equal(mailReady({...env,XAR_EMAIL_PROVIDER:'unknown'}),false);
});

test('Customer.io sends to the account region with Bearer auth and private reset content',async()=>{
 const original=globalThis.fetch,requests=[];
 globalThis.fetch=async(url,options)=>{requests.push({url,options,body:JSON.parse(options.body)});return new Response('{}',{status:200})};
 try{for(const region of ['eu','us']){
  const env={...configured('customerio'),XAR_EMAIL_REGION:region};await sendResetEmail(env,'player@example.com',link);
  const r=requests.at(-1);assert.equal(r.url,region==='eu'?'https://api-eu.customer.io/v1/send/email':'https://api.customer.io/v1/send/email');
  assert.equal(r.options.headers.Authorization,'Bearer '+env.XAR_EMAIL_API_KEY);assert.equal(r.options.headers['api-key'],undefined);
  assert.equal(r.body.to,'player@example.com');assert.deepEqual(r.body.identifiers,{email:'player@example.com'});
  assert.equal(r.body.tracked,false);assert.equal(r.body.disable_message_retention,true);assert.equal(r.body.send_to_unsubscribed,true);
  assert.ok(r.body.body_plain.includes(link));assert.ok(r.body.body.includes(link));assert.equal(r.body.from,'XaR Cloud <cloud@example.com>');
 }
 await sendResetEmail(configured('customerio'),'player@example.com','https://example.com/?value=<script>&other="x"');
 assert.ok(!requests.at(-1).body.body.includes('<script>'));assert.ok(requests.at(-1).body.body.includes('&lt;script&gt;'));
 }finally{globalThis.fetch=original}
});

test('existing mail providers retain their endpoints, payloads and credentials',async()=>{
 const original=globalThis.fetch,requests=[];globalThis.fetch=async(url,options)=>{requests.push({url,options,body:JSON.parse(options.body)});return new Response('{}',{status:202})};
 try{
  const resend=configured('resend');await sendResetEmail(resend,'player@example.com',link);let r=requests.at(-1);
  assert.equal(r.url,'https://api.resend.com/emails');assert.equal(r.options.headers.Authorization,'Bearer '+resend.XAR_EMAIL_API_KEY);assert.deepEqual(r.body.to,['player@example.com']);assert.ok(r.body.text.includes(link));
  const brevo=configured('brevo');await sendResetEmail(brevo,'player@example.com',link);r=requests.at(-1);
  assert.equal(r.url,'https://api.brevo.com/v3/smtp/email');assert.equal(r.options.headers['api-key'],brevo.XAR_EMAIL_API_KEY);assert.deepEqual(r.body.to,[{email:'player@example.com'}]);assert.ok(r.body.textContent.includes(link));
 }finally{globalThis.fetch=original}
});

test('provider rejection and missing configuration fail without exposing response secrets or retrying sends',async()=>{
 const original=globalThis.fetch;let count=0;globalThis.fetch=async()=>{count++;return new Response('provider-private-data',{status:403})};
 try{await assert.rejects(sendResetEmail(configured('customerio'),'player@example.com',link),error=>!error.message.includes('provider-private-data'));assert.equal(count,1);
  await assert.rejects(sendResetEmail({...configured('customerio'),XAR_EMAIL_REGION:''},'player@example.com',link));assert.equal(count,1);
 }finally{globalThis.fetch=original}
});
