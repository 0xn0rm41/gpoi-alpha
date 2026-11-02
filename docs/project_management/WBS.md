# Work Breakdown Structure

Hierarchical decomposition. Work packages (x.y.z) are the level that goes on the Kanban board ([PROCESS.md](PROCESS.md)); owners come from [RACI.md](RACI.md); timing from [ROADMAP.md](ROADMAP.md). No effort estimates are given: estimate in the pilot.

```
Hub Studenti
├── 1 Product
│   ├── 1.1 Core features (events, announcements, ideas, polls, notes, books)
│   │   ├── 1.1.1 Idea voting threshold + "expose to school"
│   │   ├── 1.1.2 Book exchange (commission switch, default OFF)
│   │   └── 1.1.3 School-scoped communities with invite code
│   ├── 1.2 Accounts, sessions, roles
│   ├── 1.3 Admin and moderation tools
│   └── 1.4 UX, accessibility, mobile layout
├── 2 Engineering and quality
│   ├── 2.1 Tests and CI
│   ├── 2.2 Security hardening and dependency updates
│   ├── 2.3 Backup, restore, monitoring
│   └── 2.4 Release management (SemVer, changelog)
├── 3 Infrastructure
│   ├── 3.1 Domain purchase and DNS
│   ├── 3.2 VPS, reverse proxy, TLS
│   ├── 3.3 Email (SMTP, SPF/DKIM/DMARC)
│   └── 3.4 Scaling plan (one server per 10 schools)
├── 4 Legal and compliance
│   ├── 4.1 GDPR: privacy policy, DPA, records of processing, minors
│   ├── 4.2 Licensing: AGPL headers, DCO, CLA decision, trademark
│   ├── 4.3 PSD2 / payments decision for the book exchange
│   └── 4.4 Italian regime and invoicing (with commercialista)
├── 5 Business and finance
│   ├── 5.1 Financial model upkeep
│   ├── 5.2 Pricing research (Van Westendorp, Gabor-Granger)
│   ├── 5.3 Funding and grants tracker
│   └── 5.4 Sponsorship and donations setup
├── 6 Schools and community
│   ├── 6.1 Pilot school onboarding and feedback loop
│   ├── 6.2 Onboarding kit for new schools (demo, trial, DPA)
│   ├── 6.3 Support process
│   └── 6.4 Open-source community (README, templates, code of conduct)
└── 7 Project management
    ├── 7.1 Roadmap and board upkeep
    ├── 7.2 Risk register reviews
    └── 7.3 Handover and documentation
```

Mapping to docs: 4 and 5 are detailed in [../economy_finance/README.md](../economy_finance/README.md); 6.4 uses the templates in [../github/README.md](../github/README.md).
