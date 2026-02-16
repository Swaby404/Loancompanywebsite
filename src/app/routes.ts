import { createBrowserRouter } from "react-router";
import Root from "./pages/Root";
import Landing from "./pages/Landing";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import LoanApplication from "./pages/LoanApplication";
import Loans from "./pages/Loans";
import LoanDetail from "./pages/LoanDetail";
import AdminTools from "./pages/AdminTools";
import NotFound from "./pages/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Landing },
      { path: "signin", Component: SignIn },
      { path: "signup", Component: SignUp },
      { path: "dashboard", Component: Dashboard },
      { path: "loan-application", Component: LoanApplication },
      { path: "loans", Component: Loans },
      { path: "loans/:loanId", Component: LoanDetail },
      { path: "admin-tools", Component: AdminTools },
      { path: "*", Component: NotFound },
    ],
  },
]);