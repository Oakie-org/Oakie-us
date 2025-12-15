// Amplify configuration for Cognito
// These values should match your deployed Cognito User Pool

export const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || "",
      userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID || "",
      signUpVerificationMethod: "code" as const,
    },
  },
};

// Export region for potential future use
export const AWS_REGION = import.meta.env.VITE_AWS_REGION || "us-west-2";
