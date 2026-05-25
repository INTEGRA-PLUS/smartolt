export const SMARTOLT_ENDPOINTS = {
  // System / OLT
  GET_OLTS: 'system/get_olts',
  GET_OLT_DETAIL: (oltId: string | number) => `system/get_olt/${oltId}`,
  GET_OLT_RUNNING_CONFIG: (oltId: string | number) => `system/get_olt_running_config/${oltId}`,

  // ONUs
  GET_ONUS: 'onus/get_onus',
  GET_ONU_DETAIL: (sn: string) => `onus/get_onu/${sn}`,
  GET_ONU_STATUS: (sn: string) => `onus/get_onu_status/${sn}`,
  GET_ONUS_BY_OLT: (oltId: string | number) => `onus/get_onus_by_olt/${oltId}`,
  GET_UNAUTHORIZED_ONUS: 'onus/get_unauthorized_onus',

  // Signals
  GET_SIGNAL_LEVELS: 'signals/get_signal_levels',
  GET_SIGNAL_LEVEL_BY_SN: (sn: string) => `signals/get_signal_level/${sn}`,
  GET_OLT_SIGNAL_LEVELS: (oltId: string | number) => `signals/get_olt_signal_levels/${oltId}`,

  // ONU Types
  GET_ONU_TYPES: 'onus/get_onu_types',
  GET_ONU_TYPE_DETAIL: (typeId: string | number) => `onus/get_onu_type/${typeId}`,

  // VLANs
  GET_VLANS: 'vlans/get_vlans',
  GET_OLT_VLANS: (oltId: string | number) => `vlans/get_olt_vlans/${oltId}`,

  // Profiles
  GET_PROFILES: 'profiles/get_profiles',

  // Operations (write)
  REBOOT_ONU: 'operations/reboot_onu',
  AUTHORIZE_ONU: 'operations/authorize_onu',
  MOVE_ONU: 'operations/move_onu',
  ENABLE_ONU: 'operations/enable_onu',
  DISABLE_ONU: 'operations/disable_onu',
  DELETE_ONU: 'operations/delete_onu',
  RESTORE_FACTORY_ONU: 'operations/restore_factory_onu',
  RESYNC_CONFIG_ONU: 'operations/resync_config_onu',

  // Movements / history
  GET_MOVEMENTS: 'movements/get_movements',
  GET_ONU_MOVEMENTS: (sn: string) => `movements/get_onu_movements/${sn}`,
} as const;
