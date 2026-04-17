import { createBrowserRouter } from 'react-router-dom';
import Home from './views/Home/Home';
import HomeAuth from './views/HomeAuth/HomeAuth';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';

export const router = createBrowserRouter([
  { path: '/', element: <Home /> },
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/home', element: <HomeAuth /> },
    ],
  },
]);
