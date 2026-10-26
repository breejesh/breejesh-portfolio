---
title: "Design a YouTube-Scale Video Platform: Resumable Uploads, Parallel Transcoding, ABR, and the CDN"
description: "How video platforms work end to end: capacity math, resumable chunked uploads, a transcoding DAG that splits videos into segments and encodes a bitrate ladder in parallel, HLS and DASH packaging, adaptive bitrate playback, multi-tier CDN caching close to viewers, and where the money actually goes."
date: "2025-09-29"
tags: [System Design & Architecture, Backend & Databases]
coverImage: /assets/images/design-youtube-streaming.webp
previewImage: /assets/images/design-youtube-streaming.webp
---

> **TL;DR**
> * **The Problem:** Accept enormous files from creators on unreliable connections, turn each into dozens of formats and qualities quickly, and stream them to viewers on every kind of device and network without buffering, at a scale where bandwidth is the largest cost in the business.
> * **The Design:** Resumable chunked uploads into object storage; an event-driven transcoding DAG that splits each video into short segments and encodes a bitrate ladder across many workers in parallel; packaging into HLS and DASH; playback through signed manifests, a multi-tier CDN with caches inside or near ISPs, and a player that picks the bitrate for every segment.
> * **The Result:** A ten-minute 4K upload becomes watchable in minutes instead of hours, the vast majority of bytes are served from caches a few network hops from the viewer, and quality adapts continuously instead of stalling.

YouTube has said that more than 500 hours of video are uploaded every minute, and back in 2017 that people watched over a billion hours a day. Those two numbers define the system. The write side is a giant batch-processing pipeline. The read side is one of the largest content delivery problems on the internet. They share almost nothing except the storage in between.

This post designs both sides.

---

## Requirements and Numbers

**Functional:** upload videos; process them into streamable formats; play them on phones, browsers and TVs; adapt quality to the network; show thumbnails and metadata.

**Non-functional:** uploads survive dropped connections; new videos playable within minutes; playback starts in about a second and rarely rebuffers; global availability.

| Quantity | Value | Implication |
| --- | --- | --- |
| Uploads | ~500 hours per minute | ~720,000 hours of new video per day |
| Renditions per video | ~6 resolutions x 2 to 3 codecs | Every uploaded hour becomes many hours of encoded output |
| Encoded storage | Order of several GB per hour across the ladder | Petabytes of new storage per day |
| Watch time | Over 1 billion hours per day (2017 figure) | At ~2.5 Mbps average, on the order of an exabyte of egress per day |

The last row is why the CDN, not the transcoder, dominates cost and architecture. Saving 10% of bitrate through better encoding saves 10% of the largest bill you have.

---

## The Upload and Processing Pipeline

![Video upload pipeline: the creator uploads chunks through a resumable upload API into raw object storage, a VideoUploaded event triggers a transcode DAG orchestrator that splits the video into four-second chunks, fans them out to an encoder fleet producing a bitrate ladder across codecs, a packager writes HLS and DASH segments and manifests, while thumbnails and safety checks run in parallel and update video metadata to ready](/assets/images/hld/design-video-upload-pipeline.webp)

* **Creator.** Uploads from a phone on a train or a studio connection. The file can be gigabytes.
* **Upload API (resumable).** Splits the upload into chunks (say 8 to 16 MB) with a session ID, so a dropped connection resumes from the last acknowledged chunk instead of starting over. Clients often upload directly to object storage with presigned URLs; the API only manages the session.
* **Raw uploads (object store).** The original file is kept. Better encoders appear every few years, and re-encoding popular videos from the original is how platforms cut bitrate later.
* **VideoUploaded event.** Decouples upload from processing. A spike in uploads queues work instead of failing requests.
* **Transcode DAG orchestrator.** Processing is a directed acyclic graph of tasks: probe, split, encode each segment at each rendition, merge, package, thumbnail, safety checks. The orchestrator tracks task state and retries failures individually.
* **Split into chunks.** Cutting the video at keyframes into segments of a few seconds is the key to speed. Each segment encodes independently, so a 10-minute video becomes hundreds of small parallel jobs.
* **Encoder fleet (ladder x codecs).** Produces every rendition, typically H.264 for compatibility plus VP9 or AV1 for efficiency. Encoding is CPU-heavy enough that Google built a custom video transcoding chip (the Argos VCU, described in 2021) for YouTube.
* **Packager (HLS / DASH).** Wraps encoded segments into the formats players expect and writes manifests listing every rendition. CMAF lets HLS and DASH share the same media segments, halving storage for the packaged output.
* **Encoded segments + manifests.** The read side's source of truth, typically in object storage behind the CDN.
* **Thumbnails + safety checks.** Run in parallel: thumbnail extraction, copyright matching, and policy classifiers. A video can be playable for the uploader while still under review for public listing.
* **Video metadata DB.** Title, owner, status, renditions available, and processing state.

The green note is the payoff: splitting turns encoding time from "proportional to video length" into "proportional to video length divided by fleet size."

**A bitrate ladder (illustrative, H.264):**

| Rendition | Resolution | Typical bitrate |
| --- | --- | --- |
| 240p | 426 x 240 | ~0.4 Mbps |
| 360p | 640 x 360 | ~0.8 Mbps |
| 480p | 854 x 480 | ~1.4 Mbps |
| 720p | 1280 x 720 | ~2.8 Mbps |
| 1080p | 1920 x 1080 | ~5 Mbps |
| 2160p (4K) | 3840 x 2160 | ~15 to 20 Mbps |

Modern platforms do not use one fixed ladder. Netflix popularized **per-title encoding** in 2015: a cartoon with flat colors needs far fewer bits than a grainy action film at the same perceived quality, so each title gets its own ladder.

---

## Playback and the CDN

![Video playback path: the viewer's player first gets a signed manifest URL from the playback API, which checks rights and region against metadata and entitlements, then requests segments from an edge cache near or inside the ISP, which falls back to a regional mid-tier cache and an origin shield in front of the encoded segments; the player measures throughput and buffer to pick each segment's bitrate](/assets/images/hld/design-video-playback-cdn.webp)

1. **Manifest first.** The player calls the Playback API, which checks entitlements and region rules, and returns a short-lived signed URL to the manifest.
2. **Segments from the edge.** The player requests segments one by one from the nearest edge cache. Popular videos are almost always there.
3. **Tiered misses.** On a miss, the edge asks a regional mid-tier cache, which asks an origin shield in front of storage. Each tier collapses many misses into one upstream request, so the origin sees a tiny fraction of traffic.
4. **Adaptive bitrate.** After each segment, the player updates its estimate of throughput and checks its buffer, then chooses the next segment's rendition. A short tunnel drops you to 480p for a few seconds instead of freezing the video.

**Caches inside ISPs.** The biggest platforms place cache servers directly inside internet providers' networks: Netflix's Open Connect appliances and Google's Global Cache are the well-known examples. Bytes then never cross the expensive part of the internet. The ISP saves transit costs, the platform saves egress, and the viewer gets lower latency.

The green note sets the operational target: the edge tier should serve the overwhelming majority of bytes.

---

## Where the Money Goes

| Cost | Driver | Lever |
| --- | --- | --- |
| Delivery (CDN egress) | Watch time x bitrate | Better codecs (AV1), per-title ladders, ISP-embedded caches |
| Encoding compute | Upload hours x renditions | Encode the long tail lazily; spend more compute only on popular videos |
| Storage | Renditions x retention | Drop rarely watched high renditions; keep originals in cold storage |
| Moderation | Upload volume | Automated classifiers first, human review where it matters |

The long tail matters here. Most uploaded videos are watched rarely. A common strategy is to encode a minimal ladder at upload time and generate premium renditions (4K, AV1) only once a video proves popular, because the encoding cost is only worth paying if the delivery savings follow.

---

## Failure Modes

| Failure | Expected behavior |
| --- | --- |
| Upload connection drops at 80% | Resume from the last acknowledged chunk |
| One encoding task fails | The orchestrator retries that segment only; the rest of the DAG continues |
| Encoder backlog during a spike | Queue grows; prioritize short and popular uploads; publish lower renditions first |
| Edge cache node fails | Traffic shifts to neighbors; mid-tier absorbs extra misses |
| Viral video, cold caches | Request collapsing at each tier prevents a stampede on the origin |
| Viewer's network degrades | ABR lowers quality instead of rebuffering |

---

## Production Checklist

- [ ] Resumable, chunked uploads with direct-to-storage presigned URLs
- [ ] Originals retained for future re-encoding
- [ ] Event-driven DAG with per-task retries and idempotent outputs
- [ ] Keyframe-aligned splitting for parallel encoding
- [ ] Per-title or content-aware ladders; modern codecs for popular content
- [ ] HLS and DASH from shared CMAF segments
- [ ] Signed, short-lived manifest URLs; entitlement and region checks
- [ ] Multi-tier CDN with request collapsing and an origin shield
- [ ] Player metrics: startup time, rebuffer ratio, average bitrate, quality switches
- [ ] Cost dashboards: egress by tier, encode hours by rendition, storage by age

---

## The Leftover

Every video on these platforms exists in dozens of copies, at different sizes and qualities, scattered across thousands of machines, most of them in buildings owned by somebody else's internet provider.

The viewer sees none of that. They see a video that starts, and a quality badge that flickers from 1080p to 720p when the train enters a tunnel and back again when it leaves. That flicker is the whole system working.

---

## Sources

* [YouTube Official Blog: platform statistics (hours uploaded per minute)](https://blog.youtube/press/)
* [Netflix Tech Blog: Per-Title Encode Optimization](https://netflixtechblog.com/per-title-encode-optimization-7e99442b62a2)
* [Netflix Open Connect overview](https://openconnect.netflix.com/en/)
* [Ranganathan et al., "Warehouse-Scale Video Acceleration: Co-design and Deployment in the Wild" (ASPLOS 2021)](https://dl.acm.org/doi/10.1145/3445814.3446723)
* [RFC 8216: HTTP Live Streaming](https://www.rfc-editor.org/rfc/rfc8216)
* [Alliance for Open Media: AV1](https://aomedia.org/av1-features/)
* Related in this series: [Design Google Drive](/blog/en/design-google-drive), [Scale From Zero to Millions](/blog/en/design-scale-zero-to-millions), [Back-of-the-Envelope Estimation](/blog/en/design-back-of-envelope-estimation)
