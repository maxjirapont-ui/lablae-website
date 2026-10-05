import sharp from 'sharp';
import {createRequire} from 'node:module';
import path from 'node:path';

const unreadable = 'เปิดไฟล์นี้ไม่ได้ กรุณาใช้สลิปที่บันทึกจากแอปธนาคาร หรือภาพหน้าจอสลิป';

/** Decode content before accepting a slip; a file header alone does not prove it opens. */
export async function validateShopSlipBytes(bytes:Buffer):Promise<'pdf'|'png'|'webp'|'jpg'> {
  if (bytes.subarray(0,5).toString('ascii') === '%PDF-') {
    const {getDocument} = await import('pdfjs-dist/legacy/build/pdf.mjs');
    // Keep Node's filesystem resolver; bundling require.resolve can return a module ID.
    const nodeRequire = createRequire(import.meta.url);
    const resolvePackage = nodeRequire.resolve.bind(nodeRequire);
    const pdfRoot = path.dirname(resolvePackage('pdfjs-dist/package.json'));
    const loading = getDocument({data:new Uint8Array(bytes),maxImageSize:20_000_000,standardFontDataUrl:path.join(pdfRoot,'standard_fonts')+path.sep,cMapUrl:path.join(pdfRoot,'cmaps')+path.sep,wasmUrl:path.join(pdfRoot,'wasm')+path.sep,disableFontFace:true,useSystemFonts:false,useWorkerFetch:false,enableXfa:false,stopAtErrors:true,verbosity:0});
    try {
      const document = await loading.promise;
      if (!document.numPages) throw new Error(unreadable);
      if (document.numPages > 50) throw new Error('PDF นี้มีหลายหน้า กรุณาแนบเฉพาะหน้าสลิป หรือใช้ภาพหน้าจอสลิป');
      for (let n=1;n<=document.numPages;n++) {
        const page = await document.getPage(n);
        const viewport = page.getViewport({scale:1});
        if (!Number.isFinite(viewport.width) || !Number.isFinite(viewport.height) || viewport.width <= 0 || viewport.height <= 0) throw new Error(unreadable);
        // Decode PDF graphics onto a bounded canvas before accepting the file.
        const scaled = page.getViewport({scale:Math.min(1,1000/Math.max(viewport.width,viewport.height))});
        const factory = document.canvasFactory as {create(width:number,height:number):{canvas:HTMLCanvasElement;context:CanvasRenderingContext2D};destroy(canvas:{canvas:HTMLCanvasElement;context:CanvasRenderingContext2D}):void};
        const canvas = factory.create(Math.max(1,Math.ceil(scaled.width)),Math.max(1,Math.ceil(scaled.height)));
        // In pinned PDF.js 6.4.299 a stream error can also finish a partial render.
        // Require the worker's real final chunk; its error handler bypasses this method.
        const workerPage = page as unknown as {_renderPageChunk(chunk:{lastChunk:boolean},state:unknown):void};
        const receiveChunk = workerPage._renderPageChunk;
        let complete = false;
        if (typeof receiveChunk !== 'function') { factory.destroy(canvas); throw new Error(unreadable); }
        workerPage._renderPageChunk = function(chunk,state) {
          if (chunk.lastChunk) complete = true;
          receiveChunk.call(this,chunk,state);
        };
        try {
          await page.render({canvas:canvas.canvas,canvasContext:canvas.context,viewport:scaled}).promise;
          if (!complete) throw new Error(unreadable);
        } finally { workerPage._renderPageChunk = receiveChunk; factory.destroy(canvas); }
        page.cleanup();
      }
      return 'pdf';
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('PDF นี้')) throw error;
      throw new Error(unreadable);
    } finally { await loading.destroy(); }
  }
  try {
    const decoder = sharp(bytes,{limitInputPixels:60_000_000,failOn:'warning'});
    const image = await decoder.metadata();
    if (!['jpeg','png','webp'].includes(image.format || '') || (image.pages || 1)>1) throw new Error(unreadable);
    // Resizing bounds the decoded output; libvips still reads pixels and rejects truncated data.
    await decoder.rotate().resize({width:2400,height:2400,fit:'inside',withoutEnlargement:true}).raw().toBuffer();
    return image.format === 'png' ? 'png' : image.format === 'webp' ? 'webp' : 'jpg';
  } catch { throw new Error(unreadable); }
}
