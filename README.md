# Hieu-boutique Shop

Shop bán quần áo, phụ kiện, trang sức cho nữ  
Công nghệ sử dụng:


Hoi đang rảnh chắc đổi về Nextjs code fullstack với thêm phần blockchain vào cho người dùng thanh toán bằng crypto luôn
# webbanquanao
# Hieu-Boutique
# Hieu-Boutique

### Environment variables (server)

The server supports SMTP mail sending and file-based logs. Add these variables to `hieu-boutique-server/.env` or export them in your environment.

- `MAIL_USER` (or `SMTP_USER`): SMTP username (e.g. your Gmail address)
- `MAIL_PASS` (or `SMTP_PASS`): SMTP password (Gmail app password if using Gmail)
- `FROM_EMAIL` (optional): From address used in outgoing mail (defaults to `MAIL_USER`)
- `ADMIN_EMAIL` (optional): Admin email to receive order notifications
- `SMTP_HOST` (optional): SMTP host (defaults to `smtp.gmail.com`)
- `SMTP_PORT` (optional): SMTP port (defaults to `465`)
- `SMTP_SECURE` (optional): `true`/`false` (defaults to `true`)
- `LOG_DIR` (optional): directory for file logs (logger default is `logs/`)

Important: Do NOT commit your real credentials to public repositories. Use secrets in production.
# Hieu-Boutique
