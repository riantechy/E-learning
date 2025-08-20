// components/ProfileDropdown.tsx
'use client'

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Dropdown, Image } from 'react-bootstrap';
import { useAuth } from '@/context/AuthContext'; // Import useAuth
import { User } from '@/lib/api'; // Import User type

export default function ProfileDropdown({ user }: { user: User }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const router = useRouter();
  const { logout } = useAuth(); // Use logout from useAuth

  const handleLogout = async () => {
    try {
      logout(); // Call logout from AuthContext
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <Dropdown show={showDropdown} onToggle={(isOpen) => setShowDropdown(isOpen)}>
      <Dropdown.Toggle variant="light" id="dropdown-profile" className="d-flex align-items-center">
        <Image
          src={user?.profile_image || '/images/default-profile.png'} // Use profile_image
          roundedCircle
          width={40}
          height={40}
          alt="Profile"
          className="me-2"
        />
        <span className="d-none d-md-inline">{user?.first_name || 'Admin'}</span>
      </Dropdown.Toggle>

      <Dropdown.Menu align="end">
        <Dropdown.Item as={Link} href="/admin-dashboard/profile">
          Profile
        </Dropdown.Item>
        <Dropdown.Item as={Link} href="/admin-dashboard/settings">
          Settings
        </Dropdown.Item>
        <Dropdown.Divider />
        <Dropdown.Item onClick={handleLogout}>Logout</Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
}