# Changelog

## [Unreleased]

## [0.3.0] - 2026-06-23

### Added
- Signal node: `Attachment → Get` operation to download a received attachment by
  its id, returned as binary data.

### Fixed
- Signal node: `Receipt → Send` now sends the signal-cli RPC parameters
  `target-timestamp` (as an array) and `type`, fixing the server-side
  NullPointerException that made receipts unusable.
- Signal node: `Reaction → Send` / `Reaction → Remove` now send `emoji` and
  `targetTimestamp`, fixing the same class of NullPointerException that made
  reactions unusable.
- Signal node: JSON-RPC error responses are surfaced as node errors instead of
  being returned as a successful, empty result.

## [0.1.4] - 2025-05-05
