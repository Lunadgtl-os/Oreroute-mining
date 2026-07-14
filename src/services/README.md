# Data integration

This directory is reserved for the independent Ore Route data layer.

The current migration release intentionally separates the interface from the Base44-hosted data implementation. The next integration phase will connect authentication and the following operational entities:

- Organisation
- MaterialPassport
- CustodyEvent
- TransportTender
- TenderBid
- Shipment
- PaymentMilestone
- Document
- TradeDossier
- WashPlantBatch

Do not commit credentials or production API keys. Use environment variables described in `.env.example`.
