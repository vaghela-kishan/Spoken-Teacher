import { AlertTriangle } from "lucide-react";
import * as React from "react";

interface Props {
  children: React.ReactNode;
}
interface State {
  hasError: boolean;
}

/**
 * App-level error boundary. Without this, any render-time exception unmounts the
 * whole React tree and the user is left staring at a blank white page. Here we
 * catch it and offer a recovery path.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: unknown) {
    // eslint-disable-next-line no-console
    console.error("Unhandled UI error:", error, info);
  }

  private handleReload = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="grid min-h-screen place-items-center bg-background p-6 text-center">
        <div className="max-w-md">
          <div className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-destructive/10 text-destructive">
            <AlertTriangle className="size-7" />
          </div>
          <h1 className="text-xl font-bold">Something went wrong</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            The page hit an unexpected error. Reloading usually fixes it — your data is safe.
          </p>
          <button
            onClick={this.handleReload}
            className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground outline-none transition-colors hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary/60"
          >
            Reload page
          </button>
        </div>
      </div>
    );
  }
}
