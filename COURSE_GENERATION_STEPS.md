# Course Generation Steps - Complete Workflow

## Overview

Here's the complete breakdown of steps to generate a full course with all information.

---

## Total Steps: **2 Main Steps** (+ 1 per topic)

### Step 1: Create Course
**Action:** User creates a course
- Enter course title
- Enter course goal
- Enter target timeline
- (Optional) Upload course outline (PDF/TXT/MD)

**AI Agent Used:** None (manual input)

**What's Created:**
- Course record in database
- Course status: `draft`

---

### Step 2: Generate Course Structure
**Action:** Click "Generate Course Structure" button

**AI Agent Used:** 📚 **Course Structure Agent**

**What It Does:**
- Analyzes course title, goal, timeline, and outline (if provided)
- Breaks down course into **Modules**
- Breaks down each module into **Topics**

**What's Created:**
- Multiple Module records
- Multiple Topic records (one per topic)
- Course status: `ready`

**API Keys Needed:**
- Course Structure Agent → OpenAI Key OR Gemini Key (or both for fallback)

**Example Output:**
```
Course: "Web Development Fundamentals"
├── Module 1: HTML & CSS Basics
│   ├── Topic 1: Introduction to HTML
│   ├── Topic 2: CSS Styling
│   └── Topic 3: Responsive Design
├── Module 2: JavaScript Basics
│   ├── Topic 1: Variables and Data Types
│   └── Topic 2: Functions and Control Flow
└── Module 3: Advanced Topics
    └── Topic 1: APIs and Async Programming
```

---

### Step 3: Generate Topic Content (Per Topic)
**Action:** Click "Generate Topic Content" on each topic

**AI Agent Used:** ✍️ **Content Generation Agent**

**What It Does:**
- Generates **4 types of content** in parallel:
  1. **Lecture Notes** - Detailed educational content
  2. **Tutorial Exercises** - Practice questions with answers
  3. **Practical Tasks** - Hands-on step-by-step tasks
  4. **Quiz** - MCQ and short answer questions with explanations

**What's Created:**
- Lecture notes (markdown format)
- Tutorial exercises array (questions + answers)
- Practical tasks array (title, description, steps)
- Quiz object (MCQ questions + short answer questions)

**API Keys Needed:**
- Content Generation Agent → OpenAI Key OR Gemini Key (or both for fallback)

**Topic Status:** Changes from `pending` → `ready`

---

## Complete Workflow Example

### Scenario: Course with 3 Modules, 5 Topics Total

**Step 1:** Create Course
- ✅ Course created
- Status: `draft`

**Step 2:** Generate Course Structure
- ✅ 3 Modules created
- ✅ 5 Topics created
- Status: `ready`

**Step 3:** Generate Content for Topic 1
- ✅ Lecture notes generated
- ✅ Tutorial exercises generated
- ✅ Practical tasks generated
- ✅ Quiz generated

**Step 4:** Generate Content for Topic 2
- ✅ All content generated

**Step 5:** Generate Content for Topic 3
- ✅ All content generated

**Step 6:** Generate Content for Topic 4
- ✅ All content generated

**Step 7:** Generate Content for Topic 5
- ✅ All content generated

**Total Steps:** 1 (create) + 1 (structure) + 5 (topics) = **7 steps**

---

## Step-by-Step Summary

| Step | Action | AI Agent | What's Generated | API Keys Needed |
|------|--------|----------|------------------|-----------------|
| 1 | Create Course | None | Course record | None |
| 2 | Generate Structure | Course Structure Agent | Modules + Topics | Course Structure Agent keys |
| 3+ | Generate Topic Content | Content Generation Agent | Lecture notes, Exercises, Tasks, Quiz | Content Generation Agent keys |

**Note:** Step 3+ is repeated for each topic in your course.

---

## API Key Requirements

### Minimum Setup (One Provider)
- **Course Structure Agent:** OpenAI key OR Gemini key
- **Content Generation Agent:** OpenAI key OR Gemini key

### Recommended Setup (Both Providers)
- **Course Structure Agent:** OpenAI key + Gemini key (for fallback)
- **Content Generation Agent:** OpenAI key + Gemini key (for fallback)

### Best Practice Setup
- Use **separate API keys** for each agent
- Set **both OpenAI and Gemini** for redundancy
- Use **Auto provider preference** for automatic fallback

---

## Time Estimates

| Step | Estimated Time |
|------|----------------|
| Create Course | 1-2 minutes (manual) |
| Generate Structure | 30-60 seconds (AI) |
| Generate Topic Content (per topic) | 30-90 seconds (AI) |

**Example:** Course with 5 topics
- Total time: ~5-10 minutes
- Most time is waiting for AI generation

---

## What Gets Generated in Each Step

### Step 2: Course Structure
```
✅ Module 1: "Introduction"
   ✅ Topic 1: "Getting Started"
   ✅ Topic 2: "Basic Concepts"
✅ Module 2: "Advanced Topics"
   ✅ Topic 3: "Advanced Concepts"
```

### Step 3: Topic Content (for each topic)
```
✅ Lecture Notes (detailed markdown content)
✅ Tutorial Exercises (3-5 exercises with answers)
✅ Practical Tasks (2-4 tasks with step-by-step instructions)
✅ Quiz (5-7 MCQ + 2-3 short answer questions with explanations)
```

---

## Progress Tracking

The system tracks:
- ✅ Course creation
- ✅ Structure generation
- ✅ Topic content generation (per topic)
- ✅ Learning progress (completion, quiz scores)

---

## Quick Reference

**2 Main AI Steps:**
1. **Course Structure Agent** - Creates modules and topics (1 time per course)
2. **Content Generation Agent** - Creates content for each topic (1 time per topic)

**Total Steps Formula:**
```
1 (create course) + 1 (generate structure) + N (generate content for each topic)
= 2 + N steps
```

Where N = number of topics in your course.

---

## Example Calculations

| Course Size | Modules | Topics | Total Steps |
|-------------|---------|--------|-------------|
| Small | 2 | 4 | 6 steps |
| Medium | 3 | 8 | 10 steps |
| Large | 5 | 15 | 17 steps |

---

**Ready to generate your course?** Start with Step 1! 🚀

