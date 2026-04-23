import { createBrowserRouter, Navigate } from 'react-router-dom';
import Home from './views/Home/Home';
import HomeAuth from './views/HomeAuth/HomeAuth';
import CompleteProfile from './views/CompleteProfile/CompleteProfile';
import Profile from './views/Profile/Profile';
import ProjectDash from './views/ProjectDash/ProjectDash';
import Tasks from './views/ProjectDash/Tasks/Tasks';
import NotificationsPage from './views/ProjectDash/Notifications/NotificationsPage';
import Settings from './views/ProjectDash/Settings/Settings';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import AppLayout from './components/AppLayout/AppLayout';
import Notes from './views/Notes/Notes';

export const router = createBrowserRouter([
  { path: '/', element: <Home /> },
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/complete-profile', element: <CompleteProfile /> },
      {
        element: <AppLayout />,
        children: [
          { path: '/home', element: <HomeAuth /> },
          { path: '/notes', element: <Notes /> },
          { path: '/profile', element: <Profile /> },
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
