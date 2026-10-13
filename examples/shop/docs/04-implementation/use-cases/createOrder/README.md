---
id: UC-001
name: createOrder
title: Create order
status: draft
origin: code
sourceOfTruth: code
---

# UC-001 Create order — implementation

| Overview | Requirements | Analysis | Design | Implementation | Tests |
| --- | --- | --- | --- | --- | --- |
| [Use cases](../../../01-requirements/use-case-overview.svg) | [Requirements](../../../01-requirements/use-cases/createOrder/README.md) | [Analysis](../../../02-analysis/use-cases/createOrder/README.md) | [Design](../../../03-design/use-cases/createOrder/README.md) | **Implementation** | [Tests](../../../04-implementation/use-cases/createOrder/README.md#tests) |

Design: [README](../../../03-design/use-cases/createOrder/README.md)

## Code

| Element | Kind | Location | Verified |
| --- | --- | --- | --- |
| OrdersController | controller | `src/api/orders.controller.ts` | no |
| CreateOrderService | service | `src/application/create-order.service.ts` | no |
| Order, OrderLine | entities | `src/domain/` | no |

## Tests

| Test | Covers | Location | Result |
| --- | --- | --- | --- |
| createOrder places an order | main flow | `test/create-order.spec.ts` | not run |
| createOrder rejects insufficient stock | alternative flow A1, RN-002 | `test/create-order.spec.ts` | not run |
