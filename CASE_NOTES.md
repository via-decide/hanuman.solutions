# Case notes — one week, one production estate

Source material for hanuman.solutions. Everything here is real, dated
2026-08-04 to 2026-08-05, across six live domains, a payment gateway, ~101 git
repositories and a mail pipeline.

**What this is for:** showing a founder their own pain in someone else's
system, so they recognise it before it costs them.

**What is deliberately absent:** how any of it was diagnosed or fixed. The
symptom and the cost are the hook. The method is the product.

---

## 1. The site that was down for four days and nobody noticed

**Symptom.** Every page on a live commercial domain returned "page not found."
Not the homepage only — every URL. The API still answered, which is why
monitoring stayed green.

**How long.** Four days.

**Why nobody noticed.** Uptime checks were watching an endpoint that never
stopped responding. The dashboard said the last deploy succeeded. It had
succeeded — it deployed the wrong thing.

**What it cost.** Every visitor for four days. Every link shared in that window
went to a dead page. No error was raised anywhere, because nothing errored.

**Recognise this if:** your monitoring watches `/health` and not the page a
customer actually opens.

---

## 2. A deploy that deletes your website, and looks completely normal

**Symptom.** A routine deploy from a developer machine. Green build, no
warnings, no failures.

**What actually happened.** Files that existed in the repository had been
removed from that laptop. The deploy uploaded the laptop, not the repository.
Production lost everything the laptop was missing.

**The dangerous part.** A deploy that *removes* files is visually identical to
one that adds them. There is no warning, no diff, no confirmation. You find out
when a customer tells you.

**Same estate, second occurrence.** A second site was one command away from
losing 11 pages of published content that existed in production and nowhere
else. That command was not run — this time.

**Recognise this if:** anyone on your team can deploy from their own machine.

---

## 3. A store that could never take money, for months

**Symptom.** Checkout worked. The button responded, an order was created, the
payment provider accepted it.

**What was actually happening.** Every product on the site was sending the same
internal test identifier — a ₹1 placeholder — to the payment gateway. Below the
gateway's minimum charge. No real product could be purchased, by anyone, ever.

**Why it was never caught.** Nothing errored. The order appeared in the
dashboard. The failure was one layer below where anyone was looking.

**Also found in the same system:** prices were being read in one currency and
charged in another. A ₹199 item was being billed as ₹2.99 — a 98.5% discount,
applied automatically, on every sale.

**Recognise this if:** you have never completed a real purchase on your own
storefront, with your own card.

---

## 4. The payment webhook that threw money away and reported success

**Symptom.** Payments captured correctly. Money arrived. Orders did not update.

**What was happening.** The webhook that confirms payment answered "received,
all good" to *every* request — including ones it had rejected and ones that
crashed halfway. The payment provider, told everything was fine, stopped
retrying and moved on.

**The consequence.** A customer pays. The provider believes it delivered the
confirmation. Your system never records it. Nobody is told. The money is in
your account and the order does not exist.

**How it looked from outside.** A green dashboard on both sides.

**Recognise this if:** you have never checked that a failed webhook actually
retries.

---

## 5. One credential, copied into 101 places

**Symptom.** None. Everything worked perfectly.

**What was found.** A single access credential with full write permission to
every repository, embedded in plain text in **101 git configurations**, in a
machine-learning training dataset, and in eleven other files across the
machine.

**Why it happened.** It was pasted once, years of tooling copied it forward,
and nothing ever flagged it. Every clone carried it.

**What it exposed.** Anyone reading any one of those files could push code to
every project — including the ones that handle payments.

**Recognise this if:** you have ever pasted a token into a URL to make a clone
work.

---

## 6. Three copies of one website, and nobody knew which was real

**Symptom.** A site that worked fine.

**What was found.** The live site served 43 pages. The machine used to update
it could produce 32 of them, spread across four unrelated folders with
misleading names. The remaining 11 — a month of published research — existed
**only on the live server.**

**What that means.** No backup. No source. One rollback, one deletion, one
provider incident and a month of work is gone permanently.

**Recognise this if:** you cannot say, right now, which folder builds your
website.

---

## 7. Paid products delivering broken links

**Symptom.** Customer pays. Confirmation email arrives. Everything looks right.

**What was found.** Four of nine products emailed customers a download link
that led to a page-not-found. Including the highest-priced item on the site.

**Why the system allowed it.** There was a safety check confirming a delivery
link existed. There was no check that the link *worked*.

**What the customer experiences.** They pay, they receive a professional email,
they click, and they get nothing. Then they email you. Then they ask for a
refund.

**Recognise this if:** you have never clicked your own delivery link after a
real purchase.

---

## 8. Emails that could never have been sent

**Symptom.** Order confirmations were not arriving.

**What was found.** The mail credentials were never configured. Worse, the
system had a fallback that assumed "no mail configured" meant "development
mode" and let purchases continue anyway — taking money for products it had no
way to deliver.

**Recognise this if:** your order emails go through a provider you set up once
and have not tested since.

---

## The pattern

Not one of these was a bug in the sense of broken code. Every system involved
was doing exactly what it was told.

They share one shape: **the thing reporting success was not the thing doing the
work.**

- monitoring watched an endpoint, not a page
- a deploy reported success for uploading the wrong source
- an order was created without a chargeable amount
- a webhook confirmed receipt without recording anything
- a check confirmed a link existed without confirming it resolved

Green dashboards. Real money. Nothing connecting them.

---

## The state now

All eight are closed. The estate has:

- deploys that cannot ship a machine's local mess to production
- a payment path verified end to end, with an audit trail
- credentials rotated, with the leak path removed
- content that exists in more than one place
- delivery that refuses to sell what it cannot deliver
- a written map of what runs where, and what depends on what

**The last one is the one founders underestimate.** Most of the week was not
repair. It was finding out what was actually running — because nothing on the
system described itself accurately, and the documentation that existed
described intentions rather than reality.

---

## Suggested landing copy

> **Your dashboard is green. That is not the same as working.**
>
> In one week across six production sites we found a site that had been
> completely down for four days, a store that had never been able to take a
> payment, a webhook quietly discarding confirmed orders, and one password
> copied into 101 places.
>
> None of it showed up as an error. All of it was costing money.
>
> **Send us your system. Diagnosis in 12 hours.**

Short variants:

- *"Four days down. Monitoring never noticed. Here's why."*
- *"Their checkout worked. It had never taken a single rupee."*
- *"The payment succeeded. The order vanished. Both dashboards said fine."*
- *"One password. 101 places. Nothing flagged it."*
- *"43 pages live. 32 backed up. Nobody knew."*
