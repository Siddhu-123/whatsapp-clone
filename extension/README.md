# Secret Password Generator

A small deterministic password generator.

## Flow

1. The extension gets the current website domain when possible.
2. The user enters a master secret.
3. The extension derives a fixed 12-character password locally.
4. The password is masked with crying cats by default.
5. Click the password area to copy. Long-click/hold to reveal temporarily.
6. Secret/password UI clears after 20 seconds or when the popup closes.
7. Copied password is cleared from clipboard after 20 seconds when the browser allows it.

## Important

The master secret is never saved. The user must remember it.
