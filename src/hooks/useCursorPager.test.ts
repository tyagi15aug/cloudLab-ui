import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useCursorPager } from "./useCursorPager";

describe("useCursorPager", () => {
  it("starts with no cursor and no previous page", () => {
    const { result } = renderHook(() => useCursorPager());

    expect(result.current.cursor).toBeUndefined();
    expect(result.current.hasPrev).toBe(false);
  });

  it("advances the cursor and tracks that a previous page now exists", () => {
    const { result } = renderHook(() => useCursorPager());

    act(() => result.current.goNext("cursor-1"));

    expect(result.current.cursor).toBe("cursor-1");
    expect(result.current.hasPrev).toBe(true);
  });

  it("ignores goNext when the next cursor is null or undefined", () => {
    const { result } = renderHook(() => useCursorPager());

    act(() => result.current.goNext(null));
    expect(result.current.cursor).toBeUndefined();
    expect(result.current.hasPrev).toBe(false);

    act(() => result.current.goNext(undefined));
    expect(result.current.cursor).toBeUndefined();
    expect(result.current.hasPrev).toBe(false);
  });

  it("pops the cursor stack on goPrev, returning to undefined for the first page", () => {
    const { result } = renderHook(() => useCursorPager());

    act(() => result.current.goNext("cursor-1"));
    act(() => result.current.goNext("cursor-2"));
    expect(result.current.cursor).toBe("cursor-2");

    act(() => result.current.goPrev());
    expect(result.current.cursor).toBe("cursor-1");
    expect(result.current.hasPrev).toBe(true);

    act(() => result.current.goPrev());
    expect(result.current.cursor).toBeUndefined();
    expect(result.current.hasPrev).toBe(false);
  });

  it("does nothing on goPrev when there is no history", () => {
    const { result } = renderHook(() => useCursorPager());

    act(() => result.current.goPrev());

    expect(result.current.cursor).toBeUndefined();
    expect(result.current.hasPrev).toBe(false);
  });

  it("reset clears both the cursor and the history stack", () => {
    const { result } = renderHook(() => useCursorPager());

    act(() => result.current.goNext("cursor-1"));
    act(() => result.current.goNext("cursor-2"));
    act(() => result.current.reset());

    expect(result.current.cursor).toBeUndefined();
    expect(result.current.hasPrev).toBe(false);
  });
});
