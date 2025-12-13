import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// import { useAuth } from '../context/AuthContext';
import styles from "./Login.module.css";

export const Login: React.FC = () => {
  // const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const emailId = React.useId();
  const passwordId = React.useId();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Login attempt", { email, password });
    // login();
  };

  return (
    <div className={styles.container}>
      {/* Left Side - Visual */}
      <div className={styles.visualSide}>
        <div className={styles.visualContent}>
          <h2 className={styles.visualTitle}>Welcome back to Oakie.</h2>
          <p className={styles.visualText}>
            Continue your journey of creation and collaboration.
          </p>
        </div>
        <div className={styles.blob}></div>
      </div>

      {/* Right Side - Form */}
      <div className={styles.formSide}>
        <div className={styles.formContainer}>
          <div className={styles.header}>
            <h1 className={styles.title}>Sign in</h1>
            <p className={styles.subtitle}>
              New user?{" "}
              <Link to="/register" className={styles.link}>
                Create an account
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className="space-y-[var(--spacing-xs)]">
              <Label htmlFor={emailId}>Email address</Label>
              <Input
                id={emailId}
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-[var(--spacing-xs)]">
              <Label htmlFor={passwordId}>Password</Label>
              <Input
                id={passwordId}
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className={styles.actions}>
              <Link to="/forgot-password" className={styles.forgotLink}>
                Forgot password?
              </Link>
            </div>
            <Button type="submit" size="lg" className={styles.submitBtn}>
              Sign in
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
