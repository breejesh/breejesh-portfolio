---
title: "Kimi K3 हाइप के पीछे: क्या यह वाकई Fable 5 किलर है?"
description: "Kimi K3 हाइप के पीछे: Artificial Analysis, LMArena और Moonshot बेंचमार्क vs Claude Fable 5। Spoiler: मजबूत ओपन मॉडल, साफ Fable 5 किलर नहीं।"
date: 2026-07-21
tags: [AI, LLM, Benchmarks, Kimi, Moonshot AI]
coverImage: /assets/images/kimi-k3-cover.webp
previewImage: /assets/images/kimi-k3-cover.webp
---

टाइमलाइन ने **Kimi K3** को **Claude Fable 5** का अंतिम संस्कार जैसा ट्रीट किया। 2.8T ओपन मॉडल, एक कोडिंग एरिना पर #1, फ्रंटियर के करीब intelligence scores। फिर "China ends the frontier" वाले पोस्ट।

तो: क्या K3 वाकई Fable 5 किलर है?

**नहीं।** कुल capability पर नहीं। Moonshot खुद कहता है K3 अभी भी **Claude Fable 5** और **GPT-5.6 Sol** के पीछे है। स्वतंत्र boards इसे Opus-class के पास रखते हैं, Fable से ऊपर नहीं। कुछ coding boards पर ऊपर मारता है। प्राइस, स्पीड, और verbosity पर यह मुफ्त पावर नहीं है।

आगे receipts हैं: vendor vs स्वतंत्र स्कोर, और जहाँ हाइप डेटा से आगे निकल जाता है। बुकमार्क वाले लाइव boards अंत में हैं।

### Kimi K3 असल में क्या है

[Moonshot के लॉन्च पोस्ट](https://www.kimi.com/blog/kimi-k3) के अनुसार:

- कुल **2.8T पैरामीटर**, ओपन 3T-क्लास पोजिशनिंग
- **Stable LatentMoE**: 896 experts, **प्रति टोकन 16 active**
- **Kimi Delta Attention (KDA)** और **Attention Residuals** लंबे sequences और depth के लिए
- **नेटिव मल्टीमोडल** text + image input (प्रोडक्ट डेमो में video/screenshot workflows)
- **1,048,576 टोकन** कॉन्टेक्स्ट, पूरी विंडो पर फ्लैट API प्राइसिंग
- Moonshot के अनुसार Kimi K2 के मुकाबले लगभग **2.5x scaling efficiency**
- Train/serve नोट्स: MXFP4 weights + MXFP8 activations, self-host के लिए **64+ accelerator** supernode सुझाव

लॉन्च API प्राइसिंग: **$0.30 / 1M cache-hit input**, **$3.00 / 1M cache-miss input**, **$15.00 / 1M output**। Moonshot कहता है उनके coding stack पर अक्सर **90%+ cache hits** मिलते हैं।

चीनी lab रिलीज़ के हिसाब से यह महंगा है, पुराने Kimi प्राइस से ज्यादा Western mid-high tier के करीब। दांव यह है कि long-horizon coding और knowledge work token बिल चुका दें।

### स्वतंत्र बेंचमार्क (vendor slides नहीं)

#### Artificial Analysis Intelligence Index

[Artificial Analysis](https://artificialanalysis.ai/models/kimi-k3/) लॉन्च के बाद का सबसे साफ पब्लिक third-party स्नैपशॉट है।

| मेट्रिक | रिपोर्टेड वैल्यू (AA) | नोट्स |
| --- | --- | --- |
| Intelligence Index v4.1 | **57** | AA क्लास रैंकिंग में लगभग **#4 / 186** |
| आउटपुट स्पीड | **~36.9 tokens/s** | median peers से साफ धीमा |
| Input / output प्राइस | **$3 / $15** प्रति 1M tokens | Cache hit input **$0.30** |
| Eval verbosity | इंडेक्स रन पर **~130M** output tokens | ~63M peer median से काफी ऊपर |
| Context window | **1M** tokens | Multimodal text + image input |
| Total eval cost | पूरी index suite के लिए लगभग **$2.7k** | ज्यादा token use से लागत बढ़ती है |

Index v4.1 नौ evals मिलाता है: GDPval-AA v2, Terminal-Bench v2.1, SciCode, Humanity's Last Exam, GPQA Diamond, CritPt, AA-Omniscience, AA-LCR आदि। पूरा methodology: [Artificial Analysis](https://artificialanalysis.ai/methodology/intelligence-benchmarking)।

**चार्ट कैसे पढ़ें:** [Kimi K3 Intelligence सेक्शन](https://artificialanalysis.ai/models/kimi-k3/#intelligence) और उसी पेज पर [cost-per-task scatter](https://artificialanalysis.ai/models/kimi-k3/) खोलें। Capability frontier-adjacent है। Efficiency मुफ्त नहीं।

लॉन्च कवरेज K3 को उस इंडेक्स पर **Claude Opus 4.8** और **GPT-5.5** के करीब रखती है, और **Claude Fable 5** व **GPT-5.6 Sol** के पीछे। यह Moonshot की अपनी लाइन से मेल खाता है।

#### Vals Index

[Vals](https://www.vals.ai/models/kimi_kimi-k3) Kimi K3 को Vals Index पर **74.70% ± 0.96** दिखाता है (release 16 जुलाई 2026), 1M context के साथ। Vals अलग enterprise-oriented suite है, इसलिए 74.7 और AA का 57 एक ही स्केल न समझें।

#### LMArena Frontend Code Arena

Unblinding के बाद K3 **LMArena Frontend Code Arena पर #1, 1679 Elo** पर डेब्यू हुआ, उस बोर्ड पर Claude Fable 5 से आगे, Kimi K2.6 से बड़ा जंप। सार [BenchLM नोट](https://benchlm.ai/blog/posts/kimi-3-release-data-coming-soon) और [Simon Willison](https://simonwillison.net/2026/Jul/16/kimi-k3/) में है।

एक preference board पूरा frontier नहीं है। फिर भी frontend/UI coding के लिए मजबूत पब्लिक सिग्नल है, Moonshot के "vision in the loop" डेमो से मेल खाता है।

### Moonshot कोडिंग स्कोर (vendor-reported)

ये नंबर [आधिकारिक full benchmark table](https://www.kimi.com/blog/kimi-k3#full-benchmark-table) से हैं। ज्यादातर K3 rows **Kimi Code** harness पर max reasoning effort से चलीं। दूसरे मॉडल अक्सर अपना बेस्ट harness इस्तेमाल करते हैं (Claude Code, Codex, Terminus)। इसे pure model bake-off नहीं, product-level evidence समझें।

ऑफिशियल लॉन्च चार्ट (self-reported suite):

![Kimi K3 आधिकारिक बेंचमार्क तुलना चार्ट (Moonshot AI)](https://kimi-file.moonshot.cn/prod-chat-kimi/kfs/4/2/2026-07-16/1d9chlgn6rtp4tqfnnmjg?x-tos-process=image%2Fauto-orient%2C1%2Fstrip%2Fignore-error%2C1)

*स्रोत: [Moonshot AI, Kimi K3: Open Frontier Intelligence](https://www.kimi.com/blog/kimi-k3)*

![Kimi K3 दूसरा आधिकारिक तुलना चार्ट (Moonshot AI)](https://kimi-file.moonshot.cn/prod-chat-kimi/kfs/4/2/2026-07-16/1d9chlbnf2ena6205244g?x-tos-process=image%2Fauto-orient%2C1%2Fstrip%2Fignore-error%2C1)

*स्रोत: [Moonshot AI लॉन्च पोस्ट](https://www.kimi.com/blog/kimi-k3)*

| Benchmark | Kimi K3 | क्या मापता है | पब्लिक बोर्ड / नोट्स |
| --- | --- | --- | --- |
| Terminal-Bench 2.1 | **88.3** | Agentic terminal tasks | [AA Terminal-Bench](https://artificialanalysis.ai/evaluations/terminalbench-v2-1) से क्रॉस-चेक |
| FrontierSWE | **81.2** dominance | Hard SWE / research | [frontierswe.com](https://www.frontierswe.com/) (पब्लिक लिस्टिंग में K3 लेट हो सकता है) |
| ProgramBench | **77.8** raw pass rate | Binary + docs से प्रोग्राम rebuild | [programbench.com](https://programbench.com/) / [Vals ProgramBench](https://www.vals.ai/benchmarks/programbench) |
| DeepSWE | **67.5** (Kimi Code); **67.3** mini-SWE-agent | फ्रेश multi-repo issue fixing | [deepswe.datacurve.ai](https://deepswe.datacurve.ai/) |
| SWE Marathon | **42.0** | Multi-hour project work | [swe-marathon.org](https://www.swe-marathon.org/) |

टीम के लिए खरीदते समय ये caveats मायने रखते हैं:

1. **Raw pass rate ≠ fully resolved.** ProgramBench का 77.8 test-level pass rate है, "77.8% प्रोग्राम पूरी तरह rebuild" नहीं।
2. **Harness स्कोर का हिस्सा है।** Moonshot चेतावनी देता है: K3 **preserved thinking history** के प्रति sensitive है। History ड्रॉप हो तो quality हिल सकती है।
3. **Dominance pairwise win probability है**, completed tasks का प्रतिशत नहीं।
4. कई K3 rows vendor-run थीं, owner boards refresh से पहले। बोर्ड अपडेट होने पर स्वतंत्र पेज प्राथमिकता दें।

### लागत, स्पीड, और token hunger

स्वतंत्र माप और early field reports एक दिशा में जाते हैं:

- मजबूत intelligence score, **धीमा decode** (AA पर ~37 t/s क्लास)
- कठिन evals पर **उच्च verbosity** (median peers से ज्यादा output tokens)
- Intelligence Index task cost कुछ recaps में **GPT-5.6 Sol** के करीब, भारी Claude max tiers से सस्ता, फिर भी "budget open model" प्राइसिंग नहीं
- Cache hits बहुत मायने रखते हैं: repeated repo context पर $0.30 vs $3.00 input = 10x फर्क

शॉर्ट चैट पर K3 महंगा और over-eager लग सकता है। Multi-hour coding agents, stable prefixes, और high cache reuse पर बिल अलग दिखता है।

### नेटिव विजन और long-horizon काम

K3 डिज़ाइन से मल्टीमोडल है। Moonshot case studies kernel optimization, compiler work, live screenshots वाले game/UI loops, chip design sandboxes, और research-to-code pipelines दिखाते हैं। ये demos हैं, leaderboards नहीं। फिर भी product pitch समझ आता है: लंबी sessions, tools, vision feedback, कम babysitting।

प्रोडक्ट सतह पर Moonshot [kimi.com](https://www.kimi.com/), [Kimi Work](https://www.kimi.com/products/kimi-work), [Kimi Code](https://www.kimi.com/code), और [Kimi API](https://platform.kimi.ai/) (`kimi-k3`) लिस्ट करता है।

### अभी किसे ध्यान देना चाहिए

**पायलट लायक अगर आप:**

- बड़े repos पर long-horizon coding agents चाहते हैं
- July 27 के बाद **self-host weights** के रास्ते के साथ near-frontier quality चाहते हैं
- Frontend / UI care करते हैं जहाँ Arena ने K3 को पहले रैंक किया
- **accepted PR per cost** माप सकते हैं, सिर्फ cost per million tokens नहीं

**शायद default न बनाएँ अगर आप:**

- Low latency chat या सस्ते high-QPS completions चाहिए
- Ambiguous tasks पर improvising proactive agents बर्दाश्त नहीं कर सकते
- इस हफ्ते procurement के लिए fully independent same-harness boards चाहिए

### ईमानदार सार

Kimi K3 ने नया ग्लोबल #1 नहीं बनाया। Builders के लिए ज्यादा दिलचस्प काम किया: **open vs closed** गैप को महीनों में संकुचित किया, ओपन 3T-क्लास weights कैलेंडर पर रखे, और competitive coding agent रिजल्ट दिखाए, जबकि स्वतंत्र labs अभी भी इसे Fable 5 और GPT-5.6 Sol के ठीक पीछे रखते हैं।

आगे तीन ठोस markers देखें:

1. 27 जुलाई weight release (license, checkpoints, serving stack)
2. स्वतंत्र boards जो traces, costs, confidence intervals के साथ K3 पोस्ट करें
3. आपका अपना bake-off: fixed harness, fixed budget, real repos

### लाइव चार्ट और boards

लेटेस्ट नंबर चाहिए तो इन्हें बुकमार्क करें, पोस्ट में फ्रीज स्क्रीनशॉट नहीं। मुख्य चार्ट ऊपर भी स्कोर के साथ inline लिंक हैं।

| चार्ट / बोर्ड | क्या दिखाता है | लिंक |
| --- | --- | --- |
| Artificial Analysis मॉडल पेज | Intelligence Index, स्पीड, प्राइस, cost per task, token use | [artificialanalysis.ai/models/kimi-k3](https://artificialanalysis.ai/models/kimi-k3/) |
| Artificial Analysis होम | क्रॉस-मॉडल क्वालिटी, प्राइस, आउटपुट स्पीड | [artificialanalysis.ai](https://artificialanalysis.ai/) |
| Terminal-Bench 2.1 (AA) | स्वतंत्र agentic terminal coding | [artificialanalysis.ai/evaluations/terminalbench-v2-1](https://artificialanalysis.ai/evaluations/terminalbench-v2-1) |
| Vals मॉडल पेज | Vals Index और enterprise / coding evals | [vals.ai/models/kimi_kimi-k3](https://www.vals.ai/models/kimi_kimi-k3) |
| DeepSWE लीडरबोर्ड | फ्रेश repo repair टास्क | [deepswe.datacurve.ai](https://deepswe.datacurve.ai/) |
| FrontierSWE | कठिन implementation / perf / research | [frontierswe.com](https://www.frontierswe.com/) |
| ProgramBench | behavior + docs से प्रोग्राम rebuild | [programbench.com](https://programbench.com/) |
| SWE Marathon | multi-hour whole-project engineering | [swe-marathon.org](https://www.swe-marathon.org/) |
| Moonshot लॉन्च पोस्ट | आर्किटेक्चर और फुल स्कोर टेबल | [kimi.com/blog/kimi-k3](https://www.kimi.com/blog/kimi-k3) |
| OpenRouter रूट | लाइव API प्राइसिंग और provider routing | [openrouter.ai/moonshotai/kimi-k3](https://openrouter.ai/moonshotai/kimi-k3) |

### स्रोत और क्रेडिट

इस पोस्ट के नंबर और चार्ट के लिए प्राथमिक व स्वतंत्र स्रोत:

1. [Kimi K3: Open Frontier Intelligence](https://www.kimi.com/blog/kimi-k3) : Moonshot AI लॉन्च पोस्ट, architecture, pricing, full table, आधिकारिक चार्ट
2. [Artificial Analysis पर Kimi K3](https://artificialanalysis.ai/models/kimi-k3/) : Intelligence Index, speed, price, verbosity, cost charts
3. [Artificial Analysis Intelligence Index methodology](https://artificialanalysis.ai/methodology/intelligence-benchmarking)
4. [Artificial Analysis पर Terminal-Bench 2.1](https://artificialanalysis.ai/evaluations/terminalbench-v2-1)
5. [Vals पर Kimi K3](https://www.vals.ai/models/kimi_kimi-k3) : Vals Index और संबंधित evals
6. [DeepSWE leaderboard](https://deepswe.datacurve.ai/)
7. [ProgramBench](https://programbench.com/)
8. [FrontierSWE](https://www.frontierswe.com/)
9. [SWE Marathon](https://www.swe-marathon.org/)
10. [OpenRouter: moonshotai/kimi-k3](https://openrouter.ai/moonshotai/kimi-k3)
11. [Simon Willison on Kimi K3](https://simonwillison.net/2026/Jul/16/kimi-k3/) : launch context, AA highlights, practical API notes
12. [BenchLM: Kimi K3 release note](https://benchlm.ai/blog/posts/kimi-3-release-data-coming-soon) : Arena Elo, independent index framing

बोर्ड refresh होने पर स्कोर बदलते हैं। करंट रैंकिंग के लिए ऊपर की लाइव चार्ट सेक्शन प्राथमिकता दें।
