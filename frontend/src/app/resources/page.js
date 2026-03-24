"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const FEATURED_RESOURCES = [
  {
    icon: "🛠️",
    title: "Self-Help Tools",
    description: "Worksheets and exercises for thought tracking, sleep hygiene, and study stress.",
    links: [
      { label: "CCI Self-Help", href: "https://www.cci.health.wa.gov.au/Resources/Looking-After-Yourself" },
      { label: "Get Self Help (CBT)", href: "https://www.getselfhelp.co.uk/" },
    ],
  },
  {
    icon: "📞",
    title: "Crisis & Support",
    description: "If you or someone else is in danger or experiencing a crisis, get help right now.",
    links: [
      { label: "988 Lifeline", href: "https://988lifeline.org/" },
      { label: "Crisis Text Line", href: "https://www.crisistextline.org/" },
    ],
  },
  {
    icon: "🧑‍🤝‍🧑",
    title: "Campus & Community",
    description: "Connect with peers and schedule time with a professional when you're ready.",
    links: [
      { label: "Learn More", href: "/about" },
      { label: "Community Forum", href: "/forum" },
    ],
  },
];

const WELLNESS_ARTICLES = [
  {
    icon: "🧠",
    title: "NIMH — Coping With Everyday Problems",
    description: "National Institute of Mental Health on recognizing and managing stress.",
    href: "https://www.nimh.nih.gov/health/publications/stress",
    readTime: "5 min read",
  },
  {
    icon: "📚",
    title: "APA — Topics: Stress",
    description: "American Psychological Association resources on stress and coping.",
    href: "https://www.apa.org/topics/stress",
    readTime: "8 min read",
  },
  {
    icon: "❤️",
    title: "NHS — Tips to Reduce Stress",
    description: "Practical, evidence-based tips from the UK National Health Service.",
    href: "https://www.nhs.uk/mental-health/self-help/guides-tools-and-activities/tips-to-reduce-stress/",
    readTime: "6 min read",
  },
  {
    icon: "🏥",
    title: "CDC — Learn About Mental Health",
    description: "Core concepts and links to further resources from the CDC.",
    href: "https://www.cdc.gov/mentalhealth/learn/index.htm",
    readTime: "10 min read",
  },
  {
    icon: "🛏️",
    title: "Sleep Foundation — Sleep Hygiene",
    description: "How better sleep supports mental wellbeing and performance.",
    href: "https://www.sleepfoundation.org/sleep-hygiene",
    readTime: "7 min read",
  },
];

const MEDITATIONS = [
  {
    title: "Peaceful Meditation — Spotify",
    description: "Gentle ambient tracks for calm and focus.",
    embed: "https://open.spotify.com/embed/playlist/37i9dQZF1DWZqd5JICZI0u?utm_source=generator",
    link: "https://open.spotify.com/playlist/37i9dQZF1DWZqd5JICZI0u",
  },
  {
    title: "Ambient Relaxation — Spotify",
    description: "Relax and unwind with chill, ambient music.",
    embed: "https://open.spotify.com/embed/playlist/37i9dQZF1DX3Ogo9pFvBkY?utm_source=generator",
    link: "https://open.spotify.com/playlist/37i9dQZF1DX3Ogo9pFvBkY",
  },
  {
    title: "Nature Sounds — Spotify",
    description: "Sounds of birds, rain, and forest ambience.",
    embed: "https://open.spotify.com/embed/playlist/37i9dQZF1DX4PP3DA4J0N8?utm_source=generator",
    link: "https://open.spotify.com/playlist/37i9dQZF1DX4PP3DA4J0N8",
  },
];

const VIDEOS = [
  {
    title: "5-Minute Meditation You Can Do Anywhere",
    description: "Quick breathing and presence practice to reduce stress.",
    embed: "https://www.youtube.com/embed/inpok4MKVLM",
    link: "https://www.youtube.com/watch?v=inpok4MKVLM",
  },
  {
    title: "Headspace | Mini Meditation: Breathe",
    description: "Guided mini-meditation to help pause and reset.",
    embed: "https://www.youtube.com/embed/YFSc7Ck0Ao0",
    link: "https://www.youtube.com/watch?v=YFSc7Ck0Ao0",
  },
  {
    title: "UCLA Mindful — 5-Minute Guided Meditation",
    description: "A brief, evidence-based mindfulness practice.",
    embed: "https://www.youtube.com/embed/ZToicYcHIOU",
    link: "https://www.youtube.com/watch?v=ZToicYcHIOU",
  },
];

export default function ResourcesPage() {
  return (
    <div className="min-h-screen bg-background text-charcoal pb-24">
      {/* Hero */}
      <section className="bg-surface border-b border-border/50 pb-16 pt-20 px-4 sm:px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-accent-soft px-4 py-2 text-sm font-semibold text-primary shadow-sm border border-accent/20">
              <span className="text-base" aria-hidden="true">📚</span>
              <span>Resource Library</span>
            </div>
            <h1 className="mt-6 font-heading text-h2 font-bold leading-tight text-charcoal sm:text-h1">
              Knowledge to support your <span className="text-primary">mental wellbeing</span>.
            </h1>
            <p className="mt-4 text-base sm:text-lg text-text-secondary leading-relaxed">
              Trusted, curated content selected by licensed therapists. Explore practical guides, clinical resources, and crisis support options.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Resources */}
      <section className="py-20 px-4 sm:px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-12">
            <h2 className="font-heading text-h3 font-bold text-charcoal">Support Categories</h2>
            <p className="mt-2 text-base text-text-muted">Find exactly what you need.</p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {FEATURED_RESOURCES.map((item) => (
              <Card key={item.title} className="flex flex-col h-full hover:-translate-y-1 hover:shadow-card group">
                <CardHeader>
                  <div className="mb-4 inline-flex h-[52px] w-[52px] items-center justify-center rounded-xl bg-primary-soft text-2xl text-primary transition-transform group-hover:scale-110">
                    {item.icon}
                  </div>
                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription className="opacity-90">{item.description}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto flex flex-col gap-2 pt-2">
                  {item.links.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center px-4 py-2.5 rounded-lg bg-surface-alt hover:bg-primary-soft/50 text-sm font-semibold text-charcoal hover:text-primary transition-colors border border-border/60"
                    >
                      {link.label}
                      <svg className="ml-auto w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    </a>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Wellness Articles */}
      <section className="py-20 px-4 sm:px-6 bg-surface-alt/40 border-y border-border/50">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <h2 className="font-heading text-h3 font-bold text-charcoal">Selected Articles</h2>
              <p className="mt-2 text-base text-text-muted">Evidence-based reading to deepen your toolkit.</p>
            </div>
            {/* Filter mock - UI only */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-text-muted mr-2">Filter:</span>
              <select className="px-4 py-2 text-sm bg-surface border border-border rounded-lg text-charcoal hover:border-primary/50 focus:ring-1 focus:ring-primary outline-none cursor-pointer">
                <option>All Topics</option>
                <option>Stress & Anxiety</option>
                <option>Depression</option>
                <option>Sleep</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {WELLNESS_ARTICLES.map((item) => (
              <a
                key={item.title}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="group block"
              >
                <Card className="h-full flex flex-col hover:border-primary/40 focus-within:ring-2 focus-within:ring-primary/50 focus-within:ring-offset-2 outline-none">
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-surface-alt text-xl group-hover:bg-primary-soft transition-colors">
                        {item.icon}
                      </div>
                      {item.readTime && (
                        <span className="text-xs font-semibold text-text-muted bg-surface-alt px-2 py-1 rounded-md">
                          {item.readTime}
                        </span>
                      )}
                    </div>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-2">{item.title}</CardTitle>
                    <CardDescription className="line-clamp-2 mt-1">{item.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="mt-auto pt-0">
                    <span className="inline-flex items-center text-sm font-semibold text-primary group-hover:underline underline-offset-4">
                      Read Article <span className="ml-1 transition-transform group-hover:translate-x-1">→</span>
                    </span>
                  </CardContent>
                </Card>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Guided Meditation Audios */}
      <section className="py-20 px-4 sm:px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-12">
            <h2 className="font-heading text-h3 font-bold text-charcoal">Guided Meditation Audios</h2>
            <p className="mt-2 text-base text-text-muted">
              Press play to start a session. Curated playlists from Spotify.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {MEDITATIONS.map((item) => (
              <Card key={item.title} className="flex h-full flex-col">
                <CardHeader>
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto">
                  <div className="overflow-hidden rounded-xl border border-border/60">
                    <iframe
                      src={item.embed}
                      width="100%"
                      height="320"
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                      loading="lazy"
                      className="h-96 w-full border-0"
                      title={item.title}
                    />
                  </div>
                  <p className="mt-3 text-xs text-text-muted">
                    If the player doesn&apos;t load,{' '}
                    <a
                      className="font-semibold text-primary hover:underline"
                      href={item.link}
                      target="_blank"
                      rel="noreferrer"
                    >
                      open on Spotify
                    </a>
                    .
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stress Management Videos */}
      <section className="py-20 px-4 sm:px-6 bg-surface-alt/40 border-y border-border/50">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-12">
            <h2 className="font-heading text-h3 font-bold text-charcoal">Stress Management Videos</h2>
            <p className="mt-2 text-base text-text-muted">
              Short, effective practices you can try right now.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {VIDEOS.map((item) => (
              <Card key={item.title} className="flex h-full flex-col">
                <CardHeader>
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto">
                  <div className="overflow-hidden rounded-xl border border-border/60">
                    <iframe
                      src={item.embed}
                      title={item.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      loading="lazy"
                      className="aspect-video w-full border-0"
                    />
                  </div>
                  <p className="mt-3 text-xs text-text-muted">
                    If the video doesn&apos;t load,{' '}
                    <a
                      className="font-semibold text-primary hover:underline"
                      href={item.link}
                      target="_blank"
                      rel="noreferrer"
                    >
                      watch on YouTube
                    </a>
                    .
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
