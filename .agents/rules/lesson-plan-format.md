---
description: "Standardizes the format for all generated lesson plans to use a Detailed Lesson Plan (Teacher's POV) with the 4 E's framework, interactive dialogue, clear spacing, and image indicators."
---

# Lesson Plan Generation Rules

Whenever the user asks to generate, create, or enhance a lesson plan, you MUST strictly follow these formatting and stylistic guidelines:

1. **Format as a Detailed Lesson Plan (DLP):**
   - The lesson plan must be written from the "Teacher's Point of View".
   - NEVER output a "wall of text" or narrative paragraphs (e.g., avoid "Ipinakita ko ang larawan...").
   - Instead, use an explicit, direct script/dialogue format alternating between the Teacher and the Students (e.g., **Guro:** [exact dialogue] / **Mga Mag-aaral:** [exact response]).
   - **Crucial:** Use proper spacing (blank lines) between speaker turns for readability. Do not cram text together.

2. **Use the 4 E's Framework for Procedure (Daloy ng Aralin):**
   - Under section "III. Pamamaraan (Daloy ng Aralin)", you MUST structure the flow using the 4 E's with clear letter indicators:
     - **A. Engage (Pagganyak / Motivation)**
     - **B. Explore (Paglalahad / Presentation)**
     - **C. Experience (Pagtalakay / Discussion)**
     - **D. Empathize (Paglalapat / Application)**

3. **Interactive & Scaffolding Flow:**
   - The teacher's script must include interactive questioning, probing, and checks for understanding.
   - Include realistic student responses and appropriate teacher feedback.

4. **Optional Image Indicators:**
   - Embed clear, distinct tags whenever a visual aid, presentation slide, or picture should be shown.
   - Use the exact format: `[OPTIONAL IMAGE INDICATOR: <description of the image/visual aid>]`
   - Place these indicators naturally on their own line.

5. **Language & Standard Parts:**
   - Use Tagalog/Filipino unless specified otherwise, keeping a professional and engaging classroom tone.
   - Standard Outline:
     - I. Layunin (Objectives)
     - II. Paksang Aralin (Subject Matter)
     - III. Pamamaraan (Daloy ng Aralin) -> [Must use the 4 E's here]
     - IV. Pagtataya (Evaluation)
     - V. Takdang Aralin (Assignment)
