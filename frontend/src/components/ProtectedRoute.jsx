import { Navigate, useLocation } from 'react-router-dom';
import { getStoredUser } from '../utils/auth';

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const user = getStoredUser();

  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  return children;
}
