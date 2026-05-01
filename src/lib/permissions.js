/**
 * SPA mirror of the backend's role-permission map.
 *
 * This is a *hint* for client-side UX (hide nav items, disable buttons
 * the user can't use). The backend remains the source of truth — every
 * mutation goes through `PermissionGuard`, so a tampered SPA can't
 * actually escalate. Hiding here is just to avoid showing dead-end
 * actions that 403 on click.
 *
 * Source of truth: `apps/api/src/admin-auth/constants/permissions.ts`.
 * If you add a new role on the backend, add it here too — otherwise
 * users with that role will see an empty sidebar.
 */

// Resource.action strings, identical to backend `PERMISSIONS` constants.
export const PERM = {
  CREATIVES_VIEW: 'creatives.view',
  CREATIVES_REVIEW: 'creatives.review',
  CREATIVES_APPROVE: 'creatives.approve',
  CREATIVES_REJECT: 'creatives.reject',
  CREATIVES_APCON_SUBMIT: 'creatives.apcon_submit',
  CREATIVES_APCON_MARK: 'creatives.apcon_mark',

  HOSTS_VIEW: 'hosts.view',
  HOSTS_CREATE_INVITE: 'hosts.create_invite',
  HOSTS_UPDATE_PROFILE: 'hosts.update_profile',
  HOSTS_UPDATE_BANK: 'hosts.update_bank',
  HOSTS_SUSPEND: 'hosts.suspend',
  HOSTS_REACTIVATE: 'hosts.reactivate',
  HOSTS_TERMINATE: 'hosts.terminate',

  SCREENS_VIEW: 'screens.view',
  SCREENS_PAUSE: 'screens.pause',
  SCREENS_RESUME: 'screens.resume',
  SCREENS_REBOOT: 'screens.reboot',
  SCREENS_REASSIGN: 'screens.reassign',
  SCREENS_RETIRE: 'screens.retire',
  SCREENS_FORCE_UPDATE: 'screens.force_update',

  PAYOUTS_VIEW: 'payouts.view',
  PAYOUTS_APPROVE: 'payouts.approve',
  PAYOUTS_BULK_APPROVE: 'payouts.bulk_approve',

  FRAUD_VIEW: 'fraud.view',
  FRAUD_CONFIRM: 'fraud.confirm',
  FRAUD_REFUND: 'fraud.refund',

  SUPPORT_VIEW: 'support.view',
  SUPPORT_REPLY: 'support.reply',

  ADVERTISERS_VIEW: 'advertisers.view',
  ADVERTISERS_APPROVE_KYC: 'advertisers.approve_kyc',
  ADVERTISERS_WALLET_ADJUST: 'advertisers.wallet_adjust',
  ADVERTISERS_SUSPEND: 'advertisers.suspend',

  REFUNDS_VIEW: 'refunds.view',
  REFUNDS_APPROVE: 'refunds.approve',

  TAX_VIEW: 'tax.view',
  TAX_REMIT: 'tax.remit',

  ADMIN_USERS_VIEW: 'admin_users.view',
  ADMIN_USERS_CREATE: 'admin_users.create',

  AUDIT_VIEW: 'audit.view',
  MONITORING_VIEW: 'monitoring.view',
}

/**
 * Role → permissions. Mirrors `ROLE_PERMISSIONS` on the backend. Don't
 * try to be exhaustive — this map only needs to cover permissions that
 * the SPA branches on for UX (sidebar visibility, action button
 * availability). Anything else, the backend will 403 as a backstop.
 */
export const ROLE_PERMISSIONS = {
  // Full access; for the SPA, this is "show everything".
  admin_root: '*',
  ops_lead: '*-except-admin-users',

  fraud_analyst: [
    PERM.FRAUD_VIEW,
    PERM.FRAUD_CONFIRM,
    PERM.FRAUD_REFUND,
    PERM.HOSTS_VIEW,
    PERM.SCREENS_VIEW,
    PERM.ADVERTISERS_VIEW,
    PERM.PAYOUTS_VIEW,
    PERM.AUDIT_VIEW,
    PERM.MONITORING_VIEW,
  ],

  vetting_agent: [
    PERM.CREATIVES_VIEW,
    PERM.CREATIVES_REVIEW,
    PERM.CREATIVES_APPROVE,
    PERM.CREATIVES_REJECT,
    PERM.CREATIVES_APCON_SUBMIT,
    PERM.CREATIVES_APCON_MARK,
    PERM.ADVERTISERS_VIEW,
    PERM.MONITORING_VIEW,
  ],

  finance: [
    PERM.PAYOUTS_VIEW,
    PERM.PAYOUTS_APPROVE,
    PERM.PAYOUTS_BULK_APPROVE,
    PERM.REFUNDS_VIEW,
    PERM.REFUNDS_APPROVE,
    PERM.TAX_VIEW,
    PERM.TAX_REMIT,
    PERM.ADVERTISERS_VIEW,
    PERM.ADVERTISERS_WALLET_ADJUST,
    PERM.HOSTS_VIEW,
    PERM.AUDIT_VIEW,
    PERM.MONITORING_VIEW,
  ],

  field_ops: [
    PERM.HOSTS_VIEW,
    PERM.HOSTS_CREATE_INVITE,
    PERM.SCREENS_VIEW,
    PERM.SCREENS_PAUSE,
    PERM.SCREENS_REASSIGN,
    PERM.SCREENS_RETIRE,
    PERM.SUPPORT_VIEW,
    PERM.SUPPORT_REPLY,
    PERM.MONITORING_VIEW,
  ],

  support_agent: [
    PERM.SUPPORT_VIEW,
    PERM.SUPPORT_REPLY,
    PERM.HOSTS_VIEW,
    PERM.ADVERTISERS_VIEW,
    PERM.SCREENS_VIEW,
    PERM.PAYOUTS_VIEW,
    PERM.MONITORING_VIEW,
  ],
}

/**
 * Does the given role have the given permission? Unknown roles are
 * treated as having no permissions (fail closed).
 */
export function roleHasPermission(role, permission) {
  if (!role || !permission) return false
  const grants = ROLE_PERMISSIONS[role]
  if (!grants) return false
  if (grants === '*') return true
  if (grants === '*-except-admin-users') {
    return !permission.startsWith('admin_users.')
  }
  return Array.isArray(grants) && grants.includes(permission)
}
