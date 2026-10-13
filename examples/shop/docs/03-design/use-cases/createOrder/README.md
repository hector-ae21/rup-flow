---
id: UC-001
name: createOrder
status: reviewed
origin: requirements
sourceOfTruth: model
---

# UC-001 Create order — design realization

Analysis: [README](../../../02-analysis/use-cases/createOrder/README.md)

## Elements

| Design element | Kind | Code target |
| --- | --- | --- |
| OrdersController | controller | `src/api/orders.controller.ts` |
| CreateOrderService | service | `src/application/create-order.service.ts` |
| Order, OrderLine, Product | entities | `src/domain/` |
| OrderRepository, ProductRepository | repositories | `src/persistence/` |

## Sequence

![Sequence](./sequence.svg)

## Contracts

| Operation | Input | Output | Errors |
| --- | --- | --- | --- |
| POST /orders | lines[{sku, quantity}], address | order number, total | 409 insufficient stock, 422 invalid address or no lines |

## Data touched

| Table | Operation |
| --- | --- |
| product | read, update stock |
| order, order_line | insert |
