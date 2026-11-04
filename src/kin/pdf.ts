export type PdfSection = { page: number; text: string };

export async function extractPdfSections(bytes: Uint8Array): Promise<{ sections: PdfSection[]; totalPages: number; emptyPages: number }> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const task = pdfjs.getDocument({ data: bytes, useSystemFonts: true });
  try {
    const pdf = await task.promise;
    if (pdf.numPages > 150) throw new Error("PDF는 150쪽 이하로 나누어 올려 주세요.");
    const sections: PdfSection[] = [];
    let emptyPages = 0;
    for (let page = 1; page <= pdf.numPages; page++) {
      const pageData = await pdf.getPage(page);
      const content = await pageData.getTextContent();
      const text = content.items.map(item => "str" in item ? item.str : "").join(" ").replace(/\s+/g, " ").trim();
      if (text.length < 20) emptyPages++;
      for (let offset = 0; offset < text.length; offset += 1800) {
        const part = text.slice(offset, offset + 2100).trim();
        if (part.length >= 20) sections.push({ page, text: part });
      }
      pageData.cleanup();
    }
    if (!sections.length) throw new Error("PDF에서 글자를 추출하지 못했습니다. 이미지로만 된 PDF는 문자 인식(OCR) 후 다시 올려 주세요.");
    if (sections.length > 300) throw new Error("자료가 너무 깁니다. PDF를 나누어 올려 주세요.");
    return { sections, totalPages: pdf.numPages, emptyPages };
  } finally { await task.destroy(); }
}
