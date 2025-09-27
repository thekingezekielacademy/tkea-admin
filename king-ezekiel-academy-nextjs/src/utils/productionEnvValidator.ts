'use client';

interface ProductionEnvConfig {
  // Required for production
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  FLUTTERWAVE_PUBLIC_KEY: string;
  FLUTTERWAVE_SECRET_KEY: string;
  FLUTTERWAVE_WEBHOOK_HASH: string;
  
  // Optional but recommended
  NEXT_PUBLIC_SITE_URL?: string;
  NODE_ENV?: string;
  
  // Optional features
  NEXT_PUBLIC_GOOGLE_ANALYTICS_ID?: string;
  NEXT_PUBLIC_FACEBOOK_PIXEL_ID?: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  missing: string[];
  recommendations: string[];
}

export class ProductionEnvValidator {
  private static readonly REQUIRED_VARS: (keyof ProductionEnvConfig)[] = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'FLUTTERWAVE_PUBLIC_KEY',
    'FLUTTERWAVE_SECRET_KEY',
    'FLUTTERWAVE_WEBHOOK_HASH'
  ];

  private static readonly RECOMMENDED_VARS: (keyof ProductionEnvConfig)[] = [
    'NEXT_PUBLIC_SITE_URL',
    'NODE_ENV'
  ];

  private static readonly OPTIONAL_VARS: (keyof ProductionEnvConfig)[] = [
    'NEXT_PUBLIC_GOOGLE_ANALYTICS_ID',
    'NEXT_PUBLIC_FACEBOOK_PIXEL_ID'
  ];

  static validate(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const missing: string[] = [];
    const recommendations: string[] = [];

    // Check required variables
    for (const varName of this.REQUIRED_VARS) {
      const value = process.env[varName];
      if (!value) {
        errors.push(`Required environment variable ${varName} is missing`);
        missing.push(varName);
      } else if (value.trim() === '') {
        errors.push(`Required environment variable ${varName} is empty`);
      }
    }

    // Check recommended variables
    for (const varName of this.RECOMMENDED_VARS) {
      const value = process.env[varName];
      if (!value) {
        warnings.push(`Recommended environment variable ${varName} is missing`);
        recommendations.push(`Set ${varName} for better functionality`);
      }
    }

    // Validate specific formats
    this.validateSupabaseConfig(errors);
    this.validateFlutterwaveConfig(errors);
    this.validateUrls(errors, warnings);

    // Check NODE_ENV
    const nodeEnv = process.env.NODE_ENV;
    if (nodeEnv !== 'production') {
      warnings.push(`NODE_ENV is set to '${nodeEnv}', should be 'production' in production`);
    }

    // Check for development keys in production
    this.checkForDevelopmentKeys(errors, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      missing,
      recommendations
    };
  }

  private static validateSupabaseConfig(errors: string[]): void {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && !supabaseUrl.includes('supabase.co')) {
      errors.push('NEXT_PUBLIC_SUPABASE_URL does not appear to be a valid Supabase URL');
    }

    if (supabaseKey && supabaseKey.length < 100) {
      errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY appears to be invalid (too short)');
    }
  }

  private static validateFlutterwaveConfig(errors: string[]): void {
    const publicKey = process.env.FLUTTERWAVE_PUBLIC_KEY;
    const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;

    if (publicKey && !publicKey.startsWith('FLWPUBK-')) {
      errors.push('FLUTTERWAVE_PUBLIC_KEY does not appear to be a valid Flutterwave public key');
    }

    if (secretKey && !secretKey.startsWith('FLWSECK-')) {
      errors.push('FLUTTERWAVE_SECRET_KEY does not appear to be a valid Flutterwave secret key');
    }
  }

  private static validateUrls(errors: string[], warnings: string[]): void {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    
    if (siteUrl) {
      try {
        new URL(siteUrl);
        if (siteUrl.includes('localhost') || siteUrl.includes('127.0.0.1')) {
          warnings.push('NEXT_PUBLIC_SITE_URL contains localhost - should be production URL');
        }
      } catch {
        errors.push('NEXT_PUBLIC_SITE_URL is not a valid URL');
      }
    }
  }

  private static checkForDevelopmentKeys(errors: string[], warnings: string[]): void {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && (supabaseUrl.includes('localhost') || supabaseUrl.includes('127.0.0.1'))) {
      errors.push('NEXT_PUBLIC_SUPABASE_URL appears to be a development URL');
    }

    // Check for test keys (these often start with 'test_' or contain 'test')
    if (supabaseKey && (supabaseKey.includes('test') || supabaseKey.includes('demo'))) {
      warnings.push('Supabase key appears to be a test/demo key');
    }
  }

  static getProductionChecklist(): string[] {
    return [
      '✅ All required environment variables are set',
      '✅ Supabase URL and keys are valid',
      '✅ Flutterwave keys are valid',
      '✅ NODE_ENV is set to production',
      '✅ Site URL is production URL (not localhost)',
      '✅ No development/test keys are being used',
      '✅ Database migrations are up to date',
      '✅ SSL certificates are valid',
      '✅ CDN is configured and working',
      '✅ Error monitoring is set up',
      '✅ Performance monitoring is active',
      '✅ Backup procedures are in place'
    ];
  }

  static generateEnvTemplate(): string {
    return `# Production Environment Variables Template
# Copy this to your .env.local or production environment

# === REQUIRED VARIABLES ===
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK-your_flutterwave_public_key
FLUTTERWAVE_SECRET_KEY=FLWSECK-your_flutterwave_secret_key
FLUTTERWAVE_WEBHOOK_HASH=your_webhook_hash

# === RECOMMENDED VARIABLES ===
NEXT_PUBLIC_SITE_URL=https://your-production-domain.com
NODE_ENV=production

# === OPTIONAL VARIABLES ===
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=GA-XXXXXXXXX
NEXT_PUBLIC_FACEBOOK_PIXEL_ID=123456789012345

# === NOTES ===
# 1. Never commit these values to version control
# 2. Use your hosting platform's environment variable system
# 3. Test all variables in staging before production
# 4. Rotate keys regularly for security
`;
  }
}

// Utility function for runtime validation
export const validateProductionEnvironment = (): ValidationResult => {
  if (typeof window === 'undefined') {
    // Server-side validation
    return ProductionEnvValidator.validate();
  } else {
    // Client-side validation (limited)
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Check if we're in production
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      warnings.push('Running on localhost - this should not be production');
    }
    
    // Check for HTTPS
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      errors.push('Not using HTTPS - required for production');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      missing: [],
      recommendations: []
    };
  }
};

export default ProductionEnvValidator;
