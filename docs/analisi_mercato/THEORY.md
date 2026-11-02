# Market-analysis theory - quick reference

Each model below: **what it is**, **when to use it**, **pitfalls**, and a one-line **Hub Studenti angle**. Do not use every model; pick those that answer your current question. Operational templates are in [FRAMEWORKS.md](FRAMEWORKS.md).

| Question you have | Model |
|---|---|
| How big can this be? | TAM / SAM / SOM |
| What outside forces help or hurt us? | PESTEL |
| How attractive/competitive is this space? | Porter's Five Forces, competitor analysis |
| Where are we strong/weak, what should we do? | SWOT |
| Do users actually want what we build? | Value Proposition Canvas, Jobs-To-Be-Done |
| Who exactly do we serve first? | STP |
| Why might it grow (or stall)? | Network effects / two-sided markets |

---

## 1. TAM / SAM / SOM (Italian: mercato totale / servibile / ottenibile)

**What.** Three nested estimates of demand.
- **TAM** - total demand if everyone who could use the product did.
- **SAM** - the part you can serve with your product, language, legal basis and channels.
- **SOM** - the part you can realistically capture in a defined period given resources and competition.

Two ways to compute:
- **Bottom-up (preferred):** `number of buyers x price x adoption`. Example structure: schools x price per school per year.
- **Top-down:** start from a published market figure and take a share. Fragile: "1% of a big number" is not a plan.

**When.** Before investing time/money, for a pitch, or to decide whether SaaS revenue can ever cover costs.

**Pitfalls.**
- Quoting a huge TAM from a generic report with no link to your product.
- Counting students when the *payer* is the school (or the reverse).
- SOM with no time frame or no channel ("we will get 10% of schools" - how?).
- Mixing free users and paying customers in one number.

**Hub Studenti angle.** Separate three units: students (users), schools (buyers of SaaS), and book transactions (commission). Each has its own SAM.

## 2. PESTEL

**What.** Checklist of macro factors: **P**olitical, **E**conomic, **S**ocial, **T**echnological, **E**nvironmental, **L**egal.

**When.** At the start (context) and when entering a new country or sector.

**Pitfalls.** A long list with no consequence. For every factor write: *effect on us* (opportunity/threat) and *what we do about it*. Drop factors that are not relevant.

**Hub Studenti angle.** Legal weighs heavily: GDPR, minors' consent (14+ in Italy), school-data rules, AGPL obligations, commission on sales (tax/consumer rules, to be checked with a professional). Technological: Italian schools already use Google Workspace / the electronic register - integration or conflict?

## 3. Porter's Five Forces

**What.** Industry attractiveness from five pressures: rivalry among competitors, threat of new entrants, threat of substitutes, bargaining power of buyers, bargaining power of suppliers.

**When.** To understand why margins are high or low and where you are exposed.

**Pitfalls.**
- Defining the "industry" too broadly or too narrowly.
- Forgetting **substitutes** - for student tools the main rival is often *WhatsApp/Instagram groups and paper notice boards*, not another app.
- Scoring forces without evidence.

**Hub Studenti angle.** Buyers (schools) can choose free alternatives or build their own; suppliers (hosting, email delivery) are interchangeable; new entrants are easy because the code is open - including copies of your own code (AGPL helps but does not stop hosted competitors from using it with source disclosure).

## 4. SWOT

**What.** Strengths and Weaknesses (internal), Opportunities and Threats (external), crossed to produce actions (SO, WO, ST, WT strategies).

**When.** To summarise findings from other models into decisions.

**Pitfalls.**
- Generic items ("good team") - make each item specific and evidence-backed.
- Stopping at the list: the value is the **TOWS cross** ("use strength X to seize opportunity Y").
- Confusing internal and external factors.

## 5. Value Proposition Canvas

**What.** Two halves that must fit. *Customer profile:* jobs, pains, gains. *Value map:* products/services, pain relievers, gain creators.

**When.** Designing or checking features, writing landing-page copy, preparing interviews.

**Pitfalls.**
- Filling the canvas from imagination; every pain/gain should trace to an interview quote or observation.
- Listing features as "pain relievers" that relieve no listed pain.
- One canvas for all segments - make one per segment (student, class rep, teacher, school admin).

## 6. Jobs-To-Be-Done (JTBD)

**What.** People "hire" a product to make progress in a situation. A job statement: *When [situation], I want to [motivation], so I can [outcome].* Includes functional, emotional and social dimensions, and the "firing" of the current solution.

**When.** Discovery interviews; deciding what to build first; understanding competitors (anything hired for the same job competes).

**Pitfalls.**
- Writing a job that is just a feature ("I want a poll tool").
- Asking "would you use X?" instead of "tell me about the last time you had to...".
- Ignoring the switching cost of leaving the current habit (e.g. the class WhatsApp group).

## 7. STP - Segmentation, Targeting, Positioning

**What.** Divide the market into segments, pick the one(s) to serve first, and state a positioning (who it is for, what category, the key difference).

**When.** Before choosing pilot schools and before any marketing.

**Pitfalls.**
- Segmenting by demographics only; behaviour and need are more useful.
- Targeting "all schools". Choose a beachhead: a narrow group where you can win and learn fast.
- Positioning claims you cannot prove.

**Positioning statement template.** *For [target] who [need], Hub Studenti is a [category] that [key benefit]. Unlike [alternative], it [differentiator].*

## 8. Competitor analysis

**What.** Systematic comparison of direct competitors (similar product), indirect (different product, same job) and substitutes (including doing nothing).

**When.** Before pricing, positioning and roadmap decisions; repeat periodically.

**Pitfalls.**
- Comparing only features. Also compare price, target buyer, data/privacy stance, distribution, switching cost, and stated weaknesses (reviews, forums).
- Only listing apps; include informal tools (messaging groups, shared drives, school portals).
- Copying a competitor's claims without checking the source and date.

## 9. Two-sided markets and network effects

**What.**
- **Direct network effect:** value rises as more people in the same group join (more classmates -> more useful).
- **Cross-side effect:** one side's participation attracts the other (more sellers -> more buyers on the book exchange).
- **Local vs global:** here effects are mostly **local to one school**; a second school adds little to the first.
- **Cold start problem:** an empty hub is worthless; you need a "critical mass" per school.

**When.** Planning the launch, deciding whether to go deep in one school or wide across many, pricing (who gets it free?).

**Pitfalls.**
- Assuming virality without measuring it (invites per user, activation rate).
- Charging the side that creates value for others too early.
- Treating a multi-school product as one network when each school is its own small market.

**Hub Studenti angle.** Launch school by school; seed with content that has value even with few users (events, announcements from reps) before features that need many users (book exchange, notes). Track **activation per school** (share of enrolled students who registered and did one action in 14 days) - the exact threshold is an assumption to calibrate in the pilot.
