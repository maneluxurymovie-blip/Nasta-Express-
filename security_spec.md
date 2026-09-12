# Security Specification - Nasta Express

## Data Invariants
1. **Products & Categories**: Publicly readable, but only writeable by whitelisted Admins.
2. **Orders**: Publicly createable (any user can place an order), but only readable and updateable by Admins.
3. **Admin Whitelist**: The `/admins/{uid}` collection defines who has admin privileges.
4. **Immutability**: `createdAt` fields must never change. `totalAmount` on an order is immutable once placed (by a customer).

## The Dirty Dozen Payloads

| ID | Operation | Collection | Payload | Result |
|----|-----------|------------|---------|--------|
| 1 | Create | products | `{ name: "Sneaky Item", price: 0 }` (by non-admin) | DENIED |
| 2 | Update | products | `{ isAvailable: true }` (by non-admin) | DENIED |
| 3 | List | orders | `getDocs(collection(db, 'orders'))` (by non-admin) | DENIED |
| 4 | Create | orders | `{ customerName: "A".repeat(1001) }` (invalid size) | DENIED |
| 5 | Update | orders | `{ status: "Delivered" }` (by non-admin) | DENIED |
| 6 | Create | admins | `{ email: "hacker@evil.com" }` (self-whitelist) | DENIED |
| 7 | Create | products | `{ name: 123 }` (invalid type) | DENIED |
| 8 | Delete | categories | `deleteDoc(doc(db, 'categories', 'id'))` (by non-admin) | DENIED |
| 9 | Update | orders | `{ createdAt: request.time }` (attempting to change immutable field) | DENIED |
| 10 | Create | orders | `{ status: "Delivered" }` (spoofing terminal state on create) | DENIED |
| 11 | Get | admins | `getDoc(doc(db, 'admins', 'some-id'))` (by non-admin) | DENIED |
| 12 | Create | products | `{ name: "Missing fields" }` (missing required fields) | DENIED |
