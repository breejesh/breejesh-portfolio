---
title: "Fargate vs EC2 for Always-On Services: When the Premium Stops Making Sense"
description: "Fargate is great for bursty work. For APIs and workers that never sleep, the per-vCPU premium adds up. Here is the 2026 cost math and the ops trade-offs."
date: "2026-06-23"
tags: [Cloud & DevOps]
coverImage: /assets/images/fargate-vs-ec2-always-on.webp
previewImage: /assets/images/fargate-vs-ec2-always-on.webp
---

Fargate is often the default choice in architecture reviews: zero node management, zero AMIs, automated capacity. For steady, always-on workloads, however, that managed convenience carries a steep pricing premium. No "who patched the node." You define CPU and memory, ship a task, and AWS runs it.

That is the right product for a lot of work. It is the wrong product for a lot of **always-on** work. The bill makes that clear after a few months of steady 24/7 traffic.

This is the same cost habit that shows up with NAT Gateways and other managed conveniences: you pay a premium for not owning a box. The premium is fine when utilization is lumpy. It is expensive when utilization is flat.

---

## What you are actually buying

| Model | You pay for | You own |
| --- | --- | --- |
| **Fargate** | vCPU-hour + GB-hour for every running task | Task definition, networking, IAM, logging |
| **ECS on EC2** | The instance (On-Demand, Spot, or Savings Plan) | Capacity, packing, AMI/OS, more failure modes |
| **Raw EC2 + Docker/systemd** | The instance | Almost everything |

Fargate prices the **reserved slice** of each task. If a task asks for 1 vCPU and uses 15% of a core most of the night, you still pay for 1 vCPU all night. On EC2, that idle headroom can be shared with other tasks on the same host, or you right-size the host down.

AWS has published this for years in their own ECS cost write-ups: at low packing density, Fargate can look cheaper than a half-empty EC2. At high, steady utilization, EC2 usually wins on pure compute dollars.

---

## Rough monthly math (us-east-1, order of magnitude)

Numbers move with Savings Plans and region. Use these as a **shape**, not a quote.

| Workload | Fargate (always on) | Close EC2 equivalent | Notes |
| --- | --- | --- | --- |
| 0.5 vCPU / 1 GB, 1 task | ~$18/month | `t3.micro` / `t4g.micro` class | Fargate still wins on ops simplicity for one tiny service |
| 1 vCPU / 2 GB, 2 tasks (HA) | ~$70/month | One small multi-vCPU host or two micros | Break-even depends on how hard you pack |
| 2 vCPU / 4 GB, 4 tasks | ~$280/month | `t3.large` / `m7i`-class packing | EC2 starts to pull ahead if hosts stay busy |
| 4 vCPU / 16 GB, steady fleet | Hundreds+/month | `m7i.xlarge` + friends | Steady state + 1-year commitments favor EC2 harder |

Rules of thumb that hold up in practice:

1. **One small always-on API** with rare deploys: Fargate is often worth the tax.
2. **A fleet of workers and APIs that run all day, every day**: pack them on ECS/EC2 or EKS nodes and buy a Compute Savings Plan.
3. **Spiky batch** (train jobs, nightly ETL, preview envs): Fargate or Fargate Spot keeps you from paying for idle metal.

If your average CPU on Fargate tasks sits under ~30% for months, you are not "efficient." You are renting reserved capacity you do not use, at a higher unit price than EC2.

---

## Ops is the real second price

Pure dollars are only half the decision.

**Fargate wins when:**

* You do not want a node upgrade story
* Teams ship many small services and hate capacity planning
* Scale-to-zero or near-zero matters (combined with good min task counts)
* Compliance is easier when AWS owns the runtime host

**EC2 (with ECS or EKS) wins when:**

* You already run a platform team that patches and monitors nodes
* You need DaemonSets, custom kernel modules, or host-level agents that Fargate blocks or complicates
* GPU, high network throughput, or dense bin-packing matters
* You can keep bin packing high enough that the Fargate premium is pure waste

The trap is pretending you have a platform team when you do not. A poorly run EC2 cluster is more expensive than Fargate once you count pages, failed deploys, and "why is the disk full" weekends.

---

## A simple decision path

```
Is the service idle most of the day or highly bursty?
  yes -> Fargate (or Lambda if the runtime fits)
  no  -> continue

Do you already operate container nodes well?
  no  -> stay on Fargate until the monthly bill hurts more than hiring ops time
  yes -> model EC2 with real packing %

Can you keep average host utilization healthy (roughly >50-60% of what you pay for)?
  yes -> ECS on EC2 or EKS with Savings Plans
  no  -> Fargate is still cheaper than empty instances
```

Measure packing with real metrics: CPU, memory, and **network** (people forget network). Right-size task reservations before you migrate. Moving an over-reserved Fargate task onto EC2 without fixing requests/limits just moves waste to a different line item.

---

## Migration pattern that does not blow up prod

If you are already on Fargate and the bill hurts:

1. **Export 30 days of CloudWatch** for CPU, memory, and task count. Find the floor, not the peak marketing slide.
2. **Cut task CPU/memory** where headroom is fantasy. Many teams discover 50% of the Fargate bill is over-reservation, not Fargate itself.
3. **Pick one service** that is always on and boring (internal API, queue worker). Move that first.
4. **Run dual capacity** briefly: Fargate service + EC2 capacity provider, shift traffic with weight or a feature flag.
5. **Buy commitment only after** the shape stabilizes. Savings Plans on the wrong size are a second tax.

Also check the rest of the bill while you are there. It is common to "optimize compute" and still bleed on NAT data processing, multi-AZ idle load balancers, and verbose logging. Compute is rarely the only idle tax.

---

## Bottom line

Fargate is not a scam. It is a **convenience premium**. Pay it for bursty work, small teams, and services where host management is the real risk.

For always-on fleets with predictable floors, EC2 capacity (ECS or EKS) plus honest packing and a Savings Plan is usually the adult move. Do the math on **your** reservation rates and **your** ops cost, not a conference slide that assumes perfect bin packing or zero engineer time.

If your January cloud bill already feels like a hangover, start with one always-on service, thirty days of metrics, and a spreadsheet. The architecture review can wait until the numbers are boring.
