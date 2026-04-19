import { createBrowserRouter, Navigate } from 'react-router-dom';
import Home from './views/Home/Home';
import HomeAuth from './views/HomeAuth/HomeAuth';
import MotionShowcase from './views/MotionShowcase/MotionShowcase';
import GsapShowcase from './views/GsapShowcase/GsapShowcase';
import ProjectDash from './views/ProjectDash/ProjectDash';
import Tasks from './views/ProjectDash/Tasks/Tasks';
import NotificationsPage from './views/ProjectDash/Notifications/NotificationsPage';
import Settings from './views/ProjectDash/Settings/Settings';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import AppLayout from './components/AppLayout/AppLayout';

export const router = createBrowserRouter([
  { path: '/', element: <Home /> },
  { path: '/motion-showcase', element: <MotionShowcase /> },
  { path: '/gsap-showcase', element: <GsapShowcase /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/home', element: <HomeAuth /> },
          {
            path: '/project/:projectId',
            element: <ProjectDash />,
            children: [
              { index: true, element: <Navigate to="tasks" replace /> },
              { path: 'tasks', element: <Tasks /> },
              { path: 'notifications', element: <NotificationsPage /> },
              { path: 'settings', element: <Settings /> },
            ],
          },
        ],
      },
    ],
  },
]);
