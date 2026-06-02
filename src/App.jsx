import { Toaster } from "@/components/ui/toaster"

import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { useEffect, Suspense, lazy } from 'react';
import { LanguageProvider } from '@/lib/LanguageContext';
import QRCodePage from './pages/QRCode';
const DriverModePage = lazy(() => import('./pages/DriverMode'));
const KDSPage = lazy(() => import('./pages/KDS'));
const HotelManagementPage = lazy(() => import('./pages/HotelManagement'));
const RoomsPage = lazy(() => import('./pages/Rooms'));
const HRPage = lazy(() => import('./pages/HR'));

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

      <Route path="/DriverMode" element={<LayoutWrapper currentPageName="DriverMode"><Suspense fallback={null}><DriverModePage /></Suspense></LayoutWrapper>} />
      <Route path="/QRCode" element={<LayoutWrapper currentPageName="QRCode"><QRCodePage /></LayoutWrapper>} />
      <Route path="/KDS" element={<LayoutWrapper currentPageName="KDS"><Suspense fallback={null}><KDSPage /></Suspense></LayoutWrapper>} />
      <Route path="/HotelManagement" element={<LayoutWrapper currentPageName="HotelManagement"><Suspense fallback={null}><HotelManagementPage /></Suspense></LayoutWrapper>} />
      <Route path="/Rooms" element={<LayoutWrapper currentPageName="Rooms"><Suspense fallback={null}><RoomsPage /></Suspense></LayoutWrapper>} />
      <Route path="/HR" element={<LayoutWrapper currentPageName="HR"><Suspense fallback={null}><HRPage /></Suspense></LayoutWrapper>} />
      <Route path="*" element={<PageNotFound />} />
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