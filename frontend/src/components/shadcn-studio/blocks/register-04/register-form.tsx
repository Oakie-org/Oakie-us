import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { EyeIcon, EyeOffIcon, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";

const RegisterForm = () => {
  const navigate = useNavigate();
  const { register, confirmRegistration, error, clearError } = useAuth();

  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmationCode, setConfirmationCode] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) {
      alert("Please agree to the terms and privacy policy");
      return;
    }

    setIsLoading(true);
    clearError();

    try {
      const result = await register(email, password, name);
      if (result.needsConfirmation) {
        setNeedsConfirmation(true);
      } else {
        navigate("/login");
      }
    } catch {
      // Error is already set in context
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    clearError();

    try {
      await confirmRegistration(email, confirmationCode);
      // Success! Redirect to login
      navigate("/login");
    } catch {
      // Error is already set in context
    } finally {
      setIsLoading(false);
    }
  };

  // Show confirmation code input after registration
  if (needsConfirmation) {
    return (
      <form className="space-y-4" onSubmit={handleConfirm}>
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            We sent a verification code to <strong>{email}</strong>
          </p>
        </div>

        <Input
          type="text"
          placeholder="Enter verification code"
          value={confirmationCode}
          onChange={(e) => setConfirmationCode(e.target.value)}
          required
        />

        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}

        <Button className="w-full" type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Verify Email
        </Button>

        <Button
          variant="ghost"
          className="w-full"
          type="button"
          onClick={() => setNeedsConfirmation(false)}
        >
          Back to registration
        </Button>
      </form>
    );
  }

  return (
    <form className="space-y-4" onSubmit={handleRegister}>
      {/* Name */}
      <Input
        type="text"
        placeholder="Enter your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />

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
          minLength={8}
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

      {/* Privacy policy */}
      <div className="flex items-center gap-3">
        <Checkbox
          id="agreeTerms"
          className="size-6"
          checked={agreedToTerms}
          onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
        />
        <Label htmlFor="agreeTerms" className="text-muted-foreground">
          I agree to Terms and Privacy Policy
        </Label>
      </div>

      {error && <p className="text-sm text-destructive text-center">{error}</p>}

      <Button className="w-full" type="submit" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Sign up to Oakie
      </Button>
    </form>
  );
};

export default RegisterForm;
