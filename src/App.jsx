import { Toaster } from "@/components/ui/toaster"
import Hotels from './pages/Hotels';
import HotelAdmin from './pages/HotelAdmin';
import HotelHome from './pages/hotel/HotelHome';
import HotelMenu from './pages/hotel/HotelMenu';
import HotelAbout from './pages/hotel/HotelAbout';
import HotelReservations from './pages/hotel/HotelReservations';
import HotelTrackOrder from './pages/hotel/HotelTrackOrder';
import HotelTableDining from './pages/hotel/HotelTableDining';
import HotelCustomize from './pages/hotel/HotelCustomize';
import HotelRecommendations from './pages/hotel/HotelRecommendations';
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { useEffect } from 'react';

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

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
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
      <Route path="/Hotels" element={<LayoutWrapper currentPageName="Hotels"><Hotels /></LayoutWrapper>} />
      <Route path="/hotel/:slug" element={<HotelHome />} />
      <Route path="/hotel/:slug/menu" element={<HotelMenu />} />
      <Route path="/hotel/:slug/about" element={<HotelAbout />} />
      <Route path="/hotel/:slug/reservations" element={<HotelReservations />} />
      <Route path="/hotel/:slug/track-order" element={<HotelTrackOrder />} />
      <Route path="/hotel/:slug/table-dining" element={<HotelTableDining />} />
      <Route path="/hotel/:slug/customize" element={<HotelCustomize />} />
      <Route path="/hotel/:slug/recommendations" element={<HotelRecommendations />} />
      <Route path="/hotel/:slug/admin" element={<HotelAdmin />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <NavigationTracker />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App