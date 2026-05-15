import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Crown, Flower2, Heart, Film, Scroll, Palette, Globe } from 'lucide-react';

export const DesignSelector = () => {
  const navigate = useNavigate();
  const [hoveredDesign, setHoveredDesign] = useState(null);

  const designs = [
    {
      id: 'temple',
      name: 'Traditional South Indian Temple',
      description: 'Sacred temple aesthetics with saffron and gold',
      icon: Sparkles,
      color: 'temple',
      gradient: 'from-orange-300 via-amber-200 to-yellow-100'
    },
    {
      id: 'royal',
      name: 'Royal Classic Indian',
      description: 'Regal purple and magenta with golden accents',
      icon: Crown,
      color: 'royal',
      gradient: 'from-purple-300 via-pink-200 to-amber-100'
    },
    {
      id: 'floral',
      name: 'Floral Elegance',
      description: 'Soft pastels with botanical beauty',
      icon: Flower2,
      color: 'floral',
      gradient: 'from-rose-200 via-pink-100 to-green-100'
    },
    {
      id: 'divine',
      name: 'Divine Minimal',
      description: 'Clean, spiritual, and modern',
      icon: Heart,
      color: 'divine',
      gradient: 'from-amber-50 via-white to-gray-50'
    },
    {
      id: 'cinematic',
      name: 'Cinematic',
      description: 'Bold and dramatic with video-like feel',
      icon: Film,
      color: 'cinematic',
      gradient: 'from-slate-700 via-amber-400 to-red-400'
    },
    {
      id: 'scroll',
      name: 'Classic Scroll',
      description: 'Vintage parchment paper invitation',
      icon: Scroll,
      color: 'scroll',
      gradient: 'from-amber-200 via-orange-100 to-yellow-50'
    },
    {
      id: 'art',
      name: 'Cultural Art',
      description: 'Hand-painted traditional art style',
      icon: Palette,
      color: 'art',
      gradient: 'from-red-300 via-teal-200 to-purple-200'
    },
    {
      id: 'modern',
      name: 'Universal Modern',
      description: 'Contemporary and inclusive design',
      icon: Globe,
      color: 'modern',
      gradient: 'from-blue-200 via-cyan-100 to-pink-100'
    }
  ];

  return (
    <div className="luxe min-h-screen relative py-16 px-4" data-testid="design-selector">
      <div className="lux-orbit" style={{ width: 900, height: 900, top: -300, left: -300 }} />
      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="lux-eyebrow block mb-5">◆ Choose Your Story's Canvas</span>
          <h1 className="font-display text-5xl md:text-7xl leading-[1.04]" style={{ color: '#FFF8DC' }}>
            Eight cinematic <span className="text-gold font-script italic">worlds</span>
          </h1>
          <p className="mt-5 text-base md:text-lg max-w-2xl mx-auto" style={{ color: 'rgba(255,248,220,0.65)' }}>
            Locked layouts. Curated motion. Pick the soul of your wedding story.
          </p>
        </div>

        {/* Design Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {designs.map((design, index) => {
            const Icon = design.icon;
            return (
              <Card
                key={design.id}
                className="lux-glass group relative overflow-hidden cursor-pointer transition-all duration-700 hover:-translate-y-2"
                style={{
                  animationDelay: `${index * 0.1}s`
                }}
                onMouseEnter={() => setHoveredDesign(design.id)}
                onMouseLeave={() => setHoveredDesign(null)}
                onClick={() => navigate(`/invitation/${design.id}`)}
              >
                {/* Background Gradient — luxury veil */}
                <div className={`absolute inset-0 bg-gradient-to-br ${design.gradient} opacity-20 group-hover:opacity-35 transition-opacity duration-700 mix-blend-overlay`} />

                {/* Content */}
                <div className="relative p-7 h-full flex flex-col">
                  <div className="flex-1">
                    <div className="mb-5 w-12 h-12 rounded-xl grid place-items-center"
                      style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.18), rgba(139,0,0,0.18))', border: '1px solid var(--lux-border-strong)' }}>
                      <Icon className="w-5 h-5 transition-transform duration-500 group-hover:scale-110" style={{ color: '#D4AF37' }} />
                    </div>
                    <h3 className="font-display text-2xl mb-2" style={{ color: '#FFF8DC' }}>
                      {design.name}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,248,220,0.6)' }}>
                      {design.description}
                    </p>
                  </div>

                  <Button
                    className={`lux-btn lux-btn-ghost mt-6 justify-center transition-all duration-500 ${
                      hoveredDesign === design.id ? 'opacity-100 translate-y-0' : 'opacity-60 translate-y-1'
                    }`}
                  >
                    View Design
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Bottom Info */}
        <div className="mt-12 text-center text-gray-600 animate-fade-in">
          <p className="text-sm">
            Each design can be customized with optional spiritual themes or kept universal
          </p>
        </div>
      </div>
    </div>
  );
};

export default DesignSelector;
   </p>
        </div>
      </div>
    </div>
  );
};

export default DesignSelector;
