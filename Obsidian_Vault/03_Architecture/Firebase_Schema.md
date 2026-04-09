---
type: architecture
tags:
  - architecture
  - database
---
# Firebase Firestore Schema

Übersicht über unsere NoSQL-Datenstruktur.

## Collection: `users`
Dokument-ID: `user.uid` (aus Firebase Auth)

```json
{
  "email": "hunter@example.com",
  "displayName": "Sung Jin-Woo",
  "level": 15,
  "exp": 4500,
  "gold": 1250,
  "stats": {
    "STR": 20,
    "AGI": 15,
    "INT": 10
  },
  "lifeDomains": [],
  "inventory": ["item_id_1", "item_id_2"]
}
```

## Collection: `tasks`
```json
{
  "userId": "user.uid",
  "title": "React Three Fiber optimieren",
  "rank": "A",
  "status": "in_progress", // 'todo', 'in_progress', 'completed'
  "createdAt": "Timestamp",
  "rewards": {
    "exp": 1200,
    "gold": 400
  }
}
```
