import { createBrowserRouter } from "react-router";
import Root from "./pages/Root";
import Landing from "./pages/Landing";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import LoanApplication from "./pages/LoanApplication";
import Loans from "./pages/Loans";
import LoanDetail from "./pages/LoanDetail";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminTools from "./pages/AdminTools";
import EmailSetup from "./pages/EmailSetup";
import NotFound from "./pages/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Landing },
      { path: "signin", Component: SignIn },
      { path: "signup", Component: SignUp },
      { path: "forgot-password", Component: ForgotPassword },
      { path: "reset-password", Component: ResetPassword },
      { path: "dashboard", Component: Dashboard },
      { path: "loan-application", Component: LoanApplication },
      { path: "loans", Component: Loans },
      { path: "loans/:loanId", Component: LoanDetail },
      { path: "admin-tools", Component: AdminTools },
      { path: "email-setup", Component: EmailSetup },
      { path: "*", Component: NotFound },
    ],
  },
  // Admin routes without Root wrapper
  { path: "admin/login", Component: AdminLogin },
  { path: "admin/dashboard", Component: AdminDashboard },
]);