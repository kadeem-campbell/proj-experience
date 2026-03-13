import { Navigate } from 'react-router-dom';

// ManagementDashboard is now merged into AdminPanel
export default function ManagementDashboard() {
  return <Navigate to="/admin" replace />;
}
