import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { EyeIcon, EyeOffIcon, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";

const LoginForm = () => {
  const navigate = useNavigate();
  const { login, error, clearError } = useAuth();

  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    clearError();

    try {
      await login(email, password);
      // Success! Redirect to home
      navigate("/");
    } catch {
      // Error is already set in context
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleLogin}>
      {/* Email */}
      <Input
        type="email"
        placeholder="Enter your email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      {/* Password */}
      <div className="relative">
        <Input
          id="password"
          type={isVisible ? "text" : "password"}
          placeholder="••••••••••••••••"
          className="pr-9"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Button
          variant="ghost"
          size="icon"
          type="button"
          onClick={() => setIsVisible((prevState) => !prevState)}
          className="text-muted-foreground focus-visible:ring-ring/50 absolute inset-y-0 right-0 rounded-l-none hover:bg-transparent"
        >
          {isVisible ? <EyeOffIcon /> : <EyeIcon />}
          <span className="sr-only">
            {isVisible ? "Hide password" : "Show password"}
          </span>
        </Button>
      </div>

      {/* Remember Me and Forgot Password */}
      <div className="flex items-center justify-between gap-y-2">
        <div className="flex items-center gap-3">
          <Checkbox
            id="rememberMe"
            className="size-6"
            checked={rememberMe}
            onCheckedChange={(checked) => setRememberMe(checked === true)}
          />
          <Label htmlFor="rememberMe" className="text-muted-foreground">
            Remember Me
          </Label>
        </div>

        <a href="#" className="hover:underline">
          Forgot Password?
        </a>
      </div>

      {error && <p className="text-sm text-destructive text-center">{error}</p>}

      <Button className="w-full" type="submit" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Sign in to Oakie
      </Button>
    </form>
  );
};

export default LoginForm;
