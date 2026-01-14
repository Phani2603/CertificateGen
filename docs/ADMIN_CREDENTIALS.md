# Admin Portal Access

## Default Admin Credentials

The admin portal is accessible at: `/admin/login`

### Environment Variables Required

Add these to your `.env.local` file:

```env
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=your-secure-password-here
```

## Features

The admin portal provides complete system control with:

### Dashboard (`/admin`)
- Total users count with breakdown (Individual, Corporate, Academic)
- Organizations count (Academic + Corporate)
- Pending access requests with urgency indicator
- Total events across all organizations
- Total certificates issued system-wide
- Real-time data from MongoDB

### User Management (`/admin/users`)
- View all registered users
- Search and filter by user type
- Edit user details (name, email, type)
- Delete users
- Pagination support

### Organization Management (`/admin/organizations`)
- View all organizations (Academic & Corporate)
- Search organizations
- Filter by type (All, Academic, Corporate)
- View organization details
- Delete organizations
- Direct links to corporate dashboards

### Access Requests (`/admin/requests`)
- Review pending user type change requests
- Approve or deny requests
- View request details and reasons

### Audit Logs (`/admin/logs`)
- Track all administrative actions
- View timestamps, admin info, actions, targets
- Search by action type
- Pagination support

## Security

- Session-based authentication with HTTP-only cookies
- 8-hour session timeout
- Middleware protection on all admin routes
- API routes protected with admin session check
- Automatic redirect to login when unauthorized

## Design

- Fully responsive (mobile, tablet, desktop)
- Sidebar initially collapsed for better mobile experience
- Gradient red theme with professional styling
- Real-time data updates
- Loading states and error handling
- Toast notifications for actions

## All Certificate Fonts Loaded

All 25+ certificate generation fonts are pre-loaded in the admin portal:
- Script fonts (Marck Script, Great Vibes, Pacifico, Dancing Script, Tangerine)
- Serif fonts (Playfair Display, Cormorant Garamond, Lora, etc.)
- Sans-serif fonts (Montserrat, Roboto, Open Sans, Poppins, Inter, etc.)

These fonts are available system-wide for certificate generation on all devices.
