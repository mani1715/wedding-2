import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Volume2, VolumeX } from 'lucide-react';
import OpeningScreen from '@/components/invitation/OpeningScreen';
import InvitationContent from '@/components/invitation/InvitationContent';
import ParticleEffects from '@/components/invitation/ParticleEffects';

export const InvitationViewer = () => {
  const { design } = useParams();
  const navigate = useNavigate();
  const [showOpening, setShowOpening] = useState(true);
  const [deity, setDeity] = useState('ganesha'); // ganesha, venkateswara, shiva, none
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    // Opening screen shows for 3 seconds
    const timer = setTimeout(() => {
      setShowOpening(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Try to auto-play music after opening screen
    if (!showOpening && audioRef.current) {
      audioRef.current.play().catch(() => {
        // Auto-play was prevented, user needs to interact first
        setIsMuted(true);
      });
    }
  }, [showOpening]);

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.play();
        setIsMuted(false);
      } else {
        audioRef.current.pause();
        setIsMuted(true);
      }
    }
  };

  return (
    <div className="luxe relative min-h-screen overflow-x-hidden">
      {/* Background Music */}
      <audio
        ref={audioRef}
        loop
        src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
      />

      {/* Opening Screen */}
      {showOpening && <OpeningScreen design={design} deity={deity} />}

      {/* Main Invitation Content */}
      {!showOpening && (
        <>
          <ParticleEffects design={design} />
          <InvitationContent design={design} deity={deity} />
          
          {/* Back Button */}
          <div className="fixed top-4 left-4 z-50">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/')}
              className="bg-white/80 backdrop-blur-sm hover:bg-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>

          {/* Music Toggle Button */}
          <div className="fixed top-4 right-4 z-50">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleMute}
              className="bg-white/80 backdrop-blur-sm hover:bg-white"
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default InvitationViewer;
