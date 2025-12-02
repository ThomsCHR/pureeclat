import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import About from "./pages/About";
import ServicePage from "./pages/Service";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage"



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
      </Routes>
    </BrowserRouter>
  );
}

export default App
