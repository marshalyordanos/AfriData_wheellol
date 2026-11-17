// Step 1 on the booking request page: the price agreed with the customer
// and (for supplier cars) with the supplier. Wheellol keeps the difference —
// there is no commission % any more.
//
// Not set yet → "Set agreement" button. Saved → a read-only summary with a
// "Change" button; both open the same modal.
import React, { useEffect, useMemo, useState } from "react";
import { Alert, Button, Input, InputNumber, Modal, message } from "antd";
import { CarOutlined, EditOutlined, FileDoneOutlined } from "@ant-design/icons";
import { FormSection, StatusPill } from "../../components/modern/ModernUI";
import SupplierService, { isSupplierCar, supplierName } from "../suppliers/SupplierService";
import RentalRequestService, { ACCEPTED, carName, etb } from "./rentalRequestHelpers";
import "../suppliers/suppliers.css";
import "../contracts/contracts.css";

const round2 = (n) => Math.round(n * 100) / 100;
const fmt = (v) => (v === null || v === undefined || v === "" ? "" : `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ","));
const parse = (v) => v?.replace(/,/g, "");

const CarThumb = ({ car }) =>
  car.photos?.[0] ? (
    <img className="sp-thumb" src={car.photos[0]} alt="" />
  ) : (
    <span className="sp-thumb">
      <CarOutlined />
    </span>
  );

const OwnerTag = ({ car }) =>
  isSupplierCar(car) ? (
    <span className="sp-owner is-supplier">Supplier · {supplierName(car.host)}</span>
  ) : (
    <span className="sp-owner is-own">Wheellol car</span>
  );

/** Customer total, supplier total, what Wheellol keeps */
const sumUp = (cars, priceOf, supplierOf) => {
  const total = round2(cars.reduce((t, r) => t + (Number(priceOf(r)) || 0), 0));
  const supplier = round2(cars.reduce((t, r) => t + (isSupplierCar(r.car) ? Number(supplierOf(r)) || 0 : 0), 0));
  return { total, supplier, wheellol: round2(total - supplier) };
};

/* ------------------------------------------------------------------ modal */
const AgreementModal = ({ request, open, onClose, onSaved }) => {
  const cars = request.cars || [];
  const single = cars.length === 1;
  const [prices, setPrices] = useState({});
  const [note, setNote] = useState("");
  const [showErrors, setShowErrors] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    const next = {};
    cars.forEach((r) => {
      next[r.car.id] = {
        price: r.price ?? (single && request.totalPrice > 0 ? request.totalPrice : null),
        supplierAmount: r.supplierAmount ?? null,
      };
    });
    setPrices(next);
    setNote(request.adminNote || "");
    setShowErrors(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const set = (carId, patch) => setPrices((p) => ({ ...p, [carId]: { ...p[carId], ...patch } }));
  const sums = sumUp(cars, (r) => prices[r.car.id]?.price, (r) => prices[r.car.id]?.supplierAmount);

  const errorOf = (r) => {
    const p = prices[r.car.id] || {};
    const out = {};
    if (!(p.price > 0)) out.price = "Enter the customer price";
    if (isSupplierCar(r.car)) {
      if (!(p.supplierAmount > 0)) out.supplierAmount = "Enter the supplier price";
      else if (p.price > 0 && p.supplierAmount > p.price) out.supplierAmount = "Cannot be more than the customer price";
    }
    return out;
  };
  const errors = cars.map(errorOf);
  const hasErrors = errors.some((e) => Object.keys(e).length);
  const belowPaid = request.paidAmount > 0 && sums.total < request.paidAmount;

  const openContract = (request.contracts || []).find((c) => ["SENT", "VIEWED"].includes(c.status));
  const accepted = ACCEPTED.includes(request.status);
  const changed = request.totalPrice > 0 && Math.abs(sums.total - request.totalPrice) > 0.5;

  const save = async () => {
    if (hasErrors || belowPaid) {
      setShowErrors(true);
      return;
    }
    setBusy(true);
    try {
      for (const r of cars) {
        const p = prices[r.car.id];
        const body = { price: p.price };
        if (isSupplierCar(r.car)) body.supplierAmount = p.supplierAmount;
        // eslint-disable-next-line no-await-in-loop
        await SupplierService.setCarPrice(request.id, r.car.id, body);
      }
      const data = await RentalRequestService.update(request.id, {
        totalPrice: sums.total,
        adminNote: note ?? "",
      });
      message.success(`Agreement saved · customer pays ${etb(sums.total)}`);
      onSaved(data);
      onClose();
    } catch {
      // toast handled by api interceptor
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={640}
      title={request.totalPrice > 0 ? "Change agreement" : "Set agreement"}
      okText="Save agreement"
      onOk={save}
      confirmLoading={busy}
      destroyOnHidden
    >
      <p className="mp-cell-sub" style={{ marginTop: 0 }}>
        Enter the price you agreed with the customer for each car
        {cars.some((r) => isSupplierCar(r.car)) ? ", and what the supplier gets. Wheellol keeps the difference." : "."}
      </p>

      {openContract && changed && (
        <Alert
          style={{ marginBottom: 12 }}
          type="warning"
          showIcon
          message={`Contract ${openContract.contractNo} was sent with ${etb(request.totalPrice)}`}
          description="After saving, open the contract, use “Match price” and re-send it so the customer signs the new price."
        />
      )}
      {accepted && changed && (
        <Alert
          style={{ marginBottom: 12 }}
          type="warning"
          showIcon
          message={`The customer already accepted ${etb(request.totalPrice)}`}
          description="Changing the price means preparing a new contract for the customer to sign."
        />
      )}

      <div className="sp-split">
        {cars.map((r, i) => {
          const car = r.car;
          const supplier = isSupplierCar(car);
          const p = prices[car.id] || {};
          const err = showErrors ? errors[i] : {};
          const keeps = p.price > 0 && p.supplierAmount > 0 ? round2(p.price - p.supplierAmount) : null;
          return (
            <div key={r.id} className="sp-split-row">
              <div className="sp-split-head">
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <CarThumb car={car} />
                  <div style={{ minWidth: 0 }}>
                    <div className="sp-name">{carName(car)}</div>
                    <div className="sp-sub">{car.licensePlate}</div>
                  </div>
                </div>
                <OwnerTag car={car} />
              </div>
              <div className="sp-split-grid">
                <div>
                  <div className="sp-fact-k" style={{ marginBottom: 6 }}>Customer pays</div>
                  <InputNumber
                    min={0}
                    style={{ width: "100%" }}
                    status={err.price ? "error" : undefined}
                    value={p.price}
                    onChange={(v) => set(car.id, { price: v })}
                    addonAfter="ETB"
                    formatter={fmt}
                    parser={parse}
                    placeholder="e.g. 200,000"
                  />
                  {err.price && <div className="ct-err" style={{ color: "#b42318", fontSize: 12, marginTop: 4 }}>{err.price}</div>}
                </div>
                {supplier && (
                  <div>
                    <div className="sp-fact-k" style={{ marginBottom: 6 }}>Supplier gets</div>
                    <InputNumber
                      min={0}
                      style={{ width: "100%" }}
                      status={err.supplierAmount ? "error" : undefined}
                      value={p.supplierAmount}
                      onChange={(v) => set(car.id, { supplierAmount: v })}
                      addonAfter="ETB"
                      formatter={fmt}
                      parser={parse}
                      placeholder="e.g. 180,000"
                    />
                    {err.supplierAmount && (
                      <div style={{ color: "#b42318", fontSize: 12, marginTop: 4 }}>{err.supplierAmount}</div>
                    )}
                  </div>
                )}
              </div>
              {supplier && (
                <div className="mp-cell-sub" style={{ marginTop: 8 }}>
                  Wheellol keeps: <b style={{ color: keeps < 0 ? "#b42318" : "#c2410c" }}>{keeps === null ? "—" : etb(keeps)}</b>
                </div>
              )}
            </div>
          );
        })}

        <div className="sp-split-out">
          <div className="sp-split-cell">
            <div className="k">Customer pays{cars.length > 1 ? " (all cars)" : ""}</div>
            <div className="v">{etb(sums.total)}</div>
          </div>
          <div className="sp-split-cell is-ok">
            <div className="k">Supplier gets</div>
            <div className="v">{sums.supplier ? etb(sums.supplier) : "—"}</div>
          </div>
          <div className="sp-split-cell is-brand">
            <div className="k">Wheellol keeps</div>
            <div className="v">{etb(sums.wheellol)}</div>
          </div>
        </div>
        {belowPaid && (
          <Alert type="error" showIcon message={`The total cannot be lower than what was already paid: ${etb(request.paidAmount)}`} />
        )}

        <div>
          <div className="sp-fact-k" style={{ marginBottom: 6 }}>Internal note (not shown to the customer)</div>
          <Input.TextArea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Owner rate, driver arrangement, fuel, start time…"
          />
        </div>
      </div>
    </Modal>
  );
};

/* ------------------------------------------------------------------ panel */
const AgreementPanel = ({ request, num, onSaved }) => {
  const [open, setOpen] = useState(false);
  const cars = request.cars || [];
  const hasAgreement = request.totalPrice > 0;
  const perCar = cars.length > 0 && cars.every((r) => r.price > 0);
  const hasSupplier = cars.some((r) => isSupplierCar(r.car));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const sums = useMemo(() => sumUp(cars, (r) => r.price, (r) => r.supplierAmount), [request.cars]);
  const cancelled = request.status === "CANCELLED";

  return (
    <FormSection
      num={num}
      title="Agreement"
      subtitle="Price agreed with the customer and the car supplier"
      extra={
        hasAgreement && !cancelled ? (
          <Button icon={<EditOutlined />} onClick={() => setOpen(true)}>
            Change
          </Button>
        ) : null
      }
    >
      {!hasAgreement ? (
        <div className="ct-callout">
          <span className="ic">
            <FileDoneOutlined />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <b>No agreement yet</b>
            <span className="ct-muted ct-small">
              Call the customer{hasSupplier ? " and the supplier" : ""}, then enter the agreed price. After that you can select and send the contract.
            </span>
          </div>
          {!cancelled && (
            <Button type="primary" onClick={() => setOpen(true)}>
              Set agreement
            </Button>
          )}
        </div>
      ) : (
        <div className="sp-split">
          {perCar &&
            cars.map((r) => {
              const supplier = isSupplierCar(r.car);
              return (
                <div key={r.id} className="sp-split-row" style={{ padding: 12 }}>
                  <div className="sp-split-head" style={{ marginBottom: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                      <CarThumb car={r.car} />
                      <div style={{ minWidth: 0 }}>
                        <div className="sp-name">{carName(r.car)}</div>
                        <div className="sp-sub">
                          <OwnerTag car={r.car} />
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div className="sp-name">{etb(r.price)}</div>
                      {supplier && (
                        <div className="sp-sub">
                          Supplier {r.supplierAmount ? etb(r.supplierAmount) : "—"} · Wheellol {r.commissionAmount !== null && r.commissionAmount !== undefined ? etb(r.commissionAmount) : "—"}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          <div className="sp-split-out" style={{ marginTop: 0 }}>
            <div className="sp-split-cell">
              <div className="k">Customer pays</div>
              <div className="v">{etb(request.totalPrice)}</div>
            </div>
            <div className="sp-split-cell is-ok">
              <div className="k">Supplier gets</div>
              <div className="v">{hasSupplier && perCar ? etb(sums.supplier) : "—"}</div>
            </div>
            <div className="sp-split-cell is-brand">
              <div className="k">Wheellol keeps</div>
              <div className="v">{perCar ? etb(round2(request.totalPrice - sums.supplier)) : "—"}</div>
            </div>
          </div>
          {!perCar && (
            <Alert
              type="info"
              showIcon
              message="Only the total was saved for this booking. Use Change to add the price of each car."
            />
          )}
          {request.adminNote && (
            <div className="mp-note">
              <div className="mp-note-k">Internal note</div>
              {request.adminNote}
            </div>
          )}
          {ACCEPTED.includes(request.status) && <StatusPill tone="green">Accepted by the customer</StatusPill>}
        </div>
      )}
      <AgreementModal request={request} open={open} onClose={() => setOpen(false)} onSaved={onSaved} />
    </FormSection>
  );
};

export default AgreementPanel;
