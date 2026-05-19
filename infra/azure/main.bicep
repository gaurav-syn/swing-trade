// =============================================================================
// SwingTrader Platform — Azure Infrastructure
// Budget: ₹3,500/month — Optimized for personal trading platform
//
// Cost breakdown (South India region):
//   App Service B1 (Linux)          ~₹1,050/month
//   PostgreSQL Flexible B1ms        ~₹1,200/month  (no auto-pause on PG Flexible)
//   Static Web Apps (Free tier)      ₹0/month
//   Application Insights (capped)   ~₹100/month
//   Storage (LRS minimal)           ~₹50/month
//   ─────────────────────────────────────────────
//   TOTAL ESTIMATE                  ~₹2,400/month  (₹1,100 buffer)
// =============================================================================

@description('Environment name (dev/prod)')
param environment string = 'prod'

@description('Azure region — South India supports Linux App Service B1')
param location string = 'southindia'

@description('PostgreSQL region — Central India supports PostgreSQL Flexible Server')
param dbLocation string = 'centralindia'

@description('Project name prefix')
param projectName string = 'swingtrader'

@description('PostgreSQL admin username')
param dbAdminUser string = 'swingtraderadmin'

@description('PostgreSQL admin password')
@secure()
param dbAdminPassword string

@description('JWT secret (min 32 chars)')
@secure()
param jwtSecret string

@description('JWT refresh secret (min 32 chars)')
@secure()
param jwtRefreshSecret string

// ─── Variables ────────────────────────────────────────────────────────────────
var resourcePrefix = '${projectName}-${environment}'
var backendAppName = '${resourcePrefix}-backend'
var dbServerName = '${resourcePrefix}-db'
var dbName = 'swingtrader'
var appServicePlanName = '${resourcePrefix}-plan'
var staticWebAppName = '${resourcePrefix}-frontend'
var appInsightsName = '${resourcePrefix}-insights'
var logAnalyticsName = '${resourcePrefix}-logs'
var storageName = 'swingtrdrstor${environment}'   // max 24 chars, no hyphens

// ─── Log Analytics Workspace (30-day retention = free tier) ──────────────────
resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: logAnalyticsName
  location: location
  properties: {
    sku: { name: 'PerGB2018' }
    retentionInDays: 30
    features: {
      enableLogAccessUsingOnlyResourcePermissions: true
      disableLocalAuth: false
    }
    workspaceCapping: {
      dailyQuotaGb: 1
    }
  }
}

// ─── Application Insights (capped at 1GB/day ~₹100/month) ───────────────────
resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalytics.id
    RetentionInDays: 30
    IngestionMode: 'LogAnalytics'
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

// ─── Storage Account (LRS = cheapest, minimal use for logs/exports) ──────────
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: take(storageName, 24)
  location: location
  sku: { name: 'Standard_LRS' }
  kind: 'StorageV2'
  properties: {
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
    allowBlobPublicAccess: false
    accessTier: 'Cool'
  }
}

// ─── PostgreSQL Flexible Server (B1ms Burstable) ──────────────────────────────
resource postgresServer 'Microsoft.DBforPostgreSQL/flexibleServers@2023-03-01-preview' = {
  name: dbServerName
  location: dbLocation
  sku: {
    name: 'Standard_B1ms'
    tier: 'Burstable'
  }
  properties: {
    version: '16'
    administratorLogin: dbAdminUser
    administratorLoginPassword: dbAdminPassword
    storage: {
      storageSizeGB: 32
      autoGrow: 'Disabled'
    }
    backup: {
      backupRetentionDays: 7
      geoRedundantBackup: 'Disabled'
    }
    highAvailability: {
      mode: 'Disabled'
    }
    maintenanceWindow: {
      customWindow: 'Enabled'
      dayOfWeek: 0
      startHour: 2
      startMinute: 0
    }
    authConfig: {
      activeDirectoryAuth: 'Disabled'
      passwordAuth: 'Enabled'
    }
  }
}

resource postgresDatabase 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2023-03-01-preview' = {
  parent: postgresServer
  name: dbName
  properties: {
    charset: 'UTF8'
    collation: 'en_US.utf8'
  }
}

// Allow Azure services to connect (required for App Service)
resource postgresFirewall 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2023-03-01-preview' = {
  parent: postgresServer
  name: 'AllowAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

// Performance tuning for B1ms (2GB RAM)
resource postgresMaxConn 'Microsoft.DBforPostgreSQL/flexibleServers/configurations@2023-03-01-preview' = {
  parent: postgresServer
  name: 'max_connections'
  properties: {
    value: '50'
    source: 'user-override'
  }
}

// ─── App Service Plan (B1 Linux) ─────────────────────────────────────────────
resource appServicePlan 'Microsoft.Web/serverfarms@2023-01-01' = {
  name: appServicePlanName
  location: location
  sku: {
    name: 'B1'
    tier: 'Basic'
    size: 'B1'
    capacity: 1
  }
  kind: 'linux'
  properties: {
    reserved: true
    isSpot: false
  }
}

// ─── Backend App Service (NestJS) ─────────────────────────────────────────────
resource backendApp 'Microsoft.Web/sites@2023-01-01' = {
  name: backendAppName
  location: location
  kind: 'app,linux'
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    clientAffinityEnabled: false
    siteConfig: {
      linuxFxVersion: 'NODE|20-lts'
      alwaysOn: true
      ftpsState: 'Disabled'
      minTlsVersion: '1.2'
      http20Enabled: true
      numberOfWorkers: 1
      healthCheckPath: '/api/v1/health'
      appSettings: [
        { name: 'NODE_ENV',                            value: 'production' }
        { name: 'PORT',                                value: '3001' }
        { name: 'WEBSITE_NODE_DEFAULT_VERSION',        value: '~20' }
        { name: 'SCM_DO_BUILD_DURING_DEPLOYMENT',      value: 'true' }
        { name: 'WEBSITE_RUN_FROM_PACKAGE',            value: '1' }
        { name: 'DATABASE_URL',                        value: 'postgresql://${dbAdminUser}:${dbAdminPassword}@${postgresServer.properties.fullyQualifiedDomainName}:5432/${dbName}?sslmode=require&connection_limit=5&pool_timeout=20' }
        { name: 'DB_POOL_MIN',                         value: '1' }
        { name: 'DB_POOL_MAX',                         value: '5' }
        { name: 'JWT_SECRET',                          value: jwtSecret }
        { name: 'JWT_REFRESH_SECRET',                  value: jwtRefreshSecret }
        { name: 'JWT_ACCESS_EXPIRY',                   value: '15m' }
        { name: 'JWT_REFRESH_EXPIRY',                  value: '7d' }
        { name: 'FRONTEND_URL',                        value: 'https://${staticWebApp.properties.defaultHostname}' }
        { name: 'APPLICATIONINSIGHTS_CONNECTION_STRING', value: appInsights.properties.ConnectionString }
        { name: 'ApplicationInsightsAgent_EXTENSION_VERSION', value: '~3' }
        { name: 'MAX_STOCKS_PER_SCAN',                 value: '60' }
        { name: 'MARKET_DATA_TTL',                     value: '300' }
        { name: 'SCANNER_TTL',                         value: '900' }
      ]
      connectionStrings: [
        {
          name: 'DATABASE_URL'
          connectionString: 'postgresql://${dbAdminUser}:${dbAdminPassword}@${postgresServer.properties.fullyQualifiedDomainName}:5432/${dbName}?sslmode=require'
          type: 'Custom'
        }
      ]
    }
  }
}

// Auto-scale (disabled — B1 fixed capacity)
resource backendAutoScale 'Microsoft.Insights/autoscalesettings@2022-10-01' = {
  name: '${backendAppName}-autoscale'
  location: location
  properties: {
    enabled: false
    targetResourceUri: appServicePlan.id
    profiles: [
      {
        name: 'Default'
        capacity: { default: '1', minimum: '1', maximum: '1' }
        rules: []
      }
    ]
  }
}

// ─── Static Web App (FREE tier — Next.js frontend) ───────────────────────────
resource staticWebApp 'Microsoft.Web/staticSites@2023-01-01' = {
  name: staticWebAppName
  location: 'eastasia'
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {
    stagingEnvironmentPolicy: 'Disabled'
    allowConfigFileUpdates: true
    enterpriseGradeCdnStatus: 'Disabled'
  }
}

resource staticWebAppSettings 'Microsoft.Web/staticSites/config@2023-01-01' = {
  parent: staticWebApp
  name: 'appsettings'
  properties: {
    NEXT_PUBLIC_API_URL: 'https://${backendApp.properties.defaultHostName}/api/v1'
  }
}

// ─── Outputs ─────────────────────────────────────────────────────────────────
output backendUrl string = 'https://${backendApp.properties.defaultHostName}'
output frontendUrl string = 'https://${staticWebApp.properties.defaultHostname}'
output dbServerFqdn string = postgresServer.properties.fullyQualifiedDomainName
output dbConnectionString string = 'postgresql://${dbAdminUser}@${postgresServer.properties.fullyQualifiedDomainName}:5432/${dbName}?sslmode=require&connection_limit=5'
output appInsightsConnectionString string = appInsights.properties.ConnectionString
output storageAccountName string = storageAccount.name
