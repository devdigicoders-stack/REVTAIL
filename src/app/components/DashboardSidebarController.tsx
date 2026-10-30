'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';

export default function DashboardSidebarController() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const closeSidebar = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  // Sync DOM classes whenever isOpen changes
  useEffect(() => {
    const sidebar = document.querySelector('.sidebar-wrapper');
    const overlay = document.getElementById('dashboard-sidebar-overlay');

    if (isOpen) {
      if (sidebar) sidebar.classList.add('show');
      if (overlay) overlay.classList.add('show');
      document.body.classList.add('sidebar-open');
      if (window.innerWidth <= 1200) {
        document.body.style.overflow = 'hidden';
      }
    } else {
      if (sidebar) sidebar.classList.remove('show');
      if (overlay) overlay.classList.remove('show');
      document.body.classList.remove('sidebar-open');
      document.body.style.overflow = '';
    }
  }, [isOpen]);

  // Clean up any rogue overlays injected by other scripts
  useEffect(() => {
    document
      .querySelectorAll('.sidebar-overlay:not(#dashboard-sidebar-overlay)')
      .forEach((el) => el.remove());
  }, [pathname]);

  // Always close sidebar on route navigation
  useEffect(() => {
    setIsOpen(false);
    const sidebar = document.querySelector('.sidebar-wrapper');
    if (sidebar) sidebar.classList.remove('show');
    document.querySelectorAll('.sidebar-overlay').forEach((el) => {
      el.classList.remove('show');
    });
    document.body.classList.remove('sidebar-open');
    document.body.style.overflow = '';
  }, [pathname]);

  // Bind toggle & close buttons
  useEffect(() => {
    const toggleButtons = document.querySelectorAll(
      '#sidebar-toggle, .sidebar-toggle-btn'
    );
    const closeButtons = document.querySelectorAll(
      '#sidebar-close-btn, .sidebar-close-btn'
    );

    const onToggle = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      toggleSidebar();
    };

    const onClose = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      closeSidebar();
    };

    toggleButtons.forEach((btn) => btn.addEventListener('click', onToggle));
    closeButtons.forEach((btn) => btn.addEventListener('click', onClose));

    return () => {
      toggleButtons.forEach((btn) => btn.removeEventListener('click', onToggle));
      closeButtons.forEach((btn) => btn.removeEventListener('click', onClose));
    };
  }, [pathname, toggleSidebar, closeSidebar]);

  // Close sidebar on mobile when any sidebar menu link is clicked
  useEffect(() => {
    const sidebar = document.querySelector('.sidebar-wrapper');
    if (!sidebar) return;

    const onMenuLinkClick = () => {
      if (window.innerWidth <= 1200) {
        closeSidebar();
      }
    };

    const links = sidebar.querySelectorAll(
      '.sidebar-menu-link, .sidebar-brand, a'
    );
    links.forEach((link) => {
      link.addEventListener('click', onMenuLinkClick);
    });

    return () => {
      links.forEach((link) => {
        link.removeEventListener('click', onMenuLinkClick);
      });
    };
  }, [pathname, closeSidebar]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeSidebar();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, closeSidebar]);

  // Close on desktop resize
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 1200 && isOpen) {
        closeSidebar();
      }
    };

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [isOpen, closeSidebar]);

  // Close when clicking outside of the sidebar
  useEffect(() => {
    if (!isOpen) return;

    const onDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const sidebar = document.querySelector('.sidebar-wrapper');
      const toggleButtons = document.querySelectorAll(
        '#sidebar-toggle, .sidebar-toggle-btn'
      );

      // Check if click was on one of the toggle buttons
      let clickedToggle = false;
      toggleButtons.forEach((btn) => {
        if (btn.contains(target)) clickedToggle = true;
      });

      if (sidebar && !sidebar.contains(target) && !clickedToggle) {
        closeSidebar();
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener('click', onDocumentClick);
    }, 10);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', onDocumentClick);
    };
  }, [isOpen, closeSidebar]);

  return (
    <div
      id="dashboard-sidebar-overlay"
      className={`sidebar-overlay ${isOpen ? 'show' : ''}`}
      onClick={closeSidebar}
      aria-hidden={!isOpen}
      style={{
        pointerEvents: isOpen ? 'auto' : 'none',
        cursor: 'pointer',
      }}
    />
  );
}
