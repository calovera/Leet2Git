import { parseQuestionMeta } from "../src/utils/parseQuestionMeta";

test("parseQuestionMeta minimal", () => {
  const json = {
    data: { question: {
      title: "Two Sum",
      titleSlug: "two-sum",
      difficulty: "Easy",
      topicTags: [{ name: "Array" }]
    }}
  };
  const m = parseQuestionMeta(json);
  expect(m).toEqual({
    slug: "two-sum",
    title: "Two Sum",
    difficulty: "Easy",
    tag: "Array"
  });
});

test("parseQuestionMeta with missing title uses slug", () => {
  const json = {
    data: { question: {
      titleSlug: "binary-search",
      difficulty: "Easy",
      topicTags: [{ name: "Binary Search" }]
    }}
  };
  const m = parseQuestionMeta(json);
  expect(m).toEqual({
    slug: "binary-search",
    title: "binary search",
    difficulty: "Easy",
    tag: "Binary Search"
  });
});

test("parseQuestionMeta with no topic tags uses Uncategorized", () => {
  const json = {
    data: { question: {
      title: "Custom Problem",
      titleSlug: "custom-problem",
      difficulty: "Medium",
      topicTags: []
    }}
  };
  const m = parseQuestionMeta(json);
  expect(m).toEqual({
    slug: "custom-problem",
    title: "Custom Problem",
    difficulty: "Medium",
    tag: "Uncategorized"
  });
});

test("parseQuestionMeta returns null for invalid data", () => {
  expect(parseQuestionMeta({})).toBeNull();
  expect(parseQuestionMeta({ data: {} })).toBeNull();
  expect(parseQuestionMeta({ data: { question: {} } })).toBeNull();
  expect(parseQuestionMeta(null)).toBeNull();
});