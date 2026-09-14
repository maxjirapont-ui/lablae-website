import { isShopOriginAllowed } from "@/lib/shop-origin";
import {NextRequest,NextResponse,after} from 'next/server';
import {uploadShopSlip} from '@/lib/shop-slips';
import {OrderError,shopIsPublic} from '@/lib/shop-orders';
import {isAdminAuthenticated} from '@/lib/admin-auth';
import {flushShopNotifications} from '@/lib/shop-line';
const headers={'Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow','Referrer-Policy':'no-referrer'};
export async function POST(request:NextRequest,{params}:{params:Promise<{token:string}>}) {
 if(!isShopOriginAllowed(request))return NextResponse.json({error:'คำขอไม่ถูกต้อง'},{status:403,headers});
 if(process.env.NODE_ENV==='production' && !shopIsPublic() && !(await isAdminAuthenticated()))return NextResponse.json({error:'ยังไม่เปิดรับออเดอร์'},{status:403,headers});
 if(Number(request.headers.get('content-length'))>6*1024*1024)return NextResponse.json({error:'ไฟล์ใหญ่เกินไป'},{status:413,headers});
 try{
  const form=await request.formData();const file=form.get('file');if(!(file instanceof File))throw new OrderError('กรุณาเลือกรูปสลิป');
  const id=await uploadShopSlip((await params).token,String(form.get('requestKey')||''),file);
  after(async()=>{try{await flushShopNotifications();}catch{console.error('Shop LINE dispatch deferred');}});
  return NextResponse.json({ok:true,id},{headers});
 }catch(error){return NextResponse.json({error:error instanceof OrderError?error.message:'ส่งสลิปไม่สำเร็จ กรุณาลองอีกครั้ง'},{status:error instanceof OrderError?error.status:500,headers});}
}
