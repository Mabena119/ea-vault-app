// Shared MySQL connection pool for API routes
// Use dynamic import to avoid TypeScript/node type issues in Expo linting
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MySQLModule = any;

// Prefer environment variables; support common provider aliases
const DB_HOST = process.env.DB_HOST || process.env.MYSQLHOST || process.env.MYSQL_HOST || 'localhost';
const DB_USER = process.env.DB_USER || process.env.MYSQLUSER || process.env.MYSQL_USER || '';
const DB_PASSWORD = process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || process.env.MYSQL_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE || '';
const DB_PORT = Number(process.env.DB_PORT || process.env.MYSQLPORT || process.env.MYSQL_PORT || 3306);

// Simple in-memory cache for frequently accessed data
interface CacheEntry {
  data: any;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 30000; // 30 seconds default TTL

// Helper function to get cached data
export function getCachedData(key: string, ttl: number = CACHE_TTL): any | null {
  const entry = cache.get(key);
  if (entry && (Date.now() - entry.timestamp) < ttl) {
    return entry.data;
  }
  // Remove stale entry
  if (entry) {
    cache.delete(key);
  }
  return null;
}

// Helper function to set cached data
export function setCachedData(key: string, data: any): void {
  cache.set(key, { data, timestamp: Date.now() });
  
  // Limit cache size to prevent memory bloat (keep last 1000 entries)
  if (cache.size > 1000) {
    const firstKey = cache.keys().next().value;
    if (firstKey) {
      cache.delete(firstKey);
    }
  }
}

// Clear cache periodically to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now - entry.timestamp > CACHE_TTL * 2) {
      cache.delete(key);
    }
  }
}, 60000); // Clean up every minute

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pool: any | null = null;
let poolInitPromise: Promise<any> | null = null;

// Optimized pool configuration for scalability
export async function getPool() {
  // Return existing pool if available
  if (pool) {
    return pool;
  }

  // If pool is being initialized, wait for it
  if (poolInitPromise) {
    return poolInitPromise;
  }

  // Initialize pool with optimized settings
  poolInitPromise = (async () => {
    try {
      // @ts-ignore - dynamic import; types may not be available in Expo lint context
      const mysql: MySQLModule = await import('mysql2/promise');
      
      pool = mysql.createPool({
        host: DB_HOST,
        user: DB_USER,
        password: DB_PASSWORD,
        database: DB_NAME,
        port: DB_PORT,
        // Optimized connection pool settings for scalability
        connectionLimit: 50, // Increased from 10 to handle more concurrent users
        waitForConnections: true,
        queueLimit: 100, // Limit queue to prevent memory issues
        enableKeepAlive: true, // Keep connections alive
        keepAliveInitialDelay: 10000, // 10 seconds
        maxIdle: 20, // Maximum idle connections
        idleTimeout: 60000, // Close idle connections after 1 minute
        connectTimeout: 10000, // 10 second connection timeout
        acquireTimeout: 10000, // 10 second acquire timeout
        // Add query timeout at pool level
        timeout: 30000, // 30 second query timeout
      });

      // Connection health monitoring
      pool.on('connection', (connection: any) => {
        console.log('New database connection established');
        
        // Set session variables for better performance
        connection.query('SET SESSION sql_mode = "NO_ENGINE_SUBSTITUTION"', (error: any) => {
          if (error) {
            console.error('Error setting SQL mode:', error);
          }
        });
      });

      pool.on('acquire', () => {
        // Optional: log connection acquisition for monitoring
        // console.log('Connection acquired from pool');
      });

      pool.on('release', () => {
        // Optional: log connection release for monitoring
        // console.log('Connection released back to pool');
      });

      console.log('Database pool initialized with optimized settings');
      return pool;
    } catch (error) {
      console.error('Failed to initialize database pool:', error);
      poolInitPromise = null;
      throw error;
    }
  })();

  return poolInitPromise;
}

// Helper function to safely execute queries with automatic connection management
export async function executeQuery<T = any>(
  query: string,
  params: any[] = [],
  options: { cache?: boolean; cacheTTL?: number; cacheKey?: string } = {}
): Promise<T[]> {
  const { cache: useCache = false, cacheTTL = CACHE_TTL, cacheKey } = options;

  // Check cache if enabled
  if (useCache && cacheKey) {
    const cached = getCachedData(cacheKey, cacheTTL);
    if (cached !== null) {
      return cached;
    }
  }

  const pool = await getPool();
  const conn = await pool.getConnection();
  
  try {
    const [rows] = await conn.execute(query, params);
    const result = rows as T[];

    // Cache result if enabled
    if (useCache && cacheKey) {
      setCachedData(cacheKey, result);
    }

    return result;
  } finally {
    // Always release connection back to pool
    conn.release();
  }
}

// Graceful shutdown handler
export async function closePool(): Promise<void> {
  if (pool) {
    try {
      await pool.end();
      pool = null;
      poolInitPromise = null;
      console.log('Database pool closed gracefully');
    } catch (error) {
      console.error('Error closing database pool:', error);
    }
  }
}

// Handle process termination
if (typeof process !== 'undefined') {
  process.on('SIGINT', closePool);
  process.on('SIGTERM', closePool);
}


