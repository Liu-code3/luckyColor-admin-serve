# Tenant Isolation Regression Checklist

## Scope

- Same username under different tenants must authenticate against the current tenant context only.
- Tenant business services must reject cross-tenant reads and writes by enforcing `tenantId`.
- Header tenant and token tenant mismatch must be rejected. There is no super-admin or platform-admin bypass in the current implementation.

## Current Regression Coverage

- `src/modules/tenant/tenants/tenant-isolation.spec.ts`
  - same username under different tenants
  - cross-tenant service access rejection
  - super-admin/platform-admin style tenant bypass rejection via header/token mismatch
- `src/modules/tenant/tenants/tenant-bootstrap.service.spec.ts`
  - tenant initialization writes a `CREATED` audit log
- `src/modules/tenant/tenants/tenants.service.spec.ts`
  - tenant status/package/expiry/base info updates write structured audit logs
