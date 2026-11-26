# Dokumentation — aktuelle indgange

Opdateret 26. november 2026. Start her frem for at følge en gammel PR-instruktion
eller et historisk release-checkpoint. Historik, beslutninger, kildebevis og
recovery-vejledninger bevares i deres oprindelige filer.

## Produkt og resterende arbejde

- [Adobe character sheet: backlog og leverancer](adobe-sheet-backlog.md).
  Adobe er den offentlige visning. Bevar de fælles formularer og komponenter,
  som popups stadig bruger; den gamle Standard-kode er ikke klar til sletning.
- [Regelautomatisering: aktuel audit](rule-automation-audit.md) og
  [implementering/afgrænsning](rule-automation-expansion.md). Alle 186 subclasses
  har adapters. Audit-JSON er grundlaget for de resterende manuelle mekanikker.
- [Starting ability bonuses](character-rules-engine.md#starting-ability-bonuses-on-the-adobe-sheet):
  PR #290 er merget. 2014 bruger racens bonusser; alle 57 valgbare 2024-baggrunde
  har deres egne tilladte abilities i den native ability-popup.
- [Kampagneoplevelse og katalogarbejde](campaign-experience-backlog.md).
  Filen bevarer også historiske leverancer; produktionsmigration og godkendelser
  må ikke udledes af en tidligere forberedt PR.
- [Oprydning og loading: 26. november](performance-loading-2026-11-26.md).
  Målinger, katalogvurdering, valgte forbedringer og konkret opfølgning.

## Udvikling og test

- [README i repoets rod](../README.md): installation, profiler og deployment-grænser.
- [Kodens opdeling](code-map.md): fælles scope og modulernes ansvar.
- [Test-dependencies](test-dependency-profiles-da.md): fire profiler med egne
  lockfiles. Dependency-opdelingen er gennemført.
- [CI og oprydningsgennemgang](repository-configuration-review-da.md):
  Hosting-grænser, suite-manifester og målte testvarigheder.
- [Adobe-popup-kortlægning](adobe-inventory/popups-da.md): brug denne før
  komponenter eller den gamle visnings kode flyttes/fjernes.

## Drift, adgang og data

- [Invitationsmails](invitation-email-setup.md): separat backend, slået fra som
  standard; en almindelig Hosting-deploy aktiverer ikke mails.
- [Konto-notifikationer](account-notifications.md) og
  [kampagnefarver](campaign-appearance.md): adgang, funktion og rules-krav.
- [Regelkatalog og generatorer](rules-catalog.md): versioner, integritet og kilder.
- [Privat item-bibliotek](private-item-library.md),
  [Windows-operator](windows-item-library-operator.md) og
  [read-only migration-handoff](item-catalogue-operator-handoff.md).
- [Kampagnekort og billedreparation](campaign-content-management.md) og
  [billedadgang/CORS](world-map-storage-deployment.md).

## Historiske målinger og backlog-noter

[Offline startup-baselinen](startup-performance-baseline.md),
[den første repo-oprydning](repository-cleanup.md),
[stabiliseringslisten](stabilization-backlog.md) og
[den tidligere Overview-liste](overview-ui-backlog.md) er historiske checkpoints.
Deres datidige filantal, CI-tider og PR-status er ikke aktuelle totaler.
Bevar deres beslutninger og åbne anbefalinger, men afstem dem med nyere leverancer
og ovenstående aktuelle audits, før de bruges som arbejdsplan.
