'use client';

import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck, CalendarClock, Activity, BookOpen, HeartHandshake, MessageCircle, Users, Zap, Search, Play } from 'lucide-react';
import Link from 'next/link';
import { SeededImage } from '@/components/ui/SeededImage';

// Animation configs
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const ButtonPrimary = ({ children, href = '#', className = '', ...props }) => {
  const inner = (
    <motion.button 
      whileHover={{ y: -2 }}
      className={`px-6 py-3 bg-brand hover:bg-brand-hover text-white rounded-brand font-semibold shadow-md border-transparent transition-colors flex items-center justify-center \${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );

  return href ? <Link href={href}>{inner}</Link> : inner;
};

// Extracted Components
const HeroSection = () => (
  <section className="relative pt-24 pb-32 overflow-hidden px-4 sm:px-6 lg:px-8 bg-brand-soft">
    {/* Abstract background shapes */}
    <div className="absolute top-10 right-10 w-96 h-96 bg-brand-accent/20 rounded-full mix-blend-multiply blur-3xl opacity-70 animate-pulse"></div>
    <div className="absolute bottom-10 left-10 w-72 h-72 bg-brand/20 rounded-full mix-blend-multiply blur-3xl opacity-70"></div>
    
    <div className="max-w-7xl mx-auto relative z-10 grid lg:grid-cols-2 gap-12 items-center">
      <motion.div 
        initial="hidden" 
        animate="visible" 
        variants={staggerContainer}
        className="text-center lg:text-left pt-12 lg:pt-0"
      >
        <motion.h1 
          variants={fadeInUp}
          className="text-5xl lg:text-6xl font-heading font-bold text-text-dark tracking-tight leading-tight mb-6"
        >
          Your Safe Space to <br/>
          <span className="text-brand">Heal & Thrive</span>
        </motion.h1>
        <motion.p 
          variants={fadeInUp}
          className="text-lg lg:text-xl text-text-secondary mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed"
        >
          Taking care of your mental health doesn&apos;t have to be a struggle. Get professional, confidential support tailored just for you.
        </motion.p>
        
        <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
          <ButtonPrimary href="/register" className="w-full sm:w-auto">
            <span>Get Support Now</span>
            <ArrowRight className="w-5 h-5 ml-2" />
          </ButtonPrimary>
          <Link href="https://www.youtube.com/watch?v=QDia3e12czc">
            <motion.button 
              whileHover={{ y: -2 }}
              className="w-full sm:w-auto px-6 py-3 bg-white text-text-dark font-semibold rounded-brand shadow-sm border border-border-light hover:bg-gray-50 flex items-center justify-center transition-all"
            >
              <Play className="w-5 h-5 mr-2 text-brand" />
              Watch How It Works
            </motion.button>
          </Link>
        </motion.div>
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="relative mx-auto mt-10 lg:mt-0"
      >
        <div className="relative w-full max-w-lg aspect-square bg-white rounded-[2rem] shadow-card-soft overflow-hidden border border-white flex items-center justify-center">
          <SeededImage
            seed="soulsupport-hero"
            category="hero"
            alt="Calming therapy illustration"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-brand-soft/30 to-white/20"></div>
          <motion.div 
            animate={{ y: [0, -10, 0] }} 
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="relative w-64 h-64"
          >
            <div className="absolute inset-0 bg-brand/10 rounded-full"></div>
            <div className="absolute inset-4 bg-brand-accent/20 rounded-full shadow-inner"></div>
            <div className="absolute inset-8 bg-brand/30 rounded-full flex items-center justify-center">
              <HeartHandshake className="w-20 h-20 text-brand" />
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  </section>
);

const StatsGrid = () => (
  <section className="bg-white relative z-20 -mt-16 mx-4 sm:mx-6 lg:mx-auto max-w-5xl rounded-card shadow-card-soft">
    <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border-light">
      {[
        { value: '3,00,000+', label: 'Sessions Conducted' },
        { value: '100+', label: 'Experienced Therapists' },
        { value: '4.9/5', label: 'Average User Rating' }
      ].map((stat, i) => (
        <div key={i} className="p-8 text-center">
          <motion.h3 
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-brand mb-2"
          >
            {stat.value}
          </motion.h3>
          <p className="text-text-secondary font-medium">{stat.label}</p>
        </div>
      ))}
    </div>
  </section>
);

const FeatureCards = () => (
  <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
    <div className="max-w-7xl mx-auto">
      <motion.div 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={staggerContainer}
        className="text-center mb-16"
      >
        <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-bold text-text-dark mb-4">
          Why Choose SoulSupport?
        </motion.h2>
        <motion.p variants={fadeInUp} className="text-lg text-text-secondary max-w-2xl mx-auto">
          We bring you accessible, compassionate, and secure therapy whenever you need it.
        </motion.p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-8">
        {[
          { icon: ShieldCheck, title: 'Licensed Professionals', desc: 'Thoroughly vetted and certified experts specialized in diverse therapy needs.' },
          { icon: Activity, title: 'Confidential & Secure', desc: 'Bank-level encryption ensures your data and conversations stay strictly private.' },
          { icon: CalendarClock, title: 'Flexible Scheduling', desc: 'Book online sessions effortlessly to match your lifestyle and availability.' }
        ].map((feature, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="bg-brand-soft/50 rounded-card p-8 border border-brand-soft hover:shadow-card-soft transition-shadow"
          >
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="w-14 h-14 bg-white rounded-brand flex items-center justify-center mb-6 text-brand shadow-sm"
            >
              <feature.icon className="w-7 h-7" />
            </motion.div>
            <h3 className="text-xl font-bold text-text-dark mb-3">{feature.title}</h3>
            <p className="text-text-secondary leading-relaxed">{feature.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

const ResourceGrid = () => (
  <section className="py-24 px-4 sm:px-6 lg:px-8 bg-brand-section">
    <div className="max-w-7xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <h2 className="text-3xl md:text-4xl font-bold text-text-dark mb-4">Mental Health Resources</h2>
        <p className="text-lg text-text-secondary max-w-2xl mx-auto">Tools and content crafted by experts to support your well-being journey every day.</p>
      </motion.div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { icon: BookOpen, title: 'Self Help Guides', text: 'Step-by-step guides for resilience and stress.' },
          { icon: Users, title: 'Wellness Podcasts', text: 'Listen to expert insights on daily balance.' },
          { icon: Search, title: 'Blog & Articles', text: 'Practical growth stories and rich content.' }
        ].map((resource, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            whileHover={{ y: -5 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-card p-8 shadow-sm hover:shadow-card-soft border border-border-light transition-all flex flex-col items-start"
          >
            <div className="w-12 h-12 rounded-full bg-brand-soft text-brand flex items-center justify-center mb-6">
              <resource.icon className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-text-dark mb-2">{resource.title}</h3>
            <p className="text-text-secondary mb-6 flex-grow">{resource.text}</p>
            <Link href="#" className="font-semibold text-brand hover:text-brand-hover flex items-center mt-auto">
              Explore <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

const BenefitsCards = () => (
  <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
    <div className="max-w-7xl mx-auto">
      <div className="grid lg:grid-cols-12 gap-16 items-center">
        {/* Text Section */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="lg:col-span-5"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-text-dark mb-6">What Improves with Therapy?</h2>
          <p className="text-lg text-text-secondary mb-8">
            Therapy provides a dedicated, safe environment to explore your feelings and create meaningful change in your life.
          </p>
          <ul className="space-y-4 mb-8">
            {['Better Relationships', 'Higher Self-Esteem', 'Reduced Stress & Anxiety', 'Improved Focus'].map((item, idx) => (
              <li key={idx} className="flex items-center text-text-dark font-medium">
                <div className="w-6 h-6 rounded-full bg-brand-accent/20 flex items-center justify-center mr-3 text-brand">
                  ✓
                </div>
                {item}
              </li>
            ))}
          </ul>
          <ButtonPrimary href="/therapists">Connect to a Therapist</ButtonPrimary>
        </motion.div>
        
        {/* Grid Section */}
        <div className="lg:col-span-7 grid sm:grid-cols-2 gap-6">
          {[
            { title: 'Relationships', desc: 'Foster empathy and build communication.', icon: Users, delay: 0 },
            { title: 'Confidence', desc: 'Work through self-doubt.', icon: Zap, delay: 0.1 },
            { title: 'Stress & Anxiety', desc: 'Learn concrete coping mechanisms.', icon: MessageCircle, delay: 0.2 },
            { title: 'Healing', desc: 'Process trauma in a safe space.', icon: HeartHandshake, delay: 0.3 }
          ].map((card, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: card.delay }}
              whileHover={{ y: -5 }}
              className="bg-brand-soft rounded-card p-6 border border-brand/10 hover:shadow-card-soft transition-all"
            >
              <div className="w-12 h-12 rounded-brand bg-white flex items-center justify-center mb-4 text-brand shadow-sm">
                <card.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-text-dark mb-2">{card.title}</h3>
              <p className="text-text-secondary text-sm leading-relaxed">{card.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

const CTASection = () => (
  <section className="py-24 px-4 sm:px-6 lg:px-8">
    <div className="max-w-5xl mx-auto rounded-card bg-brand-gradient overflow-hidden relative shadow-card-soft">
      {/* Decorative patterns */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
      
      <div className="relative z-10 p-12 lg:p-20 text-center">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight"
        >
          Not Ready to Talk Yet?
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-10"
        >
          Explore our vast library of free resources, journal prompts, and self-guided wellness tools to start your journey at your own pace.
        </motion.p>
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           transition={{ delay: 0.2 }}
        >
          <motion.button 
            whileHover={{ scale: 1.02 }}
            className="px-8 py-4 bg-white text-brand font-bold rounded-brand shadow-md hover:bg-gray-50 transition-all focus:outline-none"
          >
            Explore Free Resources
          </motion.button>
        </motion.div>
      </div>
    </div>
  </section>
);

export default function Home() {
  return (
    <div className="min-h-screen bg-white font-sans text-text-dark selection:bg-brand-soft selection:text-brand flex flex-col">
      <HeroSection />
      <StatsGrid />
      <FeatureCards />
      <ResourceGrid />
      <BenefitsCards />
      <CTASection />
    </div>
  );
}
