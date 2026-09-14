import {NextRequest,NextResponse} from 'next/server';
import {isAdminAuthenticated} from '@/lib/admin-auth';
import {readShopSlip} from '@/lib/shop-slips';
const headers={'Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'};
export async function GET(_request:NextRequest,{params}:{params:Promise<{id:string;slipId:string}>}){
 if(!(await isAdminAuthenticated()))return new NextResponse(null,{status:401,headers});
 const {id,slipId}=await params;
 if(!/^\d+$/.test(id)||!/^\d+$/.test(slipId))return new NextResponse(null,{status:404,headers});
 try{const slip=await readShopSlip(Number(id),Number(slipId));if(!slip)return new NextResponse(null,{status:404,headers});return new NextResponse(new Uint8Array(slip.bytes),{headers:{...headers,'Content-Type':slip.type}});}catch{return new NextResponse(null,{status:404,headers});}
}
