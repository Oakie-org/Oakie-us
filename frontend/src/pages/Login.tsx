import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
// import { useAuth } from '../context/AuthContext';
import styles from './Login.module.css';

export const Login: React.FC = () => {
    // const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Login attempt', { email, password });
        // login();
    };

    return (
        <div className={styles.container}>
            {/* Left Side - Visual */}
            <div className={styles.visualSide}>
                <div className={styles.visualContent}>
                    <h2 className={styles.visualTitle}>Welcome back to Oakie.</h2>
                    <p className={styles.visualText}>Continue your journey of creation and collaboration.</p>
                </div>
                <div className={styles.blob}></div>
            </div>

            {/* Right Side - Form */}
            <div className={styles.formSide}>
                <div className={styles.formContainer}>
                    <div className={styles.header}>
                        <h1 className={styles.title}>Sign in</h1>
                        <p className={styles.subtitle}>
                            New user? <Link to="/register" className={styles.link}>Create an account</Link>
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className={styles.form}>
                        <Input
                            label="Email address"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />
                        <Input
                            label="Password"
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                        <div className={styles.actions}>
                            <Link to="/forgot-password" className={styles.forgotLink}>Forgot password?</Link>
                        </div>
                        <Button type="submit" size="lg" className={styles.submitBtn}>Sign in</Button>
                    </form>
                </div>
            </div>
        </div>
    );
};
