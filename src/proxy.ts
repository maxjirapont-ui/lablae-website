import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  const rawPath = request.nextUrl.pathname;

  let decodedPath = '';
  try {
    decodedPath = decodeURIComponent(rawPath);
  } catch {
    decodedPath = rawPath;
  }

  // 1. Google Sites Menu URLs
  // Matches: /เมนอาหาร/ชดขนโตก, /เมนูอาหาร/ชุดขันโตก, /เมนอาหาร/ขาวพนผก, etc.
  if (
    decodedPath.includes('เมนอาหาร') ||
    decodedPath.includes('เมนูอาหาร') ||
    rawPath.includes('%E0%B9%80%E0%B8%A1%E0%B8%99%E0%B8%AD%E0%B8%B2%E0%B8%AB%E0%B8%B2%E0%B8%A3') ||
    rawPath.includes('%E0%B9%80%E0%B8%A1%E0%B8%99%E0%B8%B9%E0%B8%AD%E0%B8%B2%E0%B8%AB%E0%B8%B2%E0%B8%A3')
  ) {
    if (decodedPath.includes('ขนโตก') || decodedPath.includes('ขันโตก')) {
      url.pathname = '/menu';
      url.search = '?category=' + encodeURIComponent('เซทขันโตก');
      return NextResponse.redirect(url, 301);
    }
    if (decodedPath.includes('ขาวพน') || decodedPath.includes('ข้าวพัน')) {
      url.pathname = '/menu';
      url.search = '?category=' + encodeURIComponent('ข้าวพันผัก');
      return NextResponse.redirect(url, 301);
    }
    url.pathname = '/menu';
    url.search = '';
    return NextResponse.redirect(url, 301);
  }

  // 2. Google Sites About / Directions URLs
  // Matches: /รจกเรา/เสนทางมาราน, /รู้จักเรา/เส้นทางมาร้าน, /รจกเรา/บาน-100-ป, etc.
  if (
    decodedPath.includes('รจกเรา') ||
    decodedPath.includes('รู้จักเรา') ||
    rawPath.includes('%E0%B8%A3%E0%B8%88%E0%B8%81%E0%B9%80%E0%B8%A3%E0%B8%B2') ||
    rawPath.includes('%E0%B8%A3%E0%B8%B9%E0%B9%89%E0%B8%88%E0%B8%B1%E0%B8%81%E0%B9%80%E0%B8%A3%E0%B8%B2')
  ) {
    if (
      decodedPath.includes('เสนทาง') ||
      decodedPath.includes('เส้นทาง') ||
      decodedPath.includes('แผนที่') ||
      decodedPath.includes('มาราน') ||
      decodedPath.includes('มาร้าน')
    ) {
      url.pathname = '/directions';
      url.search = '';
      return NextResponse.redirect(url, 301);
    }
    url.pathname = '/about';
    url.search = '';
    return NextResponse.redirect(url, 301);
  }

  // 3. Google Sites Articles / Blog URLs
  // Matches: /บทความ/...
  if (
    decodedPath.includes('บทความ') ||
    rawPath.includes('%E0%B8%9A%E0%B8%97%E0%B8%84%E0%B8%A7%E0%B8%B2%E0%B8%A1')
  ) {
    url.pathname = '/blog';
    url.search = '';
    return NextResponse.redirect(url, 301);
  }

  // 4. Old /home
  if (decodedPath === '/home' || decodedPath === '/home/') {
    url.pathname = '/';
    url.search = '';
    return NextResponse.redirect(url, 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - uploads (uploaded files)
     * - images (static images)
     * - api routes
     */
    '/((?!_next/static|_next/image|favicon.ico|uploads|images|api).*)',
  ],
};
