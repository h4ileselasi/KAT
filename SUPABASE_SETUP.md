# Supabase Setup for St. Catherine Church Platform

## Step 1: Create the Database Schema

1. Go to your Supabase project: https://supabase.com/dashboard/project/eicyjpsocponnwarmyaw
2. Click **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy the entire contents of `supabase/schema.sql` (in this folder)
5. Paste it into the SQL editor
6. Click **Run**

This creates 5 tables:
- `prayer_wall` — Mass intentions with candle reactions
- `announcements` — Parish news
- `events` — Upcoming events
- `products` — Store items
- `live_stream_config` — Live stream state (admin manages)

## Step 2: Create the Storage Bucket

1. Click **Storage** (left sidebar)
2. Click **Create a new bucket**
3. Name it: `images`
4. Make it **Public** (so images display without auth)
5. Click **Create bucket**

Done! The app will upload/fetch images from this bucket in Pass 3 (for now, mock images use Unsplash URLs).

## Step 3: Verify the Connection

The app will now:
- Fetch live data from Supabase (empty tables → blank lists until you add content)
- Fall back to empty lists if Supabase is down (graceful degradation)
- Keep the mock data **commented out** in `lib/mockData.js` for reference

## Step 4: Add Test Data (Optional)

To see the app populate with real data, add a test prayer:

1. Go to **Prayer Wall** in the app (http://localhost:3000/prayer)
2. Type an intention and click "Post intention"
3. You'll see it appear immediately (it's saved to Supabase)

Or add data via the Supabase UI:
1. Go to **Table Editor** → `prayers`
2. Click **Insert row** and fill in the fields

## Next: Admin Panel (Pass 3)

Once Supabase is wired, the next step is building the admin dashboard where you (as a priest/staff) can:
- Write announcements
- Schedule events
- Configure the live stream
- Manage store inventory
- Moderate the prayer wall

That's Pass 3. This Pass 2 just connects the public-facing app to the database.

---

**Questions?** The app logs errors to the browser console (F12 → Console tab). If something doesn't load, check there.
