---
title: "Optimise Leave: squeeze the most out of your time off"
date: "2026-03-13"
description: "A tool that figures out the longest continuous break you can take by combining public holidays, weekends, and your leave days."
tags: ["project", "react", "tools"]
---

At some point I found myself staring at a calendar trying to figure out the best time to take leave - which days would stretch a long weekend into something actually worth taking. It's not hard maths, but it's tedious. So I automated it.

[Optimise Leave](https://optimise-leave.vercel.app/) finds the longest continuous break you can get from a given number of leave days, accounting for public holidays and weekends in your country.

## What it does

You give it three things:

- Your **location** (country and subdivision for local holiday data)
- How many **leave days** you have
- A rough **start date** to search from

It then works out the optimal window: the stretch of days where your leave days do the most work, bridging gaps between weekends and public holidays to maximise continuous time off.

The result is an interactive calendar showing exactly which days are holidays, weekends, and your allocated leave, so you can see the full picture at a glance.

## How it's built

- **React + Vite** for the frontend
- **Tailwind CSS** for styling
- Holiday data stored as **CSV files** per country/year in `public/data/` - easy to extend
- Deployed on **Vercel**

Keeping the holiday data as flat CSV files was a deliberate choice. No API calls, no external dependency - just data that ships with the app and is simple to update or expand to new regions.

## Why I made it

I wanted a tool that answered a specific question: "If I have 5 days of leave, when should I take them?" This does exactly that, nothing more.

[Try it](https://optimise-leave.vercel.app/) · [GitHub](https://github.com/chaishah/Optimise-leave)
