'use client'

import { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import styles from './AdminSidebar.module.css';

export default function DashboardLayout({ children, sidebar }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className={styles.dashboardContainer}>
      {/* Mobile sidebar toggle button */}
      <button 
        className={`d-lg-none ${styles.mobileToggle}`}
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        ☰
      </button>

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarContent}>
          <h2 className={styles.sidebarTitle}>Admin Panel</h2>
          {sidebar}
        </div>
      </aside>

      {/* Main content */}
      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  );
}