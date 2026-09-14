import {after,NextRequest,NextResponse} from 'next/server';
import {handleShopLineEvent,verifyShopLineSignature,flushShopNotifications} from '@/lib/shop-line';
export const runtime='nodejs';
export async function POST(request:NextRequest){
 const body=await request.text();
 if(!verifyShopLineSignature(body,request.headers.get('x-line-signature')))return NextResponse.json({error:'Invalid signature'},{status:401});
 try{
  const payload=JSON.parse(body);
  if(!Array.isArray(payload.events))return NextResponse.json({error:'Invalid events'},{status:400});
  // Pairing is atomic and one-time; notifications have durable deduplication.
  for(const event of payload.events){
   if(!event?.source || typeof event.type!=='string')continue;
   await handleShopLineEvent(event);
  }
  after(async()=>{try{await flushShopNotifications();}catch{console.error('Shop LINE dispatch deferred');}});
  return NextResponse.json({ok:true});
 }catch{return NextResponse.json({error:'Shop webhook processing failed'},{status:500});}
}
