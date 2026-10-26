---
title: "Design a Notification System: Push, Email, SMS, Preferences, and Reliable Delivery"
description: "A production notification platform: one API for every producer, preference and quiet-hour checks, per-channel queues and workers, APNs/FCM/email/SMS providers, idempotency keys, retries with backoff and dead-letter queues, token hygiene, deliverability rules and the metrics that show it works."
date: "2026-06-07"
tags: [System Design & Architecture]
coverImage: /assets/images/design-notification-system.webp
previewImage: /assets/images/design-notification-system.webp
---

> **TL;DR**
> * **The Problem:** Dozens of internal services want to tell users things. Without a shared platform, each one integrates APNs, an email provider and an SMS gateway separately, ignores user preferences in its own way, and retries until users get the same message three times.
> * **The Design:** A single Notification API accepts requests with an idempotency key, checks preferences, contacts and quiet hours, and fans out to per-channel queues. Channel workers render templates, call providers, retry transient failures with jittered backoff, dead-letter the rest, and clean up invalid tokens. Provider receipts feed a delivery log.
> * **The Result:** At-least-once delivery that looks exactly-once to users, channels that fail independently, campaigns that cannot starve password resets, and one place to answer "did the user get it?"

Notifications are the part of a product that leaves the product. They land on lock screens and in inboxes, next to everything else competing for attention. Get them wrong and users do not file bug reports; they turn notifications off, and you lose the channel forever.

This post designs the shared platform that sits between "an order shipped" and "a phone buzzed."

---

## Requirements

**Functional**

* Channels: mobile push (iOS and Android), email, SMS, and optionally in-app.
* Producers send a semantic event ("order shipped," "password reset"), not a pre-rendered message.
* Respect user preferences per category and channel, unsubscribes, and quiet hours.
* Templates per notification type and locale.
* Delivery status per notification, queryable by support teams.

**Non-functional**

* Transactional messages (password resets, security alerts) delivered within seconds, even during a marketing blast.
* Never send the same notification twice to the same user because of an internal retry.
* Channels and providers fail independently: an SMS provider outage must not delay push.

**Numbers:** 50M notifications on a normal day is about 600 per second on average, but a marketing campaign to 30M users scheduled at 9 a.m. can demand tens of thousands per second for a while. **Design for the burst, and isolate it.**

---

## The Architecture

![Notification architecture: order, marketing and security producers call the notification API with an idempotency key, which checks preferences and contacts and fans out to push, email and SMS queues; channel workers render templates and call APNs/FCM, an email service provider and an SMS gateway, whose receipts and webhooks feed a delivery log](/assets/images/hld/design-notification-architecture.webp)

* **Producers (Order Service, Marketing Campaigns, Security Alerts).** They call one API with an event type, recipient and data. They never talk to APNs or Twilio directly.
* **Notification API (idempotency key).** Validates the request, rejects duplicates by idempotency key (for example `order-8812:shipped`), assigns a priority class, and decides which channels apply.
* **Preferences + Contacts.** User opt-ins per category and channel, unsubscribes, quiet hours and time zone, plus device tokens, verified email addresses and phone numbers. Legally required opt-outs (marketing email, SMS) are checked here, every time.
* **Channel Queues (push, email, sms).** One queue per channel, and in practice separate high-priority and bulk queues per channel, so a campaign cannot sit in front of a password reset.
* **Senders (Push, Email, SMS Workers).** Pull jobs, render the template, call the provider, record the result, and apply the retry policy below.
* **Templates (i18n).** Versioned templates per notification type and locale. Rendering happens at send time, so a fixed typo applies to messages still in the queue.
* **Providers (APNs / FCM, Email ESP, SMS Gateway).** External systems with their own rate limits, error codes and outages. Wrap each behind an adapter so you can add a second provider for failover.
* **Delivery Log.** Every attempt and every provider receipt or webhook (delivered, bounced, opened, unsubscribed) lands here. Support can answer "did she get the code?" without reading logs.

---

## Walking One Event: "Order Shipped"

1. The order service calls `POST /notifications` with `type=order_shipped`, `user_id=42`, the tracking data, and `idempotency_key=order-8812:shipped`.
2. The API checks the key. If it was seen in the last few days, it returns the original result. Retries from the order service are now harmless.
3. Preferences say user 42 wants shipping updates by push and email, not SMS. It is 2 a.m. in their time zone, but shipping updates are allowed during quiet hours as a "silent" push.
4. The API enqueues one push job and one email job, both high priority, both carrying the idempotency key.
5. The push worker renders the localized template, sends to every active device token through APNs or FCM, and logs the response. The email worker renders the HTML template and hands it to the email provider.
6. Later, provider webhooks report "delivered" for email and, through the app's own receipt, "displayed" for push. The delivery log shows the full history.

---

## Retries, Dead Letters and Exactly-Once Illusions

![Notification retry flow: dequeue a job, check deduplication and quiet hours, call the provider; on 2xx mark sent, on retryable errors such as 429, 5xx or timeouts requeue with exponential backoff and jitter up to a limit before sending to a dead-letter queue, and on permanent errors such as 410 remove the bad token or address](/assets/images/hld/design-notification-retries.webp)

Distributed systems deliver **at least once**. The trick is making that look like exactly once to the user:

* **Classify errors.** Retry throttling (429), server errors (5xx) and timeouts. Do not retry permanent errors: APNs answers `410 Unregistered` for tokens that are no longer valid, and email providers report hard bounces. Retrying those only hurts your sender reputation.
* **Backoff with jitter.** 1 s, 2 s, 4 s, with randomness and a cap. Without jitter, every failed job retries at the same instant and hammers a provider that is already struggling.
* **Bounded attempts, then dead-letter.** After the limit, move the job to a dead-letter queue with the error attached. Someone or something must look at that queue; an unread DLQ is just a slower way to lose messages.
* **Same idempotency key on every attempt.** The worker checks the delivery log before sending, and many providers accept an idempotency key too. A crash between "provider accepted" and "we recorded it" then causes no duplicate.
* **Clean up.** Remove dead push tokens and suppress hard-bounced emails immediately, or every future send to that user wastes an attempt.

---

## Channel-Specific Realities

| Channel | Cost | Latency | Gotchas |
| --- | --- | --- | --- |
| Push (APNs, FCM) | Effectively free | Seconds | Tokens rotate and expire; payload limit around 4 KB; OS may throttle or drop low-priority pushes; Google retired FCM's legacy APIs in 2024 in favor of HTTP v1 |
| Email | Fractions of a cent | Seconds to minutes | Deliverability is reputation: SPF, DKIM and DMARC are mandatory; since 2024 Gmail and Yahoo require one-click unsubscribe for bulk senders and low spam-complaint rates |
| SMS | Cents per message, varies by country | Seconds | Expensive at scale; carrier registration (10DLC in the US) and consent rules; sender IDs differ by country |
| In-app | Free | Instant if online | Only works while the app is open; often stored as an inbox and synced |

The cost column drives routing policy. An OTP code may be worth an SMS. A "your friend posted" update is not.

---

## Protecting Users From Your Own Company

The hardest requirements are not technical:

* **Frequency caps.** No more than N marketing pushes per user per day, enforced centrally, regardless of how many teams want to send.
* **Quiet hours** in the user's time zone, with explicit exceptions for security and transactional messages.
* **Collapse and digest.** Ten likes in five minutes should become one notification, not ten. Push providers support collapse keys; your platform should support batching windows.
* **One unsubscribe means one unsubscribe.** The preference store is the single source of truth, and every channel checks it at send time, not when the campaign was scheduled.

---

## Metrics That Matter

| Metric | Why |
| --- | --- |
| Time from event to provider accepted, by priority | Shows whether bulk traffic is delaying transactional messages |
| Provider error rate by code | Separates your bugs (4xx) from their outages (5xx) |
| Dead-letter queue depth and age | Messages you have silently failed to deliver |
| Invalid token and hard-bounce rate | Contact data hygiene |
| Opt-out rate after each campaign | The only honest measure of whether people want what you send |

---

## Production Checklist

- [ ] One API for all producers; no direct provider integrations elsewhere
- [ ] Idempotency keys required on every request and reused on every retry
- [ ] Preferences, unsubscribes and quiet hours checked at send time
- [ ] Separate high-priority and bulk queues per channel
- [ ] Retry classification, jittered backoff, attempt limits and a monitored DLQ
- [ ] Invalid tokens and hard bounces removed automatically
- [ ] SPF, DKIM, DMARC and one-click unsubscribe for email
- [ ] Frequency caps and collapse or digest for noisy events
- [ ] Delivery log queryable by support, with provider receipts attached
- [ ] Secondary provider configured for critical channels

---

## The Leftover

The best notification system is the one users barely notice: the code arrives when they asked for it, the package update arrives when the package moves, and nothing arrives at 3 a.m. that could have waited.

That restraint is a design decision, not a default. Every team that ships a feature will want a notification for it. The platform is where somebody gets to say "fold it into the daily digest," and be right.

---

## Sources

* [Apple: Sending notification requests to APNs (status codes, including 410)](https://developer.apple.com/documentation/usernotifications/sending-notification-requests-to-apns)
* [Firebase Cloud Messaging: migrate from legacy APIs to HTTP v1](https://firebase.google.com/docs/cloud-messaging/migrate-v1)
* [Google: Email sender guidelines (bulk sender requirements)](https://support.google.com/a/answer/81126)
* [RFC 8058: Signaling one-click functionality for list email headers](https://www.rfc-editor.org/rfc/rfc8058)
* [AWS Architecture Blog: Exponential backoff and jitter](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/)
* Related in this series: [Design a Chat System](/blog/en/design-chat-system), [Design a Rate Limiter](/blog/en/design-a-rate-limiter), [Event-driven architecture](/blog/en/event-driven-architecture-intro)
