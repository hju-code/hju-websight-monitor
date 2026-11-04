import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { extractPdfSections } from "../src/kin/pdf";

test("extracts Korean admission material into searchable sections", async () => {
  const result = await extractPdfSections(new Uint8Array(await readFile("tests/fixtures/korean-brief.pdf")));
  assert.equal(result.totalPages, 1);
  assert.equal(result.emptyPages, 0);
  assert.match(result.sections[0].text, /혜전대학교 간호학과/);
});

test("rejects invalid PDF content", async () => {
  await assert.rejects(extractPdfSections(new TextEncoder().encode("not a pdf")));
});
