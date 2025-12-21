import { NextResponse } from 'next/server';
import { checkDatabaseHealth } from '../../../../lib/mongodb';
import { getEnvironmentSummary } from '@/lib/env-validator';

export async function GET() {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  
  try {
    // Check database health
    const dbHealth = await checkDatabaseHealth();
    
    // Check environment configuration
    const envSummary = getEnvironmentSummary();
    
    // Calculate response time
    const responseTime = Date.now() - startTime;
    
    // Determine overall health status
    const isHealthy = dbHealth.healthy && envSummary.hasDatabase && envSummary.hasJwtSecret;
    
    const healthData = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp,
      responseTime: `${responseTime}ms`,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024)
      },
      services: {
        database: {
          status: dbHealth.healthy ? 'healthy' : 'unhealthy',
          responseTime: dbHealth.responseTime || 'N/A',
          lastCheck: dbHealth.timestamp
        },
        authentication: {
          status: envSummary.hasJwtSecret ? 'configured' : 'missing',
          firebase: envSummary.hasFirebase ? 'configured' : 'missing'
        },
        payments: {
          status: envSummary.hasStripe ? 'configured' : 'missing'
        }
      },
      checks: {
        database: dbHealth.healthy,
        environment: envSummary.hasDatabase && envSummary.hasJwtSecret,
        firebase: envSummary.hasFirebase,
        stripe: envSummary.hasStripe || process.env.NODE_ENV === 'development'
      }
    };

    // Add error details if unhealthy
    if (!isHealthy) {
      healthData.errors = [];
      
      if (!dbHealth.healthy) {
        healthData.errors.push({
          service: 'database',
          message: dbHealth.error || 'Database connection failed'
        });
      }
      
      if (!envSummary.hasDatabase) {
        healthData.errors.push({
          service: 'environment',
          message: 'MONGODB_URI not configured'
        });
      }
      
      if (!envSummary.hasJwtSecret) {
        healthData.errors.push({
          service: 'environment',
          message: 'JWT_SECRET not configured'
        });
      }
    }

    return NextResponse.json(healthData, {
      status: isHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('Health check error:', error);
    
    return NextResponse.json({
      status: 'error',
      timestamp,
      responseTime: `${Date.now() - startTime}ms`,
      error: {
        message: 'Health check failed',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      services: {
        database: { status: 'error' },
        authentication: { status: 'unknown' },
        payments: { status: 'unknown' }
      }
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  }
}

// Add a simple ping endpoint
export async function HEAD() {
  return new NextResponse(null, { 
    status: 200,
    headers: {
      'Cache-Control': 'no-cache'
    }
  });
}