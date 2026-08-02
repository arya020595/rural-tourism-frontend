# Development Report
## Sabah Rural Tourism Digital Initiative – Phase 2  
### Mobile Application Development

**Prepared for:** Sabah Tourism Board (STB), Sabah  
**Prepared by:** ST Datablu Sdn. Bhd.  
**Date:** June 2025

---

> **CONFIDENTIALITY STATEMENT**  
> This document is the property of ST Datablu Sdn. Bhd. and has been prepared exclusively for the internal use of Sabah Tourism Board, Sabah (STB). It contains confidential and proprietary information and is not to be disclosed to any person outside of STB.  
>  
> The reproduction of this document in any manner or medium is strictly prohibited without written authorisation from ST Datablu Sdn. Bhd.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Project Overview and Scope of Work](#2-project-overview-and-scope-of-work)
3. [Project Milestone](#3-project-milestone)
4. [Engagement with Association](#4-engagement-with-association)
5. [Application Design](#5-application-design)
6. [Conclusion](#6-conclusion)
7. [Appendices](#7-appendices)

---

## 1. Executive Summary

> ⚠️ *Content pending — to be filled in.*

---

## 2. Project Overview and Scope of Work

**RUTeC** (Rural Tourism e-Commerce) is a mobile application developed for the Sabah
Tourism Board under the Sabah Rural Tourism Digital Initiative. The application
provides a single digital platform that connects rural tourism operators and
community associations in Sabah with tourists, enabling them to promote, discover,
and book rural tourism experiences and accommodations.

The platform is delivered as a cross-platform mobile application (Android, with
Progressive Web App support) backed by a centralised RESTful API and database. It
caters to three primary categories of users:

- **Tourists** — browse and search rural tourism activities and accommodations,
  make and pay for bookings, receive digital receipts and QR codes, and manage
  their trips and notifications.
- **Operators** — list and manage their activities and accommodation offerings,
  set availability and slots, receive and process booking requests, and issue
  receipts to tourists.
- **Associations** — community/association-level accounts that oversee and represent
  groups of rural tourism operators.

### Key Features

- Listing and management of rural tourism **activities** and **accommodations**.
- **Booking management** for both activities and accommodations, including
  slot/availability-based filtering.
- **Digital receipts and QR codes** generated for confirmed bookings.
- **Role-Based Access Control (RBAC)** distinguishing tourists, operators, and
  association users, each with permission-scoped access.
- **Notifications and messaging**, including booking reminders.
- **Offline support** via Progressive Web App capabilities and local on-device
  storage, allowing core functionality with limited connectivity — important for
  rural areas.
- **Media handling** such as image upload, compression, and cropping for listings.

### Scope of Work

The scope of this engagement covers the design and development of the RUTeC mobile
application end to end, comprising:

1. **Frontend mobile application** — a cross-platform Android / PWA app built with
   Ionic and Angular, packaged natively using Capacitor.
2. **Backend API and database** — a RESTful service handling authentication,
   business logic, bookings, receipts, and notifications, persisting data to a
   relational database.
3. **Engagement with rural tourism associations** to gather requirements and
   validate the application against on-the-ground needs.
4. **Deployment and operations** — containerised deployment with an automated
   CI/CD pipeline.

> ⚠️ *Note: confirm the exact meaning of the "C" in RUTeC and adjust the expansion
> above if it differs from "Rural Tourism e-Commerce".*

### Technology Stack

The table below displays the technology stack used in the development of the RUTeC application.

| Purpose                    | Technology / Tools Used |
|----------------------------|-------------------------|
| Application Development    | TypeScript (frontend), JavaScript / Node.js 20 (backend) |
| Application Architecture   | Hybrid cross-platform mobile app (Angular + Ionic web layer packaged natively via Capacitor) communicating with a RESTful backend API; layered backend architecture (routes → controllers → services → models) with policy-based (Pundit-style) authorization |
| Web Development Framework  | Angular 18 with Ionic Framework 8 (frontend); Express 4 (backend API) |
| Web Server                 | Nginx 1.27 (serves the production Angular build); Node.js / Express HTTP server (backend) |
| Object Relational Mapper   | Sequelize 6 (with Sequelize CLI for migrations & seeders) |
| Database                   | MySQL 8.0 (managed via DBeaver) |
| Visualization Tool         | Figma (UI/UX design & mockups) |
| Project Management         | GitHub (Projects & Issues for task tracking) |
| Version Control            | Git, hosted on GitHub |
| System Requirement Analysis| draw.io (architecture, flow & ER diagrams) |
| Quality Assurance Tools    | ESLint (with angular-eslint / typescript-eslint) for static code analysis & linting |
| Testing                    | Jest with Supertest (backend unit & integration tests); Karma + Jasmine (frontend unit tests) |
| Integration Testing        | Jest integration suites running against a MySQL 8.0 service in GitHub Actions CI; Playwright (frontend end-to-end) |
| API Testing                | Postman (collections maintained in the backend repo) |
| Penetration Testing        | npm audit (dependency vulnerability scanning) |
| Hosting & Deployment       | Docker (multi-stage builds) with Docker Compose on a self-hosted Linux server; container images published to GitHub Container Registry (GHCR); CI/CD automated via GitHub Actions (build → SSH deploy, with database migrations run on release) |
| Documentation              | Markdown (technical docs in repo `docs/`); Postman collections for API reference |
| Performance Monitoring     | Docker container health checks; morgan (HTTP request logging) |
| Communication              | Slack (automated CI/CD deployment notifications); Nodemailer (transactional email from the backend) |

---

## 3. Project Milestone

> ⚠️ *To be taken from the presentation slides (22nd June 2026).*

---

## 4. Engagement with Association

> ⚠️ *Information available in slides — include objectives of each engagement.*

| Date       | Association |
|------------|-------------|
| *(pending)*| *(pending)* |
| *(pending)*| *(pending)* |

---

## 5. Application Design

> ⚠️ *Snapshots of logo and application — to be inserted.*

---

## 6. Conclusion

The RUTeC mobile application marks an important step in the Sabah Rural Tourism
Digital Initiative. It brings rural tourism operators, community associations, and
tourists together on a single, easy-to-use platform — making it simpler to promote,
discover, and book rural tourism experiences and accommodations across Sabah.

Throughout this engagement, the focus has been on building a practical solution that
works for the people who will actually use it. The application has been shaped by
direct engagement with rural tourism associations, helping ensure it reflects the real
needs of the communities it is meant to serve.

Moving forward, RUTeC provides a strong foundation for the continued growth of Sabah's
rural tourism sector. Future phases can build on this by encouraging wider adoption and
adding new features based on user feedback. ST Datablu remains committed to working
together with the Sabah Tourism Board to achieve the long-term goals of this
initiative.

---

## 7. Appendices

> ⚠️ *Engagement images — to be inserted.*

---

*© 2026 ST Datablu Sdn. Bhd. All Rights Reserved.*
