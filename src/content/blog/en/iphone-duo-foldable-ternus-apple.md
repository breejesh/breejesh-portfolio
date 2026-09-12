---
title: "iPhone Duo: Apple's New CEO Opened His First Keynote by Folding the Phone"
description: "John Ternus used his first Apple event to launch the $1,999 iPhone Duo, a 7.6-inch foldable with Apple Pencil support and split-screen apps. The hardware is late on purpose. The software consequences for developers arrive on October 23."
date: "2026-09-12"
tags: [Hardware & Semiconductors, Tech Business & Finance]
coverImage: /assets/images/iphone-duo-foldable-ternus-apple.webp
previewImage: /assets/images/iphone-duo-foldable-ternus-apple.webp
---

> **TL;DR**
> * **The Catalyst:** On September 9, at John Ternus's first keynote as Apple CEO, Apple launched the iPhone Duo: a passport-sized foldable with a 7.6-inch inner display, a 5.4-inch outer display, an A20 Pro on a 2nm process, Apple Pencil support and two apps side by side. Price: $1,999 to $3,199.
> * **The Insight:** Apple is following its oldest playbook. Let a category exist for years (Samsung has shipped foldables since 2019), wait until the crease, the hinge and the battery stop being apologies, then enter at the top of the price range and set the defaults.
> * **The Outlook:** The Duo will not be a volume product in year one. Its real effect is on software: for the first time, iPhone apps must handle a tablet-sized canvas, split-screen and a stylus. Pre-orders open October 16, and apps that still assume one fixed portrait width will look broken on Apple's most expensive phone.

Tim Cook stepped back to executive chairman on September 1. Eight days later his successor walked on stage, ran through the iPhone 18 Pro, new Watches and AirPods, and then said the three words Apple keynotes had quietly retired: "one more thing."

Then he folded the phone.

It is hard to overstate how on-brand that is for Ternus. He spent most of his career running hardware engineering. His first big moment as CEO is not an AI demo or a services number. It is a hinge.

---

## What Apple Actually Shipped

| Spec | iPhone Duo |
| --- | --- |
| Inner display | 7.6-inch Super Retina XDR, nano-texture coating to reduce crease visibility |
| Outer display | 5.4-inch |
| Chip | A20 Pro (2nm), 12GB RAM |
| Cameras | 48MP main (f/1.6), 48MP ultrawide (f/2.2) |
| Battery and charging | 4,883 mAh, 35W wired, 25W MagSafe |
| Biometrics | Touch ID in the side button |
| Input | Apple Pencil support, a first for iPhone |
| Multitasking | Two apps side by side, or two windows of the same site |
| Price | $1,999 (256GB) to $3,199 (2TB) |
| Dates | Pre-orders October 16, availability October 23 |

Two details on that list say more than the rest.

**Touch ID is back.** Apple has not explained the choice, but the likely reason is physical: a Face ID module is deep, and a phone has to be very thin to fold in half. The side-button sensor Apple already ships on iPads avoids compromising either the thickness or the inner screen.

**The nano-texture inner panel.** The crease has been the single most common complaint about foldables. Apple did not claim to remove it. It chose a matte coating that makes it harder to see. That is a very Apple trade: sacrifice a little contrast for a lot of perceived polish.

---

## Late on Purpose

Samsung has been selling foldables since 2019. Huawei showed off its Mate XT2 triple-fold with the homegrown Kirin 9050 Pro the same week. By the standards of the category, Apple is seven years late.

That is the plan, not the problem. The pattern is familiar:

| Category | Pioneer shipped | Apple entered | Apple's entry point |
| --- | --- | --- | --- |
| MP3 players | Late 1990s | 2001 (iPod) | Premium, with a better sync story |
| Smartphones | Early 2000s | 2007 (iPhone) | Premium, with a better touch story |
| Tablets | Early 2000s | 2010 (iPad) | Premium, with an app story |
| Smartwatches | 2013 | 2015 (Watch) | Premium, with a health story |
| Foldables | 2019 | 2026 (Duo) | Premium, with a Pencil and multitasking story |

Each time, the question was not "can Apple build this" but "is the component stack mature enough that Apple's version will not feel like a prototype." Hinges, ultra-thin glass, and 2nm silicon that does not cook a phone with two screens all crossed that line around now.

CCS Insight's Ben Wood said the Duo "was always going to eclipse Apple's other announcements at the event." That is true on stage. On the income statement, the iPhone 18 Pro will do the heavy lifting for years. At $1,999 and up, the Duo is a halo device: it raises the ceiling on what an iPhone can cost and makes the Pro look reasonable by comparison.

---

## The Real Story Is the Canvas

Here is the part that matters to anyone who ships iOS software.

For eighteen years the iPhone was a fixed-width, single-app, finger-only device. Size classes and safe areas grew more complicated, but a phone app could still assume a narrow portrait canvas that changed rarely.

The Duo breaks three of those assumptions at once:

1. **Width changes while the app is running.** Unfold the phone and the canvas goes from 5.4 inches to 7.6 inches. If state, scroll position or an in-progress form is lost on that transition, users will notice immediately.
2. **Your app is no longer alone.** Split-screen means your layout may be half of a 7.6-inch display, next to someone else's app. iPad developers know this world. Most iPhone-only teams have never tested it.
3. **A stylus exists.** Pencil input on a phone opens markup, signatures and handwriting fields in places where nobody designed for them.

The good news is that Apple has been preparing this for a while. Apps that already adopted adaptive layouts for iPad and Stage Manager are most of the way there. The bad news is that a lot of iPhone apps, especially cross-platform ones built with fixed breakpoints, will look stretched or letterboxed on the most expensive iPhone ever sold, to the customers most likely to complain.

**A practical checklist before October 23:**

* Test on the inner-display size in the simulator, in both full-screen and split-screen widths.
* Make sure fold and unfold transitions preserve navigation state and text input.
* Replace hard-coded breakpoints with size classes or container-based layout.
* Audit any screen with a signature, annotation or drawing surface for Pencil support.
* Check video and camera views for the new aspect ratios. A centered portrait player in the middle of a 7.6-inch canvas looks like a bug.

---

## What This Says About the Ternus Era

It is early. One keynote is not a strategy. But the choice of what to open with is a signal.

Apple's last few years were dominated by the question of whether it was behind in AI. The Duo does not answer that question. It changes the subject to the one area where Apple is still clearly ahead: integrated hardware, silicon and industrial design at a scale nobody else matches. A 2nm A20 Pro inside a phone that folds, at Apple's yields and Apple's margins, is a supply chain argument as much as a product.

The risk is the obvious one. A foldable is a phone you spend more time looking at, in more contexts, with more input methods. That is exactly where an assistant should shine. If the software intelligence on the Duo feels like the same assistant from the slab iPhone, stretched to a larger screen, the hardware will have done its job and the software will have missed the moment.

---

## The Leftover

The "one more thing" line used to introduce the thing that changed the category. This time it introduced Apple joining a category that already exists, years after everyone else.

That is not a criticism. It is how Apple has always worked. The test is not the hinge. It is whether, by next September, the apps on the inner screen look like they were built for it, or like they are waiting for someone to fold the phone back up.

---

## Sources

* [Fold the phone: Apple's new CEO unveils a foldable iPhone (NPR)](https://npr.org/2026/09/09/nx-s1-5961487/apple-duo-foldable-iphone-john-ternus)
* [iPhone Duo: Release Date and Pre-Orders (MacRumors)](https://www.macrumors.com/2026/09/10/iphone-duo-release-date-pre-orders/)
* [iPhone Duo launched: check price and specifications (TelecomTalk)](https://telecomtalk.info/iphone-duo-launched-check-price-and-specifications/1011691/)
* [iPhone Duo hands-on (Tom's Guide)](https://www.tomsguide.com/phones/iphones/iphone-duo-hands-on-apple-nailed-it-and-just-put-everyone-else-on-notice)
* [New iPhone lineup includes a foldable version called Duo (AP via WCAX)](https://www.wcax.com/2026/09/10/new-iphone-lineup-includes-foldable-version-called-duo/)
* [Top Tech News Today, September 10, 2026 (TechStartups)](https://techstartups.com/2026/09/10/top-tech-news-today-september-10-2026-apple-anthropic-ibm-meta-openai-spacex-more/)
