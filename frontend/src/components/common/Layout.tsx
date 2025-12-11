import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Button } from './Button';
import styles from './Layout.module.css';

export const Layout: React.FC = () => {
    const location = useLocation();
    const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

    if (isAuthPage) {
        return <Outlet />;
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.navContainer}>
                    <Link to="/" className={styles.logo}>
                        Oakie
                    </Link>
                    <nav className={styles.nav}>
                        <Link to="/projects" className={styles.link}>Explore</Link>
                        <Link to="/about" className={styles.link}>How it works</Link>
                    </nav>
                    <div className={styles.actions}>
                        <Link to="/login" style={{ textDecoration: 'none' }}>
                            <Button variant="secondary" size="sm">Log in</Button>
                        </Link>
                        <Button variant="primary" size="sm">Start Project</Button>
                    </div>
                </div>
            </header>
            <main className={styles.main}>
                <Outlet />
            </main>
            <footer className={styles.footer}>
                <div className={styles.footerContent}>
                    <div className={styles.footerCol}>
                        <h4 className={styles.footerTitle}>Oakie</h4>
                        <p className={styles.footerText}>Connect, Collaborate, Create anywhere.</p>
                    </div>
                    <div className={styles.footerCol}>
                        <p className={styles.footerCopyright}>&copy; 2024 Oakie.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};
