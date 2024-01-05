// Write your tests here
test("sanity", () => {
  expect(true).toBe(true);
});

test("correct enviorment variable", () => {
  expect(process.env.NODE_ENV).toBe("testing");
});
