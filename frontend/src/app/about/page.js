import Link from "next/link";
import {
  BookOpenText,
  CalendarClock,
  Globe2,
  Handshake,
  Lock,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserCheck,
  Users,
} from "lucide-react";
import { SeededImage } from "@/components/ui/SeededImage";
import { Button } from "@/components/ui/Button";

export const metadata = { title: "About Us - SoulSupport" };

const MISSION_CARDS = [
  {
    title: "Structured discovery of support",
    description: "We guide people from uncertainty to clear next steps using resources, therapist profiles, and practical pathways.",
    icon: Search,
  },
  {
    title: "Privacy-focused design",
    description: "Sensitive moments deserve safe defaults. We design every flow to protect dignity, trust, and confidentiality.",
    icon: Lock,
  },
  {
    title: "Trusted partnerships",
    description: "Licensed professionals and community organizations work together so support is clinically credible and widely accessible.",
    icon: Handshake,
  },
  {
    title: "Community accessibility",
    description: "SoulSupport is built to reduce emotional and practical barriers for students, families, and underserved communities.",
    icon: Users,
  },
];

const IMPACT_STATS = [
  { value: "50K+", label: "Community Members", icon: Users },
  { value: "100+", label: "Licensed Therapists", icon: Stethoscope },
  { value: "300K+", label: "Sessions Hosted", icon: CalendarClock },
  { value: "50+", label: "Partner NGOs", icon: Globe2 },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Discover the right support",
    description: "Start with resources, community guidance, or therapist search based on your comfort and urgency.",
    icon: BookOpenText,
  },
  {
    step: "02",
    title: "Match with trusted help",
    description: "Find verified professionals and partner-backed options that fit your needs and context.",
    icon: UserCheck,
  },
  {
    step: "03",
    title: "Start improving well-being",
    description: "Move from one-time support to continuity with practical follow-through across your care journey.",
    icon: Sparkles,
  },
];

const TIMELINE = [
  { year: "2021", event: "Platform idea" },
  { year: "2022", event: "First pilot program" },
  { year: "2024", event: "Expansion to partnerships" },
  { year: "2026", event: "Scaled community access" },
];

const TEAM = [
  {
    name: "Dr. Sarah Jenkins",
    role: "Clinical Director",
    seed: "sarah-jenkins",
    credibility: "Leads clinical quality and evidence-informed care standards.",
  },
  {
    name: "Dr. Ahmed Khan",
    role: "Head of Counseling",
    seed: "ahmed-khan",
    credibility: "Builds therapy frameworks focused on long-term outcomes.",
  },
  {
    name: "Maya Patel",
    role: "Community Lead",
    seed: "maya-patel",
    credibility: "Designs safe, accessible community support experiences.",
  },
  {
    name: "Elena Rostova",
    role: "Partnership Director",
    seed: "elena-rostova",
    credibility: "Expands NGO partnerships to reduce care access barriers.",
  },
];

const FOOTER_COLUMNS = [
  {
    title: "Platform",
    links: [
      { label: "About", href: "/about" },
      { label: "Therapists", href: "/therapists" },
      { label: "Community Forum", href: "/forum" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Resource Hub", href: "/resources" },
      { label: "Self-Help Guides", href: "/resources" },
      { label: "Crisis Support", href: "/resources" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/" },
      { label: "Terms", href: "/" },
      { label: "Safety", href: "/" },
    ],
  },
  {
    title: "Contact",
    links: [
      { label: "care@soulsupport.org", href: "mailto:care@soulsupport.org" },
      { label: "Partnerships", href: "/about" },
      { label: "Support Team", href: "/resources" },
    ],
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#f6fbfb] text-charcoal">
      <main>
        <section className="relative overflow-hidden border-b border-border/70 bg-[radial-gradient(circle_at_top_right,_rgba(125,211,252,0.35),_transparent_40%),linear-gradient(180deg,_#f8fcfc_0%,_#f6fbfb_100%)] py-20 sm:py-28">
          <div className="container mx-auto grid max-w-6xl gap-12 px-4 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                <ShieldCheck className="h-4 w-4" />
                Trusted mental wellness platform
              </p>
              <h1 className="mt-6 font-heading text-4xl font-bold leading-tight text-charcoal sm:text-5xl lg:text-6xl">
                Bridging the gap between needing help and knowing where to go.
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-8 text-text-secondary">
                SoulSupport helps people find trusted support faster through verified therapists,
                practical resources, and community-centered care pathways.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link href="/resources" prefetch={true}>
                  <Button size="lg" className="w-full sm:w-auto">
                    Explore Resources
                  </Button>
                </Link>
                <Link href="/register?role=therapist" prefetch={true}>
                  <Button size="lg" variant="outline" className="w-full border-border/90 bg-white sm:w-auto">
                    Join as a Therapist
                  </Button>
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="rounded-[2rem] border border-border/70 bg-white p-4 shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
                <div className="relative aspect-[5/4] overflow-hidden rounded-[1.5rem]">
                  <SeededImage
                    seed="soulsupport-about-hero"
                    category="wellness"
                    alt="Calm mental wellness support illustration"
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                  />
                </div>
                <div className="mt-4 rounded-2xl bg-surface-alt/60 px-4 py-3">
                  <p className="text-sm font-semibold text-charcoal">Designed for calm decision-making</p>
                  <p className="mt-1 text-sm text-text-secondary">Clear information, trusted options, and emotionally safe pathways.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 sm:py-24">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="font-heading text-3xl font-bold text-charcoal sm:text-5xl">
                More than a platform - a care system.
              </h2>
              <p className="mt-4 text-base leading-7 text-text-secondary sm:text-lg">
                Every layer of SoulSupport is designed to balance compassion, credibility, and accessibility.
              </p>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-2">
              {MISSION_CARDS.map((card) => {
                const Icon = card.icon;

                return (
                  <article key={card.title} className="rounded-[1.5rem] border border-border/70 bg-white p-6 shadow-[0_16px_36px_rgba(15,23,42,0.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_42px_rgba(15,23,42,0.08)]">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-5 font-heading text-xl font-bold text-charcoal">{card.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-text-secondary">{card.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-y border-border/70 bg-[#f9fcfc] py-20 sm:py-24">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="text-center">
              <h2 className="font-heading text-3xl font-bold text-charcoal sm:text-5xl">Impact Metrics</h2>
            </div>

            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {IMPACT_STATS.map((stat) => {
                const Icon = stat.icon;

                return (
                  <article key={stat.label} className="rounded-[1.5rem] border border-border/70 bg-white p-6 text-center shadow-[0_14px_30px_rgba(15,23,42,0.05)]">
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="mt-4 text-3xl font-bold text-charcoal">{stat.value}</p>
                    <p className="mt-2 text-sm font-semibold text-text-secondary">{stat.label}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-20 sm:py-24">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="font-heading text-3xl font-bold text-charcoal sm:text-5xl">How SoulSupport Works</h2>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {HOW_IT_WORKS.map((item, index) => {
                const Icon = item.icon;

                return (
                  <article key={item.step} className="relative rounded-[1.5rem] border border-border/70 bg-white p-6 shadow-[0_14px_30px_rgba(15,23,42,0.05)]">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Step {item.step}</p>
                    <div className="mt-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-charcoal text-white">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 font-heading text-xl font-bold text-charcoal">{item.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-text-secondary">{item.description}</p>
                    {index < HOW_IT_WORKS.length - 1 && (
                      <div className="pointer-events-none absolute -right-3 top-1/2 hidden h-px w-6 -translate-y-1/2 bg-border md:block" aria-hidden="true" />
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-y border-border/70 bg-[#f9fcfc] py-20 sm:py-24">
          <div className="container mx-auto max-w-5xl px-4">
            <div className="text-center">
              <h2 className="font-heading text-3xl font-bold text-charcoal sm:text-5xl">Our Story</h2>
            </div>

            <div className="mx-auto mt-12 max-w-3xl space-y-5">
              {TIMELINE.map((item, idx) => (
                <article key={item.year} className="relative rounded-[1.5rem] border border-border/70 bg-white p-6 pl-8 shadow-[0_12px_26px_rgba(15,23,42,0.04)]">
                  <div className="absolute inset-y-0 left-0 w-1 rounded-l-[1.5rem] bg-primary/70" aria-hidden="true" />
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">{item.year}</p>
                  <p className="mt-2 text-base text-text-secondary">{item.event}</p>
                  {idx < TIMELINE.length - 1 && (
                    <div className="absolute -bottom-5 left-3 h-5 w-px bg-primary/35" aria-hidden="true" />
                  )}
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 sm:py-24">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="font-heading text-3xl font-bold text-charcoal sm:text-5xl">Team</h2>
              <p className="mt-4 text-base leading-7 text-text-secondary sm:text-lg">
                Experienced leaders across clinical care, partnerships, and community design.
              </p>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {TEAM.map((member) => (
                <article key={member.name} className="group rounded-[1.5rem] border border-border/70 bg-white p-5 shadow-[0_14px_30px_rgba(15,23,42,0.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_42px_rgba(15,23,42,0.08)]">
                  <div className="relative mx-auto h-24 w-24 overflow-hidden rounded-2xl">
                    <SeededImage
                      seed={member.seed}
                      category="avatar"
                      alt={member.name}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  </div>
                  <h3 className="mt-5 text-center font-heading text-lg font-bold text-charcoal">{member.name}</h3>
                  <p className="mt-1 text-center text-sm font-medium text-primary">{member.role}</p>
                  <p className="mt-3 text-center text-sm leading-6 text-text-secondary">{member.credibility}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-[#0f172a] py-24 text-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(125,211,252,0.25),_transparent_34%),linear-gradient(180deg,_#0f172a_0%,_#111827_100%)]" aria-hidden="true" />
          <div className="container relative z-10 mx-auto max-w-4xl px-4">
            <div className="rounded-[2rem] border border-white/10 bg-white/5 px-6 py-12 shadow-[0_26px_60px_rgba(2,6,23,0.35)] backdrop-blur sm:px-10">
              <h2 className="font-heading text-3xl font-bold text-white sm:text-5xl">
                Help us extend the reach of trusted mental wellness support.
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-white/70 sm:text-lg">
                We collaborate with therapists, educators, and community organizations to make support more available and easier to trust.
              </p>
              <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
                <Link href="/register?role=therapist" prefetch={true}>
                  <Button size="lg" className="w-full bg-white text-charcoal hover:bg-white/90 sm:w-auto">
                    Join as Therapist
                  </Button>
                </Link>
                <Link href="/resources" prefetch={true}>
                  <Button size="lg" variant="outline" className="w-full border-white/35 bg-transparent text-white hover:bg-white/10 sm:w-auto">
                    Explore Resource Hub
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* <footer className="border-t border-border/70 bg-white py-14">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {FOOTER_COLUMNS.map((column) => (
                <div key={column.title}>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-charcoal">{column.title}</h3>
                  <ul className="mt-4 space-y-2.5">
                    {column.links.map((link) => (
                      <li key={link.label}>
                        <Link href={link.href} className="text-sm text-text-secondary transition hover:text-primary">
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="mt-10 border-t border-border/70 pt-5 text-sm text-text-muted">
              SoulSupport © {new Date().getFullYear()}.
            </div>
          </div>
        </footer> */}
      </main>
    </div>
  );
}
