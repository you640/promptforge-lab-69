export interface DiffLine {
  type: "same" | "add" | "remove";
  text: string;
}

/** Jednoduchý LCS diff po riadkoch pre diff viewer. */
export function diffLines(a: string, b: string): DiffLine[] {
  const left = a.split("\n");
  const right = b.split("\n");
  const n = left.length;
  const m = right.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));

  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = left[i] === right[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const out: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (left[i] === right[j]) {
      out.push({ type: "same", text: left[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      out.push({ type: "remove", text: left[i] });
      i++;
    } else {
      out.push({ type: "add", text: right[j] });
      j++;
    }
  }
  while (i < n) out.push({ type: "remove", text: left[i++] });
  while (j < m) out.push({ type: "add", text: right[j++] });
  return out;
}
