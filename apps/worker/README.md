# MotoTrust Worker

Background process for work that should not block API requests.

Initial responsibilities:

- Send notifications.
- Process video proof metadata.
- Retry failed webhooks.
- Run scheduled reminders.

Keep the worker thin. Business state changes should still be owned by the API/domain modules.

