import { BrowserRouter, Routes, Route } from 'react-router-dom'
import React from 'react'
import HomePage from './pages/HomePage.jsx'
import SignInPage from './pages/SignInPage.jsx'
import SignUpPage from './pages/SignUpPage.jsx'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import PrivateRoute from './components/PrivateRoute.jsx'
import OnlyAdminPrivateRoute from './components/OnlyAdminPrivateRoute.jsx'
import NotFound from './pages/NotFound.jsx'
import ScrollToTop from './components/ScrollToTop.jsx'
import AboutUs from './pages/AboutPage.jsx'
import DashboardDirector from './pages/DashboardDirector.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import ManagerDashboard from './pages/ManagerDashboard.jsx'
import WaiterDashboard from './pages/WaiterDashboard.jsx'
import ReceptionDashboard from './pages/ReceptionDashboard.jsx'
import OnlyManagerPrivateRoute from './components/OnlyManagerPrivateRoute.jsx'
import OnlyWaiterPrivateRoute from './components/OnlyWaiterPrivateRoute.jsx'
import OnlyReceptionPrivateRoute from './components/OnlyReceptionPrivateRoute.jsx'
import QrOrderPage from "./pages/QrOrderPage";


export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Header />
      <Routes>
        <Route path="*" element={<NotFound />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/staff-sign-in" element={<SignInPage />} />
        <Route path="/admin-sign-up-page" element={<SignUpPage />} />
        <Route path="/qr-order/:tableNumber" element={<QrOrderPage />} />

        <Route element={<PrivateRoute />}>
          <Route path="/dashboard-director" element={<DashboardDirector />} />
        </Route>

        <Route element={<OnlyAdminPrivateRoute />}>
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
        </Route>

        <Route element={<OnlyManagerPrivateRoute />}>
          <Route path="/manager-dashboard" element={<ManagerDashboard />} />
        </Route>

        <Route element={<OnlyWaiterPrivateRoute />}>
          <Route path="/waiter-dashboard" element={<WaiterDashboard />} />
        </Route>

        <Route element={<OnlyReceptionPrivateRoute />}>
          <Route path="/reception-dashboard" element={<ReceptionDashboard />} />
        </Route>


      </Routes>
      <Footer />
    </BrowserRouter>
  )
}
