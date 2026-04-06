# Slide Structure V2 — 15-slide arc

This is a proposed narrative structure for the OpenClaw / twodot.ai talk.

Goal: explain the market shift, frame OpenClaw's architectural importance, show how twodot.ai uses it in practice, then lead into the design of the current V1 assistant / claw model.

---

## Slide 1 — Opening hook: the wrong metric

**Title idea:** AI coding is not the metric anymore

**Core point:**
The market spent a year arguing about how much code AI can write. That is already the wrong question.

**Talk track:**
- "% of code written" was a useful transitional metric
- it rewarded visible generation, not useful autonomous completion
- the better 2026 question is: can your team create environments where implementation and experimentation happen autonomously?

**Good line:**
> AI coding was the 2025 metric. Automated coding is much closer to the 2026 metric.

---

## Slide 2 — Why uptake is polarized

**Title idea:** Why some people hate this and others love it

**Core point:**
OpenClaw-style systems produce polarized reactions because they expose a divide in how people think about work.

**Talk track:**
- developers often see chaos, rough edges, and missing guarantees
- operators, founders, and high-friction businesses see leverage immediately
- the people living inside repetitive workflow pain feel the value first

**Use from scratchpad:**
- devs hate it
- supplement drop shippers love it

---

## Slide 3 — The real leverage is the environment

**Title idea:** Model quality matters. Environment design matters more.

**Core point:**
The advantage is not just the model — it is the environment around the model.

**Talk track:**
- can people safely prototype workflows?
- can operators test business logic quickly?
- can clients interact with a bounded system directly?
- can you learn before you commit to a full product build?

**Message:**
High-freedom, low-risk experimentation beats static planning.

---

## Slide 4 — What twodot.ai is building

**Title idea:** twodot.ai as an agentic OS for business

**Core point:**
twodot.ai is building a platform for creating, hosting, and operating agents that participate in business workflows.

**Talk track:**
- custom agents with specific permissions
- scalable hosting / operational model
- boutique software behaviour at scale
- agents sitting across real business systems rather than in a demo bubble

**Good line:**
> We are trying to build an agentic operating system for business.

---

## Slide 5 — What that means in real business terms

**Title idea:** Boutique software at scale

**Core point:**
This is how you automate messy business reality without treating every problem like a bespoke software rewrite.

**Talk track:**
Use the CRM/email/package-tracking example:
- read inbound/outbound email
- cross-reference tracked packages or jobs
- reconcile state across systems
- update operational tracking
- surface exceptions and move work forward

**Message:**
The point is not answers. The point is operational movement.

---

## Slide 6 — Why OpenClaw matters to us

**Title idea:** OpenClaw as an experimentation engine

**Core point:**
OpenClaw has been one of the fastest ways for twodot.ai to test agentic workflows both internally and with clients.

**Talk track:**
- test dev workflows
- test business workflows
- test client-facing operating models
- start as a prototype surface
- end up as real infrastructure because it is already useful

**Good line:**
> If an experimentation tool works, it stops being an experiment and becomes infrastructure.

---

## Slide 7 — The old AI product pattern

**Title idea:** Disposable chats were always the wrong primitive

**Core point:**
Most AI products began as disposable chat sessions.

**Talk track:**
- open a chat
- ask for something
- get a result
- abandon the thread
- start another

That works for answers. It is weak for operations.

---

## Slide 8 — Why memory bolt-ons were not enough

**Title idea:** Memory was a patch, not a full solution

**Core point:**
The industry's first continuity fix was memory retrieval, but it did not solve the architectural problem.

**Talk track:**
- memory can store facts
- memory can retrieve some context later
- but the working context is still fragmented
- retrieval is selective and often unreliable
- operational continuity wants more than vague recall

---

## Slide 9 — What OpenClaw changes

**Title idea:** OpenClaw is a phase shift

**Core point:**
OpenClaw shifts from disposable chats toward persistent operational sessions.

**Talk track:**
Safer factual framing:
- continuity is primary
- sessions persist rather than being purely throwaway
- memory and supporting systems help maintain continuity
- the system is built to reduce context bloat without losing the operating thread

**Avoid overclaiming:**
Do not say literally one universal consciousness across the whole system.

---

## Slide 10 — Sessions, streams, and substrate

**Title idea:** Same assistant substrate, different active streams

**Core point:**
One of the key innovations is that you can have multiple independent active context streams without losing coherence of the assistant.

**Talk track:**
- sessions/streams are separate in active context
- Telegram is not just the same chat in another wrapper
- shared substrate can include identity, memory, operating rules, style
- active conversation state remains separate
- relays happen intentionally, not by contaminating all contexts

**Good line:**
> Same assistant substrate. Different active streams. Intentional bridges when needed.

---

## Slide 11 — Why that matters for business use

**Title idea:** This is what makes it operational

**Core point:**
Real business work is ongoing, interrupted, multi-party, and stateful.

**Talk track:**
- commitments continue over time
- tasks are interrupted and resumed
- multiple humans interact with the same assistant identity
- background work matters
- context isolation matters too

**Message:**
This is much closer to an operator model than a chatbot model.

---

## Slide 12 — How twodot.ai actually uses it

**Title idea:** Our claws in the wild

**Core point:**
This is not theoretical; twodot.ai already runs multiple OpenClaw-based assistants with distinct roles.

**Talk track:**
Mention:
- Ali
- Fraser
- Kylie
- Monica

Frame as:
- multiple claws
- different roles
- same general platform logic
- real usage, not slideware

---

## Slide 13 — Example claw: Ali

**Title idea:** Ali as Grant's executive assistant

**Core point:**
Ali is an easy example because people instantly understand what an executive assistant does.

**Talk track:**
- effectively Grant's executive assistant
- calendar access and scheduling context
- practical coordination
- operational support around executive work

**Message:**
This makes the category legible very quickly.

---

## Slide 14 — Designing our V1 assistant

**Title idea:** The claw we are building now

**Core point:**
We are now taking the lessons from experimentation and turning them into a more deliberate V1 assistant design.

**Talk track:**
Lead into:
- what we now think a useful claw needs
- boundaries and permissions
- continuity and session design
- tools and relay capability
- production guardrails
- usability over novelty

**Message:**
The V1 is not just a demo assistant — it is an operational unit.

---

## Slide 15 — Cool features and benefits of a claw

**Title idea:** What you get when a claw is actually good

**Core point:**
A claw is valuable when it is not just clever, but useful in the rhythm of real work.

**Possible feature buckets:**
- persistent continuity
- multi-channel presence
- role-specific behaviour
- bounded permissions
- deliberate relays across people/surfaces
- background execution
- operator visibility
- cheap experimentation that can graduate into production

**Closing line options:**
> The future is not one giant chatbot. It is a set of useful claws operating inside real business systems.

Or:
> OpenClaw gets interesting when it stops being a demo and starts behaving like an operational organism inside the company.

---

## Suggested flow summary

1. Wrong metric
2. Polarized uptake
3. Environment > model
4. twodot.ai mission
5. Business automation example
6. OpenClaw as experimentation engine
7. Old disposable-chat model
8. Memory patch model
9. OpenClaw phase shift
10. Sessions / streams / substrate
11. Why this matters operationally
12. Multiple claws in use
13. Ali example
14. V1 assistant design
15. Benefits / closing

---

## Notes on tone

This deck should sound:
- founder/operator-grade
- practical
- opinionated
- slightly ahead of the audience, but not mystical

Avoid:
- vague AGI language
- overselling universal intelligence
- overclaiming architecture beyond what OpenClaw really documents
- turning every slide into a paragraph wall
