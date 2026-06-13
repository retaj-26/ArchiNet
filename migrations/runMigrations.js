const pool = require('../config/database');

const createTablesQuery = `
  -- Network Design Requests Table
  CREATE TABLE IF NOT EXISTS network_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_type VARCHAR(100) NOT NULL,
    building_size VARCHAR(100),
    floors VARCHAR(50),
    users_count VARCHAR(100),
    security_level VARCHAR(100),
    vlan_requirements VARCHAR(200),
    wifi_requirements VARCHAR(200),
    server_requirements VARCHAR(200),
    infrastructure_notes TEXT,
    project_details TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id UUID
  );

  -- Support Tickets Table
  CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number VARCHAR(20) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    support_message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'open',
    priority VARCHAR(50) DEFAULT 'normal',
    category VARCHAR(100),
    response_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id UUID
  );

  -- Analysis Requests Table
  CREATE TABLE IF NOT EXISTS analysis_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_text TEXT NOT NULL,
    file_config_path VARCHAR(255),
    file_topology_path VARCHAR(255),
    analysis_result TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id UUID
  );

  -- Indexes for performance
  CREATE INDEX IF NOT EXISTS idx_network_requests_status ON network_requests(status);
  CREATE INDEX IF NOT EXISTS idx_network_requests_created_at ON network_requests(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
  CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_analysis_requests_status ON analysis_requests(status);
`;

const runMigrations = async () => {
  try {
    console.log('Running database migrations...');
    await pool.query(createTablesQuery);
    console.log('✓ All migrations completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('✗ Migration error:', err);
    process.exit(1);
  }
};

runMigrations();
