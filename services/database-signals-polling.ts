import { Platform } from 'react-native';

// Database configuration
const dbConfig = {
  host: '172.203.148.37.host.secureserver.net',
  user: 'eauser',
  password: 'snVO2i%fZSG%',
  database: 'eaconverter',
  port: 3306,
  connectTimeout: 60000,
  acquireTimeout: 60000,
  timeout: 60000,
};

export interface DatabaseSignal {
  id: string;
  ea: string;
  asset: string;
  latestupdate: string;
  type: string;
  action: string;
  price: string;
  tp: string;
  sl: string;
  time: string;
  results: string;
}

export interface LicenseData {
  id: string;
  owner: string;
  ea: string;
  user: string;
  k_ey: string;
  created: string;
  expires: string;
  plan: string;
  status: string;
  phone_secret_code: string;
  phoneId: string;
  power: string;
}

export interface SignalPollingCallback {
  onSignalFound: (signal: DatabaseSignal) => void;
  onError: (error: string) => void;
}

class DatabaseSignalsPollingService {
  private isEnabled: boolean = true;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private onSignalFound?: (signal: DatabaseSignal) => void;
  private onError?: (error: string) => void;
  private currentLicenseKey: string | null = null;
  private currentEA: string | null = null;
  private lastPollTime: string | null = null;

  // Enable database connections
  enableDatabaseConnections() {
    this.isEnabled = true;
    console.log('Database connections enabled for signals polling service');
  }

  // Disable database connections
  disableDatabaseConnections() {
    this.isEnabled = false;
    this.stopPolling();
    console.log('Database connections disabled for signals polling service');
  }

  // Start polling for signals
  startPolling(
    licenseKey: string,
    onSignalFound?: (signal: DatabaseSignal) => void,
    onError?: (error: string) => void
  ) {
    if (this.intervalId) {
      console.log('Database signals polling already running');
      return;
    }

    this.onSignalFound = onSignalFound;
    this.onError = onError;
    this.currentLicenseKey = licenseKey;
    this.lastPollTime = new Date().toISOString();

    console.log('Starting database signals polling for license:', licenseKey);

    if (!this.isEnabled) {
      console.log('Database connections disabled - using mock data for testing');
      this.startMockPolling(licenseKey);
      return;
    }

    // Start real database polling
    this.startRealPolling(licenseKey);
  }

  // Stop polling
  stopPolling() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.currentLicenseKey = null;
    this.currentEA = null;
    this.lastPollTime = null;
    console.log('Database signals polling stopped');
  }

  // Mock polling for testing (when database is disabled)
  private startMockPolling(licenseKey: string) {
    console.log('Starting mock database signals polling for license:', licenseKey);

    // Simulate finding a signal every 30 seconds for testing
    this.intervalId = setInterval(() => {
      const mockSignal: DatabaseSignal = {
        id: 'mock-' + Date.now(),
        ea: 'MockEA',
        asset: 'XAUUSD',
        latestupdate: new Date().toISOString(),
        type: 'TRADE',
        action: Math.random() > 0.5 ? 'BUY' : 'SELL',
        price: (Math.random() * 1000 + 2000).toFixed(2),
        tp: (Math.random() * 50 + 10).toFixed(2),
        sl: (Math.random() * 30 + 5).toFixed(2),
        time: new Date().toISOString(),
        results: 'PENDING'
      };

      console.log('Mock database signal found:', mockSignal);
      if (this.onSignalFound) {
        this.onSignalFound(mockSignal);
      }
    }, 30000); // Check every 30 seconds
  }

  // Real database polling - optimized to reduce server load
  private startRealPolling(licenseKey: string) {
    console.log('Starting real database signals polling for license:', licenseKey);

    // Initial check
    this.checkForNewSignals(licenseKey).catch(error => {
      console.error('Error in initial signal check:', error);
    });

    // Check for signals every 30 seconds instead of 10 (reduced from 6 req/min to 2 req/min)
    // This significantly reduces database load while still providing timely updates
    this.intervalId = setInterval(async () => {
      try {
        await this.checkForNewSignals(licenseKey);
      } catch (error) {
        console.error('Error checking for database signals:', error);
        if (this.onError) {
          this.onError(`Database error: ${error}`);
        }
      }
    }, 30000); // Check every 30 seconds (optimized from 10s)
  }

  // Check for new signals in database
  private async checkForNewSignals(licenseKey: string) {
    try {
      console.log('Checking for new database signals for license:', licenseKey);

      // First, get the EA from the license
      const ea = await this.getEAFromLicense(licenseKey);
      if (!ea) {
        console.error('Could not find EA for license:', licenseKey);
        return;
      }

      this.currentEA = ea;
      console.log('Found EA for license:', ea);

      // Get new signals for this EA since last poll
      const signals = await this.getNewSignalsForEA(ea);

      console.log(`Found ${signals.length} new signals for EA ${ea}:`, signals);

      // Process each signal found
      for (const signal of signals) {
        console.log('✅ New database signal found:', signal);
        if (this.onSignalFound) {
          this.onSignalFound(signal);
        }
      }

      // Update last poll time
      this.lastPollTime = new Date().toISOString();

    } catch (error) {
      console.error('Error in checkForNewSignals:', error);
      throw error;
    }
  }

  // Get EA from license key via API (with caching to reduce API calls)
  private eaCache: Map<string, { ea: string | null, timestamp: number }> = new Map();
  private EA_CACHE_TTL = 300000; // 5 minutes - EA rarely changes

  private async getEAFromLicense(licenseKey: string): Promise<string | null> {
    try {
      // Check cache first
      const cached = this.eaCache.get(licenseKey);
      if (cached && (Date.now() - cached.timestamp) < this.EA_CACHE_TTL) {
        return cached.ea;
      }

      const response = await fetch(`/api/get-ea-from-license?licenseKey=${encodeURIComponent(licenseKey)}`);
      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }
      const data = await response.json();
      
      // Cache the result
      this.eaCache.set(licenseKey, { ea: data.eaId, timestamp: Date.now() });
      
      return data.eaId;
    } catch (error) {
      console.error('Error fetching EA from license via API:', error);
      throw new Error('Failed to fetch EA from license');
    }
  }

  // Get new signals for EA since last poll (optimized with exponential backoff on errors)
  private consecutiveErrors = 0;
  private maxConsecutiveErrors = 3;

  private async getNewSignalsForEA(ea: string): Promise<DatabaseSignal[]> {
    try {
      const params = new URLSearchParams({
        eaId: ea,
        since: this.lastPollTime || new Date(Date.now() - 60 * 60 * 1000).toISOString() // Default to 1 hour ago (reduced from 24h)
      });

      const response = await fetch(`/api/get-new-signals?${params}`, {
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });
      
      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Reset error counter on success
      this.consecutiveErrors = 0;
      
      return data.signals;
    } catch (error) {
      this.consecutiveErrors++;
      console.error(`Error fetching new signals via API (attempt ${this.consecutiveErrors}):`, error);
      
      // Implement exponential backoff if too many errors
      if (this.consecutiveErrors >= this.maxConsecutiveErrors) {
        console.warn('Too many consecutive errors, temporarily pausing polling');
        this.stopPolling();
        
        // Auto-restart after 5 minutes
        setTimeout(() => {
          if (this.currentLicenseKey) {
            console.log('Restarting polling after error cooldown');
            this.consecutiveErrors = 0;
            this.startPolling(this.currentLicenseKey, this.onSignalFound, this.onError);
          }
        }, 300000); // 5 minutes
      }
      
      throw new Error('Failed to fetch new signals');
    }
  }

  // Check if polling is running
  isRunning(): boolean {
    return this.intervalId !== null;
  }

  // Get current polling status
  getStatus() {
    return {
      isRunning: this.isRunning(),
      licenseKey: this.currentLicenseKey,
      ea: this.currentEA,
      lastPollTime: this.lastPollTime,
      isEnabled: this.isEnabled
    };
  }
}

export const databaseSignalsPollingService = new DatabaseSignalsPollingService();
export default databaseSignalsPollingService;
