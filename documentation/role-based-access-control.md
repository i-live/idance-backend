# Role-Based Access Control (RBAC) System

This document describes the role-based access control system implemented in the iDance application, including role definitions, permissions, and management procedures.

## Overview

The iDance application uses a simple but effective role-based access control system with four distinct roles. Each role has specific permissions designed to support different organizational functions while maintaining security and data privacy.

## Roles vs Groups - Design Decision

We chose a **role-based system** over a group-based system for the following reasons:

### Role-Based System (Implemented)
- **Single assignment**: Each user has ONE role
- **Hierarchical**: Clear authority levels (user < moderator < support < admin)
- **Job function based**: Defines primary organizational function
- **Simple to manage**: Easy to understand and implement
- **Perfect for clear organizational hierarchy**

### Group-Based System (Not Implemented)
- **Multiple assignment**: Users can belong to MULTIPLE groups
- **Functional**: Organized around specific capabilities
- **Flexible**: Can mix and match permissions
- **Complex to manage**: More flexible but harder to track
- **Better for cross-functional teams and complex organizations**

**For a dating app with clear organizational roles, the role-based system is ideal.**

## Role Definitions

### 1. `user` (Default Role)
**Purpose**: Regular application users
**Access Level**: Own data only + public data

**Permissions**:
- **View**: Own complete user record + public fields of active users
- **Update**: Own user record only
- **Delete**: Can soft-delete own account
- **Fields Access**: All own fields + public fields of others (id, username, first_name, last_name, profile_picture_url)

**Use Cases**:
- Regular app users
- Dating app participants
- Standard account holders

### 2. `moderator`
**Purpose**: Content moderation team
**Access Level**: Read-only access to user data for moderation

**Permissions**:
- **View**: All user records (for moderation purposes)
- **Update**: Cannot update user data
- **Delete**: Cannot delete users
- **Fields Access**: Public fields only (id, username, first_name, last_name, profile_picture_url)

**Use Cases**:
- Content moderation
- Reviewing reported profiles
- Monitoring for inappropriate content
- Community guidelines enforcement

### 3. `support`
**Purpose**: Customer support team
**Access Level**: Read-only access to user data for customer service

**Permissions**:
- **View**: All user records
- **Update**: Cannot update user data
- **Delete**: Cannot delete users
- **Fields Access**: 
  - Public fields (id, username, first_name, last_name, profile_picture_url)
  - Contact info (email)
  - Status fields (role, user_status, user_tier)
  - Activity data (last_active_at, created_at, updated_at)

**Use Cases**:
- Customer support inquiries
- Account verification
- Troubleshooting user issues
- Billing support
- Account recovery assistance

### 4. `admin`
**Purpose**: Full system administrators
**Access Level**: Complete access to all data and operations

**Permissions**:
- **View**: All user records and all fields
- **Update**: Any user record
- **Delete**: Can soft-delete any user account
- **Fields Access**: All fields including sensitive data (password hashes, OAuth providers, deletion info)

**Use Cases**:
- System administration
- User account management
- Security investigations
- Data management
- System configuration

## Field-Level Access Control

### Public Fields (All Roles Can View)
- `id` - User identifier
- `username` - Display name
- `first_name` - First name
- `last_name` - Last name
- `profile_picture_url` - Profile image

### Support + Admin Access
- `email` - Contact email (needed for customer service)
- `role` - User's role assignment
- `user_status` - Account status (active, suspended, etc.)
- `user_tier` - Subscription tier (basic, pro, vip)
- `last_active_at` - Last activity timestamp
- `created_at` - Account creation date
- `updated_at` - Last modification date

### Admin Only Access
- `password` - Password hash (security sensitive)
- `oauth_providers` - OAuth authentication data
- `deleted_at` - Soft deletion timestamp

## Role Assignment

### Default Assignment
All new users are automatically assigned the `user` role during signup through the authentication system.

### Manual Role Assignment
Admin roles must be assigned manually by existing administrators:

```sql
-- Make a user an admin
UPDATE user SET role = 'admin' WHERE email = 'admin@yourapp.com';

-- Make a user support staff
UPDATE user SET role = 'support' WHERE email = 'support@yourapp.com';

-- Make a user a moderator
UPDATE user SET role = 'moderator' WHERE email = 'mod@yourapp.com';

-- Demote back to regular user
UPDATE user SET role = 'user' WHERE email = 'user@yourapp.com';
```

### Role Validation
The system validates roles using database constraints:
- Only valid roles: `['user', 'admin', 'support', 'moderator']`
- Default role: `'user'`
- Role changes are logged via `updated_at` timestamp

## Permission Implementation

### Table-Level Permissions
```sql
-- Users can view their own record, public can view active users, staff can view all
FOR select WHERE id = $auth.id OR user_status = 'active' OR $auth.role IN ['admin', 'support', 'moderator']

-- Users can update their own record, admins can update any, support/moderators cannot update
FOR update WHERE id = $auth.id OR $access = 'backend_worker' OR $auth.role = 'admin'

-- Soft delete only - only admins can delete
FOR delete WHERE (id = $auth.id OR $access = 'backend_worker' OR $auth.role = 'admin') AND deleted_at = NONE
```

### Field-Level Permissions Examples
```sql
-- Email field - Support and Admin access
PERMISSIONS FOR select WHERE id = $auth.id OR $access = 'backend_worker' OR $auth.role IN ['admin', 'support']

-- Password field - Admin only
PERMISSIONS FOR select WHERE id = $auth.id OR $access = 'backend_worker' OR $auth.role = 'admin'

-- Public fields - No additional restrictions beyond table level
-- (username, first_name, last_name, profile_picture_url)
```

## Security Considerations

### Authentication Integration
- Roles are included in JWT tokens via `$auth.role`
- Role validation happens at the database level
- No client-side role enforcement (security through database permissions)

### Audit Trail
- All role changes update the `updated_at` timestamp
- Consider implementing a separate audit log for role changes in production

### Principle of Least Privilege
- Each role has minimum necessary permissions
- Support staff cannot modify data (read-only)
- Moderators have limited field access
- Only admins can perform destructive operations

## Administrative Procedures

### Onboarding New Staff

1. **Create User Account**:
   ```sql
   -- User signs up normally through the app
   -- Or create manually:
   CREATE user SET
       email = 'newstaff@yourapp.com',
       username = 'newstaff',
       first_name = 'New',
       last_name = 'Staff',
       role = 'user',  -- Start as user
       user_status = 'active',
       user_tier = 'basic';
   ```

2. **Assign Appropriate Role**:
   ```sql
   UPDATE user SET role = 'support' WHERE email = 'newstaff@yourapp.com';
   ```

3. **Verify Access**:
   - Test login with new credentials
   - Verify appropriate dashboard access
   - Confirm field-level permissions work correctly

### Offboarding Staff

1. **Revoke Admin Access**:
   ```sql
   UPDATE user SET role = 'user' WHERE email = 'formerstaff@yourapp.com';
   ```

2. **Optional - Deactivate Account**:
   ```sql
   UPDATE user SET user_status = 'suspended' WHERE email = 'formerstaff@yourapp.com';
   ```

### Emergency Access Procedures

1. **Create Emergency Admin** (Database Access Required):
   ```sql
   UPDATE user SET role = 'admin' WHERE email = 'emergency@yourapp.com';
   ```

2. **Revoke Compromised Access**:
   ```sql
   UPDATE user SET role = 'user', user_status = 'suspended' 
   WHERE email = 'compromised@yourapp.com';
   ```

## Monitoring and Compliance

### Access Monitoring
- Monitor role assignments and changes
- Track admin actions on user accounts
- Log support staff data access for compliance

### Regular Audits
- Review role assignments quarterly
- Verify staff still need their assigned roles
- Remove unused admin/support accounts

### Compliance Considerations
- Support staff access to email addresses (GDPR considerations)
- Admin access to all data (data protection compliance)
- Audit trail for role changes (compliance requirements)

## Troubleshooting

### Common Issues

1. **User Can't Access Admin Dashboard**:
   - Check role assignment: `SELECT role FROM user WHERE email = 'user@example.com'`
   - Verify user_status is 'active'
   - Check JWT token includes correct role

2. **Support Staff Can't See User Data**:
   - Verify role is 'support' or 'admin'
   - Check database permissions are applied
   - Verify authentication is working

3. **Permission Denied Errors**:
   - Check SurrealDB permissions syntax
   - Verify `$auth.role` is populated in JWT
   - Test with direct database queries

### Testing Role Permissions

```sql
-- Test as different roles by setting auth context
-- (This would be done through your application's auth system)

-- Test support access
SELECT email, user_status FROM user WHERE id = 'user:test';

-- Test moderator access (should not see email)
SELECT username, first_name FROM user WHERE id = 'user:test';

-- Test admin access (should see everything)
SELECT * FROM user WHERE id = 'user:test';
```

## Future Enhancements

### Potential Additions
- **Time-based roles**: Temporary admin access
- **Department-based roles**: Marketing, Engineering, etc.
- **Permission inheritance**: Role hierarchies
- **Custom permissions**: Fine-grained access control

### Migration Considerations
If moving to a group-based system in the future:
- Groups could supplement roles (not replace)
- Example: `role = 'admin'` + `groups = ['marketing', 'beta_testers']`
- Would require schema changes and permission updates

## Related Documentation

- [Authentication System](./authentication.md) - How users authenticate and get roles
- [Database Schema](./database.md) - Complete database structure
- [JWT Secrets Guide](./jwt-secrets-guide.md) - JWT token configuration
- [Architecture Overview](./architecture.md) - System design patterns

---

**Last Updated**: January 2025  
**Version**: 1.0  
**Maintainer**: Development Team