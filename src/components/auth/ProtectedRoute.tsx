
import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth();
  
  // Si l'utilisateur n'est pas connecté et que le chargement est terminé, rediriger vers la page de connexion
  if (!isLoading && !user) {
    return <Navigate to="/auth" replace />;
  }
  
  // Afficher le contenu si l'utilisateur est connecté
  return <>{children}</>;
};

export default ProtectedRoute;
