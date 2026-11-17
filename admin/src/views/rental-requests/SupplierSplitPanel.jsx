// Booking request → price of each car + Wheellol commission on supplier cars.
//
// The admin agrees the price with the customer (e.g. 200,000). For a supplier's
// car Wheellol keeps the commission % (10% → 20,000) and the supplier gets the rest.
// The admin can also type what the supplier asked for; the customer price is
// then worked out so the supplier still gets that amount after commission.
import React, { useEffect, useMemo, useState } from "react";
import { Alert, InputNumber, message } from "antd";
import { CarOutlined } from "@ant-design/icons";
import { FormSection, Btn, StatusPill } from "../../components/modern/ModernUI";
import SupplierService, { isSupplierCar, supplierName } from "../suppliers/SupplierService";
import RentalRequestService, { carName, etb } from "./rentalRequestHelpers";
import "../suppliers/suppliers.css";

const round2 = (n) => Math.round(n * 100) / 100;
const fmt = (v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
const parse = (v) => v?.replace(/,/g, "");

/** Same maths as the backend (commission.service.ts) — for the live preview */
const preview = ({ price, supplierAmount }, rate) => {
  if (rate === null) return { price, commissionAmount: null, supplierAmount: null };
  if (supplierAmount > 0) {
    const p = round2(supplierAmount / (1 - rate / 100));
    return { price: p, commissionAmount: round2(p - supplierAmount), supplierAmount };
  }
  if (price > 0) {
    const c = round2((price * rate) / 100);
    return { price, commissionAmount: c, supplierAmount: round2(price - c) };
  }
  return { price: null, commissionAmount: null, supplierAmount: null };
};

const CarSplitRow = ({ request, row, globalPercent, single, onSaved }) => {
  const car = row.car;
  const supplier = isSupplierCar(car);
  // % used for the preview: what was stored, else the supplier's own %, else the default
  const rate = supplier
    ? row.commissionRate ?? car.host?.hostProfile?.commissionRate ?? globalPercent
    : null;

  const [mode, setMode] = useState("price"); // "price" | "supplier"
  const [price, setPrice] = useState(row.price ?? (single ? request.totalPrice : null));
  const [supplierAmount, setSupplierAmount] = useState(row.supplierAmount ?? null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setPrice(row.price ?? (single ? request.totalPrice : null));
    setSupplierAmount(row.supplierAmount ?? null);
  }, [row.price, row.supplierAmount, single, request.totalPrice]);

  const live = preview(mode === "supplier" ? { supplierAmount } : { price }, rate);
  const dirty =
    mode === "supplier"
      ? (supplierAmount ?? null) !== (row.supplierAmount ?? null)
      : (price ?? null) !== (row.price ?? null);

  const save = async () => {
    setBusy(true);
    try {
      const saved = await SupplierService.setCarPrice(
        request.id,
        car.id,
        mode === "supplier" ? { supplierAmount: supplierAmount ?? null } : { price: price ?? null }
      );
      // one car: its price IS the agreed total
      if (single && saved.price && saved.price !== request.totalPrice) {
        await RentalRequestService.update(request.id, { totalPrice: saved.price });
        message.success(`Saved — agreed total is now ${etb(saved.price)}`);
      } else {
        message.success("Car price saved");
      }
      setMode("price");
      onSaved();
    } catch (e) {
      /* toast shown by the API interceptor */
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="sp-split-row">
      <div className="sp-split-head">
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          {car.photos?.[0] ? (
            <img className="sp-thumb" src={car.photos[0]} alt="" />
          ) : (
            <span className="sp-thumb"><CarOutlined /></span>
          )}
          <div style={{ minWidth: 0 }}>
            <div className="sp-name">{carName(car)}</div>
            <div className="sp-sub">{car.licensePlate}</div>
          </div>
        </div>
        {supplier ? (
          <span className="sp-owner is-supplier">Supplier · {supplierName(car.host)} · {rate}%</span>
        ) : (
          <span className="sp-owner is-own">Wheellol car</span>
        )}
      </div>

      <div className="sp-split-grid">
        <div>
          <div className="sp-fact-k" style={{ marginBottom: 6 }}>
            Customer price for this car {single && <span className="sp-muted">(= agreed total)</span>}
          </div>
          <InputNumber
            min={0}
            style={{ width: "100%" }}
            value={mode === "supplier" ? live.price : price}
            disabled={mode === "supplier"}
            onChange={(v) => { setMode("price"); setPrice(v); }}
            addonAfter="ETB"
            formatter={fmt}
            parser={parse}
            placeholder="e.g. 200000"
          />
        </div>
        {supplier && (
          <div>
            <div className="sp-fact-k" style={{ marginBottom: 6 }}>…or what the supplier asked for</div>
            <InputNumber
              min={0}
              style={{ width: "100%" }}
              value={mode === "supplier" ? supplierAmount : live.supplierAmount}
              onChange={(v) => { setMode("supplier"); setSupplierAmount(v); }}
              addonAfter="ETB"
              formatter={fmt}
              parser={parse}
              placeholder="e.g. 180000"
            />
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Btn variant="primary" onClick={save} disabled={busy || !dirty}>
            Save price
          </Btn>
        </div>
      </div>

      {supplier && (
        <div className="sp-split-out">
          <div className="sp-split-cell">
            <div className="k">Customer pays</div>
            <div className="v">{etb(live.price)}</div>
          </div>
          <div className="sp-split-cell is-brand">
            <div className="k">Wheellol commission ({rate}%)</div>
            <div className="v">{etb(live.commissionAmount)}</div>
          </div>
          <div className="sp-split-cell is-ok">
            <div className="k">Supplier gets</div>
            <div className="v">{etb(live.supplierAmount)}</div>
          </div>
        </div>
      )}
    </div>
  );
};

const SupplierSplitPanel = ({ request, num, onChanged }) => {
  const [globalPercent, setGlobalPercent] = useState(null);
  const cars = request.cars || [];
  const hasSupplierCar = cars.some((r) => isSupplierCar(r.car));

  useEffect(() => {
    if (!hasSupplierCar) return;
    SupplierService.getSettings()
      .then((s) => setGlobalPercent(s.commissionPercent))
      .catch(() => setGlobalPercent(10));
  }, [hasSupplierCar]);

  const totals = useMemo(() => {
    const sum = (k) => round2(cars.reduce((t, r) => t + (r[k] || 0), 0));
    return {
      price: sum("price"),
      commission: sum("commissionAmount"),
      supplier: sum("supplierAmount"),
      priced: cars.filter((r) => r.price > 0).length,
    };
  }, [cars]);

  // Only needed when a supplier's car is in the request
  if (!hasSupplierCar || globalPercent === null) return null;

  const single = cars.length === 1;
  const mismatch = !single && totals.priced === cars.length && request.totalPrice > 0 && totals.price !== request.totalPrice;

  const useSum = async () => {
    try {
      await RentalRequestService.update(request.id, { totalPrice: totals.price });
      message.success(`Agreed total set to ${etb(totals.price)}`);
      onChanged();
    } catch (e) {
      /* toast shown by the API interceptor */
    }
  };

  return (
    <FormSection
      num={num}
      title="Supplier price & commission"
      subtitle="Set the price of each car. Wheellol keeps its commission from supplier cars; the supplier only sees their share."
      extra={totals.commission > 0 ? <StatusPill tone="green">Commission {etb(totals.commission)}</StatusPill> : null}
    >
      <div className="sp-split">
        {!single && (
          <Alert
            type="info"
            showIcon
            message="This request has several cars — enter the customer price of each car. Their sum should equal the agreed total."
          />
        )}
        {mismatch && (
          <Alert
            type="warning"
            showIcon
            message={`Car prices add up to ${etb(totals.price)}, but the agreed total is ${etb(request.totalPrice)}.`}
            action={<Btn onClick={useSum}>Use {etb(totals.price)} as total</Btn>}
          />
        )}
        {cars.map((row) => (
          <CarSplitRow
            key={row.id}
            row={row}
            request={request}
            single={single}
            globalPercent={globalPercent}
            onSaved={onChanged}
          />
        ))}
        {!single && totals.priced > 0 && (
          <div className="sp-split-out">
            <div className="sp-split-cell"><div className="k">All cars</div><div className="v">{etb(totals.price)}</div></div>
            <div className="sp-split-cell is-brand"><div className="k">Wheellol commission</div><div className="v">{etb(totals.commission)}</div></div>
            <div className="sp-split-cell is-ok"><div className="k">Suppliers get</div><div className="v">{etb(totals.supplier)}</div></div>
          </div>
        )}
      </div>
    </FormSection>
  );
};

export default SupplierSplitPanel;
