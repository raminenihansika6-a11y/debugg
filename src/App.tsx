// @ts-nocheck
import "./styles.css";
import { useState, useEffect } from "react";
import { auth, db } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider, // ← add this
  signInWithPopup,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";

// Daily challenge rotates every 24 hours based on the date

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;600;700;800;900&family=JetBrains+Mono:wght@400;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#0a0a12;--bg2:#111120;--card:#161628;--card2:#1c1c35;
  --border:rgba(255,255,255,0.08);
  --lime:#c8f135;--cyan:#00e5ff;--pink:#ff4fcb;--orange:#ff7b2c;
  --yellow:#ffe03b;--purple:#a855f7;--green:#22c55e;--red:#ef4444;
  --text:#f0f0ff;--muted:#6b7280;
  --font:'Nunito',sans-serif;--mono:'JetBrains Mono',monospace;--display:'Fredoka One',sans-serif;
}
body.light{
  --bg:#f0f4f8;--bg2:#e8edf2;--card:#ffffff;--card2:#f0f4f8;
  --border:rgba(0,0,0,0.10);
  --text:#1a1a2e;--muted:#5a6a7a;
  --lime:#5a9e0a;--cyan:#0077aa;
}
body.light .nav{background:rgba(240,244,248,0.92);}
body.light .code-line:hover{background:rgba(0,0,0,0.05);}
body.light .code-line.selected{background:rgba(239,68,68,0.12);}
body.light .code-line.correct{background:rgba(34,197,94,0.12);}
body.light .nav-logo{background:linear-gradient(90deg,var(--lime),var(--cyan));-webkit-background-clip:text;-webkit-text-fill-color:transparent;}
html{scroll-behavior:smooth}
body{background:var(--bg);color:var(--text);font-family:var(--font);overflow-x:hidden;min-height:100vh}
::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:var(--lime);border-radius:3px}
button{cursor:pointer;border:none;outline:none;font-family:var(--font)}
input,textarea,select{font-family:var(--font);outline:none;border:none;background:none;color:var(--text)}
.page{min-height:100vh;animation:fadeUp .4s ease}
@keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
@keyframes pulse-anim{0%,100%{opacity:1}50%{opacity:.5}}
@keyframes fall{from{transform:translateY(-60px) rotate(0deg);opacity:1}to{transform:translateY(110vh) rotate(720deg);opacity:0}}
.btn-lime{background:var(--lime);color:#0a0a12;font-weight:900;padding:14px 32px;border-radius:50px;font-size:15px;transition:transform .15s,box-shadow .15s;box-shadow:0 0 24px rgba(200,241,53,.3)}
.btn-lime:hover{transform:translateY(-2px) scale(1.04);box-shadow:0 0 44px rgba(200,241,53,.55)}
.btn-ghost{background:transparent;color:var(--text);font-weight:700;padding:13px 28px;border-radius:50px;font-size:14px;border:2px solid var(--border);transition:all .2s}
.btn-ghost:hover{border-color:var(--lime);color:var(--lime);transform:translateY(-2px)}
.btn-sm{padding:8px 18px;font-size:13px;font-weight:700;border-radius:50px;transition:all .15s}
.card{background:var(--card);border:1px solid var(--border);border-radius:20px;padding:24px;transition:transform .2s,border-color .2s}
.card:hover{border-color:rgba(200,241,53,.25);transform:translateY(-2px)}
.tag{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:50px;font-size:11px;font-weight:800}
.tag-easy{background:rgba(34,197,94,.15);color:var(--green)}
.tag-medium{background:rgba(255,123,44,.15);color:var(--orange)}
.tag-hard{background:rgba(239,68,68,.15);color:var(--red)}
.tag-lang{background:rgba(0,229,255,.1);color:var(--cyan)}
.nav{position:fixed;top:0;left:0;right:0;z-index:999;display:flex;align-items:center;justify-content:space-between;padding:14px 32px;background:rgba(10,10,18,.9);backdrop-filter:blur(18px);border-bottom:1px solid var(--border)}
.nav-logo{font-family:var(--display);font-size:24px;background:linear-gradient(90deg,var(--lime),var(--cyan));-webkit-background-clip:text;-webkit-text-fill-color:transparent;cursor:pointer}
.nav-links{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.nav-link{background:none;color:var(--muted);font-weight:700;font-size:13px;padding:7px 14px;border-radius:50px;transition:all .2s}
.nav-link:hover,.nav-link.active{color:var(--lime);background:rgba(200,241,53,.08)}
.grid-bg{position:absolute;inset:0;pointer-events:none;background-image:linear-gradient(rgba(200,241,53,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(200,241,53,.04) 1px,transparent 1px);background-size:48px 48px}
.glow{position:absolute;border-radius:50%;filter:blur(80px);opacity:.18;pointer-events:none}
.input-field{width:100%;background:var(--card2);border:1.5px solid var(--border);border-radius:14px;padding:14px 18px;color:var(--text);font-size:15px;font-weight:600;transition:border-color .2s}
.input-field:focus{border-color:var(--lime)}
.input-field::placeholder{color:var(--muted)}
.xp-bar{height:8px;background:rgba(255,255,255,.08);border-radius:50px;overflow:hidden}
.xp-fill{height:100%;background:linear-gradient(90deg,var(--lime),var(--cyan));border-radius:50px;transition:width .7s ease}
.code-line{font-family:var(--mono);font-size:13px;line-height:1.9;padding:2px 12px;border-radius:6px;cursor:pointer;transition:background .15s;white-space:pre;display:block;position:relative}
.code-line:hover{background:rgba(255,255,255,.05)}
.code-line.selected{background:rgba(239,68,68,.18);border-left:3px solid var(--red)}
.code-line.correct{background:rgba(34,197,94,.12);border-left:3px solid var(--green)}
.emoji-particle{position:fixed;font-size:30px;animation:fall linear forwards;pointer-events:none;z-index:9999}
.tab{padding:10px 20px;border-radius:50px;font-weight:800;font-size:13px;background:none;color:var(--muted);transition:all .2s}
.tab.active{background:var(--lime);color:#0a0a12}
.badge-box{display:flex;flex-direction:column;align-items:center;gap:6px;padding:16px;border-radius:16px;background:var(--card2);border:1px solid var(--border)}
.lb-row{display:flex;align-items:center;gap:14px;padding:12px 18px;border-radius:14px;border:1px solid transparent;transition:all .2s}
.lb-row:hover{border-color:var(--border);background:rgba(255,255,255,.02)}
.post{background:var(--card);border:1px solid var(--border);border-radius:18px;padding:20px;margin-bottom:14px;transition:border-color .2s}
.post:hover{border-color:rgba(200,241,53,.2)}
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.75);backdrop-filter:blur(8px);z-index:1000;display:flex;align-items:center;justify-content:center;animation:fadeUp .2s ease}
.modal{background:var(--card);border:1px solid var(--border);border-radius:24px;padding:32px;max-width:480px;width:90%}
.chip{display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border-radius:50px;font-size:11px;font-weight:700;background:var(--card2);border:1px solid var(--border);color:var(--muted)}
.level-node{width:64px;height:64px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:22px;cursor:pointer;transition:all .25s;border:3px solid transparent;position:relative;margin:0 auto}
.level-node.done{border-color:var(--lime);background:rgba(200,241,53,.1)}
.level-node.active{border-color:var(--cyan);background:rgba(0,229,255,.08);box-shadow:0 0 24px rgba(0,229,255,.3);animation:float 3s ease infinite}
.level-node.locked{border-color:var(--border);background:var(--card2);opacity:.5;cursor:not-allowed}
.level-conn{width:3px;height:36px;background:var(--border);margin:0 auto}
.level-conn.done{background:linear-gradient(to bottom,var(--lime),var(--cyan))}
`;

/* ── DATA ── */
// REPLACE your existing CHALLENGES constant with this entire block

const CHALLENGES = [
  // ─── PYTHON (10) ───────────────────────────────────────────
  {
    id: 101,
    lang: "Python",
    difficulty: "easy",
    errorType: "Syntax",
    title: "Off-by-one Loop",
    xp: 50,
    description:
      "This function should print numbers 1 to 5, but the output is wrong.",
    lines: [
      "def print_numbers():",
      "    for i in range(0, 5):",
      "        print(i)",
      "",
      "print_numbers()",
    ],
    bugLine: 1,
    fixed: "    for i in range(1, 6):",
    hint: "range() is exclusive of the end. Also check the start value!",
    expectedOutput: "1\n2\n3\n4\n5",
  },

  {
    id: 102,
    lang: "Python",
    difficulty: "medium",
    errorType: "Logic",
    title: "Broken Factorial",
    xp: 80,
    description: "Recursive factorial always returns 0. Fix the base case.",
    lines: [
      "def factorial(n):",
      "    if n == 0:",
      "        return 0",
      "    return n * factorial(n - 1)",
      "",
      "print(factorial(5))",
    ],
    bugLine: 2,
    fixed: "        return 1",
    hint: "0! is 1, not 0. That's the base case of any factorial.",
    expectedOutput: "120",
  },

  {
    id: 103,
    lang: "Python",
    difficulty: "hard",
    errorType: "Runtime",
    title: "Index Out of Range",
    xp: 120,
    description: "Accessing the last element crashes. Why?",
    lines: [
      "def last_item(lst):",
      "    return lst[len(lst)]",
      "",
      "print(last_item([10, 20, 30]))",
    ],
    bugLine: 1,
    fixed: "    return lst[len(lst) - 1]",
    hint: "Lists are 0-indexed. len=3 means last index is 2.",
    expectedOutput: "30",
  },

  {
    id: 104,
    lang: "Python",
    difficulty: "easy",
    errorType: "Syntax",
    title: "Missing Colon",
    xp: 40,
    description: "This function definition has a syntax error. Spot it.",
    lines: [
      "def greet(name)",
      "    print('Hello, ' + name)",
      "",
      "greet('World')",
    ],
    bugLine: 0,
    fixed: "def greet(name):",
    hint: "Python function definitions need a specific punctuation at the end.",
    expectedOutput: "Hello, World",
  },

  {
    id: 105,
    lang: "Python",
    difficulty: "medium",
    errorType: "Logic",
    title: "Wrong String Reverse",
    xp: 70,
    description: "This should reverse a string but returns the original.",
    lines: [
      "def reverse_str(s):",
      "    return s[::1]",
      "",
      "print(reverse_str('hello'))",
    ],
    bugLine: 1,
    fixed: "    return s[::-1]",
    hint: "Slicing step of 1 goes forward. What step goes backward?",
    expectedOutput: "olleh",
  },

  {
    id: 106,
    lang: "Python",
    difficulty: "medium",
    errorType: "Logic",
    title: "Sum of List Bug",
    xp: 75,
    description: "Should return sum of all numbers but always returns 0.",
    lines: [
      "def sum_list(nums):",
      "    total = 0",
      "    for n in nums:",
      "        total = n",
      "    return total",
      "",
      "print(sum_list([1,2,3,4]))",
    ],
    bugLine: 3,
    fixed: "        total += n",
    hint: "You're replacing total each time instead of adding to it.",
    expectedOutput: "10",
  },

  {
    id: 107,
    lang: "Python",
    difficulty: "hard",
    errorType: "Exception",
    title: "Division by Zero",
    xp: 110,
    description: "This calculator crashes on division. Add a guard.",
    lines: [
      "def divide(a, b):",
      "    return a / b",
      "",
      "print(divide(10, 0))",
    ],
    bugLine: 1,
    fixed: "    return a / b if b != 0 else 'Error: Division by zero'",
    hint: "Check if b is zero before dividing.",
    expectedOutput: "Error: Division by zero",
  },

  {
    id: 108,
    lang: "Python",
    difficulty: "easy",
    errorType: "Syntax",
    title: "Indentation Error",
    xp: 45,
    description: "Python is very strict about indentation. Find the mistake.",
    lines: [
      "def check(x):",
      "    if x > 0:",
      "    print('Positive')",
      "    else:",
      "        print('Non-positive')",
    ],
    bugLine: 2,
    fixed: "        print('Positive')",
    hint: "The print inside the if block needs more indentation.",
    expectedOutput: "Positive",
  },

  {
    id: 109,
    lang: "Python",
    difficulty: "hard",
    errorType: "Logic",
    title: "Palindrome Check Fail",
    xp: 130,
    description:
      "This should return True for palindromes but always returns False.",
    lines: [
      "def is_palindrome(s):",
      "    return s == s[1:]",
      "",
      "print(is_palindrome('racecar'))",
    ],
    bugLine: 1,
    fixed: "    return s == s[::-1]",
    hint: "s[1:] just removes the first character. How do you reverse a string?",
    expectedOutput: "True",
  },

  {
    id: 110,
    lang: "Python",
    difficulty: "medium",
    errorType: "Runtime",
    title: "Key Error in Dict",
    xp: 85,
    description: "Accessing a missing dictionary key crashes the program.",
    lines: ["data = {'name': 'Alice'}", "age = data['age']", "print(age)"],
    bugLine: 1,
    fixed: "age = data.get('age', 'Not found')",
    hint: "Use .get() with a default value instead of direct key access.",
    expectedOutput: "Not found",
  },

  // ─── JAVASCRIPT (10) ───────────────────────────────────────
  {
    id: 201,
    lang: "JavaScript",
    difficulty: "medium",
    errorType: "Logic",
    title: "Broken Factorial",
    xp: 80,
    description: "Recursive factorial always returns 0. Fix the base case.",
    lines: [
      "function factorial(n) {",
      "  if (n === 0) return 0;",
      "  return n * factorial(n - 1);",
      "}",
      "console.log(factorial(5));",
    ],
    bugLine: 1,
    fixed: "  if (n === 0) return 1;",
    hint: "What is the mathematical value of 0!?",
    expectedOutput: "120",
  },

  {
    id: 202,
    lang: "JavaScript",
    difficulty: "easy",
    errorType: "Syntax",
    title: "Missing Bracket",
    xp: 45,
    description: "This arrow function won't run. Find the syntax issue.",
    lines: [
      "const greet = (name) => {",
      "  console.log('Hello, ' + name);",
      "",
      "greet('World');",
    ],
    bugLine: 2,
    fixed: "};",
    hint: "Arrow functions with curly braces need a closing brace.",
    expectedOutput: "Hello, World",
  },

  {
    id: 203,
    lang: "JavaScript",
    difficulty: "medium",
    errorType: "Logic",
    title: "Array Sum Wrong",
    xp: 75,
    description: "Should sum all array elements but returns NaN.",
    lines: [
      "function sumArray(arr) {",
      "  let total = 0;",
      "  arr.forEach(n => total = n);",
      "  return total;",
      "}",
      "console.log(sumArray([1,2,3,4]));",
    ],
    bugLine: 2,
    fixed: "  arr.forEach(n => total += n);",
    hint: "You're assigning n to total each time, not adding.",
    expectedOutput: "10",
  },

  {
    id: 204,
    lang: "JavaScript",
    difficulty: "hard",
    errorType: "Logic",
    title: "Async Await Missing",
    xp: 130,
    description: "This async function doesn't wait for the result.",
    lines: [
      "async function getData() {",
      "  const res = fetch('https://api.example.com/data');",
      "  const json = await res.json();",
      "  return json;",
      "}",
    ],
    bugLine: 1,
    fixed: "  const res = await fetch('https://api.example.com/data');",
    hint: "fetch() returns a Promise — you need to await it before calling .json().",
    expectedOutput: "[object Object]",
  },

  {
    id: 205,
    lang: "JavaScript",
    difficulty: "easy",
    errorType: "Syntax",
    title: "Undefined Variable",
    xp: 50,
    description:
      "This code crashes because a variable is used before declaration.",
    lines: [
      "function sayHi() {",
      "  console.log(message);",
      "  const message = 'Hi!';",
      "}",
      "sayHi();",
    ],
    bugLine: 1,
    fixed: "  console.log('Hi!');",
    hint: "const variables are not hoisted. Use the value directly or move the declaration up.",
    expectedOutput: "Hi!",
  },

  {
    id: 206,
    lang: "JavaScript",
    difficulty: "medium",
    errorType: "Logic",
    title: "Wrong Comparison",
    xp: 80,
    description:
      "The equality check always returns false even for equal values.",
    lines: [
      "function isEqual(a, b) {",
      "  return a === b;",
      "}",
      "console.log(isEqual('5', 5));",
    ],
    bugLine: 1,
    fixed: "  return a == b;",
    hint: "=== checks type AND value. == checks only value.",
    expectedOutput: "true",
  },

  {
    id: 207,
    lang: "JavaScript",
    difficulty: "hard",
    errorType: "Runtime",
    title: "Cannot Read Property",
    xp: 120,
    description: "Accessing property on undefined crashes the app.",
    lines: ["const user = null;", "console.log(user.name);"],
    bugLine: 1,
    fixed: "console.log(user?.name ?? 'No user');",
    hint: "Use optional chaining ?. to safely access properties on null/undefined.",
    expectedOutput: "No user",
  },

  {
    id: 208,
    lang: "JavaScript",
    difficulty: "medium",
    errorType: "Logic",
    title: "String to Number",
    xp: 70,
    description: "Adding numbers but getting string concatenation instead.",
    lines: [
      "function add(a, b) {",
      "  return a + b;",
      "}",
      "console.log(add('5', 3));",
    ],
    bugLine: 1,
    fixed: "  return Number(a) + Number(b);",
    hint: "When one operand is a string, + does concatenation. Convert first.",
    expectedOutput: "8",
  },

  {
    id: 209,
    lang: "JavaScript",
    difficulty: "easy",
    errorType: "Logic",
    title: "Off by One Filter",
    xp: 55,
    description: "Should return numbers greater than 3 but misses some.",
    lines: [
      "const nums = [1,2,3,4,5];",
      "const result = nums.filter(n => n > 4);",
      "console.log(result);",
    ],
    bugLine: 1,
    fixed: "const result = nums.filter(n => n > 3);",
    hint: "Check the filter condition — should it be > 3 or > 4?",
    expectedOutput: "[4, 5]",
  },

  {
    id: 210,
    lang: "JavaScript",
    difficulty: "hard",
    errorType: "Exception",
    title: "JSON Parse Error",
    xp: 115,
    description:
      "Parsing invalid JSON crashes the program. Add error handling.",
    lines: [
      "function parseData(str) {",
      "  return JSON.parse(str);",
      "}",
      "console.log(parseData('not json'));",
    ],
    bugLine: 1,
    fixed:
      "  try { return JSON.parse(str); } catch(e) { return 'Invalid JSON'; }",
    hint: "Wrap JSON.parse in a try/catch block to handle invalid input.",
    expectedOutput: "Invalid JSON",
  },

  // ─── JAVA (10) ─────────────────────────────────────────────
  {
    id: 301,
    lang: "Java",
    difficulty: "easy",
    errorType: "Compile",
    title: "Missing Semicolon",
    xp: 40,
    description:
      "This Java snippet won't compile. Spot the single missing character.",
    lines: [
      "public class Hello {",
      "    public static void main(String[] args) {",
      '        System.out.println("Hello World")',
      "    }",
      "}",
    ],
    bugLine: 2,
    fixed: '        System.out.println("Hello World");',
    hint: "Every Java statement must end with a specific terminator.",
    expectedOutput: "Hello World",
  },

  {
    id: 302,
    lang: "Java",
    difficulty: "medium",
    errorType: "Logic",
    title: "Wrong Array Index",
    xp: 80,
    description:
      "Should print the last element but throws ArrayIndexOutOfBoundsException.",
    lines: [
      "int[] arr = {10, 20, 30, 40};",
      "System.out.println(arr[arr.length]);",
    ],
    bugLine: 1,
    fixed: "System.out.println(arr[arr.length - 1]);",
    hint: "Arrays are 0-indexed. Last index is length - 1.",
    expectedOutput: "40",
  },

  {
    id: 303,
    lang: "Java",
    difficulty: "hard",
    errorType: "Runtime",
    title: "Null Pointer Exception",
    xp: 120,
    description: "This crashes with NullPointerException. Fix the null check.",
    lines: ["String name = null;", "System.out.println(name.length());"],
    bugLine: 1,
    fixed: "System.out.println(name != null ? name.length() : 0);",
    hint: "Always check if a String is null before calling methods on it.",
    expectedOutput: "0",
  },

  {
    id: 304,
    lang: "Java",
    difficulty: "easy",
    errorType: "Syntax",
    title: "Wrong Method Signature",
    xp: 45,
    description: "The main method signature is wrong — JVM can't find it.",
    lines: [
      "public class Main {",
      "    public static void main(String args) {",
      '        System.out.println("Running");',
      "    }",
      "}",
    ],
    bugLine: 1,
    fixed: "    public static void main(String[] args) {",
    hint: "The args parameter must be an array of Strings.",
    expectedOutput: "Running",
  },

  {
    id: 305,
    lang: "Java",
    difficulty: "medium",
    errorType: "Logic",
    title: "Integer Division",
    xp: 75,
    description: "Should print 2.5 but prints 2 instead.",
    lines: [
      "int a = 5, b = 2;",
      "double result = a / b;",
      "System.out.println(result);",
    ],
    bugLine: 1,
    fixed: "double result = (double) a / b;",
    hint: "Dividing two ints gives an int. Cast one to double first.",
    expectedOutput: "2.5",
  },

  {
    id: 306,
    lang: "Java",
    difficulty: "hard",
    errorType: "Exception",
    title: "Stack Overflow",
    xp: 130,
    description:
      "Infinite recursion causes StackOverflowError. Fix the base case.",
    lines: [
      "public static int sum(int n) {",
      "    return n + sum(n - 1);",
      "}",
      "System.out.println(sum(5));",
    ],
    bugLine: 0,
    fixed: "public static int sum(int n) {\n    if (n <= 0) return 0;",
    hint: "A recursive function needs a base case to stop recursion.",
    expectedOutput: "15",
  },

  {
    id: 307,
    lang: "Java",
    difficulty: "easy",
    errorType: "Compile",
    title: "Missing Return",
    xp: 50,
    description: "The compiler complains about a missing return statement.",
    lines: [
      "public static int double_val(int x) {",
      "    int result = x * 2;",
      "}",
    ],
    bugLine: 2,
    fixed: "    return result;\n}",
    hint: "Non-void methods must return a value on all code paths.",
    expectedOutput: "20",
  },

  {
    id: 308,
    lang: "Java",
    difficulty: "medium",
    errorType: "Logic",
    title: "String Comparison Bug",
    xp: 85,
    description:
      "String comparison always returns false even for equal strings.",
    lines: [
      'String a = new String("hello");',
      'String b = new String("hello");',
      "System.out.println(a == b);",
    ],
    bugLine: 2,
    fixed: "System.out.println(a.equals(b));",
    hint: "== compares references, not content. Use .equals() for Strings.",
    expectedOutput: "true",
  },

  {
    id: 309,
    lang: "Java",
    difficulty: "hard",
    errorType: "Runtime",
    title: "Class Cast Exception",
    xp: 115,
    description: "Casting the wrong type causes a ClassCastException.",
    lines: [
      "Object obj = Integer.valueOf(42);",
      "String str = (String) obj;",
      "System.out.println(str);",
    ],
    bugLine: 1,
    fixed: "String str = obj.toString();",
    hint: "You can't cast an Integer to a String. Use .toString() instead.",
    expectedOutput: "42",
  },

  {
    id: 310,
    lang: "Java",
    difficulty: "medium",
    errorType: "Logic",
    title: "Infinite While Loop",
    xp: 90,
    description: "This loop never terminates. Find why.",
    lines: [
      "int i = 0;",
      "while (i < 5) {",
      "    System.out.println(i);",
      "    i--;",
      "}",
    ],
    bugLine: 3,
    fixed: "    i++;",
    hint: "i-- decrements i, making it go negative forever. Should it go up?",
    expectedOutput: "0\n1\n2\n3\n4",
  },

  // ─── C (10) ────────────────────────────────────────────────
  {
    id: 401,
    lang: "C",
    difficulty: "easy",
    errorType: "Syntax",
    title: "Missing Semicolon",
    xp: 40,
    description: "This C program won't compile. Find the missing character.",
    lines: [
      "#include <stdio.h>",
      "int main() {",
      '    printf("Hello World")',
      "    return 0;",
      "}",
    ],
    bugLine: 2,
    fixed: '    printf("Hello World");',
    hint: "Every C statement must end with a semicolon.",
    expectedOutput: "Hello World",
  },

  {
    id: 402,
    lang: "C",
    difficulty: "medium",
    errorType: "Logic",
    title: "Wrong Format Specifier",
    xp: 75,
    description: "Printing a float but getting garbage value.",
    lines: [
      "#include <stdio.h>",
      "int main() {",
      "    float x = 3.14;",
      '    printf("%d\\n", x);',
      "    return 0;",
      "}",
    ],
    bugLine: 3,
    fixed: '    printf("%f\\n", x);',
    hint: "Use %f for float, %d is for integers only.",
    expectedOutput: "3.140000",
  },

  {
    id: 403,
    lang: "C",
    difficulty: "hard",
    errorType: "Runtime",
    title: "Null Pointer Dereference",
    xp: 130,
    description: "Dereferencing a NULL pointer causes a segfault.",
    lines: [
      "#include <stdio.h>",
      "int main() {",
      "    int *ptr = NULL;",
      '    printf("%d", *ptr);',
      "    return 0;",
      "}",
    ],
    bugLine: 3,
    fixed: '    if (ptr != NULL) printf("%d", *ptr);',
    hint: "Always check if a pointer is NULL before dereferencing it.",
    expectedOutput: "(no output — safe exit)",
  },

  {
    id: 404,
    lang: "C",
    difficulty: "easy",
    errorType: "Compile",
    title: "Undeclared Variable",
    xp: 45,
    description: "Using a variable without declaring it first.",
    lines: [
      "#include <stdio.h>",
      "int main() {",
      "    x = 10;",
      '    printf("%d", x);',
      "    return 0;",
      "}",
    ],
    bugLine: 2,
    fixed: "    int x = 10;",
    hint: "In C, you must declare a variable's type before using it.",
    expectedOutput: "10",
  },

  {
    id: 405,
    lang: "C",
    difficulty: "medium",
    errorType: "Logic",
    title: "Off-by-one in Array",
    xp: 80,
    description: "Writing past the array boundary causes undefined behavior.",
    lines: [
      "#include <stdio.h>",
      "int main() {",
      "    int arr[5];",
      "    for(int i=0; i<=5; i++) arr[i]=i;",
      "    return 0;",
      "}",
    ],
    bugLine: 3,
    fixed: "    for(int i=0; i<5; i++) arr[i]=i;",
    hint: "Array of size 5 has indices 0–4. <= 5 goes one too far.",
    expectedOutput: "(no crash)",
  },

  {
    id: 406,
    lang: "C",
    difficulty: "hard",
    errorType: "Runtime",
    title: "Memory Leak",
    xp: 120,
    description:
      "Allocated memory is never freed — always free what you malloc.",
    lines: [
      "#include <stdlib.h>",
      "int main() {",
      "    int *p = malloc(sizeof(int));",
      "    *p = 42;",
      "    return 0;",
      "}",
    ],
    bugLine: 4,
    fixed: "    free(p);\n    return 0;",
    hint: "Every malloc() must have a corresponding free() before the program exits.",
    expectedOutput: "(no memory leak)",
  },

  {
    id: 407,
    lang: "C",
    difficulty: "easy",
    errorType: "Logic",
    title: "Wrong Return Type",
    xp: 50,
    description: "Function should return int but implicitly returns nothing.",
    lines: [
      "#include <stdio.h>",
      "int add(int a, int b) {",
      "    int result = a + b;",
      "}",
      'int main() { printf("%d", add(2,3)); }',
    ],
    bugLine: 3,
    fixed: "    return result;\n}",
    hint: "Non-void functions must explicitly return a value.",
    expectedOutput: "5",
  },

  {
    id: 408,
    lang: "C",
    difficulty: "medium",
    errorType: "Syntax",
    title: "Missing Include",
    xp: 65,
    description: "printf is used but the required header is missing.",
    lines: ["int main() {", '    printf("Hello");', "    return 0;", "}"],
    bugLine: 0,
    fixed: "#include <stdio.h>\nint main() {",
    hint: "printf lives in stdio.h — you must include it.",
    expectedOutput: "Hello",
  },

  {
    id: 409,
    lang: "C",
    difficulty: "hard",
    errorType: "Logic",
    title: "Pointer Arithmetic Bug",
    xp: 125,
    description:
      "Should print second element via pointer but prints wrong value.",
    lines: [
      "#include <stdio.h>",
      "int main() {",
      "    int arr[] = {10,20,30};",
      "    int *p = arr;",
      '    printf("%d", *p+1);',
      "    return 0;",
      "}",
    ],
    bugLine: 4,
    fixed: '    printf("%d", *(p+1));',
    hint: "*p+1 adds 1 to the value. *(p+1) moves the pointer then dereferences.",
    expectedOutput: "20",
  },

  {
    id: 410,
    lang: "C",
    difficulty: "medium",
    errorType: "Runtime",
    title: "scanf Buffer Overflow",
    xp: 90,
    description: "Reading unbounded string input can overflow the buffer.",
    lines: [
      "#include <stdio.h>",
      "int main() {",
      "    char name[10];",
      '    scanf("%s", name);',
      '    printf("%s", name);',
      "    return 0;",
      "}",
    ],
    bugLine: 3,
    fixed: '    scanf("%9s", name);',
    hint: "Limit scanf string input to buffer size - 1 to prevent overflow.",
    expectedOutput: "(safe input)",
  },

  // ─── C++ (10) ──────────────────────────────────────────────
  {
    id: 501,
    lang: "C++",
    difficulty: "easy",
    errorType: "Compile",
    title: "Missing Namespace",
    xp: 40,
    description: "cout is used without the correct namespace.",
    lines: [
      "#include <iostream>",
      "int main() {",
      '    cout << "Hello" << endl;',
      "    return 0;",
      "}",
    ],
    bugLine: 2,
    fixed: '    std::cout << "Hello" << std::endl;',
    hint: "cout lives in the std namespace. Use std::cout or add 'using namespace std;'",
    expectedOutput: "Hello",
  },

  {
    id: 502,
    lang: "C++",
    difficulty: "medium",
    errorType: "Logic",
    title: "Wrong Vector Access",
    xp: 80,
    description:
      "Accessing out-of-bounds index on a vector causes undefined behavior.",
    lines: [
      "#include <vector>",
      "#include <iostream>",
      "int main() {",
      "    std::vector<int> v = {1,2,3};",
      "    std::cout << v[5];",
      "    return 0;",
      "}",
    ],
    bugLine: 4,
    fixed: "    std::cout << v.at(2);",
    hint: "Use .at() for bounds-checked access. Index 5 doesn't exist in a 3-element vector.",
    expectedOutput: "3",
  },

  {
    id: 503,
    lang: "C++",
    difficulty: "hard",
    errorType: "Runtime",
    title: "Dangling Pointer",
    xp: 130,
    description: "Pointer used after the object it points to was deleted.",
    lines: ["int* p = new int(42);", "delete p;", "std::cout << *p;"],
    bugLine: 2,
    fixed: "p = nullptr; // don't use after delete",
    hint: "After delete, the pointer is dangling. Set it to nullptr immediately.",
    expectedOutput: "(safe — no use after delete)",
  },

  {
    id: 504,
    lang: "C++",
    difficulty: "easy",
    errorType: "Syntax",
    title: "Missing Header",
    xp: 45,
    description: "Using string without including the right header.",
    lines: [
      "int main() {",
      '    std::string name = "Alice";',
      "    return 0;",
      "}",
    ],
    bugLine: 0,
    fixed: "#include <string>\nint main() {",
    hint: "std::string requires #include <string>.",
    expectedOutput: "(compiles successfully)",
  },

  {
    id: 505,
    lang: "C++",
    difficulty: "medium",
    errorType: "Logic",
    title: "Integer Overflow",
    xp: 85,
    description: "Multiplying large ints causes overflow and wrong result.",
    lines: [
      "#include <iostream>",
      "int main() {",
      "    int a = 100000, b = 100000;",
      "    int result = a * b;",
      "    std::cout << result;",
      "    return 0;",
      "}",
    ],
    bugLine: 3,
    fixed: "    long long result = (long long)a * b;",
    hint: "int can't hold 10^10. Use long long and cast before multiplying.",
    expectedOutput: "10000000000",
  },

  {
    id: 506,
    lang: "C++",
    difficulty: "hard",
    errorType: "Exception",
    title: "Bad Alloc Not Caught",
    xp: 120,
    description:
      "new can throw std::bad_alloc if allocation fails — handle it.",
    lines: [
      "#include <iostream>",
      "int main() {",
      "    int* arr = new int[999999999];",
      "    delete[] arr;",
      "    return 0;",
      "}",
    ],
    bugLine: 2,
    fixed:
      '    int* arr = nullptr;\n    try { arr = new int[999999999]; } catch(std::bad_alloc&) { std::cout << "Alloc failed"; return 1; }',
    hint: "Wrap large allocations in try/catch for std::bad_alloc.",
    expectedOutput: "Alloc failed",
  },

  {
    id: 507,
    lang: "C++",
    difficulty: "easy",
    errorType: "Logic",
    title: "Wrong Increment",
    xp: 50,
    description: "Loop prints one too few iterations.",
    lines: [
      "#include <iostream>",
      "int main() {",
      "    for(int i=1; i<5; i++)",
      '        std::cout << i << " ";',
      "    return 0;",
      "}",
    ],
    bugLine: 2,
    fixed: "    for(int i=1; i<=5; i++)",
    hint: "i<5 stops before 5. Should it include 5?",
    expectedOutput: "1 2 3 4 5",
  },

  {
    id: 508,
    lang: "C++",
    difficulty: "medium",
    errorType: "Logic",
    title: "Copy vs Reference",
    xp: 90,
    description: "Function modifies a copy, original stays unchanged.",
    lines: [
      "#include <iostream>",
      "void addTen(int x) { x += 10; }",
      "int main() {",
      "    int n = 5;",
      "    addTen(n);",
      "    std::cout << n;",
      "    return 0;",
      "}",
    ],
    bugLine: 1,
    fixed: "void addTen(int& x) { x += 10; }",
    hint: "Pass by reference (&) to modify the original variable.",
    expectedOutput: "15",
  },

  {
    id: 509,
    lang: "C++",
    difficulty: "hard",
    errorType: "Runtime",
    title: "Double Delete",
    xp: 125,
    description: "Deleting the same pointer twice causes undefined behavior.",
    lines: ["int* p = new int(10);", "int* q = p;", "delete p;", "delete q;"],
    bugLine: 3,
    fixed: "q = nullptr; // don't delete twice",
    hint: "p and q point to the same memory. Only delete once, then nullptr.",
    expectedOutput: "(no crash)",
  },

  {
    id: 510,
    lang: "C++",
    difficulty: "medium",
    errorType: "Compile",
    title: "Const Violation",
    xp: 75,
    description: "Trying to modify a const variable.",
    lines: [
      "#include <iostream>",
      "int main() {",
      "    const int x = 10;",
      "    x = 20;",
      "    std::cout << x;",
      "    return 0;",
      "}",
    ],
    bugLine: 3,
    fixed: "    // x = 20; // cannot modify const",
    hint: "const variables cannot be reassigned after initialization.",
    expectedOutput: "10",
  },

  // ─── HTML (10) ─────────────────────────────────────────────
  {
    id: 601,
    lang: "HTML",
    difficulty: "easy",
    errorType: "Syntax",
    title: "Unclosed Tag",
    xp: 35,
    description: "This paragraph tag is never closed — fix the structure.",
    lines: ["<html>", "<body>", "  <p>Hello World", "</body>", "</html>"],
    bugLine: 2,
    fixed: "  <p>Hello World</p>",
    hint: "Every opening <p> tag needs a matching </p> closing tag.",
    expectedOutput: "<p>Hello World</p>",
  },

  {
    id: 602,
    lang: "HTML",
    difficulty: "easy",
    errorType: "Syntax",
    title: "Missing Alt Attribute",
    xp: 35,
    description: "Images must have alt attributes for accessibility.",
    lines: ['<img src="logo.png">'],
    bugLine: 0,
    fixed: '<img src="logo.png" alt="Company Logo">',
    hint: "The alt attribute describes the image for screen readers and broken loads.",
    expectedOutput: '<img src="logo.png" alt="Company Logo">',
  },

  {
    id: 603,
    lang: "HTML",
    difficulty: "medium",
    errorType: "Logic",
    title: "Broken Hyperlink",
    xp: 60,
    description: "This link opens in the same tab instead of a new one.",
    lines: ['<a href="https://example.com">Visit Site</a>'],
    bugLine: 0,
    fixed:
      '<a href="https://example.com" target="_blank" rel="noopener">Visit Site</a>',
    hint: "Use target='_blank' to open in new tab. Add rel='noopener' for security.",
    expectedOutput: "Opens in new tab",
  },

  {
    id: 604,
    lang: "HTML",
    difficulty: "easy",
    errorType: "Syntax",
    title: "Wrong Doctype",
    xp: 30,
    description: "The DOCTYPE declaration is incorrect for HTML5.",
    lines: [
      "<!DOCTYPE HTML PUBLIC>",
      "<html>",
      "<head><title>Page</title></head>",
      "</html>",
    ],
    bugLine: 0,
    fixed: "<!DOCTYPE html>",
    hint: "HTML5 doctype is simply: <!DOCTYPE html> — no extra text.",
    expectedOutput: "<!DOCTYPE html>",
  },

  {
    id: 605,
    lang: "HTML",
    difficulty: "medium",
    errorType: "Syntax",
    title: "Form Missing Action",
    xp: 65,
    description:
      "This form submits nowhere — it's missing the action attribute.",
    lines: [
      '<form method="POST">',
      '  <input type="text" name="username">',
      '  <button type="submit">Submit</button>',
      "</form>",
    ],
    bugLine: 0,
    fixed: '<form method="POST" action="/submit">',
    hint: "The action attribute tells the form where to send the data.",
    expectedOutput: 'action="/submit" present',
  },

  {
    id: 606,
    lang: "HTML",
    difficulty: "hard",
    errorType: "Logic",
    title: "Table Structure Bug",
    xp: 100,
    description: "Table rows are placed outside <tbody> — fix the structure.",
    lines: [
      "<table>",
      "  <tr><td>Row 1</td></tr>",
      "  <tr><td>Row 2</td></tr>",
      "</table>",
    ],
    bugLine: 1,
    fixed: "  <tbody>\n    <tr><td>Row 1</td></tr>",
    hint: "Tables should wrap rows in <thead> or <tbody> for valid HTML.",
    expectedOutput: "Valid table structure",
  },

  {
    id: 607,
    lang: "HTML",
    difficulty: "easy",
    errorType: "Syntax",
    title: "Input Missing Type",
    xp: 30,
    description: "Password field shows text instead of dots.",
    lines: ['<input name="password" placeholder="Enter password">'],
    bugLine: 0,
    fixed:
      '<input type="password" name="password" placeholder="Enter password">',
    hint: "Add type='password' to hide the input characters.",
    expectedOutput: 'type="password" present',
  },

  {
    id: 608,
    lang: "HTML",
    difficulty: "medium",
    errorType: "Logic",
    title: "Duplicate IDs",
    xp: 70,
    description: "Two elements share the same ID — IDs must be unique.",
    lines: ['<div id="main">First</div>', '<div id="main">Second</div>'],
    bugLine: 1,
    fixed: '<div id="secondary">Second</div>',
    hint: "ID attributes must be unique on a page. Use class for shared styling.",
    expectedOutput: "Unique IDs",
  },

  {
    id: 609,
    lang: "HTML",
    difficulty: "medium",
    errorType: "Syntax",
    title: "Unquoted Attribute",
    xp: 55,
    description: "Attribute values should always be quoted in HTML.",
    lines: ["<div class=container id=main>Content</div>"],
    bugLine: 0,
    fixed: '<div class="container" id="main">Content</div>',
    hint: "Wrap all attribute values in double quotes.",
    expectedOutput: 'class="container" id="main"',
  },

  {
    id: 610,
    lang: "HTML",
    difficulty: "hard",
    errorType: "Logic",
    title: "Script in Head Blocks Render",
    xp: 105,
    description: "Script in <head> without defer blocks page rendering.",
    lines: [
      "<head>",
      "  <script src='app.js'></script>",
      "</head>",
      "<body><p>Hello</p></body>",
    ],
    bugLine: 1,
    fixed: "  <script src='app.js' defer></script>",
    hint: "Add 'defer' so the script loads after HTML parsing is complete.",
    expectedOutput: "defer attribute added",
  },

  // ─── CSS (10) ──────────────────────────────────────────────
  {
    id: 701,
    lang: "CSS",
    difficulty: "easy",
    errorType: "Syntax",
    title: "Missing Semicolon",
    xp: 30,
    description: "A missing semicolon breaks all CSS rules after it.",
    lines: ["p {", "  color: red", "  font-size: 16px;", "}"],
    bugLine: 1,
    fixed: "  color: red;",
    hint: "Every CSS property-value pair must end with a semicolon.",
    expectedOutput: "color: red; present",
  },

  {
    id: 702,
    lang: "CSS",
    difficulty: "easy",
    errorType: "Logic",
    title: "Wrong Color Value",
    xp: 35,
    description: "Background is invisible because the color value is wrong.",
    lines: ["div {", "  background-color: #GGG;", "}"],
    bugLine: 1,
    fixed: "  background-color: #CCC;",
    hint: "Hex colors use 0-9 and A-F only. G is not a valid hex digit.",
    expectedOutput: "background-color: #CCC;",
  },

  {
    id: 703,
    lang: "CSS",
    difficulty: "medium",
    errorType: "Logic",
    title: "Centering Not Working",
    xp: 70,
    description: "margin: auto doesn't center this div. Why?",
    lines: ["div {", "  margin: 0 auto;", "  background: lime;", "}"],
    bugLine: 1,
    fixed: "  width: 200px;\n  margin: 0 auto;",
    hint: "margin: auto only works if the element has an explicit width.",
    expectedOutput: "Centered div",
  },

  {
    id: 704,
    lang: "CSS",
    difficulty: "easy",
    errorType: "Syntax",
    title: "Missing Colon",
    xp: 30,
    description: "This rule won't apply because of a syntax error.",
    lines: [".box {", "  display flex;", "}"],
    bugLine: 1,
    fixed: "  display: flex;",
    hint: "CSS property and value are separated by a colon, not a space.",
    expectedOutput: "display: flex;",
  },

  {
    id: 705,
    lang: "CSS",
    difficulty: "medium",
    errorType: "Logic",
    title: "Z-index Not Working",
    xp: 75,
    description: "z-index has no effect on this element. Why?",
    lines: [".tooltip {", "  z-index: 999;", "  background: black;", "}"],
    bugLine: 0,
    fixed: ".tooltip {\n  position: relative;",
    hint: "z-index only works on positioned elements (relative, absolute, fixed, sticky).",
    expectedOutput: "z-index works",
  },

  {
    id: 706,
    lang: "CSS",
    difficulty: "hard",
    errorType: "Logic",
    title: "Specificity War",
    xp: 110,
    description:
      "The red color won't apply because another selector is more specific.",
    lines: ["div p { color: blue; }", "p { color: red; }"],
    bugLine: 1,
    fixed: "div p { color: red; }",
    hint: "div p is more specific than p alone. Match the selector specificity.",
    expectedOutput: "color: red applied",
  },

  {
    id: 707,
    lang: "CSS",
    difficulty: "medium",
    errorType: "Syntax",
    title: "Invalid Unit",
    xp: 60,
    description: "This font size uses an invalid CSS unit.",
    lines: ["h1 {", "  font-size: 24pixel;", "}"],
    bugLine: 1,
    fixed: "  font-size: 24px;",
    hint: "The correct unit is px, not pixel.",
    expectedOutput: "font-size: 24px;",
  },

  {
    id: 708,
    lang: "CSS",
    difficulty: "easy",
    errorType: "Logic",
    title: "Invisible Text",
    xp: 40,
    description: "Text is invisible because color matches background.",
    lines: ["body {", "  background: #000;", "}", "p {", "  color: #000;", "}"],
    bugLine: 4,
    fixed: "  color: #fff;",
    hint: "White text (#fff) on black background (#000) is readable.",
    expectedOutput: "color: #fff;",
  },

  {
    id: 709,
    lang: "CSS",
    difficulty: "hard",
    errorType: "Logic",
    title: "Flexbox Direction Bug",
    xp: 115,
    description: "Flex items stack vertically instead of horizontally.",
    lines: [
      ".container {",
      "  display: flex;",
      "  flex-direction: column;",
      "}",
    ],
    bugLine: 2,
    fixed: "  flex-direction: row;",
    hint: "Default flex-direction is row (horizontal). Column stacks vertically.",
    expectedOutput: "Items in a row",
  },

  {
    id: 710,
    lang: "CSS",
    difficulty: "medium",
    errorType: "Logic",
    title: "Overflow Hidden Clip",
    xp: 80,
    description: "Content is being clipped unexpectedly.",
    lines: [
      ".box {",
      "  width: 200px;",
      "  height: 100px;",
      "  overflow: hidden;",
      "}",
    ],
    bugLine: 3,
    fixed: "  overflow: visible;",
    hint: "overflow: hidden clips content outside the box. Use visible to show it.",
    expectedOutput: "overflow: visible;",
  },
];

// Daily challenge rotates every 24 hours based on the date
const DAILY_CHALLENGE = (() => {
  const today = new Date();
  const seed =
    today.getFullYear() * 10000 +
    (today.getMonth() + 1) * 100 +
    today.getDate();
  return CHALLENGES[seed % CHALLENGES.length];
})();

const USERS_LB = [
  {
    id: 1,
    name: "Aarav Shah",
    avatar: "🦊",
    xp: 4820,
    streak: 14,
    solved: 62,
    lang: "Python",
  },
  {
    id: 2,
    name: "Priya Nair",
    avatar: "🐼",
    xp: 4210,
    streak: 9,
    solved: 55,
    lang: "JavaScript",
  },
  {
    id: 3,
    name: "You",
    avatar: "🚀",
    xp: 1340,
    streak: 5,
    solved: 18,
    lang: "Python",
  },
  {
    id: 4,
    name: "Rahul K",
    avatar: "🐉",
    xp: 3900,
    streak: 21,
    solved: 48,
    lang: "Java",
  },
  {
    id: 5,
    name: "Sneha M",
    avatar: "🦋",
    xp: 2750,
    streak: 7,
    solved: 34,
    lang: "Python",
  },
  {
    id: 6,
    name: "Dev R",
    avatar: "🐺",
    xp: 2100,
    streak: 3,
    solved: 27,
    lang: "JavaScript",
  },
];

// Daily challenge rotates every 24 hours based on the date

const INIT_POSTS = [
  {
    id: 1,
    author: "Aarav Shah",
    avatar: "🦊",
    time: "2h ago",
    text: "Anyone else struggling with Python list comprehension bugs? They're sneaky! 🐍",
    likes: 24,
    comments: [
      {
        author: "Priya",
        text: "Yes! The conditional part always trips me up 😅",
      },
    ],
  },
  {
    id: 2,
    author: "Priya Nair",
    avatar: "🐼",
    time: "5h ago",
    text: "Just hit 50 solves! The JavaScript async/await challenges are 🔥 worth it",
    likes: 41,
    comments: [],
  },
  {
    id: 3,
    author: "Sneha M",
    avatar: "🦋",
    time: "1d ago",
    text: "Pro tip: Always check array bounds first when you see a runtime error 💡",
    likes: 67,
    comments: [],
  },
];

const LANG_PATHS = [
  {
    lang: "Python",
    icon: "🐍",
    levels: [
      { e: "🐣", s: "done" },
      { e: "🐛", s: "done" },
      { e: "🔍", s: "active" },
      { e: "⚡", s: "locked" },
      { e: "🔥", s: "locked" },
    ],
  },
  {
    lang: "JavaScript",
    icon: "💛",
    levels: [
      { e: "🌱", s: "done" },
      { e: "🔀", s: "active" },
      { e: "🕵️", s: "locked" },
      { e: "🚀", s: "locked" },
      { e: "🏆", s: "locked" },
    ],
  },
  {
    lang: "Java",
    icon: "☕",
    levels: [
      { e: "👋", s: "active" },
      { e: "🔗", s: "locked" },
      { e: "🧩", s: "locked" },
      { e: "⚙️", s: "locked" },
      { e: "💎", s: "locked" },
    ],
  },
  {
    lang: "C",
    icon: "🔵",
    levels: [
      { e: "🐣", s: "active" },
      { e: "🔍", s: "locked" },
      { e: "⚡", s: "locked" },
      { e: "🔥", s: "locked" },
      { e: "🏆", s: "locked" },
    ],
  },
  {
    lang: "C++",
    icon: "🟣",
    levels: [
      { e: "🌱", s: "active" },
      { e: "🔗", s: "locked" },
      { e: "🧩", s: "locked" },
      { e: "🚀", s: "locked" },
      { e: "💎", s: "locked" },
    ],
  },
  {
    lang: "HTML",
    icon: "🌐",
    levels: [
      { e: "🐣", s: "active" },
      { e: "🔍", s: "locked" },
      { e: "⚡", s: "locked" },
      { e: "🔥", s: "locked" },
      { e: "🏆", s: "locked" },
    ],
  },
  {
    lang: "CSS",
    icon: "🎨",
    levels: [
      { e: "🌱", s: "active" },
      { e: "🔀", s: "locked" },
      { e: "🕵️", s: "locked" },
      { e: "🚀", s: "locked" },
      { e: "🏆", s: "locked" },
    ],
  },
];
const BADGES = [
  { icon: "🔥", label: "7-Day Streak" },
  { icon: "⚡", label: "Speed Debugger" },
  { icon: "🐍", label: "Python Pro" },
  { icon: "🏆", label: "Top 10" },
  { icon: "💡", label: "Hint-less" },
  { icon: "🌟", label: "50 Solves" },
];

const DEV_QUEUE = [
  {
    id: 1,
    author: "Rahul K",
    avatar: "🐉",
    lang: "Python",
    title: "Wrong sort order",
    code: "arr.sort()\nprint(arr[::-1])",
    status: "pending",
  },
  {
    id: 2,
    author: "Sneha M",
    avatar: "🦋",
    lang: "JavaScript",
    title: "Promise chain bug",
    code: "fetch(url)\n  .then(r => r.text)\n  .then(console.log)",
    status: "pending",
  },
];

/* ── HELPERS ── */
function Counter({ target, suffix = "" }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let v = 0;
    const step = Math.ceil(target / 60);
    const t = setInterval(() => {
      v += step;
      if (v >= target) {
        setVal(target);
        clearInterval(t);
      } else setVal(v);
    }, 24);
    return () => clearInterval(t);
  }, [target]);
  return (
    <span>
      {val.toLocaleString()}
      {suffix}
    </span>
  );
}

function EmojiRain({ onDone }) {
  const emojis = ["🎉", "✨", "🔥", "💥", "🐛", "⚡", "🏆", "🎊", "💡", "🚀"];
  const p = Array.from({ length: 28 }, (_, i) => ({
    id: i,
    e: emojis[i % emojis.length],
    l: Math.random() * 100,
    d: Math.random() * 1.4,
    dur: 1.8 + Math.random() * 1.2,
  }));
  useEffect(() => {
    const t = setTimeout(onDone, 3600);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <>
      {p.map((x) => (
        <span
          key={x.id}
          className="emoji-particle"
          style={{
            left: `${x.l}%`,
            top: 0,
            animationDelay: `${x.d}s`,
            animationDuration: `${x.dur}s`,
          }}
        >
          {x.e}
        </span>
      ))}
    </>
  );
}

function Av({ emoji, size = 42 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "var(--card2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.42,
        flexShrink: 0,
      }}
    >
      {emoji}
    </div>
  );
}

function ThemeToggle({ theme, setTheme }) {
  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.body.classList.toggle("light", next === "light");
    localStorage.setItem("debugg-theme", next);
  }
  return (
    <button
      onClick={toggle}
      style={{
        background:
          theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
        border: "1.5px solid var(--border)",
        borderRadius: 50,
        padding: "7px 14px",
        color: "var(--text)",
        fontWeight: 800,
        fontSize: 16,
        display: "flex",
        alignItems: "center",
        gap: 6,
        transition: "all .2s",
      }}
      title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}
/* ── NAV ── */
function Nav({ page, go, user, logout, theme, setTheme }) {
  const userLinks = [
    { id: "dashboard", l: "Home" },
    { id: "levels", l: "Levels" },
    { id: "discuss", l: "Discuss" },
    { id: "leaderboard", l: "Leaderboard" },
    { id: "profile", l: "Profile" },
  ];
  const devLinks = [
    { id: "devdash", l: "Dev Panel" },
    { id: "discuss", l: "Discuss" },
    { id: "leaderboard", l: "Leaderboard" },
  ];
  const links = !user ? [] : user.role === "dev" ? devLinks : userLinks;

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.body.classList.toggle("light", next === "light");
    localStorage.setItem("debugg-theme", next);
  }

  return (
    <nav className="nav">
      <div className="nav-logo" onClick={() => go("landing")}>
        Debugg<span style={{ color: "var(--lime)" }}>.</span>
      </div>
      <div className="nav-links">
        {links.map((l) => (
          <button
            key={l.id}
            className={`nav-link${page === l.id ? " active" : ""}`}
            onClick={() => go(l.id)}
          >
            {l.l}
          </button>
        ))}
        {user ? (
          <button
            className="btn-sm btn-ghost"
            style={{ marginLeft: 8 }}
            onClick={logout}
          >
            Logout
          </button>
        ) : (
          <>
            <button className="nav-link" onClick={() => go("login")}>
              Login
            </button>
            <button
              className="btn-lime btn-sm"
              style={{ marginLeft: 4 }}
              onClick={() => go("signup")}
            >
              Sign Up
            </button>
          </>
        )}

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={theme === "dark" ? "Light Mode" : "Dark Mode"}
          style={{
            background:
              theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
            border: "1.5px solid var(--border)",
            borderRadius: 50,
            padding: "7px 12px",
            color: "var(--text)",
            fontWeight: 800,
            fontSize: 16,
            marginLeft: 8,
            transition: "all .2s",
          }}
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </button>
      </div>
    </nav>
  );
}
/* ══ LANDING ══ */
function Landing({ go }) {
  const feats = [
    {
      i: "🐛",
      t: "Debug Real Code",
      d: "Fix actual buggy code in Python, JavaScript, Java and more languages.",
    },
    {
      i: "🎮",
      t: "Level Up",
      d: "Unlock challenges as you progress. Every fix earns XP and badges.",
    },
    {
      i: "🏆",
      t: "Compete",
      d: "Climb global leaderboards. Beat friends on local group rankings.",
    },
    {
      i: "💬",
      t: "Community",
      d: "Discuss bugs, share tips, and connect with fellow debuggers worldwide.",
    },
  ];
  return (
    <div className="page">
      {/* Hero */}
      <section
        style={{
          position: "relative",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "120px 24px 80px",
          overflow: "hidden",
        }}
      >
        <div className="grid-bg" />
        <div
          className="glow"
          style={{
            width: 600,
            height: 500,
            background: "var(--lime)",
            top: "5%",
            left: "50%",
            transform: "translateX(-50%)",
          }}
        />
        <div
          className="glow"
          style={{
            width: 400,
            height: 400,
            background: "var(--cyan)",
            top: "30%",
            right: "-8%",
          }}
        />
        <div
          className="glow"
          style={{
            width: 350,
            height: 350,
            background: "var(--pink)",
            top: "15%",
            left: "-5%",
          }}
        />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div className="chip" style={{ marginBottom: 24 }}>
            🔥 The addictive way to learn coding
          </div>
          <h1
            style={{
              fontFamily: "var(--display)",
              fontSize: "clamp(46px,9vw,92px)",
              lineHeight: 1.05,
              marginBottom: 24,
            }}
          >
            Learn to Code
            <br />
            <span
              style={{
                background: "linear-gradient(90deg,var(--lime),var(--cyan))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              by Debugging
            </span>
          </h1>
          <p
            style={{
              fontSize: 17,
              color: "var(--muted)",
              maxWidth: 520,
              margin: "0 auto 40px",
              lineHeight: 1.75,
              fontWeight: 600,
            }}
          >
            Fix buggy code, earn XP, unlock levels, and compete with friends.
            The Duolingo of programming — but for real developers. 🚀
          </p>
          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              className="btn-lime"
              style={{ fontSize: 16, padding: "15px 38px" }}
              onClick={() => go("signup")}
            >
              Start Debugging Free →
            </button>
            <button className="btn-ghost" onClick={() => go("login")}>
              I have an account
            </button>
          </div>
          <div
            style={{
              display: "flex",
              gap: 48,
              justifyContent: "center",
              marginTop: 64,
              flexWrap: "wrap",
            }}
          >
            {[
              { n: 24800, l: "Debuggers", s: "+" },
              { n: 1250, l: "Challenges", s: "+" },
              { n: 98, l: "Satisfaction", s: "%" },
            ].map((s) => (
              <div key={s.l} style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontFamily: "var(--display)",
                    fontSize: 38,
                    color: "var(--lime)",
                  }}
                >
                  <Counter target={s.n} suffix={s.s} />
                </div>
                <div
                  style={{
                    color: "var(--muted)",
                    fontSize: 13,
                    fontWeight: 700,
                    marginTop: 4,
                  }}
                >
                  {s.l}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* Features */}
      <section
        style={{ padding: "80px 24px", maxWidth: 1100, margin: "0 auto" }}
      >
        <h2
          style={{
            fontFamily: "var(--display)",
            fontSize: 42,
            textAlign: "center",
            marginBottom: 48,
          }}
        >
          Why Debugg<span style={{ color: "var(--lime)" }}>?</span>
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
            gap: 20,
          }}
        >
          {feats.map((f) => (
            <div key={f.t} className="card" style={{ textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 14 }}>{f.i}</div>
              <h3
                style={{
                  fontFamily: "var(--display)",
                  fontSize: 22,
                  marginBottom: 10,
                }}
              >
                {f.t}
              </h3>
              <p
                style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.7 }}
              >
                {f.d}
              </p>
            </div>
          ))}
        </div>
      </section>
      {/* CTA */}
      <section
        style={{
          padding: "80px 24px 120px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          className="glow"
          style={{
            width: 500,
            height: 300,
            background: "var(--purple)",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
          }}
        />
        <div style={{ position: "relative", zIndex: 1 }}>
          <h2
            style={{
              fontFamily: "var(--display)",
              fontSize: "clamp(30px,6vw,54px)",
              marginBottom: 20,
            }}
          >
            Ready to squash some{" "}
            <span style={{ color: "var(--lime)" }}>bugs?</span> 🐛
          </h2>
          <p
            style={{
              color: "var(--muted)",
              fontSize: 16,
              marginBottom: 32,
              fontWeight: 600,
            }}
          >
            Join 24,000+ developers learning through debugging.
          </p>
          <button
            className="btn-lime"
            style={{ fontSize: 17, padding: "16px 44px" }}
            onClick={() => go("signup")}
          >
            Get Started — It's Free
          </button>
        </div>
      </section>
    </div>
  );
}

/* ══ AUTH ══ */
function Auth({ mode, go, setUser }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const isSignup = mode === "signup";
  const isDev = mode === "devlogin";

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);

    if (isDev) {
      if (email === "admin@debugg.com" && pass === "admin123") {
        setUser({
          name: "Dev Admin",
          email,
          avatar: "🛠️",
          role: "dev",
          xp: 0,
          streak: 0,
          solved: 0,
        });
        go("devdash");
      } else {
        setErr("Invalid dev credentials. Use admin@debugg.com / admin123");
      }
      setLoading(false);
      return;
    }

    try {
      if (isSignup) {
        if (!name) {
          setErr("Please enter your name.");
          setLoading(false);
          return;
        }
        const cred = await createUserWithEmailAndPassword(auth, email, pass);
        await updateProfile(cred.user, { displayName: name });
        const newUserData = {
          name,
          email: cred.user.email,
          uid: cred.user.uid,
          avatar: "🚀",
          role: "user",
          xp: 0,
          streak: 0,
          solved: 0,
          lastSolvedDate: null,
          solvedChallenges: [],
          createdAt: serverTimestamp(),
        };
        await setDoc(doc(db, "users", cred.user.uid), newUserData);
        setUser(newUserData);
        go("dashboard");
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, pass);
        const userDoc = await getDoc(doc(db, "users", cred.user.uid));
        if (userDoc.exists()) {
          setUser({ ...userDoc.data(), uid: cred.user.uid });
        } else {
          const fallbackData = {
            name: cred.user.displayName || cred.user.email.split("@")[0],
            email: cred.user.email,
            uid: cred.user.uid,
            avatar: "🚀",
            role: "user",
            xp: 0,
            streak: 0,
            solved: 0,
            lastSolvedDate: null,
            solvedChallenges: [],
            createdAt: serverTimestamp(),
          };
          await setDoc(doc(db, "users", cred.user.uid), fallbackData);
          setUser(fallbackData);
        }
        go("dashboard");
      }
    } catch (error) {
      if (error.code === "auth/email-already-in-use")
        setErr("Email already registered. Try logging in.");
      else if (error.code === "auth/weak-password")
        setErr("Password must be at least 6 characters.");
      else if (error.code === "auth/user-not-found")
        setErr("No account found. Sign up first.");
      else if (error.code === "auth/wrong-password")
        setErr("Wrong password. Try again.");
      else if (error.code === "auth/invalid-email")
        setErr("Invalid email address.");
      else if (error.code === "auth/too-many-requests")
        setErr("Too many attempts. Try again later.");
      else setErr(error.message);
    }
    setLoading(false);
  }

  async function handleGoogle() {
    setErr("");
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      const userDoc = await getDoc(doc(db, "users", cred.user.uid));
      if (userDoc.exists()) {
        setUser({ ...userDoc.data(), uid: cred.user.uid });
      } else {
        const newUserData = {
          name: cred.user.displayName || cred.user.email.split("@")[0],
          email: cred.user.email,
          uid: cred.user.uid,
          avatar: "🚀",
          role: "user",
          xp: 0,
          streak: 0,
          solved: 0,
          lastSolvedDate: null,
          solvedChallenges: [],
          createdAt: serverTimestamp(),
        };
        await setDoc(doc(db, "users", cred.user.uid), newUserData);
        setUser(newUserData);
      }
      go("dashboard");
    } catch (error) {
      setErr("Google sign-in failed. Try again.");
    }
    setLoading(false);
  }

  return (
    <div
      className="page"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "100px 24px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        className="glow"
        style={{
          width: 500,
          height: 500,
          background: "var(--lime)",
          top: "10%",
          left: "50%",
          transform: "translateX(-50%)",
        }}
      />
      <div
        className="card"
        style={{
          maxWidth: 440,
          width: "100%",
          position: "relative",
          zIndex: 1,
          padding: 40,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              fontFamily: "var(--display)",
              fontSize: 28,
              background: "linear-gradient(90deg,var(--lime),var(--cyan))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              marginBottom: 8,
            }}
          >
            {isDev
              ? "🛠️ Developer Login"
              : isSignup
              ? "Join Debugg 🚀"
              : "Welcome Back 👋"}
          </div>
          <p style={{ color: "var(--muted)", fontSize: 14, fontWeight: 600 }}>
            {isDev
              ? "Admin access only"
              : isSignup
              ? "Start your debugging journey"
              : "Continue debugging"}
          </p>
        </div>

        <form
          onSubmit={submit}
          style={{ display: "flex", flexDirection: "column", gap: 14 }}
        >
          {isSignup && (
            <input
              className="input-field"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}
          <input
            className="input-field"
            placeholder="Email address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="input-field"
            placeholder="Password (min 6 chars)"
            type="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
          />

          {err && (
            <div
              style={{
                background: "rgba(239,68,68,.1)",
                border: "1px solid rgba(239,68,68,.3)",
                borderRadius: 10,
                padding: "10px 14px",
                color: "var(--red)",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              ⚠️ {err}
            </div>
          )}

          <button
            type="submit"
            className="btn-lime"
            style={{
              marginTop: 8,
              width: "100%",
              padding: 15,
              opacity: loading ? 0.6 : 1,
            }}
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : isDev
              ? "Access Dev Panel"
              : isSignup
              ? "Create Account 🚀"
              : "Login →"}
          </button>
        </form>

        {/* Firebase badge */}
        {/* Google Sign-In — only show for login/signup, not devlogin */}
        {!isDev && (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                margin: "20px 0 4px",
              }}
            >
              <div
                style={{ flex: 1, height: 1, background: "var(--border)" }}
              />
              <span
                style={{ color: "var(--muted)", fontSize: 12, fontWeight: 700 }}
              >
                OR
              </span>
              <div
                style={{ flex: 1, height: 1, background: "var(--border)" }}
              />
            </div>

            <button
              onClick={handleGoogle}
              disabled={loading}
              style={{
                width: "100%",
                padding: "13px 0",
                borderRadius: 50,
                background: "#fff",
                color: "#1a1a1a",
                fontWeight: 800,
                fontSize: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                border: "1.5px solid #e0e0e0",
                marginTop: 8,
                opacity: loading ? 0.6 : 1,
                transition: "box-shadow .2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.boxShadow =
                  "0 2px 16px rgba(0,0,0,0.18)")
              }
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
            >
              {/* Google SVG icon */}
              <svg width="20" height="20" viewBox="0 0 48 48">
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.14 0 5.95 1.08 8.17 2.85l6.09-6.09C34.46 3.39 29.5 1.5 24 1.5 14.82 1.5 7.03 6.98 3.69 14.72l7.1 5.52C12.43 14.1 17.74 9.5 24 9.5z"
                />
                <path
                  fill="#4285F4"
                  d="M46.1 24.5c0-1.64-.15-3.22-.42-4.75H24v9h12.42c-.54 2.92-2.18 5.4-4.65 7.06l7.1 5.52C43.37 37.12 46.1 31.3 46.1 24.5z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.79 28.24A14.5 14.5 0 0 1 9.5 24c0-1.47.25-2.89.69-4.24l-7.1-5.52A22.45 22.45 0 0 0 1.5 24c0 3.57.85 6.94 2.36 9.94l6.93-5.7z"
                />
                <path
                  fill="#34A853"
                  d="M24 46.5c5.5 0 10.12-1.82 13.49-4.94l-7.1-5.52C28.6 37.6 26.42 38.5 24 38.5c-6.26 0-11.57-4.6-13.21-10.76l-6.93 5.7C7.03 41.02 14.82 46.5 24 46.5z"
                />
              </svg>
              Continue with Google
            </button>
          </>
        )}

        {/* Firebase badge */}
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <span
            style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}
          >
            🔒 Secured by Firebase Auth
          </span>
        </div>

        <div
          style={{
            textAlign: "center",
            marginTop: 16,
            fontSize: 13,
            color: "var(--muted)",
          }}
        >
          {isSignup ? (
            <>
              <span>Already have an account? </span>
              <button
                style={{
                  background: "none",
                  color: "var(--lime)",
                  fontWeight: 700,
                }}
                onClick={() => go("login")}
              >
                Login
              </button>
            </>
          ) : (
            !isDev && (
              <>
                <span>No account? </span>
                <button
                  style={{
                    background: "none",
                    color: "var(--lime)",
                    fontWeight: 700,
                  }}
                  onClick={() => go("signup")}
                >
                  Sign Up
                </button>
              </>
            )
          )}
        </div>
        {!isDev && (
          <div style={{ textAlign: "center", marginTop: 12 }}>
            <button
              style={{
                background: "none",
                color: "var(--muted)",
                fontSize: 12,
                fontWeight: 700,
              }}
              onClick={() => go("devlogin")}
            >
              Developer / Admin Login →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
/* ══ DASHBOARD ══ */
function Dashboard({ user, go, pickChallenge }) {
  const [filter, setFilter] = useState("All");
  const langs = [
    "All",
    "Python",
    "JavaScript",
    "Java",
    "C",
    "C++",
    "HTML",
    "CSS",
  ];
  const shown =
    filter === "All" ? CHALLENGES : CHALLENGES.filter((c) => c.lang === filter);

  return (
    <div
      className="page"
      style={{
        paddingTop: 90,
        padding: "90px 24px 60px",
        maxWidth: 1100,
        margin: "0 auto",
      }}
    >
      {/* Welcome header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 32,
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <h1 style={{ fontFamily: "var(--display)", fontSize: 36 }}>
            Hey, {user.name.split(" ")[0]} {user.avatar} 👋
          </h1>
          <p
            style={{
              color: "var(--muted)",
              fontSize: 15,
              fontWeight: 600,
              marginTop: 4,
            }}
          >
            Ready to squash some bugs today?
          </p>
        </div>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          {[
            { v: user.xp.toLocaleString(), l: "XP TOTAL", c: "var(--lime)" },
            { v: "🔥 " + user.streak, l: "STREAK", c: "var(--orange)" },
            { v: user.solved, l: "SOLVED", c: "var(--cyan)" },
          ].map((s) => (
            <div
              key={s.l}
              className="card"
              style={{
                padding: "14px 24px",
                textAlign: "center",
                minWidth: 100,
              }}
            >
              <div
                style={{
                  fontFamily: "var(--display)",
                  fontSize: 26,
                  color: s.c,
                }}
              >
                {s.v}
              </div>
              <div
                style={{
                  color: "var(--muted)",
                  fontSize: 11,
                  fontWeight: 700,
                  marginTop: 4,
                }}
              >
                {s.l}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ⚡ DAILY CHALLENGE CARD */}
      <DailyChallenge go={go} pickChallenge={pickChallenge} />

      {/* XP Progress */}
      <div className="card" style={{ marginBottom: 28, padding: 20 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 10,
          }}
        >
          <span style={{ fontWeight: 800, fontSize: 14 }}>
            Level 4 Progress
          </span>
          <span
            style={{ color: "var(--muted)", fontSize: 13, fontWeight: 700 }}
          >
            {user.xp} / 2000 XP
          </span>
        </div>
        <div className="xp-bar">
          <div
            className="xp-fill"
            style={{ width: `${(user.xp / 2000) * 100}%` }}
          />
        </div>
        <div
          style={{
            marginTop: 8,
            fontSize: 12,
            color: "var(--muted)",
            fontWeight: 600,
          }}
        >
          {2000 - user.xp} XP to Level 5 🎯
        </div>
      </div>

      {/* Language filter tabs */}
      <div
        style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}
      >
        {langs.map((l) => (
          <button
            key={l}
            className={`tab${filter === l ? " active" : ""}`}
            onClick={() => setFilter(l)}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Challenge cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(290px,1fr))",
          gap: 18,
        }}
      >
        {shown.map((c) => (
          <div
            key={c.id}
            className="card"
            style={{ cursor: "pointer" }}
            onClick={() => {
              pickChallenge(c);
              go("challenge");
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 12,
              }}
            >
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <span className={`tag tag-${c.difficulty}`}>
                  {c.difficulty.toUpperCase()}
                </span>
                <span className="tag tag-lang">{c.lang}</span>
              </div>
              <span
                style={{
                  fontFamily: "var(--display)",
                  color: "var(--lime)",
                  fontSize: 14,
                }}
              >
                +{c.xp} XP
              </span>
            </div>
            <h3
              style={{
                fontFamily: "var(--display)",
                fontSize: 18,
                marginBottom: 6,
              }}
            >
              {c.title}
            </h3>
            <p
              style={{
                color: "var(--muted)",
                fontSize: 13,
                marginBottom: 14,
                lineHeight: 1.6,
              }}
            >
              {c.description}
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span className="chip">🐛 {c.errorType}</span>
              <button
                className="btn-lime btn-sm"
                style={{ padding: "8px 16px", fontSize: 12 }}
              >
                Debug →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══ CHALLENGE / EDITOR ══ */
function ChallengePage({ challenge, go, setUser, user }) {
  const [selLine, setSelLine] = useState(null);
  const [lines, setLines] = useState([...challenge.lines]);
  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState("");
  const [output, setOutput] = useState(null);
  const [hintOn, setHintOn] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [celebration, setCelebration] = useState(false);
  const [status, setStatus] = useState("idle");
  const [seconds, setSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(true); // ← MOVED UP

  useEffect(() => {
    if (!timerActive) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [timerActive]);

  function selectLine(i) {
    if (submitted) return;
    setSelLine(i);
    setEditVal(lines[i]);
    setEditing(true);
    setOutput(null);
  }

  function applyFix() {
    if (selLine === null) return;
    const u = [...lines];
    u[selLine] = editVal;
    setLines(u);
    setEditing(false);
    setOutput(null);
  }

  async function runCode() {
    setStatus("running");
    setOutput(null);

    const langIds = {
      Python: 71,
      JavaScript: 63,
      Java: 62,
      C: 50,
      "C++": 54,
      HTML: null,
      CSS: null,
    };

    const langId = langIds[challenge.lang];

    if (!langId) {
      const isFixed = lines[challenge.bugLine] === challenge.fixed;
      setTimeout(() => {
        if (isFixed) {
          setOutput("✅ " + challenge.expectedOutput);
          setStatus("success");
        } else {
          setOutput("❌ Not fixed yet. Check line " + (challenge.bugLine + 1));
          setStatus("fail");
        }
      }, 600);
      return;
    }

    const sourceCode = lines.join("\n");

    try {
      const submitRes = await fetch(
        "https://ce.judge0.com/submissions?base64_encoded=false&wait=true",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            source_code: sourceCode,
            language_id: langId,
            stdin: "",
          }),
        }
      );

      const result = await submitRes.json();
      const stdout = result.stdout?.trim();
      const stderr = result.stderr?.trim();
      const compileErr = result.compile_output?.trim();
      const statusDesc = result.status?.description;

      if (stdout) {
        const isCorrect = stdout === challenge.expectedOutput.trim();
        if (isCorrect) {
          setOutput(stdout);
          setStatus("success");
        } else {
          setOutput(stdout + "\n\n⚠️ Expected:\n" + challenge.expectedOutput);
          setStatus("fail");
        }
      } else if (stderr) {
        setOutput("❌ Runtime Error:\n" + stderr);
        setStatus("fail");
      } else if (compileErr) {
        setOutput("❌ Compile Error:\n" + compileErr);
        setStatus("fail");
      } else {
        setOutput("⚠️ Status: " + statusDesc);
        setStatus("fail");
      }
    } catch (err) {
      const isFixed = lines[challenge.bugLine] === challenge.fixed;
      if (isFixed) {
        setOutput(challenge.expectedOutput);
        setStatus("success");
      } else {
        setOutput(
          "❌ Bug not fixed yet. Check line " + (challenge.bugLine + 1)
        );
        setStatus("fail");
      }
    }
  }

  async function submit() {
    setTimerActive(false);
    if (status !== "success") return;
    setSubmitted(true);
    setCelebration(true);

    // Calculate streak
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    let newStreak = 1;
    if (user.lastSolvedDate === today) {
      newStreak = user.streak;
    } else if (user.lastSolvedDate === yesterday) {
      newStreak = user.streak + 1;
    } else {
      newStreak = 1;
    }

    const alreadySolved = (user.solvedChallenges || []).includes(challenge.id);
    const xpGained = alreadySolved ? 0 : challenge.xp;
    const solvedInc = alreadySolved ? 0 : 1;

    const updates = {
      xp: user.xp + xpGained,
      solved: user.solved + solvedInc,
      streak: newStreak,
      lastSolvedDate: today,
      solvedChallenges: alreadySolved
        ? user.solvedChallenges
        : [...(user.solvedChallenges || []), challenge.id],
    };

    try {
      await updateDoc(doc(db, "users", user.uid), updates);
    } catch (e) {
      console.error("Failed to save progress:", e);
    }

    setUser((u) => ({ ...u, ...updates }));
    if (challenge.onComplete) challenge.onComplete();
  }

  // Timer color: green → orange → red
  const timerColor =
    seconds > 120
      ? "var(--red)"
      : seconds > 60
      ? "var(--orange)"
      : "var(--green)";
  const timerDisplay = `${Math.floor(seconds / 60)}:${String(
    seconds % 60
  ).padStart(2, "0")}`;

  return (
    <div
      className="page"
      style={{
        paddingTop: 90,
        padding: "90px 24px 60px",
        maxWidth: 980,
        margin: "0 auto",
      }}
    >
      {celebration && <EmojiRain onDone={() => setCelebration(false)} />}

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 22,
          flexWrap: "wrap",
        }}
      >
        <button
          style={{
            background: "var(--card2)",
            border: "1px solid var(--border)",
            borderRadius: 50,
            padding: "8px 16px",
            color: "var(--muted)",
            fontWeight: 700,
            fontSize: 13,
          }}
          onClick={() => go("dashboard")}
        >
          ← Back
        </button>
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: "flex",
              gap: 8,
              marginBottom: 6,
              flexWrap: "wrap",
            }}
          >
            <span className={`tag tag-${challenge.difficulty}`}>
              {challenge.difficulty.toUpperCase()}
            </span>
            <span className="tag tag-lang">{challenge.lang}</span>
            <span className="chip">🐛 {challenge.errorType}</span>
          </div>
          <h1 style={{ fontFamily: "var(--display)", fontSize: 28 }}>
            {challenge.title}
          </h1>
        </div>

        {/* XP + Timer side by side */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 6,
          }}
        >
          <div
            style={{
              fontFamily: "var(--display)",
              fontSize: 22,
              color: "var(--lime)",
            }}
          >
            +{challenge.xp} XP
          </div>
          <div
            style={{
              fontFamily: "var(--mono)",
              fontSize: 14,
              fontWeight: 700,
              color: timerColor,
              background: "var(--card2)",
              border: `1.5px solid ${timerColor}`,
              padding: "4px 14px",
              borderRadius: 50,
              transition: "color .5s, border-color .5s",
            }}
          >
            ⏱️ {timerDisplay}
          </div>
        </div>
      </div>

      <p
        style={{
          color: "var(--muted)",
          fontSize: 14,
          marginBottom: 22,
          fontWeight: 600,
          lineHeight: 1.7,
        }}
      >
        👆{" "}
        <strong style={{ color: "var(--text)" }}>Click the buggy line</strong>{" "}
        to select and edit it inline. Run to verify, then Submit.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 20,
          alignItems: "start",
        }}
      >
        {/* Code panel */}
        <div>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div
              style={{
                background: "var(--card2)",
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                gap: 8,
                borderBottom: "1px solid var(--border)",
              }}
            >
              <div
                style={{
                  width: 11,
                  height: 11,
                  borderRadius: "50%",
                  background: "var(--red)",
                }}
              />
              <div
                style={{
                  width: 11,
                  height: 11,
                  borderRadius: "50%",
                  background: "var(--yellow)",
                }}
              />
              <div
                style={{
                  width: 11,
                  height: 11,
                  borderRadius: "50%",
                  background: "var(--green)",
                }}
              />
              <span
                style={{
                  marginLeft: 8,
                  color: "var(--muted)",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                bug_challenge.
                {challenge.lang === "JavaScript"
                  ? "js"
                  : challenge.lang === "Java"
                  ? "java"
                  : challenge.lang === "C"
                  ? "c"
                  : challenge.lang === "C++"
                  ? "cpp"
                  : challenge.lang === "HTML"
                  ? "html"
                  : challenge.lang === "CSS"
                  ? "css"
                  : "py"}
              </span>
            </div>
            <div style={{ padding: "16px 8px" }}>
              {lines.map((ln, i) => (
                <span
                  key={i}
                  className={`code-line${selLine === i ? " selected" : ""}${
                    submitted && i === challenge.bugLine ? " correct" : ""
                  }`}
                  onClick={() => selectLine(i)}
                >
                  <span
                    style={{
                      color: "var(--muted)",
                      marginRight: 16,
                      fontSize: 11,
                      userSelect: "none",
                    }}
                  >
                    {i + 1}
                  </span>
                  <span
                    style={{
                      color:
                        i === challenge.bugLine && !submitted
                          ? "var(--red)"
                          : "var(--text)",
                    }}
                  >
                    {ln || " "}
                  </span>
                </span>
              ))}
            </div>
          </div>

          {editing && !submitted && (
            <div className="card" style={{ marginTop: 14 }}>
              <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 10 }}>
                ✏️ Edit Line {selLine + 1}
              </div>
              <textarea
                value={editVal}
                onChange={(e) => setEditVal(e.target.value)}
                rows={3}
                style={{
                  width: "100%",
                  background: "var(--bg)",
                  border: "1.5px solid var(--lime)",
                  borderRadius: 10,
                  padding: 12,
                  color: "var(--text)",
                  fontFamily: "var(--mono)",
                  fontSize: 13,
                  resize: "vertical",
                }}
              />
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button className="btn-lime btn-sm" onClick={applyFix}>
                  Apply Fix ✓
                </button>
                <button
                  className="btn-ghost btn-sm"
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="card">
            <button
              style={{
                width: "100%",
                background: "rgba(255,235,0,.07)",
                border: "1.5px solid rgba(255,235,0,.2)",
                borderRadius: 12,
                padding: "12px 18px",
                color: "var(--yellow)",
                fontWeight: 800,
                fontSize: 14,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
              onClick={() => setHintOn((v) => !v)}
            >
              💡 {hintOn ? "Hide Hint" : "Show Hint"}
            </button>
            {hintOn && (
              <div
                style={{
                  marginTop: 12,
                  padding: 14,
                  background: "rgba(255,235,0,.05)",
                  border: "1px dashed rgba(255,235,0,.2)",
                  borderRadius: 10,
                  color: "var(--yellow)",
                  fontSize: 14,
                  lineHeight: 1.75,
                  fontWeight: 600,
                }}
              >
                {challenge.hint}
              </div>
            )}
          </div>

          <div className="card">
            <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 12 }}>
              ⚡ Run & Test
            </div>
            <button
              className="btn-lime"
              style={{
                width: "100%",
                padding: 12,
                fontSize: 14,
                opacity: status === "running" ? 0.6 : 1,
              }}
              onClick={runCode}
              disabled={status === "running"}
            >
              {status === "running" ? "Running..." : "▶ Run Code"}
            </button>
            {output && (
              <div
                style={{
                  marginTop: 12,
                  padding: 14,
                  background: "var(--bg)",
                  borderRadius: 10,
                  fontFamily: "var(--mono)",
                  fontSize: 13,
                  lineHeight: 1.8,
                  border: `1px solid ${
                    status === "success" ? "var(--green)" : "var(--red)"
                  }`,
                  color: status === "success" ? "var(--green)" : "var(--red)",
                }}
              >
                <div
                  style={{
                    marginBottom: 4,
                    fontSize: 11,
                    color: "var(--muted)",
                    fontWeight: 700,
                  }}
                >
                  OUTPUT:
                </div>
                {output}
              </div>
            )}
          </div>

          {!submitted && (
            <button
              className="btn-lime"
              style={{
                padding: 14,
                fontSize: 15,
                opacity: status === "success" ? 1 : 0.35,
              }}
              disabled={status !== "success"}
              onClick={submit}
            >
              🚀 Submit Solution
            </button>
          )}

          {submitted && (
            <div
              className="card"
              style={{
                textAlign: "center",
                border: "2px solid var(--lime)",
                background: "rgba(200,241,53,.05)",
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
              <div
                style={{
                  fontFamily: "var(--display)",
                  fontSize: 26,
                  color: "var(--lime)",
                  marginBottom: 4,
                }}
              >
                Bug Squashed!
              </div>
              <div
                style={{
                  color: "var(--muted)",
                  fontSize: 14,
                  fontWeight: 600,
                  marginBottom: 8,
                }}
              >
                +{challenge.xp} XP earned 🏆
              </div>
              {/* Show final time */}
              <div
                style={{
                  color: timerColor,
                  fontFamily: "var(--mono)",
                  fontWeight: 700,
                  fontSize: 15,
                  marginBottom: 16,
                }}
              >
                ⏱️ Solved in {timerDisplay}
              </div>
              <button className="btn-lime" onClick={() => go("dashboard")}>
                Next Challenge →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══ LEVELS ══ */
/* ══ LEVELS ══ */
function Levels({ go, pickChallenge, devChallenges }) {
  const [sel, setSel] = useState(null); // selected language
  const [selTopic, setSelTopic] = useState(null); // selected topic
  const [selDiff, setSelDiff] = useState(null); // selected difficulty
  const [completedLevels, setCompletedLevels] = useState({});

  const TOPICS = [
    { id: "Syntax", label: "Syntax Errors", icon: "📝", color: "var(--cyan)" },
    { id: "Logic", label: "Logic Errors", icon: "🧠", color: "var(--purple)" },
    { id: "Runtime", label: "Runtime Errors", icon: "💥", color: "var(--red)" },
    {
      id: "Compile",
      label: "Compile Errors",
      icon: "⚙️",
      color: "var(--orange)",
    },
    { id: "Exception", label: "Exceptions", icon: "🚨", color: "var(--pink)" },
  ];

  const DIFFICULTIES = [
    { id: "easy", label: "Easy", icon: "🟢", color: "var(--green)" },
    { id: "medium", label: "Medium", icon: "🟡", color: "var(--yellow)" },
    { id: "hard", label: "Hard", icon: "🔴", color: "var(--red)" },
  ];

  const levelEmojis = [
    "🐣",
    "🐛",
    "🔍",
    "⚡",
    "🔥",
    "🎯",
    "💡",
    "🚀",
    "⭐",
    "🏆",
  ];

  // Build language list from devChallenges
  const langGroups = {};
  devChallenges.forEach((c) => {
    if (!langGroups[c.lang]) langGroups[c.lang] = [];
    langGroups[c.lang].push(c);
  });
  const langList = [
    { lang: "Python", icon: "🐍" },
    { lang: "JavaScript", icon: "💛" },
    { lang: "Java", icon: "☕" },
    { lang: "C", icon: "🔵" },
    { lang: "C++", icon: "🟣" },
    { lang: "HTML", icon: "🌐" },
    { lang: "CSS", icon: "🎨" },
  ].filter((l) => langGroups[l.lang]?.length > 0);

  // ── SCREEN 1: Language selection ──
  if (!sel)
    return (
      <div
        className="page"
        style={{
          paddingTop: 90,
          padding: "90px 24px 60px",
          maxWidth: 900,
          margin: "0 auto",
        }}
      >
        <h1
          style={{
            fontFamily: "var(--display)",
            fontSize: 38,
            marginBottom: 8,
          }}
        >
          Choose Your Language 🗺️
        </h1>
        <p
          style={{
            color: "var(--muted)",
            fontSize: 15,
            fontWeight: 600,
            marginBottom: 36,
          }}
        >
          Select a language to start your debugging path.
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
            gap: 20,
          }}
        >
          {langList.map((lp) => {
            const total = langGroups[lp.lang]?.length || 0;
            return (
              <div
                key={lp.lang}
                className="card"
                style={{ cursor: "pointer", textAlign: "center", padding: 32 }}
                onClick={() => {
                  setSel(lp);
                  setSelTopic(null);
                  setSelDiff(null);
                }}
              >
                <div style={{ fontSize: 48, marginBottom: 12 }}>{lp.icon}</div>
                <div
                  style={{
                    fontFamily: "var(--display)",
                    fontSize: 24,
                    marginBottom: 6,
                  }}
                >
                  {lp.lang}
                </div>
                <div
                  style={{
                    color: "var(--muted)",
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 16,
                  }}
                >
                  {total} challenges
                </div>
                <button className="btn-lime btn-sm">Start Path →</button>
              </div>
            );
          })}
        </div>
      </div>
    );

  // ── SCREEN 2: Topic selection ──
  if (!selTopic) {
    const langChallenges = langGroups[sel.lang] || [];
    return (
      <div
        className="page"
        style={{
          paddingTop: 90,
          padding: "90px 24px 60px",
          maxWidth: 800,
          margin: "0 auto",
        }}
      >
        <button
          style={{
            background: "var(--card2)",
            border: "1px solid var(--border)",
            borderRadius: 50,
            padding: "8px 16px",
            color: "var(--muted)",
            fontWeight: 700,
            fontSize: 13,
            marginBottom: 28,
          }}
          onClick={() => setSel(null)}
        >
          ← Languages
        </button>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginBottom: 8,
          }}
        >
          <span style={{ fontSize: 40 }}>{sel.icon}</span>
          <h1 style={{ fontFamily: "var(--display)", fontSize: 34 }}>
            {sel.lang}
          </h1>
        </div>
        <p
          style={{
            color: "var(--muted)",
            fontSize: 15,
            fontWeight: 600,
            marginBottom: 36,
          }}
        >
          Choose a topic to practice.
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
            gap: 16,
          }}
        >
          {TOPICS.map((topic) => {
            const count = langChallenges.filter(
              (c) => c.errorType === topic.id
            ).length;
            if (count === 0) return null;
            return (
              <div
                key={topic.id}
                className="card"
                style={{
                  cursor: "pointer",
                  padding: 28,
                  textAlign: "center",
                  border: `1px solid ${topic.color}22`,
                }}
                onClick={() => setSelTopic(topic)}
              >
                <div style={{ fontSize: 36, marginBottom: 10 }}>
                  {topic.icon}
                </div>
                <div
                  style={{
                    fontFamily: "var(--display)",
                    fontSize: 20,
                    marginBottom: 6,
                  }}
                >
                  {topic.label}
                </div>
                <div
                  style={{
                    color: "var(--muted)",
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 14,
                  }}
                >
                  {count} challenge{count !== 1 ? "s" : ""}
                </div>
                <div
                  style={{
                    display: "inline-flex",
                    padding: "4px 14px",
                    borderRadius: 50,
                    fontSize: 12,
                    fontWeight: 700,
                    background: `${topic.color}18`,
                    color: topic.color,
                  }}
                >
                  Explore →
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── SCREEN 3: Difficulty selection ──
  if (!selDiff) {
    const topicChallenges = (langGroups[sel.lang] || []).filter(
      (c) => c.errorType === selTopic.id
    );
    return (
      <div
        className="page"
        style={{
          paddingTop: 90,
          padding: "90px 24px 60px",
          maxWidth: 700,
          margin: "0 auto",
        }}
      >
        <button
          style={{
            background: "var(--card2)",
            border: "1px solid var(--border)",
            borderRadius: 50,
            padding: "8px 16px",
            color: "var(--muted)",
            fontWeight: 700,
            fontSize: 13,
            marginBottom: 28,
          }}
          onClick={() => setSelTopic(null)}
        >
          ← Topics
        </button>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginBottom: 6,
          }}
        >
          <span style={{ fontSize: 36 }}>{selTopic.icon}</span>
          <div>
            <div
              style={{ color: "var(--muted)", fontSize: 13, fontWeight: 700 }}
            >
              {sel.icon} {sel.lang}
            </div>
            <h1 style={{ fontFamily: "var(--display)", fontSize: 30 }}>
              {selTopic.label}
            </h1>
          </div>
        </div>
        <p
          style={{
            color: "var(--muted)",
            fontSize: 15,
            fontWeight: 600,
            marginBottom: 36,
          }}
        >
          Pick your difficulty level.
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
            gap: 16,
          }}
        >
          {DIFFICULTIES.map((diff) => {
            const count = topicChallenges.filter(
              (c) => c.difficulty === diff.id
            ).length;
            if (count === 0) return null;
            return (
              <div
                key={diff.id}
                className="card"
                style={{
                  cursor: "pointer",
                  padding: 32,
                  textAlign: "center",
                  border: `1px solid ${diff.color}33`,
                }}
                onClick={() => setSelDiff(diff)}
              >
                <div style={{ fontSize: 40, marginBottom: 12 }}>
                  {diff.icon}
                </div>
                <div
                  style={{
                    fontFamily: "var(--display)",
                    fontSize: 24,
                    marginBottom: 6,
                    textTransform: "capitalize",
                  }}
                >
                  {diff.label}
                </div>
                <div
                  style={{
                    color: "var(--muted)",
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 16,
                  }}
                >
                  {count} challenge{count !== 1 ? "s" : ""}
                </div>
                <div
                  style={{
                    display: "inline-flex",
                    padding: "5px 16px",
                    borderRadius: 50,
                    fontSize: 12,
                    fontWeight: 800,
                    background: `${diff.color}18`,
                    color: diff.color,
                  }}
                >
                  Start
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── SCREEN 4: Level path ──
  const pathKey = `${sel.lang}-${selTopic.id}-${selDiff.id}`;
  const challenges = (langGroups[sel.lang] || []).filter(
    (c) => c.errorType === selTopic.id && c.difficulty === selDiff.id
  );
  const done = completedLevels[pathKey] || 0;

  function handleLevelClick(index) {
    if (index > done) return;
    const c = challenges[index];
    if (!c) return;
    pickChallenge({
      ...c,
      onComplete: () => {
        setCompletedLevels((prev) => ({
          ...prev,
          [pathKey]: Math.max(prev[pathKey] || 0, index + 1),
        }));
      },
    });
    go("challenge");
  }

  return (
    <div
      className="page"
      style={{
        paddingTop: 90,
        padding: "90px 24px 60px",
        maxWidth: 480,
        margin: "0 auto",
        textAlign: "center",
      }}
    >
      <button
        style={{
          background: "var(--card2)",
          border: "1px solid var(--border)",
          borderRadius: 50,
          padding: "8px 16px",
          color: "var(--muted)",
          fontWeight: 700,
          fontSize: 13,
          marginBottom: 24,
        }}
        onClick={() => setSelDiff(null)}
      >
        ← Difficulty
      </button>

      <div style={{ fontSize: 40, marginBottom: 6 }}>{selTopic.icon}</div>
      <div
        style={{
          color: "var(--muted)",
          fontSize: 13,
          fontWeight: 700,
          marginBottom: 4,
        }}
      >
        {sel.icon} {sel.lang} · {selTopic.label}
      </div>
      <h2
        style={{
          fontFamily: "var(--display)",
          fontSize: 30,
          marginBottom: 6,
          textTransform: "capitalize",
        }}
      >
        {selDiff.label} Path
      </h2>
      <p
        style={{
          color: "var(--muted)",
          fontSize: 14,
          fontWeight: 600,
          marginBottom: 12,
        }}
      >
        {done} / {challenges.length} levels completed 🔥
      </p>

      {/* Progress bar */}
      <div className="xp-bar" style={{ maxWidth: 300, margin: "0 auto 40px" }}>
        <div
          className="xp-fill"
          style={{
            width: `${
              challenges.length > 0 ? (done / challenges.length) * 100 : 0
            }%`,
          }}
        />
      </div>

      {/* Level nodes */}
      {challenges.map((c, i) => {
        const isDone = i < done;
        const isActive = i === done;
        const isLocked = i > done;
        const nodeClass = isDone ? "done" : isActive ? "active" : "locked";
        const emoji = levelEmojis[i % levelEmojis.length];

        return (
          <div key={c.id || i}>
            <div
              className={`level-node ${nodeClass}`}
              onClick={() => handleLevelClick(i)}
              title={
                isLocked
                  ? "Complete previous level first"
                  : isActive
                  ? "Current level — click to play!"
                  : `Completed! ${c.title}`
              }
            >
              <span style={{ fontSize: 22 }}>{emoji}</span>
              {isActive && (
                <span
                  style={{
                    position: "absolute",
                    top: -8,
                    right: -8,
                    background: "var(--cyan)",
                    color: "#0a0a12",
                    fontSize: 9,
                    fontWeight: 900,
                    padding: "2px 6px",
                    borderRadius: 50,
                  }}
                >
                  NOW
                </span>
              )}
              {isDone && (
                <span
                  style={{
                    position: "absolute",
                    top: -6,
                    right: -6,
                    background: "var(--lime)",
                    color: "#0a0a12",
                    fontSize: 10,
                    borderRadius: "50%",
                    width: 20,
                    height: 20,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  ✓
                </span>
              )}
              {isLocked && (
                <span style={{ position: "absolute", fontSize: 16 }}>🔒</span>
              )}
            </div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                marginTop: 4,
                marginBottom: 4,
                color: isDone
                  ? "var(--lime)"
                  : isActive
                  ? "var(--cyan)"
                  : "var(--muted)",
              }}
            >
              {isDone || isActive ? c.title : "???"}
            </div>
            <div
              style={{
                fontSize: 10,
                color: "var(--muted)",
                fontWeight: 600,
                marginBottom: 4,
              }}
            >
              {isDone || isActive ? `+${c.xp} XP` : ""}
            </div>
            {i < challenges.length - 1 && (
              <div
                className={`level-conn${isDone ? " done" : ""}`}
                style={{ margin: "4px auto" }}
              />
            )}
          </div>
        );
      })}

      {/* Completion message */}
      {done === challenges.length && challenges.length > 0 && (
        <div
          className="card"
          style={{
            marginTop: 32,
            textAlign: "center",
            border: "2px solid var(--lime)",
            background: "rgba(200,241,53,.05)",
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 8 }}>🏆</div>
          <div
            style={{
              fontFamily: "var(--display)",
              fontSize: 22,
              color: "var(--lime)",
              marginBottom: 8,
            }}
          >
            {selDiff.label} {selTopic.label} Mastered!
          </div>
          <div style={{ color: "var(--muted)", fontSize: 14, fontWeight: 600 }}>
            All {challenges.length} levels cleared. Amazing! 🎉
          </div>
        </div>
      )}
    </div>
  );
}

/* ══ LEADERBOARD ══ */
function Leaderboard() {
  const [tab, setTab] = useState("global");
  const [lbUsers, setLbUsers] = useState(USERS_LB);
  const medals = ["🥇", "🥈", "🥉"];

  useEffect(() => {
    async function loadUsers() {
      try {
        const snap = await getDocs(
          query(collection(db, "users"), orderBy("xp", "desc"))
        );
        const realUsers = snap.docs.map((d) => ({ ...d.data(), id: d.id }));
        if (realUsers.length > 0) setLbUsers(realUsers);
      } catch (e) {
        console.error("Leaderboard load error:", e);
      }
    }
    loadUsers();
  }, []);

  const sorted = [...lbUsers].sort((a, b) => b.xp - a.xp);
  return (
    <div
      className="page"
      style={{
        paddingTop: 90,
        padding: "90px 24px 60px",
        maxWidth: 700,
        margin: "0 auto",
      }}
    >
      <h1
        style={{ fontFamily: "var(--display)", fontSize: 38, marginBottom: 6 }}
      >
        Leaderboard 🏆
      </h1>
      <p
        style={{
          color: "var(--muted)",
          fontSize: 14,
          fontWeight: 600,
          marginBottom: 28,
        }}
      >
        Top debuggers this week. Keep grinding! 💪
      </p>
      <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
        <button
          className={`tab${tab === "global" ? " active" : ""}`}
          onClick={() => setTab("global")}
        >
          🌍 Global
        </button>
        <button
          className={`tab${tab === "local" ? " active" : ""}`}
          onClick={() => setTab("local")}
        >
          👥 My Group
        </button>
      </div>
      {(tab === "global" ? sorted : sorted.slice(0, 3)).map((u, i) => (
        <div
          key={u.id}
          className="lb-row"
          style={{
            background: u.name === "You" ? "rgba(200,241,53,.04)" : "",
            border: u.name === "You" ? "1px solid rgba(200,241,53,.2)" : "",
          }}
        >
          <span
            style={{
              fontFamily: "var(--display)",
              fontSize: 18,
              minWidth: 32,
              color: i < 3 ? "var(--yellow)" : "var(--muted)",
            }}
          >
            {i < 3 ? medals[i] : i + 1}
          </span>
          <Av emoji={u.avatar} size={44} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 15 }}>
              {u.name}
              {u.name === "You" && (
                <span
                  style={{ color: "var(--lime)", fontSize: 12, marginLeft: 8 }}
                >
                  ← you
                </span>
              )}
            </div>
            <div
              style={{ color: "var(--muted)", fontSize: 12, fontWeight: 600 }}
            >
              🐛 {u.solved} solved · 🔥 {u.streak} streak · {u.lang}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontFamily: "var(--display)",
                color: "var(--lime)",
                fontSize: 20,
              }}
            >
              {u.xp.toLocaleString()}
            </div>
            <div
              style={{ color: "var(--muted)", fontSize: 11, fontWeight: 700 }}
            >
              XP
            </div>
          </div>
        </div>
      ))}
      {tab === "local" && (
        <p
          style={{
            color: "var(--muted)",
            fontSize: 13,
            fontWeight: 600,
            textAlign: "center",
            marginTop: 20,
          }}
        >
          Showing your group · Create one from Discuss → connect with users
        </p>
      )}
    </div>
  );
}

/* ══ DISCUSS ══ */
function Discuss({ user }) {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState("");
  const [commenting, setCommenting] = useState(null);
  const [commentVal, setCommentVal] = useState("");
  const [groupModal, setGroupModal] = useState(null);

  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const list = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();
          const commentsSnap = await getDocs(
            collection(db, "posts", docSnap.id, "comments")
          );
          const comments = commentsSnap.docs.map((c) => c.data());
          return { id: docSnap.id, ...data, comments: comments || [] };
        })
      );
      setPosts(list);
    });
    return () => unsubscribe();
  }, []);

  async function addPost() {
    if (!newPost.trim()) return;
    await addDoc(collection(db, "posts"), {
      text: newPost,
      author: user.name,
      avatar: user.avatar,
      userId: user.uid,
      likes: 0,
      createdAt: serverTimestamp(),
    });
    setNewPost("");
  }

  async function likePost(post) {
    if (post.likedBy?.includes(user.uid)) return;
    await updateDoc(doc(db, "posts", post.id), {
      likes: (post.likes || 0) + 1,
      likedBy: [...(post.likedBy || []), user.uid],
    });
  }

  async function addComment(postId) {
    if (!commentVal.trim()) return;
    await addDoc(collection(db, "posts", postId, "comments"), {
      text: commentVal,
      author: user.name,
      createdAt: serverTimestamp(),
    });
    setCommentVal("");
    setCommenting(null);
  }

  return (
    <div
      className="page"
      style={{
        paddingTop: 90,
        padding: "90px 24px 60px",
        maxWidth: 720,
        margin: "0 auto",
      }}
    >
      {groupModal && (
        <div className="modal-overlay" onClick={() => setGroupModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                fontFamily: "var(--display)",
                fontSize: 24,
                marginBottom: 8,
              }}
            >
              👥 Connect with {groupModal}
            </div>
            <p
              style={{
                color: "var(--muted)",
                fontSize: 14,
                fontWeight: 600,
                marginBottom: 24,
              }}
            >
              Start a group chat or add them to an existing group.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                className="btn-lime"
                style={{ flex: 1 }}
                onClick={() => setGroupModal(null)}
              >
                Create Group Chat 💬
              </button>
              <button
                className="btn-ghost"
                style={{ flex: 1 }}
                onClick={() => setGroupModal(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      <h1
        style={{ fontFamily: "var(--display)", fontSize: 38, marginBottom: 6 }}
      >
        Discuss 💬
      </h1>
      <p
        style={{
          color: "var(--muted)",
          fontSize: 14,
          fontWeight: 600,
          marginBottom: 24,
        }}
      >
        Share bugs, tips, and help others debug!
      </p>
      <div className="card" style={{ marginBottom: 22 }}>
        <textarea
          rows={3}
          placeholder="Share a tip, ask a question, or post your debugging experience..."
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
          style={{
            width: "100%",
            background: "var(--bg)",
            border: "1.5px solid var(--border)",
            borderRadius: 12,
            padding: 14,
            color: "var(--text)",
            fontSize: 14,
            resize: "none",
            transition: "border-color .2s",
          }}
          onFocus={(e) => (e.target.style.borderColor = "var(--lime)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
        />
        <div
          style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}
        >
          <button className="btn-lime btn-sm" onClick={addPost}>
            Post 🚀
          </button>
        </div>
      </div>
      {posts.map((post) => (
        <div key={post.id} className="post">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 12,
            }}
          >
            <Av emoji={post.avatar} size={40} />
            <div>
              <button
                style={{
                  background: "none",
                  fontWeight: 800,
                  fontSize: 15,
                  color: "var(--text)",
                }}
                onClick={() => setGroupModal(post.author)}
              >
                {post.author}
              </button>
              <div
                style={{ color: "var(--muted)", fontSize: 12, fontWeight: 600 }}
              >
                {post.time || "just now"}
              </div>
            </div>
          </div>
          <p
            style={{
              fontSize: 14,
              lineHeight: 1.75,
              marginBottom: 14,
              fontWeight: 600,
            }}
          >
            {post.text}
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              style={{
                background: "rgba(255,75,203,.1)",
                color: "var(--pink)",
                border: "1px solid rgba(255,75,203,.2)",
                borderRadius: 50,
                padding: "6px 14px",
                fontSize: 13,
                fontWeight: 700,
                opacity: post.likedBy?.includes(user.uid) ? 0.5 : 1,
              }}
              onClick={() => likePost(post)}
              disabled={post.likedBy?.includes(user.uid)}
            >
              ❤️ {post.likes || 0}
            </button>
            <button
              style={{
                background: "var(--card2)",
                color: "var(--muted)",
                border: "1px solid var(--border)",
                borderRadius: 50,
                padding: "6px 14px",
                fontSize: 13,
                fontWeight: 700,
              }}
              onClick={() =>
                setCommenting(commenting === post.id ? null : post.id)
              }
            >
              💬 {(post.comments || []).length}
            </button>
          </div>
          {(post.comments || []).length > 0 && (
            <div
              style={{
                marginTop: 12,
                paddingTop: 12,
                borderTop: "1px solid var(--border)",
              }}
            >
              {(post.comments || []).map((c, i) => (
                <div
                  key={i}
                  style={{ display: "flex", gap: 10, marginBottom: 10 }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: "var(--card2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                    }}
                  >
                    💬
                  </div>
                  <div
                    style={{
                      background: "var(--card2)",
                      borderRadius: 10,
                      padding: "8px 12px",
                      flex: 1,
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 800,
                        fontSize: 12,
                        color: "var(--lime)",
                        marginBottom: 2,
                      }}
                    >
                      {c.author}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--muted)" }}>
                      {c.text}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {commenting === post.id && (
            <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
              <input
                placeholder="Write a comment..."
                value={commentVal}
                onChange={(e) => setCommentVal(e.target.value)}
                style={{
                  flex: 1,
                  background: "var(--card2)",
                  border: "1.5px solid var(--border)",
                  borderRadius: 10,
                  padding: "10px 14px",
                  color: "var(--text)",
                  fontSize: 13,
                }}
                onKeyDown={(e) => e.key === "Enter" && addComment(post.id)}
              />
              <button
                className="btn-lime btn-sm"
                onClick={() => addComment(post.id)}
              >
                Send
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ══ PROFILE ══ */
function Profile({ user, setUser, onUpload }) {
  const [tab, setTab] = useState("stats");
  const [uploads, setUploads] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    title: "",
    lang: "Python",
    difficulty: "easy",
    errorType: "Syntax",
    code: "",
    bugLine: "",
    fixed: "",
    hint: "",
    expectedOutput: "",
  });
  const canUpload = true;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title || !form.code || !form.fixed || !form.hint) return;
    const newUpload = {
      id: Date.now(),
      title: form.title,
      lang: form.lang,
      difficulty: form.difficulty,
      errorType: form.errorType,
      code: form.code,
      bugLine: Number(form.bugLine),
      fixed: form.fixed,
      hint: form.hint,
      expectedOutput: form.expectedOutput,
      status: "pending",
      submittedAt: new Date().toLocaleDateString(),
      authorId: user.uid,
      author: user.name,
      avatar: user.avatar,
    };
    setUploads((prev) => [newUpload, ...prev]);
    try {
      await addDoc(collection(db, "submissions"), {
        ...newUpload,
        lines: newUpload.code.split("\n"),
        description: newUpload.hint,
        xp:
          newUpload.difficulty === "easy"
            ? 50
            : newUpload.difficulty === "medium"
            ? 80
            : 120,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Submission failed:", err);
    }
    if (onUpload)
      onUpload({
        ...newUpload,
        lines: newUpload.code.split("\n"),
        description: newUpload.hint,
        xp:
          newUpload.difficulty === "easy"
            ? 50
            : newUpload.difficulty === "medium"
            ? 80
            : 120,
      });
    setForm({
      title: "",
      lang: "Python",
      difficulty: "easy",
      errorType: "Syntax",
      code: "",
      bugLine: "",
      fixed: "",
      hint: "",
      expectedOutput: "",
    });
    setShowForm(false);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  }
  return (
    <div
      className="page"
      style={{
        paddingTop: 90,
        padding: "90px 24px 60px",
        maxWidth: 800,
        margin: "0 auto",
      }}
    >
      <div
        className="card"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 24,
          marginBottom: 22,
          flexWrap: "wrap",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          className="glow"
          style={{
            width: 300,
            height: 200,
            background: "var(--lime)",
            top: "-50%",
            right: "-5%",
          }}
        />
        <Av emoji={user.avatar} size={80} />
        <div style={{ flex: 1, position: "relative", zIndex: 1 }}>
          <div
            style={{
              fontFamily: "var(--display)",
              fontSize: 30,
              marginBottom: 4,
            }}
          >
            {user.name}
          </div>
          <div
            style={{
              color: "var(--muted)",
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 12,
            }}
          >
            {user.email}
          </div>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            <div>
              <span
                style={{
                  fontFamily: "var(--display)",
                  fontSize: 22,
                  color: "var(--lime)",
                }}
              >
                {user.xp.toLocaleString()}
              </span>
              <span
                style={{
                  color: "var(--muted)",
                  fontSize: 12,
                  fontWeight: 700,
                  marginLeft: 4,
                }}
              >
                XP
              </span>
            </div>
            <div>
              <span style={{ fontSize: 16 }}>🔥</span>
              <span
                style={{
                  fontFamily: "var(--display)",
                  fontSize: 22,
                  color: "var(--orange)",
                }}
              >
                {user.streak}
              </span>
              <span
                style={{
                  color: "var(--muted)",
                  fontSize: 12,
                  fontWeight: 700,
                  marginLeft: 4,
                }}
              >
                STREAK
              </span>
            </div>
            <div>
              <span
                style={{
                  fontFamily: "var(--display)",
                  fontSize: 22,
                  color: "var(--cyan)",
                }}
              >
                {user.solved}
              </span>
              <span
                style={{
                  color: "var(--muted)",
                  fontSize: 12,
                  fontWeight: 700,
                  marginLeft: 4,
                }}
              >
                SOLVED
              </span>
            </div>
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 22 }}>
        {["stats", "badges", "uploads"].map((t) => (
          <button
            key={t}
            className={`tab${tab === t ? " active" : ""}`}
            onClick={() => setTab(t)}
            style={{ textTransform: "capitalize" }}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "stats" && (
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 12 }}>
              📈 Level Progress
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <span
                style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600 }}
              >
                Level 4 → Level 5
              </span>
              <span style={{ fontSize: 13, fontWeight: 700 }}>
                {user.xp} / 2000 XP
              </span>
            </div>
            <div className="xp-bar">
              <div
                className="xp-fill"
                style={{ width: `${(user.xp / 2000) * 100}%` }}
              />
            </div>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))",
              gap: 14,
            }}
          >
            {[
              { l: "Python", v: "8 solved", i: "🐍" },
              { l: "JavaScript", v: "6 solved", i: "💛" },
              { l: "Java", v: "4 solved", i: "☕" },
            ].map((s) => (
              <div key={s.l} className="card" style={{ textAlign: "center" }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>{s.i}</div>
                <div style={{ fontWeight: 800, fontSize: 15 }}>{s.l}</div>
                <div
                  style={{
                    color: "var(--muted)",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {s.v}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {tab === "badges" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(110px,1fr))",
            gap: 12,
          }}
        >
          {BADGES.map((b, i) => (
            <div key={i} className="badge-box">
              <div style={{ fontSize: 32 }}>{b.icon}</div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textAlign: "center",
                  color: "var(--muted)",
                }}
              >
                {b.label}
              </div>
            </div>
          ))}
        </div>
      )}
      {tab === "uploads" && (
        <div>
          <div
            className="card"
            style={{
              marginBottom: 20,
              background: canUpload
                ? "rgba(200,241,53,.05)"
                : "rgba(239,68,68,.05)",
              border: `1.5px solid ${
                canUpload ? "rgba(200,241,53,.3)" : "rgba(239,68,68,.2)"
              }`,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>
                  {canUpload ? "✅ Upload Unlocked!" : "🔒 Upload Locked"}
                </div>
                <div
                  style={{
                    color: "var(--muted)",
                    fontSize: 13,
                    fontWeight: 600,
                    lineHeight: 1.7,
                  }}
                >
                  {canUpload
                    ? `You've solved ${user.solved} challenges! Contribute your own buggy code.`
                    : `Solve ${
                        10 - user.solved
                      } more challenges to unlock uploads.`}
                </div>
              </div>
              {canUpload && (
                <button
                  className="btn-lime btn-sm"
                  style={{ padding: "10px 22px", flexShrink: 0 }}
                  onClick={() => setShowForm((v) => !v)}
                >
                  {showForm ? "✕ Cancel" : "+ Upload Buggy Code"}
                </button>
              )}
            </div>
            {!canUpload && (
              <div style={{ marginTop: 14 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 6,
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      color: "var(--muted)",
                      fontWeight: 600,
                    }}
                  >
                    Progress to unlock
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>
                    {user.solved} / 10
                  </span>
                </div>
                <div className="xp-bar">
                  <div
                    className="xp-fill"
                    style={{ width: `${(user.solved / 10) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {submitted && (
            <div
              style={{
                background: "rgba(34,197,94,.1)",
                border: "1px solid rgba(34,197,94,.3)",
                borderRadius: 14,
                padding: "14px 20px",
                color: "var(--green)",
                fontWeight: 700,
                fontSize: 14,
                marginBottom: 20,
              }}
            >
              🎉 Your buggy code has been submitted for review! It will appear
              in the community once approved.
            </div>
          )}

          {showForm && canUpload && (
            <div
              className="card"
              style={{
                marginBottom: 24,
                border: "1.5px solid rgba(200,241,53,.2)",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--display)",
                  fontSize: 20,
                  marginBottom: 20,
                  color: "var(--lime)",
                }}
              >
                🐛 Submit Buggy Code
              </div>
              <form onSubmit={handleSubmit}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 14,
                    marginBottom: 14,
                  }}
                >
                  <div>
                    <label
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "var(--muted)",
                        display: "block",
                        marginBottom: 6,
                      }}
                    >
                      TITLE *
                    </label>
                    <input
                      className="input-field"
                      placeholder="e.g. Broken Loop Counter"
                      value={form.title}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, title: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "var(--muted)",
                        display: "block",
                        marginBottom: 6,
                      }}
                    >
                      LANGUAGE *
                    </label>
                    <select
                      className="input-field"
                      value={form.lang}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, lang: e.target.value }))
                      }
                      style={{ width: "100%" }}
                    >
                      {[
                        "Python",
                        "JavaScript",
                        "Java",
                        "C",
                        "C++",
                        "HTML",
                        "CSS",
                      ].map((l) => (
                        <option key={l}>{l}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "var(--muted)",
                        display: "block",
                        marginBottom: 6,
                      }}
                    >
                      DIFFICULTY *
                    </label>
                    <select
                      className="input-field"
                      value={form.difficulty}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, difficulty: e.target.value }))
                      }
                      style={{ width: "100%" }}
                    >
                      {["easy", "medium", "hard"].map((d) => (
                        <option key={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "var(--muted)",
                        display: "block",
                        marginBottom: 6,
                      }}
                    >
                      ERROR TYPE *
                    </label>
                    <select
                      className="input-field"
                      value={form.errorType}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, errorType: e.target.value }))
                      }
                      style={{ width: "100%" }}
                    >
                      {[
                        "Syntax",
                        "Logic",
                        "Runtime",
                        "Compile",
                        "Exception",
                      ].map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "var(--muted)",
                      display: "block",
                      marginBottom: 6,
                    }}
                  >
                    BUGGY CODE *
                  </label>
                  <textarea
                    className="input-field"
                    rows={7}
                    placeholder={
                      "def calculate(x):\n    return x * 2\n    print('done')  # bug here"
                    }
                    value={form.code}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, code: e.target.value }))
                    }
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: 13,
                      resize: "vertical",
                    }}
                    required
                  />
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 2fr",
                    gap: 14,
                    marginBottom: 14,
                  }}
                >
                  <div>
                    <label
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "var(--muted)",
                        display: "block",
                        marginBottom: 6,
                      }}
                    >
                      BUG LINE #{" "}
                      <span style={{ fontWeight: 600 }}>(0-indexed)</span>
                    </label>
                    <input
                      className="input-field"
                      type="number"
                      min={0}
                      placeholder="e.g. 2"
                      value={form.bugLine}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, bugLine: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "var(--muted)",
                        display: "block",
                        marginBottom: 6,
                      }}
                    >
                      FIXED LINE *
                    </label>
                    <input
                      className="input-field"
                      placeholder="Correct version of that line"
                      value={form.fixed}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, fixed: e.target.value }))
                      }
                      style={{ fontFamily: "var(--mono)", fontSize: 13 }}
                      required
                    />
                  </div>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 14,
                    marginBottom: 14,
                  }}
                >
                  <div>
                    <label
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "var(--muted)",
                        display: "block",
                        marginBottom: 6,
                      }}
                    >
                      HINT FOR USERS *
                    </label>
                    <input
                      className="input-field"
                      placeholder="Guide without giving away the answer"
                      value={form.hint}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, hint: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "var(--muted)",
                        display: "block",
                        marginBottom: 6,
                      }}
                    >
                      EXPECTED OUTPUT
                    </label>
                    <input
                      className="input-field"
                      placeholder="e.g. 10"
                      value={form.expectedOutput}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          expectedOutput: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                <div
                  style={{
                    background: "rgba(0,229,255,.06)",
                    border: "1px solid rgba(0,229,255,.15)",
                    borderRadius: 10,
                    padding: "10px 14px",
                    marginBottom: 20,
                    fontSize: 12,
                    color: "var(--cyan)",
                    fontWeight: 600,
                  }}
                >
                  ℹ️ Your submission will be reviewed by a developer before
                  going live.
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    type="submit"
                    className="btn-lime"
                    style={{ padding: "12px 28px" }}
                  >
                    Submit for Review 🚀
                  </button>
                  <button
                    type="button"
                    className="btn-ghost btn-sm"
                    onClick={() => setShowForm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {uploads.length > 0 ? (
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 14 }}>
                📋 My Submissions ({uploads.length})
              </div>
              {uploads.map((u) => (
                <div key={u.id} className="card" style={{ marginBottom: 14 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: 10,
                      marginBottom: 10,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontWeight: 800,
                          fontSize: 15,
                          marginBottom: 4,
                        }}
                      >
                        {u.title}
                      </div>
                      <div
                        style={{ display: "flex", gap: 6, flexWrap: "wrap" }}
                      >
                        <span className={`tag tag-${u.difficulty}`}>
                          {u.difficulty.toUpperCase()}
                        </span>
                        <span className="tag tag-lang">{u.lang}</span>
                        <span className="chip">🐛 {u.errorType}</span>
                      </div>
                    </div>
                    <span
                      style={{
                        padding: "4px 12px",
                        borderRadius: 50,
                        fontSize: 11,
                        fontWeight: 800,
                        background:
                          u.status === "approved"
                            ? "rgba(34,197,94,.15)"
                            : u.status === "rejected"
                            ? "rgba(239,68,68,.15)"
                            : "rgba(255,235,0,.1)",
                        color:
                          u.status === "approved"
                            ? "var(--green)"
                            : u.status === "rejected"
                            ? "var(--red)"
                            : "var(--yellow)",
                      }}
                    >
                      {u.status === "approved"
                        ? "✅ Approved"
                        : u.status === "rejected"
                        ? "❌ Rejected"
                        : "⏳ Pending Review"}
                    </span>
                  </div>
                  <div
                    style={{
                      background: "var(--bg)",
                      borderRadius: 10,
                      padding: 12,
                      fontFamily: "var(--mono)",
                      fontSize: 12,
                      color: "var(--muted)",
                      lineHeight: 1.8,
                      whiteSpace: "pre-wrap",
                      maxHeight: 120,
                      overflow: "hidden",
                    }}
                  >
                    {u.code}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            !showForm && (
              <div
                style={{
                  textAlign: "center",
                  padding: 48,
                  color: "var(--muted)",
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                {canUpload
                  ? "No uploads yet. Share your first buggy challenge! 🐛"
                  : "Keep debugging to unlock this feature 💪"}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

/* ══ DEV DASHBOARD ══ */
function DevDash({ onPublish }) {
  const [queue, setQueue] = useState(DEV_QUEUE);
  const [tab, setTab] = useState("upload");
  const [form, setForm] = useState({
    title: "",
    lang: "Python",
    difficulty: "easy",
    errorType: "Syntax",
    description: "",
    code: "",
    bugLine: "",
    fixed: "",
    hint: "",
    expectedOutput: "",
    xp: "80",
  });
  const [uploaded, setUploaded] = useState(false);
  const [uploadErr, setUploadErr] = useState("");

  // Load pending user submissions from Firestore
  useEffect(() => {
    const q = query(
      collection(db, "submissions"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setQueue([...DEV_QUEUE, ...items]);
    });
    return () => unsub();
  }, []);

  async function approve(id) {
    try {
      const item = queue.find((c) => c.id === id || c.firestoreId === id);
      if (item && item.id && typeof item.id === "string") {
        await updateDoc(doc(db, "submissions", item.id), {
          status: "approved",
        });
        // Promote to challenges so it appears in Dashboard/Levels
        const {
          id: _id,
          status: _s,
          firestoreId: _fid,
          submittedAt: _sa,
          ...challengeData
        } = item;
        await addDoc(collection(db, "challenges"), {
          ...challengeData,
          lines: challengeData.code
            ? challengeData.code.split("\n")
            : challengeData.lines || [],
          approved: true,
          approvedAt: serverTimestamp(),
        });
        if (onPublish)
          onPublish({
            ...challengeData,
            lines: challengeData.code?.split("\n") || challengeData.lines || [],
          });
      }
      setQueue((q) =>
        q.map((c) => (c.id === id ? { ...c, status: "approved" } : c))
      );
    } catch (e) {
      console.error("Approve error:", e);
    }
  }

  async function reject(id) {
    try {
      if (typeof id === "string" && id.length > 5) {
        await updateDoc(doc(db, "submissions", id), { status: "rejected" });
      }
      setQueue((q) => q.filter((c) => c.id !== id));
    } catch (e) {
      console.error("Reject error:", e);
    }
  }

  async function publish(e) {
    e.preventDefault();
    setUploadErr("");
    if (!form.title || !form.code || form.bugLine === "" || !form.fixed) {
      setUploadErr("Please fill in all required fields.");
      return;
    }
    try {
      const lines = form.code.split("\n");
      const newChallenge = {
        title: form.title,
        lang: form.lang,
        difficulty: form.difficulty,
        errorType: form.errorType,
        description: form.description || form.hint,
        lines,
        bugLine: parseInt(form.bugLine) || 0,
        fixed: form.fixed,
        hint: form.hint,
        expectedOutput: form.expectedOutput,
        xp: parseInt(form.xp) || 80,
        approved: true,
        source: "dev",
        createdAt: serverTimestamp(),
      };
      await addDoc(collection(db, "challenges"), newChallenge);
      if (onPublish) onPublish({ ...newChallenge, id: Date.now() });
      setUploaded(true);
      setForm({
        title: "",
        lang: "Python",
        difficulty: "easy",
        errorType: "Syntax",
        description: "",
        code: "",
        bugLine: "",
        fixed: "",
        hint: "",
        expectedOutput: "",
        xp: "80",
      });
      setTimeout(() => setUploaded(false), 3000);
    } catch (e) {
      console.error("Upload error:", e);
      setUploadErr("Failed to upload. Check Firestore rules.");
    }
  }

  return (
    <div
      className="page"
      style={{
        paddingTop: 90,
        padding: "90px 24px 60px",
        maxWidth: 900,
        margin: "0 auto",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 28,
        }}
      >
        <span style={{ fontSize: 28 }}>🛠️</span>
        <h1 style={{ fontFamily: "var(--display)", fontSize: 34 }}>
          Developer Panel
        </h1>
        <span
          className="tag"
          style={{ background: "rgba(168,85,247,.15)", color: "var(--purple)" }}
        >
          ADMIN
        </span>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <button
          className={`tab${tab === "upload" ? " active" : ""}`}
          onClick={() => setTab("upload")}
        >
          📤 Upload Challenge
        </button>
        <button
          className={`tab${tab === "review" ? " active" : ""}`}
          onClick={() => setTab("review")}
        >
          👁️ Review Queue ({queue.filter((c) => c.status === "pending").length})
        </button>
      </div>

      {tab === "upload" && (
        <div className="card">
          <div
            style={{
              fontFamily: "var(--display)",
              fontSize: 22,
              marginBottom: 20,
            }}
          >
            Upload New Buggy Challenge
          </div>
          {uploaded && (
            <div
              style={{
                background: "rgba(34,197,94,.1)",
                border: "1px solid rgba(34,197,94,.3)",
                borderRadius: 12,
                padding: "12px 18px",
                color: "var(--green)",
                fontWeight: 700,
                marginBottom: 16,
              }}
            >
              ✅ Challenge published successfully! It will appear in Levels and
              Dashboard.
            </div>
          )}
          {uploadErr && (
            <div
              style={{
                background: "rgba(239,68,68,.1)",
                border: "1px solid rgba(239,68,68,.3)",
                borderRadius: 12,
                padding: "12px 18px",
                color: "var(--red)",
                fontWeight: 700,
                marginBottom: 16,
              }}
            >
              ⚠️ {uploadErr}
            </div>
          )}
          <form onSubmit={publish}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 14,
                marginBottom: 14,
              }}
            >
              <div>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "var(--muted)",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  TITLE *
                </label>
                <input
                  className="input-field"
                  placeholder="e.g. Off-by-one Loop"
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "var(--muted)",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  LANGUAGE
                </label>
                <select
                  className="input-field"
                  value={form.lang}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, lang: e.target.value }))
                  }
                  style={{ width: "100%" }}
                >
                  {[
                    "Python",
                    "JavaScript",
                    "Java",
                    "C",
                    "C++",
                    "HTML",
                    "CSS",
                  ].map((l) => (
                    <option key={l}>{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "var(--muted)",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  DIFFICULTY
                </label>
                <select
                  className="input-field"
                  value={form.difficulty}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, difficulty: e.target.value }))
                  }
                  style={{ width: "100%" }}
                >
                  {["easy", "medium", "hard"].map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "var(--muted)",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  ERROR TYPE
                </label>
                <select
                  className="input-field"
                  value={form.errorType}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, errorType: e.target.value }))
                  }
                  style={{ width: "100%" }}
                >
                  {["Syntax", "Logic", "Runtime", "Compile", "Exception"].map(
                    (t) => (
                      <option key={t}>{t}</option>
                    )
                  )}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--muted)",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                DESCRIPTION (shown to users)
              </label>
              <input
                className="input-field"
                placeholder="e.g. This function should print 1–5 but the output is wrong."
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--muted)",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                BUGGY CODE *
              </label>
              <textarea
                className="input-field"
                rows={6}
                placeholder="Paste the buggy code here (one line per line)..."
                value={form.code}
                onChange={(e) =>
                  setForm((f) => ({ ...f, code: e.target.value }))
                }
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 13,
                  resize: "vertical",
                }}
              />
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 14,
                marginBottom: 14,
              }}
            >
              <div>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "var(--muted)",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  BUG LINE # * (0-indexed)
                </label>
                <input
                  className="input-field"
                  type="number"
                  placeholder="e.g. 2"
                  value={form.bugLine}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, bugLine: e.target.value }))
                  }
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "var(--muted)",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  FIXED LINE *
                </label>
                <input
                  className="input-field"
                  placeholder="Correct version of the bug line"
                  value={form.fixed}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, fixed: e.target.value }))
                  }
                  style={{ fontFamily: "var(--mono)", fontSize: 13 }}
                />
              </div>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 14,
                marginBottom: 14,
              }}
            >
              <div>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "var(--muted)",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  HINT FOR USERS
                </label>
                <input
                  className="input-field"
                  placeholder="Give a helpful hint without revealing the answer"
                  value={form.hint}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, hint: e.target.value }))
                  }
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "var(--muted)",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  EXPECTED OUTPUT
                </label>
                <input
                  className="input-field"
                  placeholder="e.g. 1\n2\n3"
                  value={form.expectedOutput}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, expectedOutput: e.target.value }))
                  }
                  style={{ fontFamily: "var(--mono)", fontSize: 13 }}
                />
              </div>
            </div>
            <div style={{ marginBottom: 20, maxWidth: 200 }}>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--muted)",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                XP REWARD
              </label>
              <input
                className="input-field"
                type="number"
                placeholder="e.g. 80"
                value={form.xp}
                onChange={(e) => setForm((f) => ({ ...f, xp: e.target.value }))}
              />
            </div>
            <button
              type="submit"
              className="btn-lime"
              style={{ padding: "13px 32px" }}
            >
              Publish Challenge 🚀
            </button>
          </form>
        </div>
      )}

      {tab === "review" && (
        <div>
          {queue.filter((c) => c.status === "pending").length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: 60,
                color: "var(--muted)",
                fontSize: 15,
                fontWeight: 600,
              }}
            >
              ✅ All caught up! No pending submissions.
            </div>
          )}
          {queue.map((sub) => (
            <div key={sub.id} className="card" style={{ marginBottom: 16 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 12,
                  flexWrap: "wrap",
                  gap: 10,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Av emoji={sub.avatar || "🚀"} size={38} />
                  <div>
                    <div style={{ fontWeight: 800 }}>{sub.title}</div>
                    <div
                      style={{
                        color: "var(--muted)",
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      by {sub.author} · {sub.lang}
                    </div>
                  </div>
                </div>
                {sub.status === "approved" ? (
                  <span className="tag tag-easy">✓ Approved</span>
                ) : (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      className="btn-lime btn-sm"
                      onClick={() => approve(sub.id)}
                    >
                      ✓ Approve
                    </button>
                    <button
                      style={{
                        background: "rgba(239,68,68,.15)",
                        color: "var(--red)",
                        border: "1px solid rgba(239,68,68,.3)",
                        borderRadius: 50,
                        padding: "8px 16px",
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                      onClick={() => reject(sub.id)}
                    >
                      ✗ Reject
                    </button>
                  </div>
                )}
              </div>
              <div
                style={{
                  background: "var(--bg)",
                  borderRadius: 10,
                  padding: 14,
                  fontFamily: "var(--mono)",
                  fontSize: 12,
                  color: "var(--muted)",
                  lineHeight: 1.8,
                  whiteSpace: "pre-wrap",
                }}
              >
                {sub.code}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DailyChallenge({ go, pickChallenge }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    function calcTime() {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight - now;
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(
        `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(
          s
        ).padStart(2, "0")}`
      );
    }
    calcTime();
    const t = setInterval(calcTime, 1000);
    return () => clearInterval(t);
  }, []);

  const d = DAILY_CHALLENGE;

  return (
    <div
      className="card"
      style={{
        marginBottom: 28,
        background:
          "linear-gradient(135deg, rgba(200,241,53,0.08), rgba(0,229,255,0.06))",
        border: "1.5px solid rgba(200,241,53,0.3)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background glow */}
      <div
        className="glow"
        style={{
          width: 300,
          height: 200,
          background: "var(--lime)",
          top: "-50%",
          right: "-5%",
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 28 }}>⚡</span>
            <div>
              <div
                style={{
                  fontFamily: "var(--display)",
                  fontSize: 20,
                  color: "var(--lime)",
                }}
              >
                Daily Challenge
              </div>
              <div
                style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}
              >
                Resets in{" "}
                <span
                  style={{ color: "var(--cyan)", fontFamily: "var(--mono)" }}
                >
                  {timeLeft}
                </span>
              </div>
            </div>
          </div>

          {/* Bonus XP badge */}
          <div
            style={{
              background: "rgba(200,241,53,0.15)",
              border: "1px solid rgba(200,241,53,0.4)",
              borderRadius: 50,
              padding: "6px 16px",
              fontFamily: "var(--display)",
              fontSize: 16,
              color: "var(--lime)",
            }}
          >
            +{d.xp * 2} XP BONUS 🔥
          </div>
        </div>

        {/* Challenge info */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{
                display: "flex",
                gap: 8,
                marginBottom: 8,
                flexWrap: "wrap",
              }}
            >
              <span className={`tag tag-${d.difficulty}`}>
                {d.difficulty.toUpperCase()}
              </span>
              <span className="tag tag-lang">{d.lang}</span>
              <span className="chip">🐛 {d.errorType}</span>
            </div>
            <div
              style={{
                fontFamily: "var(--display)",
                fontSize: 20,
                marginBottom: 4,
              }}
            >
              {d.title}
            </div>
            <div
              style={{ color: "var(--muted)", fontSize: 13, fontWeight: 600 }}
            >
              {d.description}
            </div>
          </div>

          <button
            className="btn-lime"
            style={{ padding: "12px 28px", fontSize: 14, flexShrink: 0 }}
            onClick={() => {
              pickChallenge({ ...d, xp: d.xp * 2 });
              go("challenge");
            }}
          >
            Solve Today's Bug →
          </button>
        </div>
      </div>
    </div>
  );
}
/* ══ ROOT ══ */
export default function App() {
  const [page, setPage] = useState("landing");
  const [user, setUser] = useState(null);
  const [challenge, setChallenge] = useState(null);
  const [communityUploads, setCommunityUploads] = useState([]);
  const [devChallenges, setDevChallenges] = useState(CHALLENGES);
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("debugg-theme");
    if (saved === "light") {
      document.body.className = "light";
      return "light";
    }
    document.body.className = "";
    return "dark";
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser && !user) {
        try {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            setUser({ ...userDoc.data(), uid: firebaseUser.uid });
          } else {
            const fallbackData = {
              name:
                firebaseUser.displayName || firebaseUser.email.split("@")[0],
              email: firebaseUser.email,
              uid: firebaseUser.uid,
              avatar: "🚀",
              role: "user",
              xp: 0,
              streak: 0,
              solved: 0,
              lastSolvedDate: null,
              solvedChallenges: [],
              createdAt: serverTimestamp(),
            };
            await setDoc(doc(db, "users", firebaseUser.uid), fallbackData);
            setUser(fallbackData);
          }
          setPage("dashboard");
        } catch (e) {
          console.error("Error loading user data:", e);
        }
      }
    });
    return () => unsub();
  }, []);

  // Load dev-published challenges from Firestore in real-time
  useEffect(() => {
    const q = query(collection(db, "challenges"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map((d) => ({ ...d.data(), id: d.id }));
      setDevChallenges([...CHALLENGES, ...docs]);
    });
    return () => unsub();
  }, []);

  // Load community uploads (user submissions) from Firestore in real-time
  useEffect(() => {
    const q = query(
      collection(db, "submissions"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map((d) => ({ ...d.data(), id: d.id }));
      setCommunityUploads(docs);
    });
    return () => unsub();
  }, []);

  function go(p) {
    const protected_ = [
      "dashboard",
      "levels",
      "discuss",
      "leaderboard",
      "profile",
      "challenge",
      "devdash",
    ];
    if (protected_.includes(p) && !user) {
      setPage("login");
      return;
    }
    setPage(p);
  }

  async function logout() {
    await signOut(auth);
    setUser(null);
    setPage("landing");
  }

  return (
    <>
      <style>{STYLES}</style>
      <Nav
        page={page}
        go={go}
        user={user}
        logout={logout}
        theme={theme}
        setTheme={setTheme}
      />
      {page === "landing" && <Landing go={go} />}
      {page === "login" && <Auth mode="login" go={go} setUser={setUser} />}
      {page === "signup" && <Auth mode="signup" go={go} setUser={setUser} />}
      {page === "devlogin" && (
        <Auth mode="devlogin" go={go} setUser={setUser} />
      )}
      {page === "dashboard" && user && (
        <Dashboard
          user={user}
          go={go}
          pickChallenge={setChallenge}
          communityUploads={communityUploads}
        />
      )}
      {page === "challenge" && user && challenge && (
        <ChallengePage
          challenge={challenge}
          go={go}
          setUser={setUser}
          user={user}
        />
      )}
      {page === "levels" && user && (
        <Levels
          go={go}
          pickChallenge={setChallenge}
          devChallenges={devChallenges}
        />
      )}
      {page === "leaderboard" && user && <Leaderboard />}
      {page === "discuss" && user && <Discuss user={user} />}
      {page === "profile" && user && (
        <Profile
          user={user}
          setUser={setUser}
          onUpload={(u) => setCommunityUploads((prev) => [...prev, u])}
        />
      )}
      {page === "devdash" && user && (
        <DevDash onPublish={(c) => setDevChallenges((prev) => [...prev, c])} />
      )}
    </>
  );
}
