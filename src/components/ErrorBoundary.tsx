/**
 * Error Boundary - prinde erorile React și afișează un fallback
 * Previne crash-ul complet al aplicației și oferă opțiunea de reîncărcare
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  /** Mesaj afișat utilizatorului */
  fallbackMessage?: string;
  /** Callback la eroare (ex: logging către serviciu) */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ErrorBoundary]', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleReload = (): void => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-6 p-8 text-center">
          <div className="rounded-full bg-destructive/10 p-6">
            <AlertTriangle className="h-12 w-12 text-destructive" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-semibold text-foreground">
              {texts.admin.errorOccurred}
            </h1>
            <p className="max-w-md text-sm text-muted-foreground">
              {this.props.fallbackMessage ?? texts.admin.errorFallbackMessage}
            </p>
          </div>
          <Button onClick={this.handleReload} variant="default">
            {texts.admin.reloadPage}
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
