# Architecture

The Vite React client communicates with an Express REST API using JWT bearer tokens. Express validates requests, Mongoose persists users/items/matches/notifications, and the matching service evaluates new reports asynchronously against filtered candidates.
