import { Toaster } from "@/components/ui/toaster"

import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, useLocation, useNavigate, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { useEffect, Suspense, lazy } from 'react';
import { LanguageProvider } from '@/lib/LanguageContext';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import ProtectedRoute from '@/components/ProtectedRoute';
import QRCodePage from './pages/QRCode';
const DriverModePage = lazy(() => import('./pages/DriverMode'));
const KDSPage = lazy(() => import('./pages/KDS'));
const HotelManagementPage = lazy(() => import('./pages/HotelManagement'));
const RoomsPage = lazy(() => import('./pages/Rooms'));
const HRPage = lazy(() => import('./pages/HR'));
const GuestExperiencePage = lazy(() => import('./pages/GuestExperience'));
const MarketingPage = lazy(() => import('./pages/Marketing'));
const GuestPortalPage = lazy(() => import('./pages/GuestPortalPage'));
const EventsPage = lazy(() => import('./pages/Events'));
const SpaAmenitiesPage = lazy(() => import('./pages/SpaAmenities'));
const SupplierMarketplacePage = lazy(() => import('./pages/SupplierMarketplace'));
const SuperAdminPage = lazy(() => import('./pages/SuperAdmin'));
const TenantOnboardingPage = lazy(() => import('./pages/TenantOnboarding'));
const BillingPage = lazy(() => import('./pages/Billing'));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AppLayout = () => {
  const { needsOnboarding } = useAuth();
  const location = useLocation();

  if (needsOnboarding && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return <ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />;
};

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public auth routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* All app routes gated by ProtectedRoute (layout route) */}
      <Route element={<AppLayout />}>
        <Route path="/" element={
          <LayoutWrapper currentPageName={mainPageKey}>
            <MainPage />
          </LayoutWrapper>
        } />
        {Object.entries(Pages).map(([path, Page]) => (
          <Route
            key={path}
            path={`/${path}`}
            element={
              <LayoutWrapper currentPageName={path}>
                <Page />
              </LayoutWrapper>
            }
          />
        ))}

        <Route path="/DriverMode" element={<LayoutWrapper currentPageName="DriverMode"><Suspense fallback={null}><DriverModePage /></Suspense></LayoutWrapper>} />
        <Route path="/QRCode" element={<LayoutWrapper currentPageName="QRCode"><QRCodePage /></LayoutWrapper>} />
        <Route path="/KDS" element={<LayoutWrapper currentPageName="KDS"><Suspense fallback={null}><KDSPage /></Suspense></LayoutWrapper>} />
        <Route path="/HotelManagement" element={<LayoutWrapper currentPageName="HotelManagement"><Suspense fallback={null}><HotelManagementPage /></Suspense></LayoutWrapper>} />
        <Route path="/Rooms" element={<LayoutWrapper currentPageName="Rooms"><Suspense fallback={null}><RoomsPage /></Suspense></LayoutWrapper>} />
        <Route path="/HR" element={<LayoutWrapper currentPageName="HR"><Suspense fallback={null}><HRPage /></Suspense></LayoutWrapper>} />
        <Route path="/GuestExperience" element={<LayoutWrapper currentPageName="GuestExperience"><Suspense fallback={null}><GuestExperiencePage /></Suspense></LayoutWrapper>} />
        <Route path="/Marketing" element={<LayoutWrapper currentPageName="Marketing"><Suspense fallback={null}><MarketingPage /></Suspense></LayoutWrapper>} />
        <Route path="/GuestPortal" element={<LayoutWrapper currentPageName="GuestPortal"><Suspense fallback={null}><GuestPortalPage /></Suspense></LayoutWrapper>} />
        <Route path="/Events" element={<LayoutWrapper currentPageName="Events"><Suspense fallback={null}><EventsPage /></Suspense></LayoutWrapper>} />
        <Route path="/SpaAmenities" element={<LayoutWrapper currentPageName="SpaAmenities"><Suspense fallback={null}><SpaAmenitiesPage /></Suspense></LayoutWrapper>} />
        <Route path="/SupplierMarketplace" element={<LayoutWrapper currentPageName="SupplierMarketplace"><Suspense fallback={null}><SupplierMarketplacePage /></Suspense></LayoutWrapper>} />
        <Route path="/SuperAdmin" element={<LayoutWrapper currentPageName="SuperAdmin"><Suspense fallback={null}><SuperAdminPage /></Suspense></LayoutWrapper>} />
        <Route path="/onboarding" element={<Suspense fallback={null}><TenantOnboardingPage /></Suspense>} />
        <Route path="/Billing" element={<LayoutWrapper currentPageName="Billing"><Suspense fallback={null}><BillingPage /></Suspense></LayoutWrapper>} />
        <Route path="*" element={<PageNotFound />} />
      </Route>
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <LanguageProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <NavigationTracker />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
      </LanguageProvider>
    </AuthProvider>
  )
}

export default App