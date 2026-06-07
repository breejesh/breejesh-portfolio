---
title: "Design a Notification System: Push, SMS, Email, Queues, and Reliability"
description: "How a notification system works, explained for beginners: channels, user preferences, message templates, queues, retries, and the path from an order shipped event to a phone alert."
date: "2026-06-07"
tags: [System Design]
coverImage: /assets/images/design-notification-system.webp
previewImage: /assets/images/design-notification-system.webp
---


> **TL;DR**
> * **The Problem:** Designing scale-ready architectures requires balancing trade-offs between availability, throughput, and operational complexity.
> * **The Insight:** How a notification system works, explained for beginners: channels, user preferences, message templates, queues, retries, and the path from an order shipped event to a phone alert.
> * **The Result:** Concrete blueprint with quantitative performance targets and production failure mode mitigations.

Imagine a school office that must tell parents important news. Sometimes it texts. Sometimes it emails. Sometimes it sends a short note that pops up on a parent's phone. The office does not yell into the street and hope someone hears. It keeps a list of parents, checks how each parent wants to be reached, fills in a standard form with the child's name and the news, and only then sends the message. If the text fails because the phone is off, the office tries again later. That school office is the right picture of a **notification system**.

This post teaches that design from zero. No interview jargon first. Plain pieces, then one full walk from "order shipped" to a phone buzz.

---

## What problem are we solving?

An app has many reasons to talk to a person:

- Your package left the warehouse.
- Here is your login code.
- Your card was charged.
- A friend liked your photo.

Those are **events**. A notification system turns events into messages people can see: **push** on a phone, **SMS** text, or **email**. Other product services should not each reinvent texting and emailing. They tell the notification system "please notify this user about this event," and the notification system does the rest.

In the school picture:

| School office | Notification system |
| --- | --- |
| News about a student | Product event (order shipped, password reset) |
| Parent contact card | User profile (email, phone, device tokens) |
| "Call only for emergencies" rules | User preferences (opt-in / opt-out) |
| Form letter with blanks | Templates |
| Outbox tray waiting for the runner | Queue |
| Runner who dials or mails | Worker that talks to Apple, SMS, or email providers |
| Try again if the line is busy | Retries |

---

## Channels: the three doors messages walk through

A **channel** is simply *how* the message is delivered.

### 1. Push

A short alert on the phone lock screen. You do not send it to the phone radio yourself. You send it to **Apple** (APNs for iPhone) or **Google** (FCM for many Android phones). They deliver when the device is reachable.

School picture: a quick note pinned on the parent's phone, not a full letter.

### 2. SMS

A text message to a phone number. You pay a gateway company (Twilio and similar). They talk to mobile carriers. SMS is expensive and often used for codes and urgent alerts.

School picture: a real text to the parent's number.

### 3. Email

A longer message to an inbox. Most teams use email platforms (SendGrid, Amazon SES, Mailgun) so bounce handling and reputation are not reinvented.

School picture: a full letter in the parent's email mailbox.

**Design rule:** every channel is the same shape: *queue → worker → outside provider*. Shared brain, different messengers.

You almost never own the last mile. Apple, carriers, and email networks do. Your job is to ask them correctly, remember what you asked, and recover when they fail.

---

## Preferences: do not message people who said no

Parents get angry if the school texts every lunch menu. Users mute apps that spam them. So the system stores **preferences**:

- Channel: push yes, SMS no, email yes.
- Category: security yes, marketing no, product tips yes.
- Quiet hours: no marketing pings at 2am in the user's timezone.

Before sending, the office checks the card:

1. Load settings for this user, channel, and category.
2. Skip if they opted out.
3. For non-security news, respect quiet hours.
4. Security and money messages (password reset, payment failed) often still go through even if marketing is off. Product and law decide that. Say it clearly.

Respecting preferences is not politeness only. It protects trust and email deliverability. A system that ignores mute is a broken system.

---

## Templates: form letters with blanks

You do not want every team writing raw HTML email in their own service. The notification system owns **templates**: approved text with blanks.

Example push template:

```
Your order {{order_id}} has shipped. Track it: {{tracking_url}}
```

At send time, the system fills blanks with real data: order id, name, amount, link.

Templates should be:

- **Per channel** (push is short; email can be long HTML; SMS has a tight character budget).
- **Per language** when you have many locales.
- **Versioned** so a bad edit can be rolled back.
- **Safe**: escape user-controlled text so weird names do not break HTML.

School picture: a stack of form letters. Staff never freehand legal wording for every call.

---

## Queues: the outbox tray

If the school principal waits on hold with every phone carrier while parents pile up at the desk, the whole office freezes. Same for software.

A **queue** is a waiting line for work:

1. Something important happens (order shipped).
2. The notification **API** records the intent and puts jobs on the queue.
3. It answers "accepted" quickly (HTTP 202 style).
4. Separate **workers** pull jobs and talk to Apple, SMS, or email.

Why queues matter:

- Spikes (big sale, flash campaign) land in the tray instead of crushing the API.
- SMS outage does not block push. Give each channel its own queue.
- Failed jobs can wait and try again without the original service hanging forever.

```
[ Order service ]
       |
       v
[ Notification API ]
  check user, prefs, template
  write a log row
       |
       +---> [ Push queue ]  --> push workers  --> Apple / Google
       |
       +---> [ SMS queue ]   --> SMS workers   --> SMS provider
       |
       +---> [ Email queue ] --> email workers --> email provider
```

**Decouple accept from deliver.** Accept means "we wrote it down and put it in the tray." Deliver means "the outside world got it." Those are two steps.

---

## Retries: try again, but not forever

Networks fail. Providers return "busy." Phones are offline. So workers **retry**.

Simple rules:

| What went wrong | What to do |
| --- | --- |
| Temporary error (timeout, 503) | Wait longer each time (backoff), try again |
| Bad phone token or dead email | Mark permanent fail; stop retrying that destination |
| Provider rate limit | Slow down; requeue with delay |
| Poison message (broken template data) | After N tries, send to a **dead-letter queue** and alert humans |

Cap attempts. Infinite retry on a broken template turns into a self-attack on your provider bill.

Also: the world is **at-least-once**, not perfect exactly-once. Timeouts can make you unsure if the SMS already left. Callers should send an **idempotency key** (a unique "we already asked for this receipt once" id). The system remembers that key and drops exact duplicates inside a window. Users hate lost password resets more than a rare double push, but you still dedupe hard when you can.

---

## Contact data you must store

Without addresses, nothing leaves the building.

| Data | Why |
| --- | --- |
| Email, phone | Destinations for email and SMS |
| Device push tokens | One user can have many phones; tokens expire |
| Locale and timezone | Language and quiet hours |
| Preferences | Channel and category switches |
| Notification log | What you tried, status, provider message ids |

Tokens arrive when the app installs or the user logs in. When Apple or Google says a token is dead forever, mark it inactive. Never assume one phone forever.

---

## Walk one event: order shipped → phone buzz

Follow one story end to end.

**Scene:** Warehouse system marks order `ord_9f3a` as shipped for user `cus_12`. Product wants push and email. User opted out of SMS marketing, but this is a transactional shipping update.

### Step 1: The event

Warehouse (or order service) calls the notification service:

```http
POST /internal/v1/notifications

{
  "idempotency_key": "ord_9f3a:shipped:v1",
  "user_id": "cus_12",
  "template_id": "order_shipped",
  "channels": ["email", "push"],
  "category": "transactional",
  "data": {
    "order_id": "ord_9f3a",
    "tracking_url": "https://shop.example/t/abc"
  }
}
```

Only trusted internal services should call this. Secrets for Apple and SMS live in a secret store, not in chat or random config files.

### Step 2: The office checks the parent card

Notification API:

1. Authenticates the caller.
2. Sees the same idempotency key was not already fully handled.
3. Loads email, devices, preferences, and the `order_shipped` template.
4. Skips SMS (not requested). Keeps email and push if settings allow.
5. Checks rate limits so one service cannot flood a user or melt the SMS budget.
6. Writes a **notification log** row with status `pending` (intent is recorded).
7. Enqueues one email job and one push job (or one push job per active device).
8. Returns `202 Accepted` with a `notification_id`. The order service does not wait for Apple.

School picture: staff stamps the request form, drops slips in the outbox, and tells the warehouse "we have it."

### Step 3: Email worker

1. Pulls the email job from the email queue.
2. Fills the email template with order id and tracking link.
3. Calls the email provider.
4. Stores the provider's message id.
5. Marks the log `sent` (or `failed` with a reason).

### Step 4: Push worker (the path to the phone)

1. Pulls the push job.
2. Looks up active device tokens for `cus_12`.
3. Builds a short payload from the push template.
4. Posts to APNs or FCM for each token.
5. On "token invalid," deactivates that device row.
6. On temporary error, retries with backoff.
7. Updates the log.

### Step 5: The phone

Apple or Google delivers when the device is online. The user sees: "Your order ord_9f3a has shipped..." Optional deep link opens the tracking page.

### Step 6: Later receipts

Providers may send webhooks: delivered, bounced, opened. Those update analytics without blocking the original send path. The hot path stays thin.

That is the whole spine: **event → check prefs → record intent → queue → worker → provider → device**.

---

## A design you can defend (interview shape)

If someone asks you to design this on a whiteboard, say:

1. **Stateless notification API** for auth, validation, preferences, rate limits, and idempotency.
2. **Database + cache** for users, devices, settings, templates, and the notification log.
3. **Per-channel queues and workers** with adapters for push, SMS, and email providers.
4. **Templates** rendered in workers, versioned and localized.
5. **At-least-once** delivery with retries, dead-letter queue, and idempotency keys.
6. **Monitoring** on queue age and provider error rates.

Trade-offs to say out loud:

- One shared queue is simpler; per-channel queues isolate failures.
- Sending sync is easier to debug and dies when a provider is slow.
- Perfect exactly-once across carriers is not free; idempotency plus dedupe is the practical bar.
- Marketing blasts and password codes should not share the same priority and money budget.
- Running your own email servers looks cheap until reputation work eats the team.

Rough scale example (adjust with the interviewer): millions of push per day, fewer SMS because SMS costs money, soft real-time (seconds are fine for shipping; OTP needs a fast priority path).

---

## Recap for a friend

A notification system is the school office of your product. Other services bring news. The office looks up how each person wants to be reached, fills a standard form, writes the request in a log, and drops work into waiting trays. Different runners handle push, SMS, and email through outside companies. If a send fails for a temporary reason, they try again a few times. If it is permanently broken, they stop and tell someone. Users who said "no marketing texts" do not get marketing texts. An "order shipped" event becomes a short phone alert because the API accepted the job, a worker filled the template, and Apple or Google delivered it when the phone was ready. The hard part is not the JSON you send to a provider. The hard part is accepting work fast, respecting preferences, surviving flaky third parties, and never silently losing important messages.

---

## Closing

Build the school office well: **channels** for the doors, **preferences** for consent, **templates** for consistent wording, **queues** so the front desk never freezes, and **retries** so temporary failure is not permanent silence. Decouple accept from deliver. Isolate channels. Treat outside providers as unreliable coworkers. Everything else hangs off that spine.