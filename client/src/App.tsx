import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import About from "./pages/About";
import ServicePage from "./pages/Service";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage"
import ProfilePage from "./pages/ProfilePage";
import BookingPage from "./pages/BookingPage";
import PricingPage from "./pages/PricingPage";
import AddServicePage from "./pages/AddServicePage";
import AdminUsersPage from "./pages/AdminUsersPage";
import AdminUserAppointmentsPage from "./pages/AdminUserAppointmentsPage";
import ServicesListPage from "./pages/ServicesListPage";
import AddressesPage from "./pages/AddressesPage";
import ArticlePage from "./pages/ArticlePage";
import PlanningPage from "./pages/PlanningPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";




function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/soins/:slug" element={<ServicePage />} />
        <Route path="/connexion" element={<LoginPage />} />
        <Route path="/inscription" element={<RegisterPage />} />
        <Route path="/profil" element={<ProfilePage />} />
        <Route path="/reservation/:slug" element={<BookingPage />} />
        <Route path="/tarifs" element={<PricingPage />} />
        <Route path="/services" element={<AddServicePage />} />
        <Route path="/admin/users" element={<AdminUsersPage />} />
        <Route path="/admin/users/:id/appointments" element={<AdminUserAppointmentsPage />} />
        <Route path="/soins" element={<ServicesListPage />} />
        <Route path="/adresses" element={<AddressesPage />} />
        <Route path="/articles/:slug" element={<ArticlePage />} />
        <Route path="/planning" element={<PlanningPage />} />
        <Route path="/mot-de-passe-oublie" element={<ForgotPasswordPage />} />
        <Route path="/reinitialisation-mot-de-passe" element={<ResetPasswordPage />} />
        
      </Routes>
    </BrowserRouter>
  );
}

export default App
