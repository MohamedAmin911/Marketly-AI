import type { Metric } from "@/types/common";

export const dashboardMetrics: Metric[] = [
  { label: "Total Projects", value: "1,204", delta: "+12.5% vs last month", tone: "success" },
  { label: "Avg. Campaign CTR", value: "4.8%", delta: "+40.6% vs last month", tone: "success" },
  { label: "Est. Revenue Impact", value: "$84.2k", delta: "84% monthly goal", tone: "neutral" },
];

export const trendData = [
  { name: "Mon", value: 2200, conversions: 180 },
  { name: "Tue", value: 3600, conversions: 280 },
  { name: "Wed", value: 3400, conversions: 240 },
  { name: "Thu", value: 4800, conversions: 330 },
  { name: "Fri", value: 6400, conversions: 260 },
  { name: "Sat", value: 8200, conversions: 380 },
  { name: "Sun", value: 7900, conversions: 440 },
];

export const recentGenerations = [
  { title: "Cyberpunk Cityscape Asset", type: "Image", color: "from-cyan-500/40 to-fuchsia-500/40" },
  { title: "Data Center B-Roll", type: "Video", color: "from-indigo-500/40 to-slate-100/20" },
  { title: "Premium Brand Gradient", type: "Creative", color: "from-violet-400/50 to-amber-300/30" },
];

export const generatedImages = [
  { title: "Neon Product Hero", tag: "Square", color: "from-cyan-400/60 via-blue-500/30 to-pink-500/50" },
  { title: "Glass Device Render", tag: "Landscape", color: "from-sky-500/50 via-violet-500/30 to-rose-500/40" },
  { title: "Launch Banner", tag: "Social", color: "from-fuchsia-500/40 via-cyan-300/30 to-violet-500/60" },
  { title: "Premium Macro Shot", tag: "Ad", color: "from-emerald-300/30 via-cyan-500/30 to-purple-500/50" },
];

export const storyboardScenes = [
  ["The Foundation", "Slow dolly push through abstract, luminescent data monoliths representing the core infrastructure."],
  ["Command Center", "Glassmorphic panels illuminate the operator face with precision light and focused controls."],
  ["Data Precision", "Extreme close up on a live analytics chart. Nodes connect with sharp neon glowing lines."],
  ["Algorithmic Velocity", "Particles stream past the camera in an abstract tunnel to visualize AI speed."],
  ["Audience Lock", "Persona cards snap into place as segments and needs are matched to the offer."],
  ["Creative Burst", "Dozens of campaign variants bloom into a controlled neon grid."],
  ["Budget Shift", "Spend reallocates between channels while underperforming lines fade back."],
  ["Market Signal", "A competitor alert rises above the stream and becomes a recommendation."],
  ["Launch Moment", "The final campaign deploys, with metrics pulsing across the command surface."],
];

export const campaignAds = [
  {
    title: "Silence the noise. Amplify your code.",
    caption: "Meet the stealth-switch mechanical keyboard built for late-night deploys. Type faster, annoy no one.",
    type: "Asset",
    color: "from-slate-100/10 to-cyan-400/30",
  },
  {
    title: "Hear the difference. Actually, don't.",
    caption: "Engineered for tactile feedback without the acoustic footprint. Your open-office neighbors will thank you.",
    type: "Reel",
    color: "from-cyan-500/30 to-rose-400/40",
  },
  {
    title: "Flow state achieved. Distractions eliminated.",
    caption: "Upgrade your setup with the tool designed for deep work. Pre-order now and get an exclusive keycap set.",
    type: "Carousel",
    color: "from-blue-600/30 to-amber-300/20",
  },
];

export const analyticsRows = [
  ["Q4 Holiday Push", "Active", "$12,450", "3,204"],
  ["Creator Retargeting", "Draft", "$8,920", "2,118"],
  ["Launch Sequence 03", "Paused", "$6,180", "1,672"],
];

export const trafficSources = [
  ["Organic Search", 45],
  ["Direct", 30],
  ["Social Media", 15],
  ["Referral", 10],
];
