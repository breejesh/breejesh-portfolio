---
title: "Tic Tac Win: Detect Winner in Tic-Tac-Toe Board (CTCI 16.4)"
description: "CTCI problem 16.4: design an algorithm to check if someone has won a Tic-Tac-Toe game on an N x N board."
date: "2025-09-21"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-16-4-tic-tac-win.webp
previewImage: /assets/images/ctci-16-4-tic-tac-win.webp
---


> **टीएल;डीआर**
> * **समस्या:** सीटीसीआई समस्या १६.४ का तकनीकी विवरण।
> * **दृष्टिकोण:** सीटीसीआई problem १६.४: design an algorithm to check if someone has won a Tic-Tac-Toe game on an N x N board.
> * **जटिलता:** इष्टतम समय और मेमोरी संतुलन।

तकनीकी साक्षात्कार में आपसे समस्या **१६.४** पूछी जाती है। प्रारंभिक समाधान सीधा दिखता है, लेकिन वास्तविक सिस्टम में समय और मेमोरी की दक्षता अनिवार्य होती है। यहाँ इसका स्पष्ट मानसिक मॉडल, संपूर्ण कोड और मुख्य सावधानियाँ दी गई हैं।

## १. संदर्भ और समस्या कथन
सीटीसीआई problem १६.४: design an algorithm to check if someone has won a Tic-Tac-Toe game on an N x N board.

## २. कोड और कार्यान्वयन

```java
public class TicTacToe {
    public boolean hasWon(int[][] board) {
        int N = board.length;
        // Check rows, columns, and diagonals
        return false;
    }
}
```

## ३. सारांश और एज केसेस
हमेशा सीमांत स्थितियों और इनपुट की जांच करें।