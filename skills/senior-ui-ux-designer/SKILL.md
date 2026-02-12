---
name: senior-ui-ux-designer
description: A senior UI/UX designer capability. Use this skill when synthesizing UI/UX requirements designing comfortable and fluid UIs aligned with a project’s design language, and validating designs against best practices for accessibility, responsive design,and modern interaction patterns.
---

# Senior UI/UX Designer Skill

## Purpose

This skill teaches the agent how to evaluate UI/UX requirements and produce design guidance
and artifacts that follow modern best practices. Use this skill when asked to:

- Provide UI/UX recommendations.
- Validate a design or interface pattern.
- Produce design notes or a plan for a responsive interface.
- Critically evaluate a design system or existing UI.
- Suggest improvements for usability and accessibility.

This skill assumes that the project uses default, out-of-the-box components from a design system
(where available) and that custom components are used sparingly and only with justification.

## When to Use

Apply this skill when:

- The user’s request mentions _design_, _UI/UX_, _usability_, _accessibility_, _responsive_, _fluid design_, _layout_, _design evaluation_, or similar terms.

- The task involves a UI, front-end screens, mockups, prototypes, or interaction patterns.

- The user asks for **UI recommendations**, **design critique**, or **design rationale**.

## Instructions for the Agent

### 1. Understand Requirements

1. Extract core user needs, goals, constraints, and context.
2. Clarify the primary interaction flow and user tasks.
3. Determine the platform (web, mobile, hybrid) and use context.
4. Identify any existing design language or component system being used.

### 2. Adhere to Existing Design Language

1. Default to native or design system components (e.g., standard UI library elements).
2. Reuse spacing, typography, and color tokens consistently.
3. Unless a _clear UX justification_ exists, avoid inventing new patterns.

### 3. Produce Comfortable & Fluid UI Designs

1. Prioritize clarity, minimal cognitive load, and intuitive affordances.
2. Ensure visual hierarchy makes key actions obvious.
3. Use consistent motion/interaction patterns (e.g., for hover, focus, transitions).
4. Avoid abrupt or unpredictable layout shifts.

### 4. Responsive & Adaptive Design Principles

1. Assume mobile-first unless specified otherwise.
2. Breakpoints should adapt fluid grid systems, not fixed pixel values.
3. Provide layout behaviors for:
   - small phones
   - large phones
   - tablets
   - desktops
   - wide screens
4. Ensure navigation and controls are reachable and touch-friendly.

### 5. Accessibility Validation

1. Refer to WCAG 2.1 AA criteria for color contrast, focus management, ARIA roles, and labels.
2. Ensure keyboard navigation is supported.
3. Ensure meaningful text alternatives and readable font sizes.
4. Avoid nonspecific triggers (e.g., color-only cues).

### 6. Research Best Practices

When forming recommendations, consult widely adopted, current best practices such as:

- Responsive web design principles
- Fluid layout and flexbox/grid use
- Interaction design patterns (e.g., MIT Touch Gesture guide and Nielsen Norman usability heuristics)
- Accessibility standards and published guidelines

Validate that the design conforms to these principles and explain trade-offs as needed.

### 7. Provide Clear & Actionable Output

When responding:

1. Start with a high-level **summary** of findings.
2. Divide output into sections:
   - Goals
   - Key UI/UX recommendations
   - Accessibility observations
   - Responsive behavior considerations
   - Suggested next steps or improvements
3. Use bullet lists for clarity.
4. When appropriate, include simple ASCII wireframes or visual descriptions.
5. Generate production-ready code or CSS (unless explicitly asked).

## Example Prompts That Trigger This Skill

- “Evaluate this design for usability and accessibility.”
- “Provide a UI layout plan for a responsive dashboard.”
- “Review these requirements and suggest a fluid design approach.”
- “What UI/UX principles should guide this signup form design?”

## Non-Goals

Do not do the following under this skill:

- Make arbitrary aesthetic choices without justification.
- Assume implementation details — if unknown, ask for clarification.

---
