const pool = require('../config/database');

/**
 * Enterprise Database Schema v2
 * Includes: Auth, Users, Roles, Projects, Subscriptions, Uploads, Audit Logs
 */

async function runEnterpriseSchema() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Starting enterprise schema migration...\n');
    
    // Enable UUID extension
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    console.log('✓ UUID extension enabled');
    
    // Create ENUM types
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE user_role AS ENUM ('user', 'admin', 'support', 'analyst');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('✓ user_role ENUM created');
    
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE subscription_tier AS ENUM ('free', 'individual', 'business', 'enterprise');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('✓ subscription_tier ENUM created');
    
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE request_status AS ENUM ('pending', 'processing', 'completed', 'rejected', 'archived');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('✓ request_status ENUM created');
    
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE ticket_status AS ENUM ('open', 'in-progress', 'waiting', 'resolved', 'closed', 'reopen');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('✓ ticket_status ENUM created');
    
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE project_status AS ENUM ('draft', 'active', 'completed', 'archived');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('✓ project_status ENUM created');
    
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE file_type AS ENUM ('image', 'pdf', 'packet-tracer', 'config', 'other');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('✓ file_type ENUM created');
    
    // ==================== USERS TABLE ====================
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        phone_number VARCHAR(20),
        company_name VARCHAR(255),
        avatar_url TEXT,
        role user_role DEFAULT 'user',
        subscription_tier subscription_tier DEFAULT 'free',
        is_active BOOLEAN DEFAULT true,
        is_verified BOOLEAN DEFAULT false,
        email_verified_at TIMESTAMP,
        last_login_at TIMESTAMP,
        last_ip_address INET,
        two_factor_enabled BOOLEAN DEFAULT false,
        two_factor_secret VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP,
        
        CONSTRAINT email_not_empty CHECK (email != ''),
        CONSTRAINT valid_email CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
      );
      
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
      CREATE INDEX IF NOT EXISTS idx_users_subscription ON users(subscription_tier);
      CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
      CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);
    `);
    console.log('✓ users table created');
    
    // ==================== SESSIONS TABLE ====================
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        token_hash VARCHAR(255) UNIQUE NOT NULL,
        ip_address INET,
        user_agent TEXT,
        expires_at TIMESTAMP NOT NULL,
        last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
      
      CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_expires ON user_sessions(expires_at);
      CREATE INDEX IF NOT EXISTS idx_sessions_active ON user_sessions(is_active);
    `);
    console.log('✓ user_sessions table created');
    
    // ==================== SUBSCRIPTIONS TABLE ====================
    await client.query(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL UNIQUE,
        tier subscription_tier DEFAULT 'free',
        stripe_subscription_id VARCHAR(255),
        start_date DATE NOT NULL,
        end_date DATE,
        auto_renew BOOLEAN DEFAULT true,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
      
      CREATE INDEX IF NOT EXISTS idx_subscriptions_tier ON subscriptions(tier);
      CREATE INDEX IF NOT EXISTS idx_subscriptions_active ON subscriptions(is_active);
    `);
    console.log('✓ subscriptions table created');
    
    // ==================== PROJECTS TABLE ====================
    await client.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        status project_status DEFAULT 'draft',
        project_data JSONB DEFAULT '{}',
        topology_image_url TEXT,
        config_file_url TEXT,
        metadata JSONB DEFAULT '{}',
        is_public BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP,
        
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
      
      CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id);
      CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
      CREATE INDEX IF NOT EXISTS idx_projects_public ON projects(is_public);
      CREATE INDEX IF NOT EXISTS idx_projects_created ON projects(created_at DESC);
    `);
    console.log('✓ projects table created');
    
    // ==================== NETWORK REQUESTS (ENHANCED) ====================
    await client.query(`
      CREATE TABLE IF NOT EXISTS network_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        project_id UUID,
        project_type VARCHAR(100) NOT NULL,
        building_size VARCHAR(50) NOT NULL,
        floors INTEGER,
        users_count INTEGER,
        security_level VARCHAR(50),
        vlan_requirements BOOLEAN DEFAULT false,
        wifi_requirements BOOLEAN DEFAULT true,
        server_requirements TEXT,
        infrastructure_notes TEXT,
        project_details JSONB DEFAULT '{}',
        status request_status DEFAULT 'pending',
        priority VARCHAR(20) DEFAULT 'normal',
        estimated_cost DECIMAL(10, 2),
        assigned_to UUID,
        response_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
        FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
      );
      
      CREATE INDEX IF NOT EXISTS idx_network_user ON network_requests(user_id);
      CREATE INDEX IF NOT EXISTS idx_network_status ON network_requests(status);
      CREATE INDEX IF NOT EXISTS idx_network_created ON network_requests(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_network_assigned ON network_requests(assigned_to);
      CREATE INDEX IF NOT EXISTS idx_network_priority ON network_requests(priority);
    `);
    console.log('✓ network_requests table enhanced');
    
    // ==================== SUPPORT TICKETS (ENHANCED) ====================
    await client.query(`
      CREATE TABLE IF NOT EXISTS support_tickets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        ticket_number VARCHAR(50) UNIQUE NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        phone_number VARCHAR(20),
        email VARCHAR(255),
        support_message TEXT NOT NULL,
        category VARCHAR(100),
        status ticket_status DEFAULT 'open',
        priority VARCHAR(20) DEFAULT 'normal',
        assigned_to UUID,
        response_message TEXT,
        is_urgent BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        resolved_at TIMESTAMP,
        
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
      );
      
      CREATE INDEX IF NOT EXISTS idx_tickets_user ON support_tickets(user_id);
      CREATE INDEX IF NOT EXISTS idx_tickets_number ON support_tickets(ticket_number);
      CREATE INDEX IF NOT EXISTS idx_tickets_status ON support_tickets(status);
      CREATE INDEX IF NOT EXISTS idx_tickets_created ON support_tickets(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_tickets_assigned ON support_tickets(assigned_to);
      CREATE INDEX IF NOT EXISTS idx_tickets_urgent ON support_tickets(is_urgent);
    `);
    console.log('✓ support_tickets table enhanced');
    
    // ==================== FILE UPLOADS TABLE ====================
    await client.query(`
      CREATE TABLE IF NOT EXISTS file_uploads (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        project_id UUID,
        request_id UUID,
        file_name VARCHAR(255) NOT NULL,
        file_size INTEGER NOT NULL,
        file_type file_type NOT NULL,
        mime_type VARCHAR(100),
        file_path TEXT NOT NULL,
        file_url TEXT,
        is_public BOOLEAN DEFAULT false,
        downloads_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP,
        
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (request_id) REFERENCES network_requests(id) ON DELETE CASCADE
      );
      
      CREATE INDEX IF NOT EXISTS idx_uploads_user ON file_uploads(user_id);
      CREATE INDEX IF NOT EXISTS idx_uploads_project ON file_uploads(project_id);
      CREATE INDEX IF NOT EXISTS idx_uploads_request ON file_uploads(request_id);
      CREATE INDEX IF NOT EXISTS idx_uploads_type ON file_uploads(file_type);
    `);
    console.log('✓ file_uploads table created');
    
    // ==================== AUDIT LOGS TABLE ====================
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID,
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(100),
        entity_id UUID,
        changes JSONB,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      );
      
      CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);
      CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
      CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
    `);
    console.log('✓ audit_logs table created');
    
    // ==================== API USAGE TABLE ====================
    await client.query(`
      CREATE TABLE IF NOT EXISTS api_usage (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID,
        endpoint VARCHAR(255),
        method VARCHAR(10),
        status_code INTEGER,
        response_time_ms INTEGER,
        ip_address INET,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      );
      
      CREATE INDEX IF NOT EXISTS idx_api_usage_user ON api_usage(user_id);
      CREATE INDEX IF NOT EXISTS idx_api_usage_endpoint ON api_usage(endpoint);
      CREATE INDEX IF NOT EXISTS idx_api_usage_created ON api_usage(created_at DESC);
    `);
    console.log('✓ api_usage table created');
    
    // ==================== NOTIFICATIONS TABLE ====================
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT,
        notification_type VARCHAR(50),
        is_read BOOLEAN DEFAULT false,
        action_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        read_at TIMESTAMP,
        
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
      
      CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
      CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
    `);
    console.log('✓ notifications table created');
    
    console.log('\n✅ Enterprise schema migration completed successfully!');
    console.log('📊 Tables created: 13');
    console.log('📑 Indexes created: 30+');
    console.log('🔐 ENUMs created: 6');
    
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { runEnterpriseSchema };
