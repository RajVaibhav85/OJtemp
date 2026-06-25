import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
        <div style={{ 
            display: 'flex', justifyContent: 'center', alignItems: 'center', 
            height: '100vh', background: '#1e1e1e', color: '#fff' 
        }}>
            <h3>Loading your environment...</h3>
        </div>
        );
    }

    if (!user) {
        return <Navigate to="/auth" replace />;
    }

    return children;
}