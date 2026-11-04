import { test } from "node:test";
import assert from "node:assert/strict";
import { rankKeywordsByCount } from "../src/stats/keyword-ranking";

test("ranks keywords by result count within each search site and handles ties and missing counts", () => {
  const rows = [
    { phrase: "혜전대", engine: "naver", tab: "web", resultTotal: 80044 },
    { phrase: "혜전", engine: "naver", tab: "web", resultTotal: 204244 },
    { phrase: "혜전대학교", engine: "naver", tab: "web", resultTotal: 170619 },
    { phrase: "같은 건수", engine: "naver", tab: "web", resultTotal: 170619 },
    { phrase: "누락", engine: "naver", tab: "web", resultTotal: null },
    { phrase: "다른 검색", engine: "daum", tab: "web", resultTotal: 1 },
  ];
  const ranks = rankKeywordsByCount(rows);
  assert.deepEqual(ranks.map(r => [r.phrase, r.keywordRank]), [["다른 검색", 1], ["혜전", 1], ["혜전대학교", 2], ["같은 건수", 2], ["혜전대", 4], ["누락", null]]);
});
