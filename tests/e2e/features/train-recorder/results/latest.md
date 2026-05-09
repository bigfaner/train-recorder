# E2E Test Report: train-recorder

**Date**: 2026-05-09
**Duration**: 0m 12s

## Summary

| Type    | Total   | Pass  | Fail    | Skip  |
| ------- | ------- | ----- | ------- | ----- |
| UI      | 114     | 0     | 114     | 0     |
| API     | 14      | 0     | 14      | 0     |
| CLI     | 0       | 0     | 0       | 0     |
| **All** | **128** | **0** | **128** | **0** |

**Result**: FAIL

---

## Results by Test Case

### API Tests (14 tests)

| TC ID      | Title                                                   | Status | Duration |
| ---------- | ------------------------------------------------------- | ------ | -------- |
| TC-API-001 | All sets met — increase weight by increment             | FAIL   | ~80ms    |
| TC-API-002 | Some sets missed — maintain weight                      | FAIL   | ~80ms    |
| TC-API-003 | Consecutive 2 misses — decrease 10%                     | FAIL   | ~75ms    |
| TC-API-004 | Independent increment per exercise                      | FAIL   | ~80ms    |
| TC-API-005 | Custom weight does not affect next suggestion           | FAIL   | ~100ms   |
| TC-API-006 | New exercise returns null suggestion                    | FAIL   | ~80ms    |
| TC-API-007 | Decrease rounds to plate combo                          | FAIL   | ~75ms    |
| TC-API-008 | Three consecutive sessions met — increment tip          | FAIL   | ~75ms    |
| TC-API-009 | Partial exit — completed exercises included in overload | FAIL   | ~75ms    |
| TC-API-010 | Mid-exit cancels running timer                          | FAIL   | ~75ms    |
| TC-API-011 | Retroactive record triggers chain recalculation         | FAIL   | ~80ms    |
| TC-API-012 | 1RM estimation formula                                  | FAIL   | ~75ms    |
| TC-API-013 | Week-over-week calculation                              | FAIL   | ~80ms    |
| TC-API-014 | Training frequency heatmap intensity grading            | FAIL   | ~80ms    |

### UI Tests (114 tests)

| TC ID                       | Status | Duration   |
| --------------------------- | ------ | ---------- |
| TC-UI-001 through TC-UI-114 | FAIL   | ~90ms each |

---

## Failed Tests Detail

### Root Cause: Expo Web Server Not Available

All 128 tests failed due to a **single shared infrastructure issue**: the Expo web dev server is not running and cannot be started.

**Two failure modes**:

1. **API tests (14)**: `page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL`
   - The API spec files use `page.goto("/workout")` with relative URLs (no `baseUrl()` prefix).
   - Without a running server, relative URLs are invalid for Playwright navigation.

2. **UI tests (114)**: `page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:8081/...`
   - The UI spec files correctly use `page.goto(\`${baseUrl()}/...\`)`pointing to`http://localhost:8081`.
   - The Expo web server is not running and cannot be started because web dependencies are not installed.

**Why the server cannot start**:

```
CommandError: It looks like you're trying to use web support but don't have the required
dependencies installed.

Install react-dom@19.1.0, react-native-web@^0.21.0 by running:

npx expo install react-dom react-native-web
```

**Diagnosis**: This is a cascade failure. Every test depends on page navigation (`page.goto`), which requires a running web server. The application is a React Native / Expo mobile app that does not have web support dependencies installed (`react-dom`, `react-native-web`). This is not a test script bug — it is a missing infrastructure prerequisite.

---

## Screenshots

No meaningful screenshots captured. Playwright auto-captured failure screenshots for each test, but these only show empty browser pages (connection refused).

---

## Recommended Fix

1. Install Expo web dependencies: `npx expo install react-dom react-native-web`
2. Fix API spec files to use absolute URLs (prepend `baseUrl()`)
3. Start Expo web server before running tests: `npx expo start --web --port 8081`
4. Re-run: `just test-e2e --feature train-recorder`
