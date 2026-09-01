---
title: "Calculator: Parsing Arithmetic Expressions with Operator Precedence in O(N) Time (CTCI 16.26)"
description: "How to parse and evaluate mathematical expressions containing +, -, *, / in linear time using a single Stack with operator precedence handling and compiler AST parsing concepts."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-16-26-calculator.webp
previewImage: /assets/images/ctci-16-26-calculator.webp
---

> **TL;DR**
> * **The Book Problem:** Given an arithmetic equation consisting of positive integers, `+`, `-`, `*`, and `/` (no parentheses), compute the result following standard order of operations.
> * **The Core Breakthrough:** Operator Precedence via Stack: When encountering `*` or `/`, compute immediately by popping the last number from the stack and pushing `last * curr`. When encountering `+` or `-`, push `+curr` or `-curr` onto the stack. Finally, sum all numbers in the stack.
> * **Production Reality:** Powers SQL mathematical expression evaluators, spreadsheet calculation engines (Excel, Google Sheets), and compiler Abstract Syntax Tree (AST) tokenizers.

## 1. Problem Statement & The Mathematical Contract

In *Cracking the Coding Interview* (Problem 16.26), we are given a string representing an arithmetic expression, such as `"2*3+5/6*3+15"`.

The expression contains non-negative integers, addition (`+`), subtraction (`-`), multiplication (`*`), and division (`/`), with optional whitespace. We must return the evaluated mathematical result as a double/integer respecting standard operator precedence ($*$, $/$ before $+$, $-$) in $O(N)$ time.

## 2. The Stack-Based Evaluation Algorithm

Instead of building a heavy recursive descent parser, we can solve this in a single forward pass using a numerical Stack (`Stack<Double>`):

1. Maintain `currentNumber` and `lastOperator` (initialized to `+`).
2. Scan character by character:
   * If digit, build `currentNumber = currentNumber * 10 + digit`.
   * If operator or end of string:
     * If `lastOperator == '+'`: `stack.push(+currentNumber)`
     * If `lastOperator == '-'`: `stack.push(-currentNumber)`
     * If `lastOperator == '*'`: `stack.push(stack.pop() * currentNumber)`
     * If `lastOperator == '/'`: `stack.push(stack.pop() / currentNumber)`
     * Update `lastOperator = char` and reset `currentNumber = 0`.
3. Sum all values remaining in the stack.

## Production Implementation

```java
import java.util.ArrayDeque;
import java.util.Deque;

public class BasicCalculator {
    public static double compute(String expression) {
        if (expression == null || expression.isEmpty()) return 0.0;

        Deque<Double> stack = new ArrayDeque<>();
        double currentNum = 0.0;
        char lastOp = '+';

        for (int i = 0; i < expression.length(); i++) {
            char c = expression.charAt(i);

            if (Character.isDigit(c)) {
                currentNum = currentNum * 10 + (c - '0');
            }

            // If operator or last character in string (ignoring spaces)
            if ((!Character.isDigit(c) && c != ' ') || i == expression.length() - 1) {
                switch (lastOp) {
                    case '+': stack.push(currentNum); break;
                    case '-': stack.push(-currentNum); break;
                    case '*': stack.push(stack.pop() * currentNum); break;
                    case '/': 
                        if (currentNum == 0.0) throw new ArithmeticException("Division by zero");
                        stack.push(stack.pop() / currentNum); 
                        break;
                }
                lastOp = c;
                currentNum = 0.0;
            }
        }

        double total = 0.0;
        while (!stack.isEmpty()) {
            total += stack.pop();
        }
        return total;
    }
}
```

## Complexity & Memory Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| Time Complexity | `O(N)` | Single linear pass over the expression string of length N. |
| Space Complexity | `O(N)` | Stack stores at most N numbers in worst-case addition-only strings. |
| Parser Overhead | `O(1)` | No recursive call stack or heap AST node allocations. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: SQL Query Engines and Spreadsheet Formula Parsers

1. **Database SQL Expression Evaluators (DuckDB, ClickHouse):** When executing `SELECT price * quantity - discount FROM orders`, vector query engines compile arithmetic formulas into reverse Polish notation (RPN) or stack bytecode executed by LLVM JIT compilation routines.
2. **Spreadsheet DAG Dependency Graph (Excel / Google Sheets):** Formula engines evaluate mathematical cells using Dijkstra's **Shunting-Yard Algorithm**, translating infix mathematical expressions into postfix stacks to detect circular cell references and compute values in dependency order.
3. **Compiler Lexer & Tokenizer:** Compilers (GCC, Clang) convert source code math expressions into Abstract Syntax Trees (ASTs) by resolving operator binding power and precedence tables.

## Edge Cases & Production Hardening

1. Division by zero (`5 / 0`): Explicitly catch and throw meaningful `ArithmeticException`.
2. Whitespace in input (`" 3 + 5 * 2 "`): Handled seamlessly by ignoring space characters in token loop.
3. Multi-digit numbers (`"1000 + 200"`): Accumulated cleanly with `currentNum * 10 + digit`.
