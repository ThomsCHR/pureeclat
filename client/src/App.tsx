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
      </Routes>
    </BrowserRouter>
  );
}

export default App
