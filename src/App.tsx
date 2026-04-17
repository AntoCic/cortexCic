import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { useAppSelector } from "./store";
import { useAuthInit } from "./db/auth/useAuthInit";

const App = () => {
  useAuthInit();
  const loading = useAppSelector((s) => s.auth.loading);

  if (loading) return null;

  return <RouterProvider router={router} />;
};

export default App;
