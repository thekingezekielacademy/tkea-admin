import { supabase } from './supabase';

interface ConnectionState {
  isConnected: boolean;
  lastCheck: number;
  retryCount: number;
  isRetrying: boolean;
}

class ConnectionManager {
  private state: ConnectionState = {
    isConnected: false,
    lastCheck: 0,
    retryCount: 0,
    isRetrying: false
  };

  private listeners: Set<(connected: boolean) => void> = new Set();
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private maxRetries = 5;
  private retryDelay = 2000; // 2 seconds
  private healthCheckIntervalMs = 30000; // 30 seconds

  constructor() {
    this.startHealthChecks();
  }

  private startHealthChecks() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      await this.checkConnection();
    }, this.healthCheckIntervalMs);

    // Initial check
    this.checkConnection();
  }

  private async checkConnection(): Promise<boolean> {
    if (this.state.isRetrying) {
      return this.state.isConnected;
    }

    try {
      const startTime = Date.now();
      const { data, error } = await supabase.auth.getSession();
      const responseTime = Date.now() - startTime;

      if (error) {
        console.warn('Connection check failed:', error.message);
        this.updateConnectionState(false);
        return false;
      }

      // Consider connection healthy if response time is under 2 seconds
      const isHealthy = responseTime < 2000;
      this.updateConnectionState(isHealthy);

      if (isHealthy) {
        this.state.retryCount = 0;
      }

      return isHealthy;
    } catch (error) {
      console.warn('Connection check error:', error);
      this.updateConnectionState(false);
      return false;
    }
  }

  private updateConnectionState(isConnected: boolean) {
    const wasConnected = this.state.isConnected;
    this.state.isConnected = isConnected;
    this.state.lastCheck = Date.now();

    if (wasConnected !== isConnected) {
      this.notifyListeners(isConnected);
    }
  }

  private notifyListeners(isConnected: boolean) {
    this.listeners.forEach(listener => {
      try {
        listener(isConnected);
      } catch (error) {
        console.error('Error in connection listener:', error);
      }
    });
  }

  public async ensureConnection(): Promise<boolean> {
    // If we're already connected and recently checked, return true
    if (this.state.isConnected && Date.now() - this.state.lastCheck < 10000) {
      return true;
    }

    // If we're retrying, wait for it to complete
    if (this.state.isRetrying) {
      return new Promise((resolve) => {
        const checkRetry = () => {
          if (!this.state.isRetrying) {
            resolve(this.state.isConnected);
          } else {
            setTimeout(checkRetry, 100);
          }
        };
        checkRetry();
      });
    }

    return await this.checkConnection();
  }

  public async retryConnection(): Promise<boolean> {
    if (this.state.isRetrying) {
      return this.state.isConnected;
    }

    this.state.isRetrying = true;

    try {
      for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
        console.log(`Connection retry attempt ${attempt}/${this.maxRetries}`);
        
        const isConnected = await this.checkConnection();
        
        if (isConnected) {
          this.state.retryCount = 0;
          this.state.isRetrying = false;
          return true;
        }

        if (attempt < this.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
        }
      }

      this.state.retryCount++;
      this.state.isRetrying = false;
      return false;
    } catch (error) {
      console.error('Connection retry failed:', error);
      this.state.isRetrying = false;
      return false;
    }
  }

  public addConnectionListener(listener: (connected: boolean) => void): () => void {
    this.listeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getConnectionState(): ConnectionState {
    return { ...this.state };
  }

  public isConnected(): boolean {
    return this.state.isConnected;
  }

  public getRetryCount(): number {
    return this.state.retryCount;
  }

  public reset() {
    this.state = {
      isConnected: false,
      lastCheck: 0,
      retryCount: 0,
      isRetrying: false
    };
    this.listeners.clear();
  }

  public destroy() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    this.listeners.clear();
  }
}

// Create singleton instance
export const connectionManager = new ConnectionManager();

// Export for use in components
export const useConnectionStatus = () => {
  const [isConnected, setIsConnected] = React.useState(connectionManager.isConnected());

  React.useEffect(() => {
    const unsubscribe = connectionManager.addConnectionListener(setIsConnected);
    return unsubscribe;
  }, []);

  return isConnected;
};

// React import for the hook
import React from 'react';
