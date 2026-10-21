---
title: "What the Cyber Resilience Act Means for Your Firmware"
description: "The EU Cyber Resilience Act now applies to connected products. What it asks of firmware teams, which deadlines matter, and what to start on today."
date: 2026-10-21
---

If your product has a microcontroller and a network connection, the [Cyber Resilience Act](https://eur-lex.europa.eu/eli/reg/2024/2847/oj) (CRA) is no longer something for next year's roadmap. The first obligations already apply, and the rest arrive in a little over a year.

Most of the work falls on firmware. Lawyers can write the policy, but somebody still has to build the update path, generate the SBOM and fix the vulnerability once it is reported.

---

## Two Dates to Remember

The CRA (Regulation (EU) 2024/2847) is rolling out in stages. Two dates matter for firmware teams:

- **11 September 2026: reporting obligations.** Manufacturers must report actively exploited vulnerabilities and severe security incidents to their national CSIRT and ENISA. You send an early warning within 24 hours and a fuller notification within 72 hours, followed by a final report no later than 14 days after a fix or mitigation is available. This applies to products **already on the market**, not only to new ones.
- **11 December 2027: full application.** From this date, products with digital elements placed on the EU market must meet the essential cybersecurity requirements in the regulation.

Penalties for breaking the essential requirements can reach **€15 million or 2.5% of worldwide annual turnover**, whichever is higher.

> The reporting duty is already live. If a vulnerability in a device you shipped years ago is being exploited today, the clock starts now.

---

## What the CRA Asks of Firmware

The regulation is written in general terms, but for embedded products a few requirements stand out.

### Secure by Default

Products must ship with a secure default configuration. Think default passwords, debug interfaces left open in production, or services listening on ports nobody uses. Users should not have to harden the device themselves.

### Security Updates That Actually Arrive

Vulnerabilities must be fixable through security updates. Where applicable, those updates are installed **automatically by default**, with a way for the user to opt out, and provided **free of charge**. Where feasible, security fixes are also kept separate from feature updates, so a customer is never forced to take a redesign to get a patch.

For firmware, this means you need a reliable update mechanism. A device that can brick itself during an update is a problem for your support team, and under the CRA it is a compliance problem too.

### A Support Period

You must define how long you will provide security updates. The default expectation is **at least five years**, unless the product is expected to be in use for a shorter time. Each security update must stay available for at least ten years after release, or for the rest of the support period if that is longer.

Five years of patches for an MCU product means your build environment, toolchain and signing keys must still work in 2032.

### An SBOM

You need a **software bill of materials** in a common, machine-readable format, covering at least the top-level dependencies. For firmware, that includes the RTOS, vendor HALs and SDKs, the TLS library and anything pulled in through a package manager. It's easy to forget the third-party code inside a vendor SDK.

### Vulnerability Handling

You need a process for receiving and handling vulnerabilities: a **coordinated vulnerability disclosure** policy, a contact address people can actually reach, and a way to track, fix and ship patches for known issues in your components.

---

## The Standards Are Late

The CRA relies on harmonised standards to give manufacturers a clear way to show conformity. Those standards are still in progress, and their deadlines have already slipped. The legal deadlines have not.

In practice there is no "just follow EN xxxx" shortcut yet. You have to read the requirements, decide what they mean for your product, and document your reasoning.

If your product has a radio, you may already be partway there. Since **1 August 2025**, the cybersecurity requirements of the Radio Equipment Directive apply, and the EN 18031 series is the harmonised standard for them. Work done for EN 18031 (authentication, secure updates, protecting network functions) carries over to the CRA.

---

## What Firmware Teams Can Do Now

You don't need to solve everything at once. These are the steps we recommend starting with:

1. **Make a product list.** Which of your products are still on the market or still receiving updates? The reporting duty already covers them.
2. **Set up a security contact.** A `security@` address, a short disclosure policy on your website, and someone responsible for reading it.
3. **Generate an SBOM in CI.** Produce it automatically on every release build, in CycloneDX or SPDX. A spreadsheet maintained by hand will be out of date after one release.
4. **Check your update path.** Can every product receive a signed update in the field? What happens if power drops halfway through? Is there a rollback?
5. **Review your defaults.** Default credentials, debug ports, open services and verbose logging in production builds.
6. **Decide on support periods.** Pick a number per product line, and check that your toolchain, keys and build servers will last that long.
7. **Write a reporting runbook.** Who decides that something is an actively exploited vulnerability, who reports it, and how do you meet a 24-hour deadline on a Saturday?

None of this is exotic. Most of it is good engineering practice that a deadline now makes mandatory.

---

## Where to Start

We've built two free tools to help you get a first picture:

- **[CRA self-check](/tools/cra-check):** a short questionnaire that shows where your product stands and what to work on first.
- **[SBOM viewer](/tools/sbom):** drop in a CycloneDX or SPDX file to see what's actually inside your firmware.

If you want help with the firmware side (secure update mechanisms, SBOM generation in CI, or a gap assessment for a specific product), take a look at our [secure updates and CRA readiness service](/services#updates).

> This article is a practical summary for engineering teams, not legal advice. For the exact obligations that apply to your product, read the regulation and consult a legal or compliance expert.

📧 **Contact us at [info@alsoft.nl](mailto:info@alsoft.nl)** or through our [contact page](/contact).
