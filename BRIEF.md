# Brief

Build a polished slide deck website for Will's talk on 2026-04-09.

## Goal
Create a presentation site (not PowerPoint) that can be served later from `howtoopenclaw.islinuxdown.com`.

## Source material
Use this scratchpad as the source of truth:
`/Users/will/.openclaw/workspace/openclaw-talk-scratchpad.md`

Talk theme:
- Productionising OpenClaw

## Requirements
- Use a web-native slide framework suitable for hosting as a static website.
- Prioritize a clean, modern, professional design.
- The talk should feel opinionated, practical, and founder/operator-grade, not academic.
- Aim for an initial v1 with roughly 12-18 slides.
- Include speaker notes where useful.
- Include strong opening hook, clear narrative arc, and solid closing.
- Use real examples drawn from the scratchpad, especially:
  - polarized uptake
  - "% of code written" vs "% of code written autonomously"
  - what productionising actually means
  - operator lessons / guardrails / real-world use
  - Fraser example material if it helps as a case study
- Include a README with local dev/build instructions.
- Include a short DEPLOY.md explaining what would need to happen to host it at `howtoopenclaw.islinuxdown.com`.

## Constraints
- Do not assume the domain is already configured locally.
- Work entirely inside this project directory.
- Make sensible tool/library choices without asking unless blocked.
- Prefer a static-host-friendly output.
- Commit changes locally when done.

## Output expectation
When finished, summarize:
1. framework chosen
2. slide count
3. where the main slide content lives
4. how to run locally
5. any open questions / polish opportunities

When completely finished, run this command to notify me:
openclaw system event --text "Done: Codex built the first pass of the OpenClaw talk slide site" --mode now
