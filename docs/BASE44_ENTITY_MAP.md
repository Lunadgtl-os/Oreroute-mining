# Base44 entity map

The published Base44 application currently defines the following operational entities. These names and responsibilities should be preserved during migration so the independent platform remains compatible with existing business logic.

| Entity | Purpose |
| --- | --- |
| Organisation | Mines, carriers, wash plants, traders, buyers and exporters |
| MaterialPassport | Mineral lot identity, origin, weight, grade and current status |
| CustodyEvent | Chronological evidence of weighing, sampling, loading, movement and transfer |
| TransportTender | Mineral transport requirements issued to carriers |
| TenderBid | Carrier pricing and delivery proposals |
| Shipment | Vehicle, driver, route, weight and live transport status |
| PaymentMilestone | Buyer/seller confirmations and staged release conditions |
| Document | Evidence files attached to lots, shipments and trades |
| TradeDossier | Commercial terms, buyer, seller and export lifecycle |
| WashPlantBatch | Processing lineage from input passports to output material |

A production database schema will be generated from this map in Phase 2.
