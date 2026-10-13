---
id: UC-001
name: createOrder
status: reviewed
origin: requirements
sourceOfTruth: model
---

# UC-001 Create order — analysis realization

Requirements: [README](../../../01-requirements/use-cases/createOrder/README.md)

## Participating classes

| Class | Stereotype | Responsibility |
| --- | --- | --- |
| CheckoutScreen | boundary | Shows lines and collects the shipping address |
| CreateOrderController | control | Validates, creates the order and reserves stock |
| Order, OrderLine | entity | Hold the order and enforce RN-001 |
| Product | entity | Holds stock and price, enforces RN-002 |

## Collaboration

![Collaboration](./collaboration.svg)

## Notes

Transaction handling and the stock reservation strategy are decided in design.
