# SWAM Platform Architecture

## Entity Glossary & Forbidden Overlap Matrix

### Strict Definitions

| Entity | Definition | Is NOT |
|--------|-----------|--------|
| **Destination** | Top-level travel geography (Zanzibar, Dar es Salaam) | ActivityType, Theme, Host |
| **Area** | Sub-location within Destination (Paje, Nungwi, Stone Town) | Product, Theme, Host |
| **POI** | Named place/attraction/landmark (Kuza Cave, Paje Beach) | ActivityType, Host, auto-public page |
| **ActivityType** | Normalized global activity category (snorkelling, safari) | Location, Product, Theme |
| **Product** | Canonical public thing-to-do page (Snorkelling in Paje) | Option, ActivityType |
| **Option** | Selectable variant under Product (Group, Private, Luxury) | Product, PriceOption |
| **PriceOption** | Price-bearing child under Option (Adult $20, Child $10) | Theme, Product |
| **Host** | Supply-side provider/seller (mapped from creators) | Traveler |
| **Traveler** | Demand-side user identity | Host, not public by default |
| **Theme** | Discoverability attribute (romantic, eco-friendly) | Tier, FormatType |
| **Tier** | Commercial classification (basic, standard, premium) | Theme, FormatType |
| **FormatType** | Delivery style (private, shared, self-guided) | Theme, Tier |
| **Collection** | Curated grouping of entities | Filter state |
| **Itinerary** | Planning object with ordered items across time | Product, Theme page |
| **Event** | Dated occurrence | Future-facing, controlled |

### Forbidden Overlap Matrix
- ActivityType ≠ Product
- Product ≠ Option
- Option ≠ PriceOption
- Theme ≠ Tier ≠ FormatType
- POI ≠ ActivityType ≠ Host
- Traveler ≠ Host
- Collection ≠ Filter state
- Destination ≠ Area ≠ POI
- Creator ≠ Host unless explicitly mapped

---

## Architecture Layers

### A. Public Discovery Layer
- Destination pages (`/{destination}`)
- Area pages (`/{destination}/{area}`)
- Product pages (`/things-to-do/{destination}/{area}/{activityType}`)
- Itinerary pages (`/itineraries/{slug}`)
- Host pages (`/hosts/{slug}`)
- Collection pages (`/collections/{slug}`)
- Map hub (`/explore/map`, `/{destination}/map`)

### B. Operational Commerce Layer
- Product → Option → PriceOption hierarchy
- Host operational data
- AvailabilitySnapshot (future)
- BookingIntent tracking
- MediaAsset management
- Review/ReviewAggregate system

### C. Graph / Relationship Layer
- Entity relationships via junction tables
- product_pois, product_themes, product_hosts, product_destinations
- Behavioral graph via interaction_events
- Internal linking scored by graph proximity

### D. Measurement & Governance Layer
- canonical_decisions: URL ownership
- entity_slug_history: slug change tracking
- entity_merges: dedup decisions
- moderation_actions: content governance
- publish_validation_results: publish scoring
- schema_generation_logs: JSON-LD tracking
- search_performance_snapshots: GSC data
- crawl_observations: crawler monitoring
- feed_issue_logs: distribution issues
- entity_funnel_metrics: conversion tracking

---

## Field Ownership Matrix

| Field | Authoritative Layer | Table |
|-------|-------------------|-------|
| canonical_url | Governance | canonical_decisions |
| is_indexable | Governance | canonical_decisions |
| price/amount | Commerce | price_options |
| option variants | Commerce | options |
| related products | Graph | product_pois, product_themes |
| page title | Product + Governance | products.title |
| schema payload | Governance | schema_generation_logs |
| publish_score | Governance | publish_validation_results |
| like_count | Product (denormalized) | products.like_count |
| view_count | Product (denormalized) | products.view_count |
| rating | Commerce (aggregated) | review_aggregates |
| slug | Product (versioned) | products.slug + entity_slug_history |

---

## Route System & Priority

### Route Classes (Priority Order)
1. **Product page** `/things-to-do/{destination}/{area}/{slug}` — highest
2. **Destination hub** `/things-to-do/{destination}` or `/{destination}`
3. **Itinerary** `/itineraries/{slug}`
4. **Collection** `/collections/{slug}`
5. **Host** `/hosts/{slug}`
6. **Theme page** `/things-to-do/{destination}/{theme}` — only when justified
7. **POI page** — only when is_public_page=true

### URL Conflict Resolution
1. Product slugs must be unique globally
2. Area slugs unique within destination
3. POI slugs unique within destination
4. Theme pages require canonical_decision with is_public_page=true
5. Filter states (query params) are NEVER indexable
6. All canonical URLs are self-referencing

### Legacy Route Compatibility
| Old Route | New Route | Handling |
|-----------|-----------|----------|
| `/experiences/:slug` | `/things-to-do/:dest/:area/:slug` | 301 redirect via middleware |
| `/experience/:id` | Product page | 301 redirect |
| `/hosts/:username` | `/hosts/:slug` | Keep working |
| `/itineraries/:slug` | `/itineraries/:slug` | No change |
| `/collections/:slug` | `/collections/:slug` | No change |

---

## Current Table → New Architecture Mapping

| Current Table | Decision | New Table(s) | Migration |
|--------------|----------|-------------|-----------|
| cities | KEEP + WRAP | destinations (new, links via legacy_city_id) | Backfill destinations from cities |
| categories | KEEP + WRAP | activity_types (new, links via legacy_category_id) | Backfill activity_types from categories |
| experiences | KEEP (compat) | products, options, price_options | Backfill products from experiences |
| creators | KEEP (compat) | hosts (new, links via legacy_creator_id) | Backfill hosts from creators |
| creator_categories | KEEP | Also map via host→activity_type | No change needed |
| collections | KEEP | No change | Already compatible |
| collection_items | KEEP | No change | Already compatible |
| collection_experiences | KEEP | No change | Already compatible |
| public_itineraries | KEEP | Enhanced with itinerary_days/items | Optional backfill |
| itineraries | KEEP | Enhanced with itinerary_days/items | Optional backfill |
| itinerary_experiences | KEEP | Also populate itinerary_items | Backfill |
| experience_photos | KEEP | Also populate media_assets | Backfill |
| experience_faqs | KEEP | No change | Already works |
| user_likes | KEEP | Also populate interaction_events | Event mirroring |
| user_roles | KEEP | No change | Already works |
| profiles | KEEP | Also backfill travellers | Link via user_id |

---

## Page Template Contracts

### Product Page
- **Purpose**: Primary discovery/booking page for a thing-to-do
- **Target Intents**: search, transactional, agentic
- **Required Modules**: title, gallery, description, options+prices, host cards, location map, social proof, FAQ
- **Required Data**: product, ≥1 option, ≥1 host, destination, activity_type
- **Schema Types**: TouristAttraction, Product (with Offer)
- **Publish Requirements**: title, description, ≥1 image, ≥1 option with price, location

### Destination Page
- **Purpose**: Hub for all things-to-do in a destination
- **Target Intents**: browse, search
- **Required Modules**: hero, area grid, activity type grid, top products, collections, map
- **Schema Types**: TouristDestination, ItemList
- **Publish Requirements**: name, description, ≥5 active products

### Host Page
- **Purpose**: Provider profile and trust page
- **Target Intents**: browse, social
- **Required Modules**: profile, products, itineraries, reviews, contact
- **Schema Types**: LocalBusiness
- **Publish Requirements**: display_name, ≥1 active product

### Itinerary Page
- **Purpose**: Curated multi-day plan
- **Target Intents**: planning, social
- **Required Modules**: hero, day-by-day, products list, map, social proof
- **Schema Types**: ItemList, TouristTrip
- **Publish Requirements**: name, ≥3 products

---

## Analytics Event Model

### Core Events
| Event | Entity | Payload |
|-------|--------|---------|
| page_view | any | entity_type, entity_id, source |
| product_impression | product | product_id, position, surface |
| product_click | product | product_id, source_surface |
| option_view | option | product_id, option_id |
| price_view | price_option | product_id, option_id, price_option_id |
| save_to_itinerary | product | product_id, itinerary_id |
| like | product/itinerary | entity_type, entity_id |
| share | any | entity_type, entity_id, channel |
| booking_intent | product | product_id, option_id, intent_type |
| search | - | query, filters, result_count |
| map_interaction | - | action, viewport, entities_visible |
| host_contact | host | host_id, channel |

### Identity Model
- Anonymous: session_id only
- Logged-in: user_id + session_id
- Traveler: user_id linked to travellers table
- Agent: future agent_request_id

---

## Sync Architecture

### Write Authority: Postgres/Supabase
All entity CRUD goes through Supabase. No other system writes canonical data.

### Read Models
1. **Frontend cache**: React Query with 5min stale time
2. **Search index**: Future Typesense/Meilisearch, synced via DB webhooks
3. **Feed exports**: Edge functions reading from products/options/price_options
4. **Schema service**: Edge function generating JSON-LD from source tables

### Sync Jobs
- `sync_jobs` table tracks all batch operations
- Event-driven sync via Supabase realtime for critical paths
- Batch reconciliation jobs for feed/search/schema

---

## Tracer Bullet: Zanzibar → Paje → Snorkelling

### Entities Created
1. Country: Tanzania (TZ)
2. Destination: Zanzibar (slug: zanzibar)
3. Area: Paje (slug: paje, under zanzibar)
4. ActivityType: Snorkelling (slug: snorkelling)
5. Product: Snorkelling in Paje (slug: snorkelling-in-paje)
6. Option: Group Snorkelling, Private Snorkelling
7. PriceOption: Adult $25, Child $15 (group); Adult $80 (private)
8. Host: (from existing creator data)
9. Theme: family-friendly, eco-friendly

### Validation Checklist
- [ ] Product page renders with all modules
- [ ] Options and prices display correctly
- [ ] Host attribution works
- [ ] JSON-LD schema generates correctly
- [ ] Canonical URL is self-referencing
- [ ] Like/save interactions work
- [ ] Map plots the product
- [ ] Internal links to related products exist
- [ ] Destination hub shows the product
- [ ] Sitemap includes the URL
