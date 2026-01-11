import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Search, UtensilsCrossed, Zap, ArrowRight, CheckCircle2, Loader2, X, UploadCloud, ChefHat, ImageIcon } from 'lucide-react';
import { compressImage } from './utils/imageUtils';

const LandingPage = () => {
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);
    const [language, setLanguage] = useState('English');
    const [searchWarning, setSearchWarning] = useState(null);
    const fileInputRef = useRef(null);
    const resultsRef = useRef(null);

    const handleCameraClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
            fileInputRef.current.click();
        }
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
            console.log("Compressing image...");
            const compressedBase64 = await compressImage(file);
            console.log("Compression done. Sending to API...");
            setPreviewImage(compressedBase64);

            // 2. Send JSON to Serverless Function
            const response = await fetch('http://localhost:3000/api/decode-menu', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    image: compressedBase64,
                    language: language
                }),
            });

            console.log("Response status:", response.status);
            const data = await response.json();
            console.log("Response data:", data);

            if (response.ok && data.results) {
                setResults(data.results);
                setSearchWarning(data.searchWarning);
                setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
            } else if (data.error) {
                console.error("API Error:", data.error);
                alert(`Error processing menu: ${data.error}`);
            } else {
                console.warn("Unexpected response format:", data);
                alert("Unexpected response from server. Check console for details.");
            }
        } catch (error) {
            console.error("Fetch Error:", error);
            alert(`Failed to connect to the server: ${error.message}. Make sure 'npm run api' is running.`);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            processFile(file);
        }
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
            <Navbar onCameraClick={handleCameraClick} language={language} setLanguage={setLanguage} />

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
                            key="loader"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.5 }}
                        >
                            <Loader2 size={64} color="hsl(var(--accent-gold))" className="animate-spin" />
                        </motion.div>
                        <h2 style={{ marginTop: '2rem', fontSize: '2rem' }}>Analyzing Menu...</h2>
                        <p style={{ color: 'hsl(var(--text-secondary))' }}>Identifying dishes and generating mouth-watering visuals...</p>
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
                            <h2 style={{ fontSize: '2rem' }}>Decoded Menu ({language})</h2>
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
                                                display: 'flex', flexDirection: 'column', overflow: 'hidden',
                                                background: 'hsla(240, 12%, 14%, 0.8)',
                                                padding: '1rem',
                                                gap: '1rem'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                                <div style={{ width: '120px', height: '120px', flexShrink: 0, background: '#000', borderRadius: '12px', overflow: 'hidden', position: 'relative' }}>
                                                    {item.image ? (
                                                        <img
                                                            src={item.image}
                                                            alt={item.dish}
                                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                            onError={(e) => {
                                                                console.error(`Image failed to load for ${item.dish}`);
                                                                e.target.style.display = 'none';
                                                                e.target.nextSibling.style.display = 'flex';
                                                            }}
                                                        />
                                                    ) : null}
                                                    <div style={{
                                                        width: '100%', height: '100%',
                                                        display: item.image ? 'none' : 'flex',
                                                        alignItems: 'center', justifyContent: 'center',
                                                        color: '#555', background: 'rgba(0,0,0,0.5)'
                                                    }}>
                                                        <UtensilsCrossed size={32} />
                                                    </div>
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: 'hsl(var(--text-primary))' }}>{item.dish}</h3>
                                                    <p style={{ color: 'hsl(var(--text-secondary))', marginBottom: '0.5rem', fontSize: '0.95rem' }}>{item.description}</p>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <span style={{ fontSize: '0.9rem', color: 'hsl(var(--accent-gold))', fontWeight: 600 }}>{item.price}</span>
                                                        {item.error && (
                                                            <span style={{
                                                                fontSize: '0.8rem',
                                                                color: 'hsl(var(--accent-berry))',
                                                                opacity: 0.8,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '4px'
                                                            }}>
                                                                <ImageIcon size={12} /> Failed to generate
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
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

const Navbar = ({ onCameraClick, language, setLanguage }) => (
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

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: 'hsl(var(--text-primary))',
                    border: '1px solid var(--glass-border)',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    outline: 'none'
                }}
            >
                <option value="English" style={{ color: 'black' }}>English</option>
                <option value="Chinese (Simplified)" style={{ color: 'black' }}>中文 (Chinese)</option>
                <option value="Malay" style={{ color: 'black' }}>Bahasa Melayu</option>
            </select>

            <button onClick={onCameraClick} className="btn-primary" style={{ padding: '8px 20px', fontSize: '0.9rem' }}>
                Scan Menu
            </button>
        </div>
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
                        Decode a menu <ArrowRight size={20} style={{ display: 'inline', marginLeft: '8px', verticalAlign: 'text-bottom' }} />
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
