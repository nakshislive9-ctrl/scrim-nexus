import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { Zap, Crosshair, Users, Swords, Shield, CalendarDays, ArrowRight, ChevronDown, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { GAMES } from "@/lib/gameData";
import { Seo } from "@/components/Seo";
import { GameLogo } from "@/components/GameLogo";

function Section({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  return (
    <motion.section
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
      animate={isInView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay }}
    >
      {children}
    </motion.section>
  );
}

function FeatureCard({ icon: Icon, title, description, index }: { icon: any; title: string; description: string; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  return (
    <motion.div
      ref={ref}
      className="glass-panel-hover p-6 flex flex-col gap-4 group cursor-default"
      initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
      animate={isInView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: index * 0.1 }}
    >
      <div className="h-11 w-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:neon-glow transition-shadow duration-300">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </motion.div>
  );
}

function Stat({ value, label, index }: { value: string; label: string; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  return (
    <motion.div
      ref={ref}
      className="text-center"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: index * 0.08 }}
    >
      <div className="text-3xl md:text-4xl font-bold neon-text font-mono tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground mt-1 uppercase tracking-widest font-mono">{label}</div>
    </motion.div>
  );
}

function GameCard({ name, index }: { name: string; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  return (
    <motion.div
      ref={ref}
      className="glass-panel-hover p-5 flex flex-col items-center gap-3 group cursor-default"
      initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
      animate={isInView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: index * 0.07 }}
    >
      <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:neon-glow transition-shadow duration-300">
        <GameLogo game={name} className="h-7 w-7" />
      </div>
      <span className="text-sm font-semibold text-foreground text-center">{name}</span>
    </motion.div>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 60]);

  useEffect(() => {
    if (!loading && user) navigate("/dashboard", { replace: true });
  }, [user, loading, navigate]);

  if (loading) return null;

  const features = [
    { icon: Crosshair, title: "Find Scrims", description: "Browse and challenge teams at your skill level. Filter by game, rank, and region." },
    { icon: Swords, title: "Challenge System", description: "Send and manage scrim challenges with real-time status updates and notifications." },
    { icon: Users, title: "Team Management", description: "Build your roster, assign roles, and invite players with shareable team codes." },
    { icon: Shield, title: "Reliability Scores", description: "Track team follow-through. Show up, play fair, and build your reputation." },
    { icon: CalendarDays, title: "Scrim Calendar", description: "Visualize your upcoming matches in a dedicated monthly calendar view." },
    { icon: Zap, title: "Real-Time Chat", description: "Coordinate with opponents in-app. Discuss maps, times, and rules before you play." },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Seo
        title="ScrimHQ – Find Scrims, Build Teams & Compete in Esports"
        description="ScrimHQ is the competitive scrimmage platform for esports teams. Find opponents, schedule scrims, manage rosters, and track match history across 12+ games."
        path="/"
      />
      {/* Nav */}
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 border-b border-border/30 bg-background/70 backdrop-blur-xl"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-16">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center neon-glow">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <span className="font-bold text-base tracking-tight text-foreground">
              SCRIM<span className="neon-text">HQ</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => document.getElementById("games")?.scrollIntoView({ behavior: "smooth" })}
              className="text-muted-foreground hover:text-foreground font-mono text-xs uppercase tracking-wider"
            >
              <Gamepad2 className="h-3.5 w-3.5 mr-1.5" /> Games
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/auth")} className="text-muted-foreground hover:text-foreground">
              Log in
            </Button>
            <Button variant="neon" size="sm" onClick={() => navigate("/auth")}>
              Get Started <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </motion.nav>

      {/* Hero */}
      <div ref={heroRef} className="relative min-h-[100vh] flex items-center justify-center pt-16">
        <div className="absolute inset-0 grid-bg opacity-40" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

        <motion.div style={{ opacity: heroOpacity, y: heroY }} className="relative z-10 text-center px-6 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-mono tracking-wider uppercase mb-8">
              <Zap className="h-3 w-3" /> Competitive Scrimmage Platform
            </div>
          </motion.div>

          <motion.h1
            className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[0.95] mb-6"
            initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.25 }}
          >
            Where Teams
            <br />
            <span className="neon-text">Compete</span>
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl text-muted-foreground max-w-lg mx-auto mb-10 leading-relaxed"
            initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.45 }}
          >
            Find opponents, schedule scrims, and track your team's performance — all in one place.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.6 }}
          >
            <Button variant="neon" size="lg" onClick={() => navigate("/auth")} className="text-base px-8">
              Start Playing <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
            <Button variant="outline" size="lg" onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })} className="text-base">
              Learn More <ChevronDown className="h-4 w-4 ml-1" />
            </Button>
          </motion.div>
        </motion.div>

        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChevronDown className="h-5 w-5 text-muted-foreground/40" />
          </motion.div>
        </motion.div>
      </div>

      {/* Stats */}
      <Section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="glass-panel p-8 md:p-12 grid grid-cols-2 md:grid-cols-4 gap-8">
            <Stat value="12" label="Games Supported" index={0} />
            <Stat value="24/7" label="Matchmaking" index={1} />
            <Stat value="∞" label="Scrims" index={2} />
            <Stat value="100%" label="Free" index={3} />
          </div>
        </div>
      </Section>

      {/* Games */}
      <Section className="py-20 px-6" delay={0.1}>
        <div id="games" className="max-w-6xl mx-auto scroll-mt-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Supported Games</h2>
            <p className="text-muted-foreground max-w-md mx-auto">Full rank ladders, region servers, and role systems for every title.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {GAMES.map((game, i) => (
              <GameCard key={game} name={game} index={i} />
            ))}
          </div>
        </div>
      </Section>

      {/* Features */}
      <Section className="py-20 px-6" delay={0.1}>
        <div id="features" className="max-w-6xl mx-auto scroll-mt-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Everything Your Team Needs</h2>
            <p className="text-muted-foreground max-w-md mx-auto">Built for competitive players who take practice seriously.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <FeatureCard key={f.title} icon={f.icon} title={f.title} description={f.description} index={i} />
            ))}
          </div>
        </div>
      </Section>

      {/* How it works */}
      <Section className="py-24 px-6" delay={0.1}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-16">Up and Running in Minutes</h2>
          <div className="grid md:grid-cols-3 gap-10">
            {[
              { step: "01", title: "Create Your Team", desc: "Sign up, name your squad, and invite your roster with a single link." },
              { step: "02", title: "Find Opponents", desc: "Browse teams in your game and rank bracket. Send a challenge when you're ready." },
              { step: "03", title: "Play & Track", desc: "Schedule the scrim, play the match, and log results to build your record." },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                className="flex flex-col items-center gap-4"
                initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
                whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: i * 0.12 }}
              >
                <span className="text-4xl font-black font-mono neon-text">{item.step}</span>
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* CTA */}
      <Section className="py-24 px-6" delay={0.1}>
        <div className="max-w-3xl mx-auto text-center">
          <div className="glass-panel p-12 md:p-16 relative overflow-hidden">
            <div className="absolute inset-0 bg-primary/[0.03] pointer-events-none" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Ready to Compete?</h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Join teams already using ScrimHQ to level up their competitive play.
              </p>
              <Button variant="neon" size="lg" onClick={() => navigate("/auth")} className="text-base px-10">
                Create Your Team <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </Section>

      {/* Footer */}
      <footer className="border-t border-border/30 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold tracking-tight">SCRIM<span className="neon-text">HQ</span></span>
          </div>
          <p className="text-xs text-muted-foreground font-mono">© 2026 ScrimHQ. Built for competitors.</p>
        </div>
      </footer>
    </div>
  );
}
