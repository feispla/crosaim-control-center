# 🔐 Security Policy

## CrosAim Control Center

Security is a core part of the CrosAim ecosystem.

CrosAim Control Center is designed to manage esports operations, teams, players, tournaments, content workflows, analytics, and integrations. Protecting user data, authentication credentials, integrations, and platform infrastructure is a priority.

---

## Supported Versions

Security updates are provided for actively maintained versions of CrosAim Control Center.

| Version               | Supported      |
| --------------------- | -------------- |
| `main`                | ✅ Yes          |
| Development branches  | ⚠️ Best effort |
| Unmaintained versions | ❌ No           |

Because CrosAim Control Center is actively evolving, security support may change as the project progresses.

---

## Reporting a Vulnerability

If you discover a security vulnerability, **please do not open a public GitHub issue**.

Publicly disclosing a vulnerability before it has been reviewed may expose users, infrastructure, or integrations to unnecessary risk.

### Preferred Contact

**Discord:** CrosAim community/server
**Email:** `feispla@zohomail.com`

When reporting a vulnerability, please include:

* A clear description of the vulnerability.
* The affected component or feature.
* Steps to reproduce the issue.
* Potential security impact.
* Relevant logs, screenshots, or proof of concept when appropriate.
* Any suggested mitigation, if available.

Please avoid including passwords, API keys, access tokens, personal information, or other sensitive credentials in your report.

---

## What to Report

Security reports may include, but are not limited to:

* Authentication bypasses.
* Authorization or privilege escalation issues.
* OAuth2 vulnerabilities.
* Discord integration vulnerabilities.
* API authentication issues.
* Exposure of private player or team data.
* Session or token vulnerabilities.
* Injection vulnerabilities.
* Cross-site scripting (XSS).
* Cross-site request forgery (CSRF).
* Sensitive information disclosure.
* Insecure configuration.
* Server-side vulnerabilities.
* Dependency vulnerabilities with meaningful security impact.
* Exposed secrets or credentials.

---

## What Not to Report Publicly

Do not publicly disclose:

* API keys.
* OAuth2 client secrets.
* Access tokens.
* Database credentials.
* Environment variables containing secrets.
* Private user information.
* Production infrastructure credentials.
* Unpatched critical vulnerabilities.

If you accidentally expose a credential, rotate or revoke it immediately and contact the maintainers.

---

## Security Practices

CrosAim Control Center follows security principles such as:

* Least-privilege access.
* Secure authentication.
* OAuth2-based authorization where applicable.
* Environment-based secret management.
* Input validation.
* Protected API endpoints.
* Role-based access control where applicable.
* Dependency maintenance.
* Separation of public and private data.
* Secure handling of third-party integrations.

Contributors should never commit secrets or credentials to the repository.

---

## Responsible Disclosure

CrosAim encourages responsible disclosure.

Security researchers and contributors who report vulnerabilities responsibly will be treated with respect and their reports will be reviewed as soon as reasonably possible.

Please allow the maintainers reasonable time to investigate and address a vulnerability before publicly disclosing technical details.

---

## Security Updates

Security fixes may be released through:

* Git commits.
* Pull requests.
* GitHub Security Advisories.
* Version updates.
* Dependency updates.
* Infrastructure or configuration changes.

Critical vulnerabilities may receive priority over normal development work.

---

## Questions

For security-related questions, contact:

**Feispla**
📧 `feispla@zohomail.com`
💬 CrosAim Discord community

---

**CrosAim — Built for esports. Designed to scale.**
