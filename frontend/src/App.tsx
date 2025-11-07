import { Route, Routes } from "react-router";
import "./App.css";
import { LoginForm } from "./components/login-form";
import { SignupForm } from "./components/signup-form";
import AuthLayout from "./pages/auth/authlayout";

function App() {
  return (
    <Routes>
      <Route path="/" element={<AuthLayout />}>
        <Route index element={<LoginForm />} />
        <Route path="signup" element={<SignupForm />} />
      </Route>
    </Routes>
  );
}

export default App;
