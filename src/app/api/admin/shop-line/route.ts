import {NextRequest,NextResponse} from 'next/server';
import {isAdminAuthenticated} from '@/lib/admin-auth';
import {makeShopPairingCode,disconnectShopGroup,flushShopNotifications,getShopLineStatus} from '@/lib/shop-line';
export async function POST(request:NextRequest){
 const headers={'Cache-Control':'private, no-store'};
 if(!(await isAdminAuthenticated()))return NextResponse.json({error:'กรุณาเข้าสู่ระบบ'},{status:401,headers});
 if(request.headers.get('origin')!==request.nextUrl.origin)return NextResponse.json({error:'คำขอไม่ถูกต้อง'},{status:403,headers});
 try{const body=await request.json();
  if(body.action==='pair')return NextResponse.json({command:await makeShopPairingCode()},{headers});
  if(body.action==='disconnect')await disconnectShopGroup();
  else if(body.action==='retry')await flushShopNotifications();
  else return NextResponse.json({error:'คำสั่งไม่ถูกต้อง'},{status:400,headers});
  return NextResponse.json({ok:true,status:await getShopLineStatus()},{headers});
 }catch{return NextResponse.json({error:'ดำเนินการไม่สำเร็จ'},{status:500,headers});}
}
