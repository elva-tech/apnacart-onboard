import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { OnboardingProvider } from './context/OnboardingContext'
import { CatalogProvider } from './context/CatalogContext'
import { AuthProvider } from './context/AuthContext'
import { CatalogGuard } from './components/catalog/CatalogGuard'
import { CustomerGuard, AdminGuard, GuestGuard } from './components/workflow/WorkflowGuards'
import { RegisterPage } from './pages/auth/LoginPage'
import { DashboardPage } from './pages/workflow/DashboardPage'
import { StoreInformationHub, ComplianceHub, CatalogHub } from './pages/workflow/WorkflowHubPages'
import { AgreementsPage } from './pages/workflow/AgreementsPage'
import { WorkflowReviewPage } from './pages/workflow/WorkflowReviewPage'
import { AdminMerchantsPage } from './pages/admin/AdminPages'
import { AdminMerchantDetailPage } from './pages/admin/AdminMerchantDetailPage'
import { WelcomePage } from './pages/WelcomePage'
import { BusinessInfoPage } from './pages/BusinessInfoPage'
import { StoreLocationPage } from './pages/StoreLocationPage'
import { DeliveryConfigPage } from './pages/DeliveryConfigPage'
import { StoreTimingsPage } from './pages/StoreTimingsPage'
import { BrandingPage } from './pages/BrandingPage'
import { AdminAccountPage } from './pages/AdminAccountPage'
import { MerchantOperationsPage } from './pages/MerchantOperationsPage'
import { LegalDocumentsPage } from './pages/LegalDocumentsPage'
import { BankingInformationPage } from './pages/BankingInformationPage'
import { StoreAssetsPage } from './pages/StoreAssetsPage'
import { ReviewPage } from './pages/ReviewPage'
import { SuccessPage } from './pages/SuccessPage'
import { CatalogDashboardPage } from './pages/catalog/CatalogDashboardPage'
import { ProductUploadPage } from './pages/catalog/ProductUploadPage'
import { ImageUploadPage } from './pages/catalog/ImageUploadPage'
import { ProductReviewPage } from './pages/catalog/ProductReviewPage'
import { CategoryManagementPage } from './pages/catalog/CategoryManagementPage'
import { CatalogReportsPage } from './pages/catalog/CatalogReportsPage'

function CatalogRoutes() {
  return (
    <CatalogGuard>
      <Routes>
        <Route path="/" element={<CatalogDashboardPage />} />
        <Route path="/upload" element={<ProductUploadPage />} />
        <Route path="/images" element={<ImageUploadPage />} />
        <Route path="/review" element={<ProductReviewPage />} />
        <Route path="/categories" element={<CategoryManagementPage />} />
        <Route path="/reports" element={<CatalogReportsPage />} />
        <Route path="*" element={<Navigate to="/catalog" replace />} />
      </Routes>
    </CatalogGuard>
  )
}

function CustomerFormRoutes() {
  return (
    <CustomerGuard>
      <Routes>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/workflow/store" element={<StoreInformationHub />} />
        <Route path="/workflow/compliance" element={<ComplianceHub />} />
        <Route path="/workflow/catalog" element={<CatalogHub />} />
        <Route path="/workflow/agreements" element={<AgreementsPage />} />
        <Route path="/workflow/review" element={<WorkflowReviewPage />} />
        <Route path="/business" element={<BusinessInfoPage />} />
        <Route path="/location" element={<StoreLocationPage />} />
        <Route path="/delivery" element={<DeliveryConfigPage />} />
        <Route path="/timings" element={<StoreTimingsPage />} />
        <Route path="/branding" element={<BrandingPage />} />
        <Route path="/store-admin" element={<AdminAccountPage />} />
        <Route path="/operations" element={<MerchantOperationsPage />} />
        <Route path="/documents" element={<LegalDocumentsPage />} />
        <Route path="/banking" element={<BankingInformationPage />} />
        <Route path="/assets" element={<StoreAssetsPage />} />
        <Route path="/review" element={<ReviewPage />} />
        <Route path="/success" element={<SuccessPage />} />
        <Route path="/catalog/*" element={<CatalogRoutes />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </CustomerGuard>
  )
}

function App() {
  return (
    <OnboardingProvider>
      <AuthProvider>
        <CatalogProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<GuestGuard><WelcomePage /></GuestGuard>} />
              <Route path="/login" element={<Navigate to="/" replace />} />
              <Route path="/register" element={<GuestGuard><RegisterPage /></GuestGuard>} />
              <Route path="/admin/login" element={<Navigate to="/" replace />} />
              <Route path="/admin" element={<AdminGuard><AdminMerchantsPage /></AdminGuard>} />
              <Route path="/admin/merchants/:merchantCode" element={<AdminGuard><AdminMerchantDetailPage /></AdminGuard>} />
              <Route path="/*" element={<CustomerFormRoutes />} />
            </Routes>
          </BrowserRouter>
        </CatalogProvider>
      </AuthProvider>
    </OnboardingProvider>
  )
}

export default App
