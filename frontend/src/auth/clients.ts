/**
 * Identity providers behind one interface.
 *
 * - "cognito": production. Talks to the Cognito user pool through Amplify.
 * - "local":   development. Talks to the backend's dev-only /dev/auth routes,
 *              so the whole app runs without an AWS account.
 */

export interface SignUpResult {
  /** True when the user must enter an emailed code before signing in. */
  needsConfirmation: boolean;
}

export interface AuthClient {
  readonly mode: "cognito" | "local";
  /** A bearer token for the current session, or null when signed out. */
  getToken(): Promise<string | null>;
  signIn(email: string, password: string): Promise<void>;
  signUp(email: string, password: string, name: string): Promise<SignUpResult>;
  confirmSignUp(email: string, code: string): Promise<void>;
  signOut(): Promise<void>;
}

// ----------------------------------------------------------------- local

const TOKEN_KEY = "oakie-local-token";
const API_BASE =
  (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/+$/, "") + "/api/v1";

function tokenIsFresh(token: string): boolean {
  try {
    const payload = JSON.parse(
      atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
    );
    return (
      typeof payload.exp === "number" &&
      payload.exp * 1000 > Date.now() + 30_000
    );
  } catch {
    return false;
  }
}

async function localAuthCall(path: string, body: object): Promise<string> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}/dev/auth/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("Can't reach the Oakie API. Is the backend running?");
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = Array.isArray(data.detail)
      ? data.detail[0]?.msg
      : data.detail;
    throw new Error(
      typeof detail === "string" ? detail : "Sign-in failed. Please try again.",
    );
  }
  return data.access_token as string;
}

const localClient: AuthClient = {
  mode: "local",
  async getToken() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token && tokenIsFresh(token)) return token;
    if (token) localStorage.removeItem(TOKEN_KEY);
    return null;
  },
  async signIn(email, password) {
    localStorage.setItem(
      TOKEN_KEY,
      await localAuthCall("login", { email, password }),
    );
  },
  async signUp(email, password, name) {
    localStorage.setItem(
      TOKEN_KEY,
      await localAuthCall("register", { email, password, name }),
    );
    return { needsConfirmation: false };
  },
  async confirmSignUp() {},
  async signOut() {
    localStorage.removeItem(TOKEN_KEY);
  },
};

// --------------------------------------------------------------- cognito

type AmplifyAuth = typeof import("aws-amplify/auth");
let amplify: Promise<AmplifyAuth> | null = null;

/** Amplify is loaded on demand so local development never downloads it. */
function loadAmplify(): Promise<AmplifyAuth> {
  amplify ??= (async () => {
    const [{ Amplify }, auth] = await Promise.all([
      import("aws-amplify"),
      import("aws-amplify/auth"),
    ]);
    Amplify.configure({
      Auth: {
        Cognito: {
          userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID ?? "",
          userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID ?? "",
          signUpVerificationMethod: "code",
        },
      },
    });
    return auth;
  })();
  return amplify;
}

const cognitoClient: AuthClient = {
  mode: "cognito",
  async getToken() {
    try {
      const { fetchAuthSession } = await loadAmplify();
      const session = await fetchAuthSession(); // refreshes expired tokens
      return session.tokens?.accessToken?.toString() ?? null;
    } catch {
      return null;
    }
  },
  async signIn(email, password) {
    const { signIn } = await loadAmplify();
    const { isSignedIn, nextStep } = await signIn({
      username: email,
      password,
    });
    if (!isSignedIn) {
      throw new Error(
        nextStep.signInStep === "CONFIRM_SIGN_UP"
          ? "Confirm your email before signing in."
          : "This account needs an extra sign-in step that Oakie doesn't support yet.",
      );
    }
  },
  async signUp(email, password, name) {
    const { signUp } = await loadAmplify();
    const { isSignUpComplete } = await signUp({
      username: email,
      password,
      options: { userAttributes: { email, name } },
    });
    return { needsConfirmation: !isSignUpComplete };
  },
  async confirmSignUp(email, code) {
    const { confirmSignUp } = await loadAmplify();
    await confirmSignUp({ username: email, confirmationCode: code });
  },
  async signOut() {
    const { signOut } = await loadAmplify();
    await signOut();
  },
};

const configuredMode = import.meta.env.VITE_AUTH_MODE as string | undefined;
const hasCognito = Boolean(import.meta.env.VITE_COGNITO_USER_POOL_ID);

export const authClient: AuthClient =
  configuredMode === "cognito" || (configuredMode !== "local" && hasCognito)
    ? cognitoClient
    : localClient;
