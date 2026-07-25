# MynStyle AI
**Full System Workflow**  
*Myntra Hackathon: Theme 1 (Bharat-First Fashion) + Theme 2 (Speed & Trust)*

---
* 🎥 **Demo Video:** <a href="https://drive.google.com/drive/folders/1TISvE7XfBqzzhcuJxt9G3Blo9nAlLIrE?usp=sharing"><img width="736" height="736" alt="Watch the MynStyle AI Demo" src="https://github.com/user-attachments/assets/f5481693-a1c2-403c-a28f-83d72ea9e3a2" /></a>
* 📄 **SRS Document:** [View Software Requirements Specification](https://drive.google.com/file/d/1YFx3p-JkFuNYW_3DRBNECPuy1TD6LaD8/view?usp=sharing)
## 📖 Table of Contents
1. [System Overview](#-system-overview)
2. [Complete System Architecture](#-complete-system-architecture)
3. [User Roles & Entry Points](#-user-roles--entry-points)
4. [Full User Workflow](#-full-user-workflow)
5. [Intelligence Layer](#-intelligence-layer)
6. [Database Schema](#-database-schema)
7. [Hackathon Evaluation Framework](#-hackathon-evaluation-framework)
8. [Competitive Advantages](#-competitive-advantages)
9. [DEMO and Documentation ( SRS ) ](#DEMOS)

---

## 🚀 System Overview

**MynStyle AI** is a full-stack fashion-commerce intelligence platform built on a **Node.js/Express** backend with a **PostgreSQL database** (via Prisma ORM) and a **React/Vite** frontend. 

Its core thesis is that Tier-2 and Tier-3 India has distinct fashion demand patterns that metros-first platforms systematically ignore — and that intelligently matching local supply to contextually-aware demand is the unlock.

---

## 🏗 Complete System Architecture

```text
┌──────────────────────────────────────────────────────────┐
│                    REACT FRONTEND (Vite)                 │
│  /login  /register  /  /search  /profile  /seller  /admin│
└──────────────┬───────────────────────────────────────────┘
               │ REST API (JWT Auth)
┌──────────────▼───────────────────────────────────────────┐
│               EXPRESS BACKEND (Node.js)                  │
│                                                          │
│  ┌───────────────┐  ┌─────────────────┐                  │
│  │ Search Intel  │  │  Shelf Builder  │                  │
│  │ (LLM: Gemma)  │  │  (Bayesian)     │                  │
│  └───────────────┘  └─────────────────┘                  │
│  ┌───────────────┐  ┌─────────────────┐  ┌────────────┐  │
│  │ Enrichment    │  │  Context Engine │  │ Weather    │  │
│  │ (Rule-based)  │  │  (Climate/Fest) │  │ (Live API) │  │
│  └───────────────┘  └─────────────────┘  └────────────┘  │
└──────────────┬───────────────────────────────────────────┘
               │ Prisma ORM
┌──────────────▼───────────────────────────────────────────┐
│                  PostgreSQL Database                     │
│  Users · Products · Purchases · Reviews · SearchQueries  │
│  CategoryRequests · CityContext · SellerWarnings         │
└──────────────────────────────────────────────────────────┘
               │ External APIs
        ┌──────┴──────────────────────┐
        │  OpenRouter (Gemma 4 LLM)   |
        | groq ( llama3-70b-8192)     │
        │  Open-Meteo (Live Weather)  │
        │  Nominatim (Geocoding)      │
        │  PostalPincode API          │
        │  Cloudinary (Image Storage) │
        └─────────────────────────────┘
```

## 👥 User Roles & Entry Points

| Role | Entry | Key Actions |
| :--- | :--- | :--- |
| **Customer** | `/register` → `/` | Browse shelves, search, buy, review |
| **Seller** | `/register` (SELLER role) | List products, view market insights, request categories |
| **Admin** | Auto-seeded from `.env` → `/admin` | Approve/reject products, warn/block sellers, view reviews |

---

## 🛤 Full User Workflow

### 1. Customer Journey
* **Onboarding:** `REGISTER` (city, state, gender, pincode) → `LOGIN` (JWT Token stored in sessionStorage)
* **Home (`/`):** Context built dynamically via Live Weather (Open-Meteo), Upcoming Festivals (`FESTIVALS_2026`), Gender, and Pincode.
* **Dynamic Shelves Rendered:**
  * 🏪 **Local Boutiques** (3-tier: city → district → state)
  * 🌡️ **Climate Comfort** (Hot/Cold/Rainy fabrics)
  * ✨ **Festival Shelf** (e.g. "Navratri in 12 days")
  * 🔥 **Trending in [State]** (purchase signal aggregation)
  * ⭐ **Verified Picks** (Bayesian + recency-decayed ratings)
  * 💰 **Under ₹[budget]** (budget slider: ₹200–₹10,000)
* **Search:** Text/mic input → LLM structuring → Synonym mapping → Office intent detection.
* **Conversion:** Product Card → Checkout Modal → Stock decrements atomically (Prisma).
* **Post-Purchase:** Profile → My Purchases → Leave Review (Verified-purchase-only checks).

### 2. Seller Journey
* **Onboarding:** `REGISTER` (SELLER role + GST, business name, years in business)
* **Market Intelligence Tab:** Top searched categories, Gap Score (searchVolume/supplyCount), Top specific search phrases.
* **Product Upload:** Cloudinary image upload (up to 5) → Rule-based + LLM (Gemma) enrichment → Admin approval queue.
* **Management:** Track products, request new categories, view analytics (14-day trends, low stock), and monitor feedback/warnings.

### 3. Admin Journey
* **Dashboard (`/admin`):** Approve/Reject pending products.
* **Seller Management:** Monitor complaint ratios, warn (>20% complaints), block (>40% complaints).
* **Data Management:** View global reviews and export global purchase data to CSV.

---

## Intelligence Layer

### 1. Search Intelligence
* **LLM:** Google Gemma 4 (26B) via OpenRouter (free tier).
* **Extraction:** Extracts category, type, colour, material, gender, occasion, budget, occupation, exclusions via Zod schema.
* **Processing:** Synonym map (cheera→saree), plural normalization, and safe fallbacks to prevent crashes.

### 2. Bayesian Rating Engine
* **Formula:** `score = (v/(v+m))*R + (m/(v+m))*C` (R = avg rating, v = num reviews, C = category mean, m = 25th percentile vote count).
* **Features:** Per-category stats to avoid bias, discovery slots for new products, and 180-day recency decay.

### 3. Local Seller Discovery (3-Tier)
* **Tier 1:** Exact City
* **Tier 2:** Pincode District (first 3 digits)
* **Tier 3:** State

### 4. Context Engine & Enrichment
* **Context:** Maps city to Live Weather (Open-Meteo) and State to Festival Calendar (`FESTIVALS_2026`).
* **Rule-based Enrichment:** Extracts macro categories, materials, and price segments from product names.
* **LLM Enrichment:** Context-aware product tagging using Gemma 4.

---

## 🗄 Database Schema

| Table | Key Fields for Bharat Intelligence |
| :--- | :--- |
| **User** | `city`, `state`, `pincode`, `gender`, `businessType` |
| **Product** | `city`, `state`, `pincode`, `climate`, `occasion`, `ethnic_style`, `price_segment`, `season`, `source` |
| **SearchQuery** | `rawQuery`, `category`, `occasion`, `budget`, `city`, `state` |
| **Purchase** | `cityName`, `stateName`, `priceAtPurchase` |
| **CategoryRequest**| `categoryName`, `gender`, `isSeasonal`, `origin` |
| **CityContext** | `climate`, `activeFestival`, `preferredTags` |

---

## 🏆 Hackathon Evaluation Framework

### THEME 1: Getting Bharat In + Right Shelf + Scaling Sellers

| Problem Statement | Implementation | Strength (1–5) |
| :--- | :--- | :--- |
| Shelf misaligned with T2/T3 needs | Budget slider + city-aware shelves | ⭐⭐⭐⭐ |
| Regional catalog gaps | Gap Score (demand/supply ratio per state) | ⭐⭐⭐⭐⭐ |
| Local sellers invisible | 3-tier city→district→state discovery | ⭐⭐⭐⭐⭐ |
| Seller tools missing | Market intelligence dashboard | ⭐⭐⭐⭐ |
| Seller quality control | Complaint ratio → warn/block pipeline | ⭐⭐⭐⭐ |
| Regional language search | Synonym map (cheera, cheeralu, sari) | ⭐⭐⭐ |
| Festival-aware product surface | State-specific festival calendar | ⭐⭐⭐⭐⭐ |

### THEME 2: Speed and Trust

| Trust Problem | Implementation | Strength (1–5) |
| :--- | :--- | :--- |
| "Will the product look as shown?" | Verified seller badge (complaint ratio) | ⭐⭐⭐⭐ |
| "Is it genuine?" | Admin approval gate for all seller products | ⭐⭐⭐⭐ |
| First-buyer trust signals | Review system with verified-purchase check | ⭐⭐⭐⭐⭐ |


## Advantages

* **End-to-End Vertical:** A fully functional, deployed multi-role platform, not just a mocked demo.
* **Real Demand Signals:** Real-time logging bridges the gap between local demand and seller supply insights.
* **Sound Bayesian Shelf:** Prevents both popularity and newness bias, ensuring a high-quality discovery experience.


