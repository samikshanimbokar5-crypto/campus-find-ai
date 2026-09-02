# API

All successful responses use `{ success: true, data }`; failures use `{ success: false, message }`. Protected endpoints require `Authorization: Bearer <token>`. Item creation accepts JSON or multipart form data with an optional `image` field.
