---
title: "AWS EC2 Pricing Demystified: On-Demand, Spot, and Reserved Instances"
description: "Compare AWS EC2 pricing models with real hourly costs, spot interruption mechanics, commitment risks, and a production hybrid strategy."
date: "2026-06-22"
tags: [Cloud & DevOps]
coverImage: /assets/images/aws-spot-reserved-ondemand.webp
previewImage: /assets/images/aws-spot-reserved-ondemand.webp
---


Cloud compute typically consumes over half of an organization's monthly AWS bill. Yet engineering teams routinely default to On-Demand instances out of habit, leaving 50% to 70% in potential savings on the table. Others avoid Spot instances entirely after experiencing a single unexpected node termination, or lock themselves into 3-year commitments for workloads that change within six months.

Choosing the wrong EC2 pricing model burns money fast. Understanding the exact trade-offs between On-Demand, Spot, and Reserved Instances (including Savings Plans) enables you to reduce infrastructure costs by 50% to 70% without compromising uptime.

---

## On-Demand Instances: Maximum Flexibility, Highest Unit Cost

On-Demand pricing is the baseline for AWS compute. You pay for compute capacity by the second (with a 60-second minimum) with no long-term commitment or upfront payment.

### Actual Cost Profile

For a modern compute-optimized instance like `c6i.2xlarge` (8 vCPU, 16 GB RAM) in `us-east-1`:

* **On-Demand Rate:** $0.34 per hour
* **Monthly Cost (24/7):** ~$248.20 per month

### When to Use On-Demand

* Short-term workloads lasting less than a few weeks.
* Unpredictable traffic spikes where immediate capacity scaling is mandatory.
* Development and staging environments that run for brief, irregular intervals.
* Initial application testing before establishing steady-state resource demands.

### The Problem with 100% On-Demand

Running production workloads entirely on On-Demand is equivalent to paying full retail price for every server 24/7/365. If a service runs continuously for more than two months, keeping it on On-Demand wastes money.

---

## Spot Instances: Up to 90% Discounts with Preemption Mechanics

Spot instances allow you to bid on spare AWS EC2 capacity. AWS offers these idle servers at steep discounts, typically 65% to 75% below On-Demand prices, and up to 90% for less common instance types.

### Actual Cost Profile

Comparing the same `c6i.2xlarge` instance in `us-east-1`:

* **Spot Rate:** ~$0.091 per hour (varies dynamically based on supply)
* **Monthly Cost (24/7):** ~$66.42 per month
* **Savings:** ~73% discount compared to On-Demand

### The Catch: Unreliability and Preemption

AWS can reclaim a Spot instance at any time when demand for On-Demand capacity increases. When AWS needs the capacity back, it sends a **2-minute preemption notification**.

Spot capacity is organized into pools. A Spot pool is defined by three parameters:

1. Instance Type (e.g., `c6i.2xlarge`)
2. Availability Zone (e.g., `us-east-1a`)
3. Region (e.g., `us-east-1`)

If a specific pool runs low on spare hardware, AWS terminates Spot nodes in that pool.

### Spot Preemption Timeline

* **0:00:** AWS signals interruption via IMDS or EventBridge.
* **0:05:** Node Handler marks node as Unschedulable (`kubectl cordon`).
* **0:10:** Active pods receive `SIGTERM`, new pods route elsewhere.
* **1:50:** Workloads finish flushing state to disk or network.
* **2:00:** AWS terminates the EC2 instance.

### How to Engineer for Spot Reliability

1. **Instance Diversification:** Never rely on a single instance type. Configure Auto Scaling Groups or Kubernetes Karpenter to request multiple instance families across multiple Availability Zones (for example: `c6i.2xlarge`, `c5.2xlarge`, `c6a.2xlarge`, `m6i.2xlarge`).
2. **Automate Node Draining:** Intercept the 2-minute preemption notice via Instance Metadata Service (IMDS) at `http://169.254.169.254/latest/meta-data/spot/instance-action` or EventBridge `EC2 Instance State-change Notification`.
3. **Use Capacity Rebalance Notifications:** AWS provides an `EC2 Instance-rebalance-recommendation` signal up to 15 minutes before reclamation when pool capacity degrades.

### Best Workloads for Spot

* Stateless web servers and API microservices behind a load balancer.
* Kubernetes worker pools running fault-tolerant container pods.
* Batch processing jobs (AWS Batch, EMR, Ray, Spark).
* CI/CD build agents and automated testing runners.

### Avoid Spot For

* Relational databases (RDS PostgreSQL, MySQL) and single-node data stores.
* Monolithic applications without graceful shutdown handlers.
* Stateful applications without real-time cross-node replication.

---

## Reserved Instances and Savings Plans: Discounts for Commitment

When you have stable, predictable workloads, AWS provides discounts in exchange for a 1-year or 3-year commitment.

### RIs vs. Savings Plans

While traditional Reserved Instances (RIs) still exist, AWS Savings Plans are the modern standard for commit-based discounts.

| Pricing Option | Commitment | Flexibility | Typical Discount |
|---|---|---|---|
| **Compute Savings Plans** | 1 or 3 Years | Highest. Applies across instance families, OS, regions, Fargate, and Lambda. | 37% (1-Yr) to 66% (3-Yr) |
| **EC2 Instance Savings Plans** | 1 or 3 Years | Medium. Locked to a single instance family in one region. | 40% (1-Yr) to 72% (3-Yr) |
| **Standard RIs** | 1 or 3 Years | Low. Locked to instance type, OS, and region. Tradable on RI Marketplace. | 35% (1-Yr) to 60% (3-Yr) |
| **Convertible RIs** | 1 or 3 Years | Medium. Allows exchanging for different instance specifications. | 30% (1-Yr) to 54% (3-Yr) |

### Actual Cost Profile

Using `c6i.2xlarge` in `us-east-1`:

* **On-Demand:** $0.340 per hour ($248.20 / month)
* **1-Year Compute Savings Plan (No Upfront):** ~$0.214 per hour ($156.22 / month, 37% savings)
* **3-Year EC2 Instance Savings Plan (All Upfront):** ~$0.095 per hour ($69.35 / month, 72% savings)

### The Lock-in Risk

The main drawback of commitments is financial lock-in. If you commit to a 3-year EC2 Instance Savings Plan for `c6i` instances and your engineering team rewrites the stack to run on Graviton `c7g` processors or moves to AWS Lambda six months later, you remain financially obligated for the remaining 2.5 years of the `c6i` commitment.

Compute Savings Plans mitigate this risk by automatically applying hourly dollar commitments across all instance families, architectures (x86 vs ARM), and compute services (EC2, Fargate, Lambda).

---

## Direct Pricing & Feature Comparison

Here is how the four main purchasing paths stack up for an 8 vCPU, 16 GB RAM server footprint (`c6i.2xlarge` equivalent):

| Metric / Feature | On-Demand | Spot Instances | 1-Yr Compute Savings Plan | 3-Yr EC2 Instance Savings Plan |
|---|---|---|---|---|
| **Hourly Rate** | $0.340 | ~$0.091 | ~$0.214 | ~$0.095 |
| **Monthly Bill** | $248.20 | ~$66.42 | ~$156.22 | ~$69.35 |
| **Discount vs. OD** | 0% | 65% - 75% | ~37% | ~72% |
| **Commitment** | None | None | 1 Year | 3 Years |
| **Interruption Risk** | None | High (2-min notice) | None | None |
| **Family Flexibility** | Instant | Instant | High (Auto-applies) | Low (Family locked) |
| **Region Flexibility** | Instant | Instant | High (Global) | Low (Region locked) |

---

## The 70/20/10 Hybrid Production Strategy

The most cost-effective cloud architectures do not choose a single pricing model. They combine all three into a hybrid allocation structure.

### Hybrid Allocation Structure

* **Baseline (60% to 70%):** Compute Savings Plans (1 or 3 Year) for core infrastructure.
* **Scale-Out (20% to 30%):** Spot Instances across multiple AZs and instance families.
* **Peak Spikes (10%):** On-Demand Auto Scaling Groups for sudden headroom buffer.

### Architectural Breakdown

1. **60% to 70% Baseline (Compute Savings Plans):** Cover your minimum daily compute baseline with 1-Year or 3-Year Compute Savings Plans. This handles database clusters, control planes, and baseline web servers.
2. **20% to 30% Scalable Compute (Spot Instances):** Use Spot instances for stateless application scaling during daytime traffic peaks. Configure Karpenter or Auto Scaling Groups with at least 4 to 6 instance types.
3. **10% Safety Buffer (On-Demand):** Keep On-Demand as a fallback mechanism. If Spot capacity pools become depleted, Auto Scaling Groups temporarily launch On-Demand instances until Spot capacity recovers.

### ROI Calculation: 100 vCPU Workload

Consider an infrastructure requiring 100 vCPUs (equivalent to twelve `c6i.2xlarge` instances) running continuous production:

* **100% On-Demand Strategy:** 12 x $248.20 = **$2,978.40 per month**
* **100% 3-Year EC2 Savings Plan:** 12 x $69.35 = **$832.20 per month** (Risk: zero agility)
* **70/20/10 Hybrid Strategy:**
  * 8 nodes on Compute Savings Plan (3-Yr): 8 x $95.00 = $760.00
  * 3 nodes on Spot Instances: 3 x $66.42 = $199.26
  * 1 node on On-Demand (burst): 1 x $248.20 = $248.20
  * **Total Hybrid Cost:** **$1,207.46 per month**

The hybrid approach cuts monthly spend by **59.4%** while preserving technical agility and eliminating single-point failure risks during Spot reclamation events.

---

## Decision Checklist

Before selecting an instance pricing tier, evaluate your workload against these criteria:

* Can the workload tolerate node termination with a 2-minute warning? **Use Spot.**
* Is the workload a stateful database or core infrastructure component running 24/7? **Use Savings Plans.**
* Is the workload an unproven prototype or an unpredictable short-term burst? **Use On-Demand.**
* Are you migrating between architectures or instance types over the next 12 months? **Choose Compute Savings Plans over EC2 Instance Savings Plans.**

