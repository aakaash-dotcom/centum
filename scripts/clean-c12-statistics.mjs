import fs from 'fs';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

async function processPdf() {
  console.log('Downloading C12 Statistics TM (1hEGihKcKP8uA8ea1HJjgy9YEs8aUNQnV)...');
  const url = 'https://drive.google.com/uc?id=1hEGihKcKP8uA8ea1HJjgy9YEs8aUNQnV&export=download';
  const res = await fetch(url);
  if (!res.ok) throw new Error('Download failed: ' + res.status);
  const pdfBytes = await res.arrayBuffer();
  console.log(`Downloaded ${pdfBytes.byteLength} bytes. Loading into PDFDocument...`);

  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pageCount = pdfDoc.getPageCount();
  console.log(`Loaded PDF with ${pageCount} pages.`);

  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const smallFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Strip third-party header stamp on every page:
  // The header stamp "www.tntextbooks.org" is located at the top margin (top 20-30pt of page).
  // We apply a clean white patch over the header band and stamp our clean Centum attribution.
  for (let i = 0; i < pageCount; i++) {
    const page = pdfDoc.getPage(i);
    const { width, height } = page.getSize();

    // Top header margin strip:
    // Mask out the top 28 points where the www.tntextbooks.org header sits
    page.drawRectangle({
      x: 0,
      y: height - 28,
      width: width,
      height: 28,
      color: rgb(1, 1, 1), // Clean white background patch
    });

    // Except on the cover page (page 0), add a subtle clean header if desired or leave clean
    if (i > 0) {
      // Clean header stamp
      page.drawText('CENTUM · Class 12 Statistics (TM)', {
        x: 36,
        y: height - 20,
        size: 7.5,
        font: font,
        color: rgb(0.48, 0.23, 0.93), // #7C3AED Centum purple
      });
      page.drawText('centum.app', {
        x: width - 85,
        y: height - 20,
        size: 7.5,
        font: smallFont,
        color: rgb(0.43, 0.16, 0.85),
      });
    }

    if ((i + 1) % 50 === 0 || i === pageCount - 1) {
      console.log(`Processed ${i + 1}/${pageCount} pages...`);
    }
  }

  const cleanBytes = await pdfDoc.save();
  const outPath = 'scripts/c12-statistics-tm-clean.pdf';
  fs.writeFileSync(outPath, cleanBytes);
  console.log(`SUCCESS! Saved clean sanitized PDF to ${outPath} (${cleanBytes.length} bytes).`);
}

processPdf().catch(console.error);
