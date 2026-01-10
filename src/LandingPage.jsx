import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Search, UtensilsCrossed, Zap, ArrowRight, CheckCircle2, Loader2, X, Image as ImageIcon, ChefHat } from 'lucide-react';

const LandingPage = () => {
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [error, setError] = useState(null);
    const [searchWarning, setSearchWarning] = useState(null);
    const fileInputRef = useRef(null);
    const resultsRef = useRef(null);

    const handleCameraClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        setResults(null);
        setError(null);
        setSearchWarning(null);

        try {
            // 1. Convert to Base64
            const toBase64 = (file) => new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve(reader.result);
                reader.onerror = error => reject(error);
            });

            const base64Image = await toBase64(file);

            // 2. Send JSON to Serverless Function
            // Note: We use the local bridge port (3000) for development. 
            // In production (Vercel), this would be just '/api/decode-menu'
            const response = await fetch('http://localhost:3000/api/decode-menu', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ image: base64Image }),
            });
            const data = await response.json();

            if (response.ok && data.results) {
                setResults(data.results);
                setSearchWarning(data.searchWarning);
                setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
            } else {
                const errorMessage = data.error || "No text found or error processing image.";
                setError(`API Error: ${errorMessage}`);
            }
        } catch (err) {
            console.error(err);
            setError(`Connection Error: ${err.message}. Make sure the local bridge is running.`);
        } finally {
            setLoading(false);
        }
    };

    const closeResults = () => {
        setResults(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="landing-page" style={{ overflowX: 'hidden' }}>
            <Navbar onCameraClick={handleCameraClick} />

            {/* Hidden File Input (Camera Trigger) */}
            <input
                type="file"
                accept="image/*"
                capture="environment"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileChange}
            />

            <main>
                <AnimatePresence mode="wait">
                    {!results && !loading && (
                        <motion.div
                            key="home"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.5 }}
                        >
                            <Hero onCameraClick={handleCameraClick} />
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    style={{
                                        maxWidth: '600px', margin: '-2rem auto 2rem', padding: '1.5rem',
                                        background: 'rgba(255, 68, 68, 0.1)', border: '1px solid #ff4444',
                                        borderRadius: '12px', color: '#ff4444', textAlign: 'left',
                                        display: 'flex', alignItems: 'flex-start', gap: '1rem',
                                        position: 'relative', zIndex: 10, backdropFilter: 'blur(10px)'
                                    }}>
                                    <X size={20} style={{ flexShrink: 0, cursor: 'pointer' }} onClick={() => setError(null)} />
                                    <div>
                                        <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Oops! Something went wrong:</strong>
                                        <p style={{ margin: 0, fontSize: '0.95rem', opacity: 0.9 }}>{error}</p>
                                    </div>
                                </motion.div>
                            )}
                            <HowItWorks />
                            <Features />
                        </motion.div>
                    )}

                    {/* Loading State */}
                    {loading && (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.4 }}
                            style={{
                                minHeight: '80vh', display: 'flex', flexDirection: 'column',
                                justifyContent: 'center', alignItems: 'center', textAlign: 'center'
                            }}
                        >
                            <div style={{ position: 'relative' }}>
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                                    style={{
                                        width: '80px', height: '80px',
                                        borderRadius: '50%',
                                        border: '4px solid hsla(var(--accent-gold), 0.3)',
                                        borderTopColor: 'hsl(var(--accent-gold))'
                                    }}
                                />
                                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <UtensilsCrossed size={32} color="hsl(var(--accent-gold))" />
                                </div>
                            </div>
                            <h2 style={{ marginTop: '2rem', fontSize: '2rem' }} className="text-gradient">Decoding Menu...</h2>
                            <p style={{ color: 'hsl(var(--text-secondary))', maxWidth: '400px', lineHeight: 1.6 }}>
                                Utilizing AI to identify dishes and fetch mouth-watering previews.
                            </p>
                        </motion.div>
                    )}

                    {/* Results View */}
                    {results && (
                        <motion.div
                            key="results"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            ref={resultsRef}
                            style={{ padding: '2rem 1rem', maxWidth: '800px', margin: '0 auto' }}
                        >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h2 style={{ fontSize: '2rem' }}>Decoded Menu</h2>
                                    <button onClick={closeResults} className="btn-secondary" style={{
                                        display: 'flex', alignItems: 'center', gap: '8px'
                                    }}>
                                        <X size={18} /> Close
                                    </button>
                                </div>

                                {searchWarning && (
                                    <div style={{
                                        padding: '1rem', background: 'rgba(255, 165, 0, 0.1)',
                                        border: '1px solid orange', borderRadius: '8px', color: 'orange',
                                        fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '10px'
                                    }}>
                                        <Zap size={18} />
                                        <span><strong>Image Search restricted:</strong> {searchWarning}. Please check API Key.</span>
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'grid', gap: '1.5rem' }}>
                                {results.map((item, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1, type: "spring", stiffness: 100 }}
                                        whileHover={{ y: -5, boxShadow: "0 12px 24px -10px rgba(0,0,0,0.5)" }}
                                        className="glass-panel"
                                        style={{
                                            display: 'flex', alignItems: 'center', overflow: 'hidden',
                                            background: 'hsla(240, 12%, 14%, 0.6)'
                                        }}
                                    >
                                        <motion.div
                                            whileHover={{ scale: 1.1 }}
                                            transition={{ duration: 0.3 }}
                                            style={{ width: '120px', height: '120px', flexShrink: 0, background: '#000', overflow: 'hidden' }}
                                        >
                                            {item.image ? (
                                                <img src={item.image} alt={item.dish} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', background: '#1a1a1e' }}>
                                                    <UtensilsCrossed size={32} opacity={0.5} />
                                                </div>
                                            )}
                                        </motion.div>
                                        <div style={{ padding: '1rem 1.5rem', flex: 1 }}>
                                            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: 'hsl(var(--text-primary))' }}>{item.dish}</h3>
                                            <span style={{ fontSize: '0.8rem', color: 'hsl(var(--accent-gold))', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, border: '1px solid hsla(45, 95%, 55%, 0.3)', padding: '4px 8px', borderRadius: '4px' }}>
                                                Decoded
                                            </span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            <motion.button
                                onClick={handleCameraClick}
                                className="btn-primary"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                style={{ width: '100%', marginTop: '3rem', justifyContent: 'center', display: 'flex' }}
                            >
                                <Camera size={20} style={{ marginRight: '10px' }} /> Scan Another Menu
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {!loading && !results && <Footer />}
        </div>
    );
};

/* --- Components --- */

const Navbar = ({ onCameraClick }) => (
    <nav className="glass-panel" style={{
        position: 'fixed', top: '1rem', left: '1rem', right: '1rem',
        padding: '0.8rem 1.5rem', zIndex: 50,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'hsla(240, 10%, 8%, 0.7)'
    }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <div style={{
                background: 'linear-gradient(135deg, hsl(var(--accent-gold)), hsl(var(--accent-berry)))',
                padding: '6px', borderRadius: '8px'
            }}>
                <ChefHat size={20} color="white" />
            </div>
            <span style={{ fontWeight: 800, fontSize: '1.2rem', fontFamily: 'var(--font-display)', letterSpacing: '-0.5px' }}>
                Menu Decoder
            </span>
        </div>
        <button onClick={onCameraClick} className="btn-primary" style={{ padding: '8px 20px', fontSize: '0.9rem' }}>
            Scan Menu
        </button>
    </nav>
);

const FloatingIcons = () => {
    // Random positions for floating icons
    const icons = [
        { Icon: UtensilsCrossed, x: -150, y: -100, delay: 0 },
        { Icon: Camera, x: 180, y: -150, delay: 1 },
        { Icon: Search, x: -180, y: 120, delay: 2 },
        { Icon: ChefHat, x: 150, y: 100, delay: 0.5 },
    ];

    return (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: -1, pointerEvents: 'none' }}>
            {icons.map((item, i) => (
                <div
                    key={i}
                    style={{
                        position: 'absolute',
                        left: '50%', top: '50%',
                        transform: `translate(${item.x}px, ${item.y}px)`
                    }}
                >
                    <motion.div
                        animate={{
                            y: [0, -20, 0],
                            rotate: [0, 5, -5, 0],
                            opacity: [0.3, 0.6, 0.3]
                        }}
                        transition={{
                            duration: 5 + i,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: item.delay
                        }}
                    >
                        <item.Icon size={48} color="hsla(var(--accent-gold), 0.2)" />
                    </motion.div>
                </div>
            ))}

            {/* Ambient Gradients */}
            <div style={{
                position: 'absolute', top: '-20%', left: '-10%', width: '40%', height: '40%',
                background: 'radial-gradient(circle, hsla(var(--accent-berry), 0.15) 0%, transparent 70%)',
                filter: 'blur(60px)'
            }} />
            <div style={{
                position: 'absolute', bottom: '-10%', right: '-10%', width: '40%', height: '40%',
                background: 'radial-gradient(circle, hsla(var(--accent-gold), 0.1) 0%, transparent 70%)',
                filter: 'blur(60px)'
            }} />
        </div>
    );
};

const Hero = ({ onCameraClick }) => {
    return (
        <section style={{
            minHeight: '100vh',
            display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
            padding: '6rem 1rem 4rem',
            textAlign: 'center',
            position: 'relative',
        }}>
            <FloatingIcons />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                style={{ maxWidth: '800px', zIndex: 1 }}
            >
                <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    style={{
                        color: 'hsl(var(--accent-gold))',
                        fontWeight: 700,
                        letterSpacing: '2px',
                        textTransform: 'uppercase',
                        fontSize: '0.9rem',
                        marginBottom: '1rem', display: 'inline-block',
                        background: 'hsla(45, 95%, 55%, 0.15)',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        border: '1px solid hsla(45, 95%, 55%, 0.3)'
                    }}
                >
                    Don't Order Blindly
                </motion.span>
                <h1 style={{
                    fontSize: 'clamp(2.5rem, 8vw, 5rem)',
                    fontWeight: 800,
                    marginBottom: '1.5rem',
                    lineHeight: 1.1
                }}>
                    Turn <span className="text-gradient">Text Menus</span><br />
                    Into <span className="text-gradient">Unknown Delights</span>
                </h1>
                <p style={{
                    color: 'hsl(var(--text-secondary))',
                    fontSize: '1.25rem',
                    maxWidth: '600px',
                    margin: '0 auto 2.5rem',
                    lineHeight: 1.6
                }}>
                    Stop guessing what "Ploov" is. Menu Decoder instantly translates menu text into mouth-watering images using AI.
                </p>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <motion.button
                        onClick={onCameraClick}
                        className="btn-primary"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        Decode a Key <ArrowRight size={20} style={{ display: 'inline', marginLeft: '8px', verticalAlign: 'text-bottom' }} />
                    </motion.button>
                </div>
            </motion.div>
        </section>
    );
};

const HowItWorks = () => {
    const steps = [
        { icon: <Camera size={32} />, title: "Snap a Photo", desc: "Take a picture of any physical menu." },
        { icon: <ImageIcon size={32} />, title: "AI Analysis", desc: "Our engine identifies every dish." },
        { icon: <UtensilsCrossed size={32} />, title: "See the Food", desc: "Instantly see what every item looks like." }
    ];

    return (
        <section style={{ padding: '6rem 1rem', maxWidth: '1200px', margin: '0 auto' }}>
            <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '4rem' }}
            >
                How It Works
            </motion.h2>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '2rem'
            }}>
                {steps.map((step, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.2, type: "spring", stiffness: 100 }}
                        whileHover={{ y: -12, boxShadow: "0 20px 30px -10px rgba(0,0,0,0.3)" }}
                        className="glass-panel"
                        style={{
                            padding: '2.5rem',
                            textAlign: 'center',
                            display: 'flex', flexDirection: 'column', alignItems: 'center'
                        }}
                    >
                        <div style={{
                            background: 'hsla(var(--bg-deep), 0.5)',
                            padding: '1.2rem', borderRadius: '50%',
                            color: 'hsl(var(--accent-gold))',
                            marginBottom: '1.5rem',
                            border: '1px solid var(--glass-border)'
                        }}>
                            {step.icon}
                        </div>
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '0.8rem' }}>{step.title}</h3>
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
        <section style={{ padding: '6rem 1rem', background: 'linear-gradient(to top, #000, hsl(240 12% 10%))' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4rem' }}>
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    style={{ flex: '1 1 400px' }}
                >
                    <h2 style={{ fontSize: '2.5rem', marginBottom: '1.5rem' }}>Eat With Confidence</h2>
                    <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '1.1rem', marginBottom: '2rem', lineHeight: 1.7 }}>
                        Whether you're in Tokyo or Tuscany, never order something you won't enjoy. Menu Decoder bridges the gap between text and taste.
                    </p>
                    <ul style={{ listStyle: 'none' }}>
                        {features.map((f, i) => (
                            <motion.li
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.2 + (i * 0.1) }}
                                style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem', fontSize: '1.1rem' }}
                            >
                                <CheckCircle2 color="hsl(var(--accent-basil))" size={20} style={{ marginRight: '12px' }} />
                                {f}
                            </motion.li>
                        ))}
                    </ul>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
                    whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, type: "spring" }}
                    style={{ flex: '1 1 400px', height: '450px', position: 'relative' }}
                    className="glass-panel"
                >
                    {/* Abstract Phone Mockup */}
                    <div style={{
                        position: 'absolute', inset: '1rem',
                        background: 'linear-gradient(135deg, hsla(var(--accent-berry), 0.1), hsla(var(--accent-gold), 0.05))',
                        borderRadius: '12px',
                        border: '1px solid var(--glass-border)',
                        overflow: 'hidden',
                        display: 'flex', flexDirection: 'column'
                    }}>
                        {/* Mock UI Header */}
                        <div style={{ padding: '15px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ff5f56' }} />
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ffbd2e' }} />
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#27c93f' }} />
                        </div>

                        {/* Mock Content */}
                        <div style={{ padding: '20px', display: 'grid', gap: '15px' }}>
                            {/* Mock Item 1 */}
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <div style={{ width: '60px', height: '60px', borderRadius: '8px', background: 'hsla(var(--accent-gold), 0.2)' }} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ width: '60%', height: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', marginBottom: '8px' }} />
                                    <div style={{ width: '40%', height: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }} />
                                </div>
                            </div>
                            {/* Mock Item 2 */}
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <div style={{ width: '60px', height: '60px', borderRadius: '8px', background: 'hsla(var(--accent-berry), 0.2)' }} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ width: '70%', height: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', marginBottom: '8px' }} />
                                    <div style={{ width: '50%', height: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }} />
                                </div>
                            </div>
                            {/* Mock Item 3 */}
                            <div style={{ display: 'flex', gap: '10px', opacity: 0.5 }}>
                                <div style={{ width: '60px', height: '60px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)' }} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ width: '50%', height: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', marginBottom: '8px' }} />
                                    <div style={{ width: '30%', height: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

const Footer = () => (
    <footer style={{ padding: '4rem 1rem', textAlign: 'center', borderTop: '1px solid var(--glass-border)', background: 'hsla(240, 10%, 6%, 0.8)' }}>
        <p style={{ color: 'hsl(var(--text-secondary))' }}>© 2026 Menu Decoder. Bon Appétit.</p>
    </footer>
);

export default LandingPage;
