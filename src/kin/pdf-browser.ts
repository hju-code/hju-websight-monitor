export async function extractPdfInBrowser(file: File) {
  if (file.size > 50 * 1024 * 1024) throw new Error("PDF는 50MB 이하로 올려 주세요.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (new TextDecoder().decode(bytes.slice(0, 5)) !== "%PDF-") throw new Error("올바른 PDF 파일을 선택해 주세요.");
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/api/pdf-worker";
  const task = pdfjs.getDocument({ data: bytes, useSystemFonts: true });
  try {
    const pdf = await task.promise;
    if (pdf.numPages > 150) throw new Error("PDF는 150쪽 이하로 나누어 올려 주세요.");
    const sections: { page: number; text: string }[] = [];
    let emptyPages = 0;
    for (let page = 1; page <= pdf.numPages; page++) {
      const data = await pdf.getPage(page);
      const content = await data.getTextContent();
      const text = content.items.map(item => "str" in item ? item.str : "").join(" ").replace(/\s+/g, " ").trim();
      if (text.length < 20) emptyPages++;
      for (let offset = 0; offset < text.length; offset += 1800) {
        const part = text.slice(offset, offset + 2100).trim();
        if (part.length >= 20) sections.push({ page, text: part });
      }
      data.cleanup();
    }
    if (!sections.length) throw new Error("PDF에서 글자를 추출하지 못했습니다. 이미지 PDF는 OCR 처리 후 올려 주세요.");
    if (sections.length > 300) throw new Error("자료가 너무 깁니다. PDF를 나누어 올려 주세요.");
    return { sections, emptyPages };
  } finally { await task.destroy(); }
}
