---
title: "GroceryFarm — shared lists, no sign-up needed"
date: "2026-03-13"
description: "A no-friction collaborative grocery list app built with Next.js and Supabase. Share a link, start adding items."
tags: ["project", "nextjs", "supabase"]
---

Grocery lists are a solved problem on paper. The trouble starts when you're trying to coordinate with someone else — you send a text, they forget, you both buy milk. Every "solution" I found online wanted me to create an account before I could write down eggs.

So I built [GroceryFarm](https://groceryfarm.vercel.app/) — a shared grocery list that skips all of that.

## What it does

You open the app, a list is created for you, and you get a unique URL. Share that URL with anyone and they can view and edit the same list in real time. No accounts, no passwords, no friction. Just a link and a list.

It's designed for households — the kind of casual, low-stakes collaboration that shouldn't require onboarding.

## How it's built

- **Next.js + TypeScript** for the frontend
- **Supabase** for the database and real-time sync
- **Tailwind CSS** for styling
- Deployed on **Vercel**

Supabase handles the real-time piece cleanly — when one person adds an item, it shows up for everyone with the link immediately, no polling required.

## The goal

Keep it simple. The entire value of the app is that it gets out of your way. No features for the sake of features — just a list that works.

[View the live app →](https://groceryfarm.vercel.app/) · [GitHub →](https://github.com/chaishah/groceryfarm)
