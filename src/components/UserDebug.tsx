import { useState, useEffect } from 'react';
import { authService } from '../services/authService';

/**
 * Temporary debug component to check authentication data
 * Add this to your Layout.tsx temporarily to debug
 */
const UserDebug = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [debugInfo, setDebugInfo] = useState<any>(null);


    useEffect(() => {
        const user = authService.getCurrentUser();
        const token = authService.getToken();

        // Decode JWT token to see claims
        let decodedToken = null;
        if (token) {
            try {
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(
                    atob(base64)
                        .split('')
                        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                        .join('')
                );
                decodedToken = JSON.parse(jsonPayload);
            } catch (e) {
                console.error('Failed to decode token:', e);
            }
        }

        setDebugInfo({
            localStorageUser: user,
            localStorageToken: token?.substring(0, 50) + '...',
            decodedToken: decodedToken,
            allLocalStorage: {
                auth_token: localStorage.getItem('auth_token')?.substring(0, 50) + '...',
                user_data: localStorage.getItem('user_data'),
                token: localStorage.getItem('token')?.substring(0, 50) + '...'
            }
        });
    }, []);

    if (!debugInfo) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 10,
            right: 10,
            background: 'white',
            border: '2px solid red',
            padding: '10px',
            zIndex: 9999,
            maxWidth: '400px',
            maxHeight: '80vh',
            overflow: 'auto',
            fontSize: '12px'
        }}>
            <h3 style={{ margin: '0 0 10px 0', color: 'red' }}>🐛 DEBUG INFO</h3>

            <div style={{ marginBottom: '10px' }}>
                <strong>User from getCurrentUser():</strong>
                <pre style={{ background: '#f5f5f5', padding: '5px', overflow: 'auto' }}>
                    {JSON.stringify(debugInfo.localStorageUser, null, 2)}
                </pre>
            </div>

            <div style={{ marginBottom: '10px' }}>
                <strong>Decoded JWT Token:</strong>
                <pre style={{ background: '#f5f5f5', padding: '5px', overflow: 'auto' }}>
                    {JSON.stringify(debugInfo.decodedToken, null, 2)}
                </pre>
            </div>

            <div>
                <strong>All LocalStorage Keys:</strong>
                <pre style={{ background: '#f5f5f5', padding: '5px', overflow: 'auto' }}>
                    {JSON.stringify(debugInfo.allLocalStorage, null, 2)}
                </pre>
            </div>
        </div>
    );
};

export default UserDebug;