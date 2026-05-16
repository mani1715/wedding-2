import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
// Public + landing
import LandingPage from './pages/LandingPage';
import LuxuryPreview from './pages/LuxuryPreview';
import LuxuryPublicInvitation from './pages/LuxuryPublicInvitation';
import CoupleAccess from './pages/CoupleAccess';
import ThemeShowroom from './pages/ThemeShowroom';

// Photographer admin (luxury)
import AdminLogin from './pages/AdminLogin';
import LuxuryDashboard from './pages/LuxuryDashboard';
import LuxuryProfileForm from './pages/LuxuryProfileForm';

// Super admin
import SuperAdminLogin from './pages/SuperAdminLogin';
import LuxurySuperAdminDashboard from './pages/LuxurySuperAdminDashboard';

// Existing functional sub-pages (kept for routing — body class wraps make them luxe)
import RSVPManagement from './pages/RSVPManagement';import GuestListManager from './pages/GuestListManager';
import Phase30AnalyticsPage from './pages/Phase30AnalyticsPage';
import GreetingsManagement from './pages/GreetingsManagement';
import WishesManagement from './pages/WishesManagement';
import PostWeddingManagement from './pages/PostWeddingManagement';
import QRCodeManagement from './pages/QRCodeManagement';
import AuditLogsPage from './pages/AuditLogsPage';
import ReferralsCreditsPage from './pages/ReferralsCreditsPage';
import ThemeSettingsPage from './pages/ThemeSettingsPage';

// Phase 38 — premium features
import LivePhotoWall from './pages/LivePhotoWall';
import LiveGalleryManagement from './pages/LiveGalleryManagement';
import AIStudio from './pages/AIStudio';
import WhatsAppManager from './pages/WhatsAppManager';
import DigitalShagunSettings from './pages/DigitalShagunSettings';
import GiftRegistryEditor from './pages/GiftRegistryEditor';
import GalleryManager from './pages/GalleryManager';
import PhotographerLiveMode from './pages/PhotographerLiveMode';

// Legacy fallbacks
import AdminDashboard from './pages/AdminDashboard';
import ProfileForm from './pages/ProfileForm';
import PublicInvitation from './pages/PublicInvitation';
import SuperAdminDashboard from './pages/SuperAdminDashboard';

// Monetization (credit packs, top-up, photographer detail)
import CreditPacksAdmin from './pages/CreditPacksAdmin';
import PhotographerDetail from './pages/PhotographerDetail';
import CreditsTopUp from './pages/CreditsTopUp';

import './App.css';

function App() {
  React.useEffect(() => {
    // Apply luxury cinematic theme globally to all pages
    document.body.classList.add('luxe', 'luxe-grain', 'luxe-vignette');
    return () => document.body.classList.remove('luxe', 'luxe-grain', 'luxe-vignette');
  }, []);

  return (
    <ErrorBoundary>
      <HelmetProvider>
        <AuthProvider>
          <div className="App">
            <BrowserRouter>
              <Routes>
                {/* Public */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/themes" element={<ThemeShowroom />} />
                <Route path="/themes/:themeId" element={<ThemeShowroom />} />
                <Route path="/preview/luxe" element={<LuxuryPreview />} />
                <Route path="/invite/:slug" element={<LuxuryPublicInvitation />} />
                <Route path="/invite/:slug/:eventType" element={<LuxuryPublicInvitation />} />
                <Route path="/invite-legacy/:slug" element={<PublicInvitation />} />
                <Route path="/invite-legacy/:slug/:eventType" element={<PublicInvitation />} />

                {/* Couple portal */}
                <Route path="/couple/access" element={<CoupleAccess />} />
                <Route path="/couple/access/:slug" element={<CoupleAccess />} />

                {/* Super Admin */}
                <Route path="/super-admin/login" element={<SuperAdminLogin />} />
                <Route path="/super-admin/dashboard" element={<LuxurySuperAdminDashboard />} />
                <Route path="/super-admin/dashboard-legacy" element={<SuperAdminDashboard />} />

                {/* Photographer Admin */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin/dashboard" element={<LuxuryDashboard />} />
                <Route path="/admin/dashboard-legacy" element={<AdminDashboard />} />

                {/* Wedding Editor (luxury wizard) */}
                <Route path="/admin/profile/new" element={<LuxuryProfileForm />} />
                <Route path="/admin/profile/:profileId/edit" element={<LuxuryProfileForm />} />
                <Route path="/admin/wedding/:weddingId/edit" element={<LuxuryProfileForm />} />

                {/* Legacy editor */}
                <Route path="/admin/profile-legacy/new" element={<ProfileForm />} />
                <Route path="/admin/profile-legacy/:profileId/edit" element={<ProfileForm />} />

                {/* Functional sub-pages (unchanged) */}
                <Route path="/admin/profile/:profileId/rsvps" element={<RSVPManagement />} />
                <Route path="/admin/profile/:profileId/guests" element={<GuestListManager />} />
                <Route path="/admin/profile/:profileId/analytics" element={<Phase30AnalyticsPage />} />
                <Route path="/admin/profile/:profileId/greetings" element={<GreetingsManagement />} />
                <Route path="/admin/profile/:profileId/wishes" element={<WishesManagement />} />
                <Route path="/admin/profile/:profileId/post-wedding" element={<PostWeddingManagement />} />
                <Route path="/admin/profile/:profileId/qr-codes" element={<QRCodeManagement />} />
                <Route path="/admin/profile/:profileId/referrals" element={<ReferralsCreditsPage />} />
                <Route path="/admin/profile/:profileId/theme-settings" element={<ThemeSettingsPage />} />
                <Route path="/admin/audit-logs" element={<AuditLogsPage />} />

                {/* Phase 38 — premium features */}
                <Route path="/admin/profile/:profileId/ai-studio" element={<AIStudio />} />
                <Route path="/admin/profile/:profileId/live-gallery" element={<LiveGalleryManagement />} />
                <Route path="/admin/profile/:profileId/whatsapp" element={<WhatsAppManager />} />
                <Route path="/admin/profile/:profileId/shagun" element={<DigitalShagunSettings />} />
                <Route path="/admin/profile/:profileId/gifts" element={<GiftRegistryEditor />} />
                <Route path="/admin/profile/:profileId/gallery" element={<GalleryManager />} />
                <Route path="/live/:profileId" element={<PhotographerLiveMode />} />
                <Route path="/invite/:slug/live-gallery" element={<LivePhotoWall />} />

                {/* Monetization */}
                <Route path="/super-admin/credit-packs" element={<CreditPacksAdmin />} />
                <Route path="/super-admin/photographers/:adminId" element={<PhotographerDetail />} />
                <Route path="/admin/credits/top-up" element={<CreditsTopUp />} />
              </Routes>
            </BrowserRouter>
          </div>
        </AuthProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;
