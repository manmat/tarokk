type Figure =
  | { kind: "trull" }
  | { kind: "double-play" }
  | { kind: "four-kings" }
  | { kind: "ulti" }
  | { kind: "eight-trumps" }
  | { kind: "nine-trumps" }
  | { kind: "xxi- catch" }
  | { kind: "volat" }
  | { kind: "contra", figure: Figure }
