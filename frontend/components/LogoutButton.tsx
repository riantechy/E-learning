// components/LogoutButton.tsx
'use client'

import { useAuth } from '@/context/AuthContext';

export default function LogoutButton() {
  const { logout } = useAuth();

  return (
    <button onClick={logout} className="btn btn-outline-danger">
      Logout
    </button>
  );
}