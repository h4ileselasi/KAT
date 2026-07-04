/* Mock content for the frontend shell. In pass 2 this is replaced by
   Supabase queries — the shapes here mirror the eventual DB tables so the
   swap is mechanical. Images use Unsplash source URLs as placeholders. */

export const liveStatus = {
  isLive: true,
  title: "Sunday Holy Mass — 9:00 AM",
  subtitle: "Celebrant: Fr. Emmanuel Okoye",
  viewers: 342,
  // A real embed URL goes here (YouTube/Mux). Placeholder for the shell.
  embedUrl: "https://www.youtube-nocookie.com/embed/live_stream?channel=UC",
  poster:
    "https://images.unsplash.com/photo-1438032005730-c779502df39b?w=900&q=70&auto=format&fit=crop",
  nextServiceAt: "2026-07-05T09:00:00Z",
};

export const announcements = [
  {
    id: "a1",
    title: "Feast of St. Catherine — Novena Begins",
    body: "Join us for nine evenings of prayer starting Monday at 6:00 PM in the main sanctuary. All are welcome.",
    image:
      "https://images.unsplash.com/photo-1544427920-c49ccfb85579?w=900&q=70&auto=format&fit=crop",
    timestamp: "2h ago",
    pinned: true,
  },
  {
    id: "a2",
    title: "Youth Choir Auditions",
    body: "Calling all voices! Auditions this Saturday after the 8 AM Mass. Bring your joy.",
    image: null,
    timestamp: "1d ago",
    pinned: false,
  },
  {
    id: "a3",
    title: "Harvest Thanksgiving — Save the Date",
    body: "Our annual Harvest is set for the last Sunday of the month. Pledge cards available at the parish office.",
    image:
      "https://images.unsplash.com/photo-1509909756405-be0199881695?w=900&q=70&auto=format&fit=crop",
    timestamp: "2d ago",
    pinned: false,
  },
];

export const events = [
  {
    id: "e1",
    title: "Adoration & Benediction",
    day: "Fri",
    date: "Jul 4",
    time: "5:00 PM",
    location: "Blessed Sacrament Chapel",
    image:
      "https://images.unsplash.com/photo-1520442978779-b5e2c3b0e0a3?w=900&q=70&auto=format&fit=crop",
  },
  {
    id: "e2",
    title: "Parish Family Picnic",
    day: "Sat",
    date: "Jul 12",
    time: "12:00 PM",
    location: "Church Grounds",
    image:
      "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=900&q=70&auto=format&fit=crop",
  },
  {
    id: "e3",
    title: "Catechism Classes Resume",
    day: "Sun",
    date: "Jul 13",
    time: "10:30 AM",
    location: "Parish Hall",
    image: null,
  },
];

export const prayers = [
  {
    id: "p1",
    intention: "For my mother's healing and speedy recovery. May God's mercy surround her.",
    name: "Anonymous",
    timestamp: "12m ago",
    candles: 24,
  },
  {
    id: "p2",
    intention: "Thanksgiving for a successful surgery. God is faithful. 🙏",
    name: "A grateful parishioner",
    timestamp: "48m ago",
    candles: 57,
  },
  {
    id: "p3",
    intention: "For my son writing his final exams this week — wisdom and calm.",
    name: "Anonymous",
    timestamp: "3h ago",
    candles: 41,
  },
  {
    id: "p4",
    intention: "For peace in our community and protection over every family.",
    name: "Anonymous",
    timestamp: "5h ago",
    candles: 88,
  },
];

export const products = [
  {
    id: "s1",
    name: "St. Catherine Rosary (Blessed)",
    price: 45,
    image:
      "https://images.unsplash.com/photo-1543348750-466b55f32f16?w=700&q=70&auto=format&fit=crop",
    tag: "Bestseller",
  },
  {
    id: "s2",
    name: "Parish Anniversary Tee",
    price: 80,
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=700&q=70&auto=format&fit=crop",
    tag: null,
  },
  {
    id: "s3",
    name: "Devotional Candle Set",
    price: 30,
    image:
      "https://images.unsplash.com/photo-1602874801007-bd458bb1b8b6?w=700&q=70&auto=format&fit=crop",
    tag: null,
  },
  {
    id: "s4",
    name: "Holy Water Bottle",
    price: 15,
    image:
      "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=700&q=70&auto=format&fit=crop",
    tag: "New",
  },
];

export const gallery = [
  "https://images.unsplash.com/photo-1438032005730-c779502df39b?w=500&q=70&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1507692049790-de58290a4334?w=500&q=70&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1544427920-c49ccfb85579?w=500&q=70&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1519491050282-cf00c82424b4?w=500&q=70&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1509909756405-be0199881695?w=500&q=70&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1524230572899-a752b3835840?w=500&q=70&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1520442978779-b5e2c3b0e0a3?w=500&q=70&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=500&q=70&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1548625149-fc4a29cf7092?w=500&q=70&auto=format&fit=crop",
];

export const verseOfDay = {
  text: "Come to me, all you who are weary and burdened, and I will give you rest.",
  ref: "Matthew 11:28",
};

export const donationFunds = ["Tithe", "Offering", "Building Fund", "Missions & Charity"];
