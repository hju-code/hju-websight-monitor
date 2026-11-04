import { test } from "node:test";
import assert from "node:assert/strict";
import { selectAnswerKnowledge } from "../src/kin/retrieval";

test("department answers require matching department and admission materials", () => {
  const entries = [
    { title: "모집요강", summary: "요강 내용", embedding: [1, 0], kind: "admission" as const },
    { title: "간호학과", summary: "학과 내용", embedding: [0.1, 0.99], kind: "department" as const, departmentName: "간호학과" },
    { title: "다른 학과", summary: "다른 내용", embedding: [1, 0], kind: "department" as const, departmentName: "조리학과" },
  ];
  const selected = selectAnswerKnowledge([1, 0], entries, "간호학과");
  assert.deepEqual(selected.map(x => x.title), ["모집요강", "간호학과"]);
  assert.throws(() => selectAnswerKnowledge([1, 0], entries, "없는 학과"), /학과 자료/);
  assert.throws(() => selectAnswerKnowledge([1, 0], entries.slice(1), "간호학과"), /모집요강/);
  assert.deepEqual(selectAnswerKnowledge([1, 0], entries, "").map(x => x.title), ["모집요강"]);
});
