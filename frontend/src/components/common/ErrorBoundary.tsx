import { Component, type ErrorInfo, type ReactNode } from "react";
import ErrorPage from "@/components/shadcn-studio/blocks/error-page-01/error-page-01"; // Assessing path after install

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public constructor(props: Props) {
    super(props);
  }

  public static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleServerError = () => {
    this.setState({ hasError: true });
  };

  public componentDidMount() {
    window.addEventListener("server-error", this.handleServerError);
  }

  public componentWillUnmount() {
    window.removeEventListener("server-error", this.handleServerError);
  }

  public render() {
    if (this.state.hasError) {
      return <ErrorPage />;
    }

    return this.props.children;
  }
}
