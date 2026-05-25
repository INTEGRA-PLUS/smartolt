export interface SmartOLTRequestConfig {
  subdomain: string;
  xToken: string;
  endpoint: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  params?: Record<string, unknown>;
  data?: Record<string, unknown>;
  timeout?: number;
}

export interface SmartOLTResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

// OLT types
export interface OLT {
  id: string | number;
  name: string;
  ip: string;
  port?: number;
  type?: string;
  status?: string;
  location?: string;
  slots?: number;
  uptime?: string;
}

// ONU types
export interface ONU {
  id: string | number;
  sn: string;
  name?: string;
  profile?: string;
  olt?: string | number;
  olt_port?: string | number;
  status?: string;
  signal?: number | null;
  mac?: string;
  ip?: string;
  vlan?: string | number;
  authorized?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ONUStatus {
  sn: string;
  online: boolean;
  signal?: number;
  uptime?: string;
  last_seen?: string;
  rx_power?: number;
  tx_power?: number;
  temperature?: number;
  voltage?: number;
}

export interface SignalLevel {
  sn: string;
  olt: string | number;
  port: string | number;
  rx_power?: number;
  tx_power?: number;
  olt_rx_power?: number;
  olt_tx_power?: number;
  timestamp?: string;
}

export interface ONUType {
  id: string | number;
  name: string;
  vendor?: string;
  model?: string;
  ports?: number;
}

// Operation payloads
export interface RebootONUPayload {
  sn: string;
  olt_id?: string | number;
}

export interface AuthorizeONUPayload {
  sn: string;
  olt_id: string | number;
  port: string | number;
  profile?: string;
  name?: string;
  vlan?: string | number;
}

export interface MoveONUPayload {
  sn: string;
  from_olt?: string | number;
  to_olt: string | number;
  to_port: string | number;
}

export interface EnableDisableONUPayload {
  sn: string;
  olt_id?: string | number;
}

export interface DeleteONUPayload {
  sn: string;
  olt_id?: string | number;
}
