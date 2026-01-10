import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Search, UtensilsCrossed, Zap, ArrowRight, CheckCircle2, Loader2, X, UploadCloud } from 'lucide-react';
import { compressImage } from './utils/imageUtils';

const LandingPage = () => {
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);
    const fileInputRef = useRef(null);
    const resultsRef = useRef(null);

    const handleCameraClick = () => {
        fileInputRef.current?.click();
    };

    const processFile = async (file) => {
        if (!file) return;

        // Basic validation
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file (JPG, PNG).');
            return;
        }

        setLoading(true);
        setResults(null);
        setPreviewImage(null);

        try {
            // 1. Compress Client-Side
            // Returns data:image/jpeg;base64,...
            const compressedBase64 = await compressImage(file);
            setPreviewImage(compressedBase64);

            // 2. Send JSON to Serverless Function
            const response = await fetch('http://localhost:3000/api/decode-menu', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ image: compressedBase64 }),
            });
            const data = await response.json();

            if (data.results) {
                setResults(data.results);
                setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
            } else {
                alert("No text found or error processing image.");
            }
        } catch (error) {
            console.error(error);
            alert("Failed to connect to the server. Make sure the local bridge is running.");
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        processFile(e.target.files?.[0]);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        processFile(file);
    };

    const closeResults = () => {
        setResults(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="landing-page">
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
                {!results && !loading && (
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        style={{ position: 'relative' }}
                    >
                        {/* Drag Overlay */}
                        <AnimatePresence>
                            {isDragging && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    style={{
                                        position: 'fixed', inset: 0, zIndex: 100,
                                        background: 'rgba(0,0,0,0.85)',
                                        backdropFilter: 'blur(8px)',
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                        border: '4px dashed var(--accent-gold)', margin: '1rem', borderRadius: '24px',
                                        pointerEvents: 'none' // Let events bubble to the div below
                                    }}
                                >
                                    <UploadCloud size={64} color="var(--accent-gold)" />
                                    <h2 style={{ marginTop: '2rem', fontSize: '2.5rem', color: 'white' }}>Drop Menu Here</h2>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <Hero onCameraClick={handleCameraClick} />
                        <HowItWorks />
                        <Features />
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div style={{
                        minHeight: '80vh', display: 'flex', flexDirection: 'column',
                        justifyContent: 'center', alignItems: 'center', textAlign: 'center'
                    }}>
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                        >
                            <Loader2 size={64} color="hsl(var(--accent-gold))" />
                        </motion.div>
                        <h2 style={{ marginTop: '2rem', fontSize: '2rem' }}>Analyzing Menu...</h2>
                        <p style={{ color: 'hsl(var(--text-secondary))' }}>Identifying dishes and finding delicious photos.</p>
                    </div>
                )}

                {/* Results View */}
                {results && (
                    <div ref={resultsRef} style={{
                        padding: '2rem 1rem',
                        maxWidth: '1200px',
                        margin: '0 auto',
                        minHeight: '100vh'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h2 style={{ fontSize: '2rem' }}>Decoded Menu</h2>
                            <button onClick={closeResults} className="btn-secondary" style={{
                                background: 'transparent', color: 'white', border: '1px solid var(--glass-border)',
                                padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px'
                            }}>
                                <X size={18} /> Close
                            </button>
                        </div>

                        <div className="results-grid" style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                            gap: '2rem',
                            alignItems: 'start'
                        }}>
                            {/* Left Column: Original Image (Sticky) */}
                            <div style={{ position: 'sticky', top: '100px' }}>
                                <h3 style={{ marginBottom: '1rem', color: 'hsl(var(--text-secondary))' }}>Original Menu</h3>
                                <div className="glass-panel" style={{ padding: '0.5rem', overflow: 'hidden' }}>
                                    <img
                                        src={previewImage}
                                        alt="Original Menu"
                                        style={{ width: '100%', borderRadius: '12px', display: 'block' }}
                                    />
                                </div>
                            </div>

                            {/* Right Column: Decoded Items */}
                            <div>
                                <h3 style={{ marginBottom: '1rem', color: 'hsl(var(--text-secondary))' }}>Identified Dishes</h3>
                                <div style={{ display: 'grid', gap: '1.5rem' }}>
                                    {results.map((item, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className="glass-panel"
                                            style={{
                                                display: 'flex', alignItems: 'center', overflow: 'hidden',
                                                background: 'hsla(240, 12%, 14%, 0.8)'
                                            }}
                                        >
                                            <div style={{ width: '120px', height: '120px', flexShrink: 0, background: '#000' }}>
                                                {item.image ? (
                                                    <img src={item.image} alt={item.dish} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555' }}>
                                                        <UtensilsCrossed size={32} />
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ padding: '1rem 1.5rem' }}>
                                                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: 'hsl(var(--text-primary))' }}>{item.dish}</h3>
                                                <span style={{ fontSize: '0.9rem', color: 'hsl(var(--accent-gold))', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Decoded</span>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                                <button onClick={handleCameraClick} className="btn-primary" style={{ width: '100%', marginTop: '3rem', justifyContent: 'center', display: 'flex' }}>
                                    <Camera size={20} style={{ marginRight: '10px' }} /> Scan Another Menu
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {!loading && !results && <Footer />}
        </div>
    );
};

/* --- Components --- */

const Navbar = ({ onCameraClick }) => (
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
        <button onClick={onCameraClick} className="btn-primary" style={{ padding: '8px 20px', fontSize: '0.9rem' }}>
            Scan Menu
        </button>
    </nav>
);

const Hero = ({ onCameraClick }) => {
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
                    <button onClick={onCameraClick} className="btn-primary">
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
