'use client'

import { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import styles from './DashboardLayout.module.css';
import AdminTopbar from './AdminTopbar';

export default function DashboardLayout({ children, sidebar }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="container-fluid p-0 min-vh-100">
      {/* Topbar */}
      <AdminTopbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="row g-0">
        {/* Sidebar */}
        <div className={`col-lg-2 ${styles.sidebarWrapper} ${sidebarOpen ? styles.sidebarOpen : 'd-none d-lg-block'}`}>
          <aside className={`h-100 ${styles.sidebar}`}>
            <div className={styles.sidebarContent}>
              <h2 className={styles.sidebarTitle}></h2>
              {sidebar}
            </div>
          </aside>
        </div>

        {/* Main content */}
        <div className="col-lg-10 col-6">
          <main className={styles.mainContent}>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}