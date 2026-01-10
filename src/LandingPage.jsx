import React from 'react';
import { motion } from 'framer-motion';
import { Camera, Search, UtensilsCrossed, Zap, ArrowRight, CheckCircle2 } from 'lucide-react';

const LandingPage = () => {
    return (
        <div className="landing-page">
            <Navbar />
            <Hero />
            <HowItWorks />
            <Features />
            <Footer />
        </div>
    );
};

/* --- Components --- */

const Navbar = () => (
    <nav className="glass-panel" style={{
        position: 'fixed', top: '1rem', left: '1rem', right: '1rem',
        padding: '1rem 2rem', zIndex: 50,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
    }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UtensilsCrossed size={24} color="hsl(var(--accent-gold))" />
            <span style={{ fontWeight: 700, fontSize: '1.2rem', fontFamily: 'var(--font-display)' }}>
                Menu Decoder
            </span>
        </div>
        <button className="btn-primary" style={{ padding: '8px 20px', fontSize: '0.9rem' }}>
            Get Started
        </button>
    </nav>
);

const Hero = () => {
    return (
        <section style={{
            minHeight: '100vh',
            display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
            padding: '6rem 1rem 4rem',
            textAlign: 'center',
            background: 'radial-gradient(circle at 50% 30%, hsl(240 12% 16%) 0%, hsl(var(--bg-deep)) 70%)'
        }}>
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                style={{ maxWidth: '800px' }}
            >
                <span style={{
                    color: 'hsl(var(--accent-gold))',
                    fontWeight: 600,
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    marginBottom: '1rem', display: 'block'
                }}>
                    Don't Order Blindly
                </span>
                <h1 style={{
                    fontSize: 'clamp(2.5rem, 8vw, 5rem)',
                    fontWeight: 800,
                    marginBottom: '1.5rem'
                }}>
                    Turn <span className="text-gradient">Text Menus</span><br />
                    Into <span className="text-gradient">Delicious Photos</span>
                </h1>
                <p style={{
                    color: 'hsl(var(--text-secondary))',
                    fontSize: '1.2rem',
                    maxWidth: '600px',
                    margin: '0 auto 2.5rem'
                }}>
                    Stop guessing what "Ploov" is. Menu Decoder instantly translates menu text into mouth-watering images using AI.
                </p>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <button className="btn-primary">
                        Decode a Menu <ArrowRight size={18} style={{ display: 'inline', marginLeft: '8px' }} />
                    </button>
                </div>
            </motion.div>

            {/* Floating Cards Animation Background */}
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: -1, opacity: 0.4 }}>
                {/* We can add floating food emojis or abstract shapes related to food here */}
            </div>
        </section>
    );
};

const HowItWorks = () => {
    const steps = [
        { icon: <Camera size={32} />, title: "Snap a Photo", desc: "Take a picture of any physical menu." },
        { icon: <Zap size={32} />, title: "AI Magic", desc: "Our OCR & Search engine identifies every dish." },
        { icon: <Search size={32} />, title: "See the Food", desc: "Instantly see what every item looks like." }
    ];

    return (
        <section style={{ padding: '6rem 1rem', maxWidth: '1200px', margin: '0 auto' }}>
            <h2 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '4rem' }}>How It Works</h2>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '2rem'
            }}>
                {steps.map((step, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.2 }}
                        className="glass-panel"
                        style={{
                            padding: '2rem',
                            textAlign: 'center',
                            display: 'flex', flexDirection: 'column', alignItems: 'center'
                        }}
                    >
                        <div style={{
                            background: 'hsl(var(--bg-deep))',
                            padding: '1rem', borderRadius: '50%',
                            color: 'hsl(var(--accent-gold))',
                            marginBottom: '1.5rem'
                        }}>
                            {step.icon}
                        </div>
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{step.title}</h3>
                        <p style={{ color: 'hsl(var(--text-secondary))' }}>{step.desc}</p>
                    </motion.div>
                ))}
            </div>
        </section>
    );
};

const Features = () => {
    const features = [
        "No more language barriers",
        "Identify spicy or allergen-rich foods",
        "Perfect for travel",
        "Works offline (cached results)"
    ];
    return (
        <section style={{ padding: '6rem 1rem', background: 'hsl(240 12% 10%)' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4rem' }}>
                <div style={{ flex: '1 1 400px' }}>
                    <h2 style={{ fontSize: '2.5rem', marginBottom: '1.5rem' }}>Eat With Confidence</h2>
                    <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '1.1rem', marginBottom: '2rem' }}>
                        Whether you're in Tokyo or Tuscany, never order something you won't enjoy. Menu Decoder bridges the gap between text and taste.
                    </p>
                    <ul style={{ listStyle: 'none' }}>
                        {features.map((f, i) => (
                            <li key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem', fontSize: '1.1rem' }}>
                                <CheckCircle2 color="hsl(var(--accent-basil))" size={20} style={{ marginRight: '10px' }} />
                                {f}
                            </li>
                        ))}
                    </ul>
                </div>
                <div style={{ flex: '1 1 400px', height: '400px' }} className="glass-panel">
                    {/* Placeholder for Feature Image */}
                    <div style={{
                        height: '100%', width: '100%',
                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                        color: 'hsl(var(--text-secondary))', fontStyle: 'italic'
                    }}>
                        Phone Mockup Overlay Construction...
                    </div>
                </div>
            </div>
        </section>
    );
};

const Footer = () => (
    <footer style={{ padding: '4rem 1rem', textAlign: 'center', borderTop: '1px solid var(--glass-border)' }}>
        <p style={{ color: 'hsl(var(--text-secondary))' }}>© 2026 Menu Decoder. Bon Appétit.</p>
    </footer>
);

export default LandingPage;
