import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabase';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Handle OAuth callback
    const handleCallback = async () => {
      try {
        // Get session from URL hash
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Auth callback error:', error);
          navigate('/login');
          return;
        }

        if (session) {
          // Check if user metadata exists
          const { data: userMeta, error: metaError } = await supabase
            .from('user_metadata')
            .select('id')
            .eq('id', session.user.id)
            .single();

          // If user metadata doesn't exist, create it (for OAuth users)
          if (metaError || !userMeta) {
            await supabase.from('user_metadata').insert([
              {
                id: session.user.id,
                full_name: session.user.user_metadata.full_name || session.user.user_metadata.name,
                subscription_tier: 'free',
                subscription_status: 'active',
              },
            ]);
          }

          // Redirect to dashboard
          navigate('/dashboard');
        } else {
          navigate('/login');
        }
      } catch (error) {
        console.error('Unexpected error:', error);
        navigate('/login');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="spinner mb-4"></div>
        <p className="text-gray-400">Completing authentication...</p>
      </div>
    </div>
  );
};

export default AuthCallback;