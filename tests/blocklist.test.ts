import { expect, test } from "vitest";
import { checkBlocklist } from "@/strategies/blocklist";

test("blocklist should correctly block provided words", async () => {
  expect(await checkBlocklist("Hello, world!", ["hello"], false)).toEqual([true, ["hello"]]);
});

test("blocklist should not block words that are not in the list", async () => {
  expect(await checkBlocklist("Hello, world!", [], false)).toEqual([false, null]);
});

test("exactMatch true: should block an exact match when word stands alone", async () => {
  expect(await checkBlocklist("This is a movie rip", ["rip"], true)).toEqual([true, ["rip"]]);
});

test("exactMatch true: should not block when the blocklist word is only a substring", async () => {
  expect(await checkBlocklist("I love JavaScript", ["rip"], true)).toEqual([false, null]);
});

test("exactMatch false: should block substring matches", async () => {
  expect(await checkBlocklist("I love JavaScript", ["rip"], false)).toEqual([true, ["rip"]]);
});
