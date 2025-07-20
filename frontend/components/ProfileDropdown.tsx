// components/ProfileDropdown.tsx
'use client'

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Dropdown, Image } from 'react-bootstrap';
import { usersApi } from '@/lib/api';

export default function ProfileDropdown({ user }: { user: any }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await usersApi.logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <Dropdown show={showDropdown} onToggle={(isOpen) => setShowDropdown(isOpen)}>
      <Dropdown.Toggle variant="light" id="dropdown-profile" className="d-flex align-items-center">
        <Image
          src={user?.profileImage || '/images/default-profile.png'}
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